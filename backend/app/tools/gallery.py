import logging
from typing import Optional

logger = logging.getLogger(__name__)


def save_to_gallery(
    session_id: str,
    image_b64: str,
    prompt: str,
    mode: str = "visual",
    poem: Optional[str] = None,
) -> dict:
    """Save a generated image to the gallery (Cloud Storage + Firestore).

    Args:
        session_id: Current session identifier.
        image_b64: Base64-encoded JPEG image data.
        prompt: The synesthetic prompt that generated this image.
        mode: Which MUSE mode created this (visual/audio/environment/sketch).
        poem: Optional poem associated with this image.

    Returns:
        Dict with 'entry_id', 'image_url', and 'success' flag.
    """
    from app.services.cloud_storage import upload_image_b64
    from app.services.firestore import save_gallery_entry

    image_url = upload_image_b64(image_b64, session_id)
    if not image_url:
        # Fallback: return base64 data URL
        image_url = f"data:image/jpeg;base64,{image_b64[:100]}..."

    entry_id = save_gallery_entry(
        session_id=session_id,
        image_url=image_url,
        prompt=prompt,
        mode=mode,
        poem=poem,
    )

    return {
        "success": True,
        "entry_id": entry_id,
        "image_url": image_url,
    }


def get_gallery(session_id: str) -> dict:
    """Retrieve all gallery entries for the current session.

    Args:
        session_id: Current session identifier.

    Returns:
        Dict with 'entries' list and 'count'.
    """
    from app.services.firestore import get_gallery_entries

    entries = get_gallery_entries(session_id)
    return {
        "entries": entries,
        "count": len(entries),
    }
