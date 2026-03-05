"""MUSE Backend — FastAPI server with ADK Live streaming over WebSocket."""
import asyncio
import base64
import json
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, HOST, PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# ADK imports (deferred so the app can start without GCP credentials in dev)
# ---------------------------------------------------------------------------
try:
    from google.adk.runners import Runner, LiveRequestQueue, RunConfig, InMemorySessionService
    from google.adk.agents.run_config import StreamingMode
    from google.genai import types as genai_types

    ADK_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ADK not available: {e}")
    ADK_AVAILABLE = False


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("MUSE backend starting up")
    yield
    logger.info("MUSE backend shutting down")


app = FastAPI(title="MUSE API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "adk_available": ADK_AVAILABLE}


# ---------------------------------------------------------------------------
# Gallery REST endpoint (fallback for clients that can't parse ADK events)
# ---------------------------------------------------------------------------
@app.get("/api/gallery/{session_id}")
async def get_gallery_rest(session_id: str):
    from app.services.firestore import get_gallery_entries
    try:
        entries = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(None, get_gallery_entries, session_id),
            timeout=3.0,
        )
    except (asyncio.TimeoutError, Exception):
        entries = []
    return {"entries": entries, "count": len(entries)}


# ---------------------------------------------------------------------------
# WebSocket session handler
# ---------------------------------------------------------------------------
class MuseSession:
    """Manages a single MUSE WebSocket session with the ADK runner."""

    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.live_queue: Optional["LiveRequestQueue"] = None
        self.runner: Optional["Runner"] = None
        self.adk_session = None

    async def send_event(self, event_type: str, data: dict):
        """Send a JSON event to the frontend."""
        try:
            await self.websocket.send_json({"type": event_type, **data})
        except Exception as e:
            logger.debug(f"Failed to send event {event_type}: {e}")

    async def setup_adk(self):
        """Initialize ADK runner and session."""
        if not ADK_AVAILABLE:
            await self.send_event("error", {"message": "ADK not available"})
            return False

        from app.agents.orchestrator import create_orchestrator

        agent = create_orchestrator()
        session_service = InMemorySessionService()
        self.runner = Runner(
            agent=agent,
            app_name="muse",
            session_service=session_service,
        )

        self.adk_session = await session_service.create_session(
            app_name="muse",
            user_id=self.session_id,
            session_id=self.session_id,
        )

        self.live_queue = LiveRequestQueue()
        return True

    async def stream_responses(self):
        """Stream ADK agent responses back to the WebSocket client."""
        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            response_modalities=["AUDIO"],
            speech_config=genai_types.SpeechConfig(
                voice_config=genai_types.VoiceConfig(
                    prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                        voice_name="Aoede"
                    )
                )
            ),
        )

        try:
            async for event in self.runner.run_live(
                session=self.adk_session,
                live_request_queue=self.live_queue,
                run_config=run_config,  # type: ignore[arg-type]
            ):
                await self._handle_adk_event(event)
        except Exception as e:
            logger.error(f"ADK streaming error: {e}")
            await self.send_event("error", {"message": str(e)})

    async def _handle_adk_event(self, event):
        """Route ADK events to appropriate WebSocket messages."""
        # Parse content parts for audio and text
        if event.content and event.content.parts:
            for part in event.content.parts:
                # Audio output — send binary PCM with header
                if part.inline_data and part.inline_data.data:
                    audio_bytes = part.inline_data.data
                    header = json.dumps(
                        {"type": "audio", "size": len(audio_bytes)}
                    ).encode() + b"\x00"
                    await self.websocket.send_bytes(header + audio_bytes)

                # Text transcript from model
                if part.text:
                    await self.send_event(
                        "transcript",
                        {"text": part.text, "role": "assistant"},
                    )

                # Function call — signal to frontend that something is happening
                if part.function_call and part.function_call.name == "generate_synesthetic_image":
                    await self.send_event("generating_image", {})

                # Function response — check for image data
                if part.function_response and part.function_response.response:
                    res_dict = part.function_response.response
                    if isinstance(res_dict, dict):
                        if res_dict.get("success") and "image_b64" in res_dict:
                            await self.send_event(
                                "image_generated",
                                {
                                    "image_b64": res_dict["image_b64"],
                                    "prompt": res_dict.get("prompt_used", ""),
                                    "style": res_dict.get("style", ""),
                                },
                            )
                        elif res_dict.get("image_url"):
                            await self.send_event(
                                "gallery_updated",
                                {
                                    "entry_id": res_dict.get("entry_id"),
                                    "image_url": res_dict["image_url"],
                                },
                            )

        # Turn completion
        if event.turn_complete:
            await self.send_event("turn_complete", {})

    async def handle_client_message(self, data: bytes | str):
        """Route incoming WebSocket messages to the ADK live queue."""
        if self.live_queue is None:
            return

        if isinstance(data, bytes):
            # Binary = PCM audio from mic (16kHz, 16-bit, mono)
            blob = genai_types.Blob(
                mime_type="audio/pcm;rate=16000",
                data=data,
            )
            self.live_queue.send_realtime(blob)

        elif isinstance(data, str):
            try:
                msg = json.loads(data)
                msg_type = msg.get("type")

                if msg_type == "video_frame":
                    # JPEG frame from camera
                    frame_b64 = msg.get("data", "")
                    frame_bytes = base64.b64decode(frame_b64)
                    blob = genai_types.Blob(
                        mime_type="image/jpeg",
                        data=frame_bytes,
                    )
                    self.live_queue.send_realtime(blob)

                elif msg_type == "text":
                    # Text message from user
                    content = genai_types.Content(
                        role="user",
                        parts=[genai_types.Part(text=msg.get("text", ""))],
                    )
                    self.live_queue.send_content(content)

                elif msg_type == "mode_change":
                    mode = msg.get("mode", "visual")
                    content = genai_types.Content(
                        role="user",
                        parts=[
                            genai_types.Part(
                                text=f"[Mode changed to: {mode}]"
                            )
                        ],
                    )
                    self.live_queue.send_content(content)

                elif msg_type == "end_of_turn":
                    self.live_queue.send_end_of_turn()

            except json.JSONDecodeError:
                logger.warning("Received invalid JSON from client")


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected: session={session_id}")

    session = MuseSession(websocket, session_id)

    if not await session.setup_adk():
        await websocket.close(code=1011)
        return

    await session.send_event(
        "connected",
        {"session_id": session_id, "message": "MUSE is ready"},
    )

    # Kick off the model — without an initial user message the Live model waits silently
    initial_content = genai_types.Content(
        role="user",
        parts=[genai_types.Part(text="[Session started. Camera is now active. Begin your synesthetic experience — describe what you sense and generate art proactively.]")],
    )
    session.live_queue.send_content(initial_content)

    # Run ADK streaming and client message handling concurrently
    async def receive_loop():
        try:
            while True:
                # Accept both text and binary frames
                msg = await websocket.receive()
                if "bytes" in msg and msg["bytes"]:
                    await session.handle_client_message(msg["bytes"])
                elif "text" in msg and msg["text"]:
                    await session.handle_client_message(msg["text"])
        except WebSocketDisconnect:
            logger.info(f"Client disconnected: session={session_id}")
        except Exception as e:
            logger.error(f"Receive loop error: {e}")
        finally:
            if session.live_queue:
                session.live_queue.close()

    try:
        await asyncio.gather(
            session.stream_responses(),
            receive_loop(),
        )
    except Exception as e:
        logger.error(f"Session error: {e}")
    finally:
        logger.info(f"Session ended: {session_id}")


# ---------------------------------------------------------------------------
# Dev server entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
