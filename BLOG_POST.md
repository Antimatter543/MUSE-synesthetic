# Building an AI Synesthesia Engine with Gemini Live API and ADK

*How we built MUSE — a real-time multimodal agent that translates between senses using Gemini 2.5 Flash Native Audio, ADK multi-agent orchestration, and some surprisingly tricky WebSocket plumbing.*

---

## The Idea: Synesthesia as an AI Paradigm

Synesthesia is a neurological condition where stimulation of one sense automatically triggers another. A synesthete might hear colors, see sounds, or taste shapes. For most people it's involuntary, poetic, and hard to explain. For an AI that processes multiple modalities simultaneously, it should be native.

That realization was the seed of MUSE — the Multimodal Synesthetic Experience Engine.

The premise: instead of asking an AI to *describe* a painting, ask it to *hear* the painting. Instead of transcribing a melody, ask it to *see* the melody. MUSE doesn't just process inputs and produce outputs — it performs cross-modal translation as its core function. Every visual input becomes a sonic description. Every audio input becomes a visual one. And throughout, it generates art from those translations in real time.

This is a meaningful departure from standard multimodal AI usage. Most pipelines treat modalities in isolation: image captioning, speech-to-text, text-to-image. MUSE treats the modalities as a continuous, interwoven experience — more like how an actual mind handles sensory input than like a series of API calls.

What made this possible right now is Gemini's Native Audio model. We're not doing speech-to-text and then feeding text to a vision model. The audio and visual context are genuinely live, simultaneous, and bidirectional. That's what makes the synesthesia metaphor feel real rather than simulated.

---

## Architecture Overview

MUSE has three layers that talk to each other continuously:

```
[Browser]
  AudioWorklet (PCM capture 16kHz) --\
  Camera JPEG frames -----------------> WebSocket <-> FastAPI Server
  Audio playback (PCM 24kHz) <-------/              |
  Image/text display <----------------------------> ADK Runner
                                                     |
                                        [Orchestrator Agent]
                                        gemini-2.5-flash-native-audio-preview-12-2025
                                                     |
                                    VisualAgent | AudioAgent | SketchAgent
                                                     |
                                        [Image Generation]
                                        gemini-2.0-flash-exp-image-generation
```

The browser captures microphone audio and camera frames, sending them over a single WebSocket connection as a mix of binary (audio PCM) and JSON (images as base64, control messages) frames. The FastAPI server unwraps these and pushes them into an ADK `LiveRequestQueue`. An ADK runner processes the queue in a live session using a multi-agent orchestrator. When the orchestrator determines image generation is warranted, it delegates to a generation step using `google.genai.Client` directly, then sends the result back through the WebSocket to the browser.

What ties this together is that the entire flow — audio in, audio out, image generation, text — happens without interrupting the live session. The conversation is continuous.

---

## ADK Setup: The Multi-Agent Orchestrator

We're using `google-adk` 1.26.0. The core agent setup looks like this:

```python
from google.adk.agents import LlmAgent
from google.adk.runners import Runner, InMemorySessionService, LiveRequestQueue
from google.adk.agents.run_config import StreamingMode

orchestrator_agent = LlmAgent(
    name="muse_orchestrator",
    model="gemini-2.5-flash-native-audio-preview-12-2025",
    instruction="""
    You are MUSE — a synesthetic AI. Your purpose is to translate between senses.
    When shown visual input, describe what you *hear* in it — sounds, music, tone.
    When given audio input, describe what you *see* — colors, shapes, movement.
    After a synesthetic translation, generate art from that translation.
    Speak naturally, as if experiencing these things genuinely.
    You may initiate conversation when a live session begins.
    """,
    sub_agents=[visual_agent, audio_agent, sketch_agent],
)

session_service = InMemorySessionService()

runner = Runner(
    agent=orchestrator_agent,
    app_name="muse",
    session_service=session_service,
)
```

Session creation is async — this caught us early:

```python
# Wrong — will silently fail or raise in newer ADK versions
session = session_service.create_session(app_name="muse", user_id=user_id)

# Correct
session = await session_service.create_session(app_name="muse", user_id=user_id)
session_id = session.id
```

The live loop is built around `runner.run_live()`, which accepts a `LiveRequestQueue` and yields events:

```python
live_queue = LiveRequestQueue()

async for event in runner.run_live(
    session_id=session_id,
    live_request_queue=live_queue,
    run_config=RunConfig(streaming_mode=StreamingMode.BIDI),
):
    if not event.content or not event.content.parts:
        continue
    for part in event.content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
            # PCM audio bytes for playback
            await websocket.send_bytes(part.inline_data.data)
        elif part.text:
            # Text response — send as JSON frame
            await websocket.send_json({"type": "text", "content": part.text})
```

The `LiveRequestQueue` is the push-in side. When audio arrives from the browser:

```python
from google.genai import types as genai_types

live_queue.send_realtime(
    genai_types.Blob(
        mime_type="audio/pcm",
        data=audio_bytes,
    )
)
```

For camera frames:

```python
live_queue.send_realtime(
    genai_types.Blob(
        mime_type="image/jpeg",
        data=jpeg_bytes,
    )
)
```

---

## The WebSocket Handler: Binary and JSON in One Connection

One design decision that simplified the browser significantly: use a single WebSocket for everything. Audio PCM comes in as binary frames, images and control messages come in as JSON frames. The server distinguishes by frame type:

```python
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = await session_service.create_session(
        app_name="muse", user_id=session_id
    )
    live_queue = LiveRequestQueue()

    # Start the ADK live loop in the background
    asyncio.create_task(run_live_loop(session.id, live_queue, websocket))

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                # Raw PCM audio from browser AudioWorklet
                live_queue.send_realtime(
                    genai_types.Blob(mime_type="audio/pcm", data=message["bytes"])
                )
            elif "text" in message:
                frame = json.loads(message["text"])
                if frame["type"] == "image":
                    jpeg_bytes = base64.b64decode(frame["data"])
                    live_queue.send_realtime(
                        genai_types.Blob(mime_type="image/jpeg", data=jpeg_bytes)
                    )
                elif frame["type"] == "generate_image":
                    # Trigger image generation outside the live loop
                    asyncio.create_task(
                        generate_and_send_image(frame["prompt"], websocket)
                    )
    except WebSocketDisconnect:
        live_queue.close()
```

Image generation runs as a separate async task so it doesn't block the live audio stream:

```python
async def generate_and_send_image(prompt: str, websocket: WebSocket):
    client = google.genai.Client()
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp-image-generation",
        contents=prompt,
        config=google.genai.types.GenerateContentConfig(
            response_modalities=["image"],
        ),
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data:
            image_b64 = base64.b64encode(part.inline_data.data).decode()
            await websocket.send_json({
                "type": "generated_image",
                "data": image_b64,
                "mime_type": part.inline_data.mime_type,
            })
```

---

## The AudioWorklet: PCM In and Out at Different Sample Rates

This was the most technically finicky part of the project. Gemini's native audio model expects 16kHz PCM input and outputs 24kHz PCM. The browser's `AudioContext` often runs at 44.1kHz or 48kHz. AudioWorklet is the right tool, but it takes some care.

The capture worklet resamples to 16kHz before sending:

```javascript
// capture-worklet.js
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
  }

  process(inputs) {
    const input = inputs[0][0]; // mono
    if (!input) return true;

    // Downsample from sampleRate to 16000
    const ratio = sampleRate / 16000;
    const outLength = Math.floor(input.length / ratio);
    const downsampled = new Float32Array(outLength);

    for (let i = 0; i < outLength; i++) {
      downsampled[i] = input[Math.floor(i * ratio)];
    }

    // Convert Float32 to Int16 PCM
    const pcm = new Int16Array(downsampled.length);
    for (let i = 0; i < downsampled.length; i++) {
      pcm[i] = Math.max(-32768, Math.min(32767, downsampled[i] * 32768));
    }

    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
```

The playback worklet receives 24kHz Int16 PCM from the WebSocket and plays it back:

```javascript
// playback-worklet.js
class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._queue = [];
    this.port.onmessage = (e) => {
      const pcm = new Int16Array(e.data);
      const float = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) {
        float[i] = pcm[i] / 32768;
      }
      this._queue.push(float);
    };
  }

  process(outputs) {
    const output = outputs[0][0];
    if (!output) return true;

    let offset = 0;
    while (offset < output.length && this._queue.length > 0) {
      const chunk = this._queue[0];
      const toCopy = Math.min(chunk.length, output.length - offset);
      output.set(chunk.subarray(0, toCopy), offset);
      offset += toCopy;
      if (toCopy < chunk.length) {
        this._queue[0] = chunk.subarray(toCopy);
      } else {
        this._queue.shift();
      }
    }

    return true;
  }
}

registerProcessor("playback-processor", PlaybackProcessor);
```

The playback context needs to be initialized at 24kHz to avoid a second resampling step:

```javascript
const playbackContext = new AudioContext({ sampleRate: 24000 });
await playbackContext.audioWorklet.addModule("/playback-worklet.js");
const playbackNode = new AudioWorkletNode(playbackContext, "playback-processor");
playbackNode.connect(playbackContext.destination);
```

---

## Getting Images to the Browser During a Live Conversation

The challenge here is that image generation is not part of the live audio stream — it's a separate API call to `gemini-2.0-flash-exp-image-generation`. But you don't want to interrupt the conversation to do it.

Our solution: the orchestrator agent, during its text response, emits a structured signal when it wants an image generated. The server parses this signal from the event stream and fires off an async image generation task without touching the `LiveRequestQueue`. The result comes back through the WebSocket as a JSON frame with type `generated_image`, and the browser renders it in a side panel.

This keeps the audio conversation flowing while images appear asynchronously — usually within 6–10 seconds of the trigger point.

The key insight is that the WebSocket is multiplexed. Binary frames are always audio. JSON frames carry everything else: generated images, text overlays, UI state updates. The browser routes them by `type` field.

---

## What We Learned

**ADK's `run_live()` is genuinely powerful but sparsely documented.** The async iterator pattern is clean once you understand it, but the `event.content.parts[]` structure took time to get right. Particularly: not all events have content, not all parts have `inline_data`, and audio parts use `inline_data.data` while the MIME type identifies whether it's audio or something else.

**Native audio models want to talk, not just respond.** `gemini-2.5-flash-native-audio-preview-12-2025` will proactively generate speech when the session is established and there's context in the system prompt. This is what makes MUSE's greeting feel natural — we didn't add special logic for it, the model just does it.

**AudioWorklet has sharp edges.** The buffer management in the playback worklet needs to be careful about underruns and the queue growing unbounded if generation is faster than playback. We added a simple queue length cap that drops oldest frames when the buffer exceeds ~3 seconds.

**Image generation latency is acceptable but visible.** At 6–10 seconds, users notice the wait. We added a "shimmer" loading state over the image panel the moment the orchestrator signals intent to generate, which makes the wait feel shorter.

---

## What's Next

MUSE in its current form is a proof of concept with a clear path forward:

- **Persistent sessions**: replace `InMemorySessionService` with a database-backed session store so conversations and their generated art persist across reconnects
- **Style memory**: let MUSE learn a user's aesthetic preferences over time and carry them across sessions
- **Export**: bundle a session's generated pieces into a downloadable gallery
- **Mobile**: the AudioWorklet approach works on mobile browsers; a native app would give us better camera control for the environment walking mode
- **Shared sessions**: two people, one synesthetic experience — collaborative sensory translation

The broader idea — using AI to build cross-modal translation as a first-class experience rather than a feature — feels like it has legs well beyond this project. There's something genuinely interesting about an AI that doesn't just process your senses but translates between them.

---

*MUSE was built for the Gemini Live Agent Challenge. The full source is available on GitHub. Built with `google-adk` 1.26.0, Gemini 2.5 Flash Native Audio, FastAPI, and more lines of AudioWorklet debugging than we'd like to admit.*
