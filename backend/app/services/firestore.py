from typing import Optional
import uuid
from datetime import datetime, timezone

from app.config import FIRESTORE_COLLECTION, GOOGLE_CLOUD_PROJECT


def get_firestore_client():
    """Get Firestore client, lazy-initialized."""
    try:
        from google.cloud import firestore
        return firestore.Client(project=GOOGLE_CLOUD_PROJECT)
    except Exception:
        return None


def save_gallery_entry(
    session_id: str,
    image_url: str,
    prompt: str,
    mode: str,
    poem: Optional[str] = None,
) -> str:
    """Save a gallery entry to Firestore. Returns the entry ID."""
    client = get_firestore_client()
    if not client:
        return str(uuid.uuid4())

    entry_id = str(uuid.uuid4())
    doc_ref = client.collection(FIRESTORE_COLLECTION).document(entry_id)
    doc_ref.set({
        "id": entry_id,
        "session_id": session_id,
        "image_url": image_url,
        "prompt": prompt,
        "mode": mode,
        "poem": poem,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return entry_id


def get_gallery_entries(session_id: str) -> list[dict]:
    """Get all gallery entries for a session."""
    client = get_firestore_client()
    if not client:
        return []

    docs = (
        client.collection(FIRESTORE_COLLECTION)
        .where("session_id", "==", session_id)
        .order_by("created_at", direction="DESCENDING")
        .limit(50)
        .stream()
    )
    return [doc.to_dict() for doc in docs]
