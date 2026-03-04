"""Record a demo video of the MUSE frontend using Playwright."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

FRONTEND_URL = "https://storage.googleapis.com/muse-frontend-project-b5adb824-a03c-48da-935/index.html?v2"
VIDEO_DIR = Path(__file__).parent.parent / "demo-video"


async def record():
    VIDEO_DIR.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--start-maximized", "--no-sandbox", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context(
            record_video_dir=str(VIDEO_DIR),
            record_video_size={"width": 1280, "height": 720},
            viewport={"width": 1280, "height": 720},
        )
        page = await context.new_page()

        print("Opening MUSE...")
        await page.goto(FRONTEND_URL, wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # Wait for connected
        try:
            await page.wait_for_selector("text=Connected", timeout=10000)
            print("Connected!")
            await page.wait_for_timeout(3000)
        except Exception:
            print("Connection timeout — continuing anyway")

        print("Showing modes...")
        for mode, label in [("Audio", "🎵"), ("Environ", "🌍"), ("Sketch", "✏️"), ("Visual", "🎨")]:
            try:
                btn = page.get_by_role("button", name=mode)
                await btn.click()
                print(f"  Clicked {mode}")
                await page.wait_for_timeout(1500)
            except Exception as e:
                print(f"  Could not click {mode}: {e}")

        print("Showing gallery...")
        try:
            await page.get_by_role("button", name="gallery").click()
            await page.wait_for_timeout(2000)
            await page.get_by_role("button", name="transcript").click()
            await page.wait_for_timeout(2000)
        except Exception as e:
            print(f"Tab error: {e}")

        await page.wait_for_timeout(2000)
        print("Closing and saving video...")
        video_path = await page.video.path()
        await context.close()
        await browser.close()

        # Rename to a nice name
        if video_path and Path(video_path).exists():
            dest = VIDEO_DIR / "muse-demo-raw.webm"
            Path(video_path).rename(dest)
            print(f"Video saved: {dest}")
            return str(dest)
        else:
            print("Video file not found")


if __name__ == "__main__":
    result = asyncio.run(record())
    print(f"Result: {result}")
