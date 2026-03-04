"""
Generate TTS narration and create a narrated demo video.
Uses edge-tts for voice, ffmpeg to merge with video.
"""
import asyncio
import subprocess
import os
from pathlib import Path

DEMO_DIR = Path(__file__).parent.parent / "demo-video"
NARRATION_DIR = DEMO_DIR / "narration"
NARRATION_DIR.mkdir(exist_ok=True)

# Narrator lines in order, with a pause (seconds) BEFORE each line.
# Pauses simulate MUSE speaking, image generation loading, and camera panning.
NARRATION_SEGMENTS = [
    # (pause_before, text)
    # [0:00] Hook
    (2.0, "What if AI could experience synesthesia, the neurological phenomenon where one sense triggers another? What if it could look at a painting and hear music, or hear a melody and see color? This is MUSE."),
    # [0:15] MUSE greets (simulated 10s), then narrator continues
    (10.0, "Let's start with something visual. I'm going to show MUSE a painting."),
    # [0:30] MUSE analyzes painting (~20s response) + image generates (~8s) = 28s pause
    (28.0, "MUSE didn't just describe the painting. It translated it into a synesthetic experience, then generated art from that translation."),
    # MUSE says "I called this one..." (~6s)
    (8.0, "Now the reverse. Let me give MUSE sound, and see what it sees."),
    # Humming 15s + MUSE audio response ~15s = 30s
    (30.0, "Eight seconds. A hum became a painting and a poem."),
    # Brief pause between modes
    (5.0, "What if you just walked through your world and MUSE came with you?"),
    # Camera pan + MUSE narrating environment (~30s) + MUSE final line (~5s) = 35s
    (35.0, "Last mode. I drew this. Let's see what MUSE does with it."),
    # MUSE sketch response (~10s) + image gen (~8s) + MUSE followup (~5s) = 23s
    (23.0, "I didn't describe it. I didn't ask for a style. MUSE inferred intent from a phone-quality photo of a pencil sketch."),
    # Transition to technical section
    (5.0, "MUSE is built on three layers. The browser captures audio and video, streaming both to a FastAPI WebSocket server. The server feeds a Google ADK multi-agent system, an orchestrator running on Gemini 2.5 Flash Native Audio, which routes each input to specialized sub-agents. When image generation is triggered mid-conversation, it runs through Gemini 2.0 Flash and the result comes back through the same WebSocket, with no interruption to the audio stream."),
    # Code snippet on screen
    (5.0, "The entire live session, audio in, audio out, images, text, flows through a single runner.run_live async loop."),
    # Gallery fade-in
    (5.0, "MUSE doesn't generate images on command. It experiences. It translates. It collaborates. Every piece here came from a conversation, a moment of genuine sensory exchange between a human and an AI that learned to cross its own wires."),
]

VOICE = "en-US-AriaNeural"  # calm, natural female voice


async def generate_tts(text: str, output_path: Path, voice: str = VOICE):
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(output_path))
    print(f"  Generated: {output_path.name}")


def get_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())


def make_silence(duration: float, output_path: Path):
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", f"anullsrc=r=24000:cl=mono",
        "-t", str(duration),
        "-c:a", "pcm_s16le",
        str(output_path)
    ], check=True, capture_output=True)


async def main():
    print("Step 1: Generating TTS for each narrator line...")
    mp3_files = []
    for i, (pause, text) in enumerate(NARRATION_SEGMENTS):
        out = NARRATION_DIR / f"line_{i:02d}.mp3"
        if not out.exists():
            await generate_tts(text, out)
        else:
            print(f"  Skipping (exists): {out.name}")
        mp3_files.append((pause, out))

    print("\nStep 2: Building full narration track...")
    # Create silence files and concatenate everything
    parts = []
    for i, (pause, mp3) in enumerate(mp3_files):
        if pause > 0:
            sil = NARRATION_DIR / f"silence_{i:02d}.wav"
            make_silence(pause, sil)
            parts.append(sil)
        parts.append(mp3)

    # Write concat list
    concat_list = NARRATION_DIR / "concat.txt"
    with open(concat_list, "w") as f:
        for p in parts:
            f.write(f"file '{p.absolute()}'\n")

    narration_audio = DEMO_DIR / "narration_full.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list),
        "-c:a", "libmp3lame", "-q:a", "2",
        str(narration_audio)
    ], check=True, capture_output=True)
    print(f"  Full narration: {narration_audio}")

    narration_dur = get_duration(narration_audio)
    print(f"  Narration duration: {narration_dur:.1f}s ({narration_dur/60:.1f} min)")

    print("\nStep 3: Looping source video to match narration length...")
    source_video = DEMO_DIR / "muse-demo.mp4"
    source_dur = get_duration(source_video)
    loops = int(narration_dur / source_dur) + 2

    looped_video = DEMO_DIR / "muse-demo-looped.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-stream_loop", str(loops),
        "-i", str(source_video),
        "-t", str(narration_dur + 2),
        "-c:v", "copy",
        "-an",
        str(looped_video)
    ], check=True, capture_output=True)
    print(f"  Looped video: {looped_video}")

    print("\nStep 4: Merging video + narration audio...")
    final = DEMO_DIR / "muse-demo-narrated.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-i", str(looped_video),
        "-i", str(narration_audio),
        "-c:v", "libx264", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        str(final)
    ], check=True, capture_output=True)

    final_dur = get_duration(final)
    print(f"\nDone! Final video: {final}")
    print(f"Duration: {final_dur:.1f}s ({final_dur/60:.1f} min)")
    return str(final)


if __name__ == "__main__":
    asyncio.run(main())
