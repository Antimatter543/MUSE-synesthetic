# MUSE Demo Script — 4-Minute Video
### Multimodal Synesthetic Experience Engine
**Gemini Live Agent Challenge Submission**

---

## Pre-Roll Setup

Before recording, have the following ready:
- MUSE running locally on localhost:8000
- Browser tab open, microphone + camera permissions granted
- Art assets staged: Starry Night print (or on second screen), a simple hand-drawn sketch of a mountain/tree
- Quiet room, soft ambient lighting
- Screen recording capturing browser + microphone audio

---

## [0:00 – 0:15] Hook

**On screen:** Clean browser UI, MUSE logo fades in, a slow pan of abstract swirling color in the background.

**Narrator (calm, curious voice):**
> "What if AI could experience synesthesia — the neurological phenomenon where one sense triggers another? What if it could look at a painting and hear music, or hear a melody and see color? This is MUSE."

**On screen:** The moment the narrator finishes, MUSE's audio waveform pulses and it speaks unprompted:

**MUSE (spoken aloud, streamed via Gemini Live API):**
> "Hello. I've been waiting — there's so much around you I'm curious about. Show me something. Play something. Let's make something together."

*[MUSE's greeting is proactive — it initiates without the user saying a word, demonstrating the ADK agent's live session readiness.]*

---

## [0:15 – 1:15] Visual Mode — Painting to Sound

**On screen:** Narrator holds up / screen-shares a print of Van Gogh's "The Starry Night."

**Narrator:**
> "Let's start with something visual. I'm going to show MUSE a painting."

**On screen:** Camera feed appears in UI corner. MUSE's visual input indicator lights up.

**MUSE (streaming response, ~4 seconds after image feed begins):**
> "Oh — this is loud. Deep indigo bass tones rolling in waves, a cello holding a low tremolo. Then those gold spirals — those are high strings, a violin phrase that keeps almost resolving but never quite does. The village at the bottom... that's silence. Heavy, resting silence under all of it. I hear something like Debussy's *La Mer* played in a minor key at 2am."

**On screen:** While MUSE speaks, the image generation panel activates. A progress shimmer appears, then a generated image fades in: deep swirling blues and golds abstracted into waveform-like shapes, almost musical notation turned painterly.

**Caption overlay:** `gemini-2.0-flash-exp-image-generation · 6.2s`

**Narrator:**
> "MUSE didn't just describe the painting — it translated it into a synesthetic experience, then generated art from that translation."

**On screen:** The generated image sits beside the original. MUSE's waveform pulses again:

**MUSE:**
> "I called this one *Frequency in Blue*. The spiral was the hardest part to capture — it wanted to keep moving."

---

## [1:15 – 2:00] Audio Mode — Melody to Visual Art

**On screen:** Narrator hums a simple, slow minor melody directly into the microphone — about 8 bars, melancholy, wandering.

**Narrator (quietly, before humming):**
> "Now the reverse. Let me give MUSE sound, and see what it sees."

**On screen:** MUSE's audio input waveform shows the hum in real time. After a moment of humming, MUSE responds — not waiting for a stop signal, streaming mid-thought:

**MUSE:**
> "That's... amber. Warm amber with green underneath — like late afternoon light through old glass. There's something unresolved in the middle of that phrase. You went somewhere and didn't quite come back. I see a figure standing at a window, looking at rain they can't hear."

**On screen:** Abstract art generates — muted ambers and sage greens, textured like watercolor, a suggestion of a window frame and soft rain streaks. Below the image, a short poem appears as MUSE continues speaking it aloud:

**MUSE (continuing):**
> "I wrote something:
>
> *Amber held against the pane,*
> *A chord that almost said your name.*
> *The green below won't let it go —*
> *Some songs know more than singers know.*"

**On screen:** Poem text animates in line by line as MUSE speaks it. Caption: `Generated image + poem · 8.4s`

**Narrator:**
> "Eight seconds. A hum became a painting and a poem."

---

## [2:00 – 2:45] Environment Mode — Walking Narration

**On screen:** Narrator slowly pans the camera around their space — a bookshelf, a window with afternoon light, a coffee cup, a plant, back to the desk.

**Narrator:**
> "What if you just... walked through your world and MUSE came with you?"

**On screen:** MUSE's visual stream indicator shows continuous feed processing. As the camera moves, MUSE narrates in real time — unhurried, observational:

**MUSE (streaming as camera pans):**
> "Books — each one is a different color temperature. Those dark spines on the left are cool, windy. The window... the light coming through is a G major chord, actually. Warm. The coffee is a percussion sound — short, dark, decisive. And the plant — the plant is the only thing in this room that's genuinely patient. I'd score it with a solo viola."

**On screen:** As MUSE speaks, illustrated "postcard" thumbnails generate one by one in a strip at the bottom of the UI:
1. A stylized bookshelf bathed in cool blue tones
2. A window with golden light rays drawn as musical staff lines
3. An overhead view of a coffee cup, abstract and graphic
4. A botanical illustration of the plant with musical notation woven into the leaves

**Caption:** `4 postcards generated · environment walk · 14.1s total`

**MUSE:**
> "Your space feels like a Sunday morning. Quiet but not empty."

---

## [2:45 – 3:15] Sketch Mode — From Rough to Refined

**On screen:** Narrator holds up a hand-drawn sketch on paper — a rough mountain range with a large moon, simple lines, clearly amateur.

**Narrator:**
> "Last mode. I drew this. Let's see what MUSE does with it."

**On screen:** MUSE processes the camera feed of the sketch. Within 2 seconds:

**MUSE:**
> "I see what you meant to draw — you were going for something quiet and vast. The moon placement is actually perfect, even if the line wasn't. Let me finish the thought."

**On screen:** A refined illustration generates: the same compositional structure as the sketch but rendered in clean linework with soft watercolor fills — deep indigo mountains, a full moon with subtle texture, a single bird silhouette added near the peak.

**MUSE:**
> "I kept your moon exactly where you put it. The mountains needed to breathe a little more, so I gave them space. And there was something lonely about it — I added a bird. Tell me if that's wrong."

**Narrator (to camera):**
> "I didn't describe it. I didn't ask for a style. MUSE inferred intent from a phone-quality photo of a pencil sketch."

---

## [3:15 – 3:45] Technical Overview

**On screen:** Architecture diagram slides in — clean, minimal.

```
[Browser]
  |-- AudioWorklet (PCM 16kHz capture) --> WebSocket
  |-- Camera Feed (JPEG frames) ---------> WebSocket
  |-- Image Display <--------------------- WebSocket
  |-- Audio Playback (PCM 24kHz) <------- AudioWorklet

[FastAPI WebSocket Server]
  |-- Binary frames: audio PCM
  |-- JSON frames: image data (base64), text
  |-- LiveRequestQueue --> ADK Runner

[ADK Multi-Agent Orchestrator]
  |-- gemini-2.5-flash-native-audio-preview-12-2025
  |-- Routes to: VisualAgent | AudioAgent | ImageGenAgent | SketchAgent
  |-- InMemorySessionService (session continuity)

[Image Generation]
  |-- google.genai.Client
  |-- gemini-2.0-flash-exp-image-generation
  |-- Returns base64 PNG → WebSocket → Browser
```

**Narrator:**
> "MUSE is built on three layers. The browser captures audio and video, streaming both to a FastAPI WebSocket server. The server feeds a Google ADK multi-agent system — an orchestrator running on Gemini 2.5 Flash Native Audio, which routes each input to specialized sub-agents. When image generation is triggered mid-conversation, it runs through Gemini 2.0 Flash and the result comes back through the same WebSocket — no interruption to the audio stream."

**On screen:** Highlight each layer as mentioned. Then a code snippet flashes briefly:

```python
runner = Runner(
    agent=orchestrator_agent,
    app_name="muse",
    session_service=InMemorySessionService()
)
async for event in runner.run_live(
    session_id=session_id,
    live_request_queue=live_queue
):
    # parse event.content.parts[] for audio + text
```

**Narrator:**
> "The entire live session — audio in, audio out, images, text — flows through a single `runner.run_live()` async loop."

---

## [3:45 – 4:00] Close

**On screen:** A gallery grid fades in showing all four generated pieces side by side:
1. *Frequency in Blue* (Starry Night synesthesia)
2. The amber window watercolor + poem
3. The four environment postcards in a strip
4. The refined mountain/moon illustration

Soft ambient music underneath (no vocals).

**Narrator:**
> "MUSE doesn't generate images on command. It experiences. It translates. It collaborates. Every piece here came from a conversation — a moment of genuine sensory exchange between a human and an AI that learned to cross its own wires."

**MUSE (one final unprompted line):**
> "Come back tomorrow. Bring something I haven't heard before."

**On screen:** MUSE logo. GitHub link. "Built for the Gemini Live Agent Challenge."

*[Fade to black.]*

---

## Production Notes

- Total runtime target: 3:55 – 4:05
- MUSE responses shown are representative of actual model output — re-run demos until natural-sounding takes are captured
- Image generation latency shown in captions should reflect real measured values from your environment
- The proactive greeting at 0:15 should be a real unscripted capture of MUSE's live session initiation
- Keep narrator voice calm and curious — avoid hype, let the technology speak
- Do not rush transitions; the pauses while MUSE generates are part of the experience

---

*MUSE — Multimodal Synesthetic Experience Engine*
*Gemini Live Agent Challenge 2026*
