import base64
import uuid
from typing import Optional

from app.config import GCS_BUCKET_NAME, GOOGLE_CLOUD_PROJECT


def get_gcs_client():
    """Get GCS client, lazy-initialized."""
    try:
        from google.cloud import storage
        return storage.Client(project=GOOGLE_CLOUD_PROJECT)
    except Exception:
        return None


def upload_image_b64(image_b64: str, session_id: str) -> Optional[str]:
    """Upload a base64-encoded image to GCS. Returns public URL or None."""
    client = get_gcs_client()
    if not client:
        return None

    image_bytes = base64.b64decode(image_b64)
    filename = f"{session_id}/{uuid.uuid4()}.jpg"

    bucket = client.bucket(GCS_BUCKET_NAME)
    blob = bucket.blob(filename)
    blob.upload_from_string(image_bytes, content_type="image/jpeg")
    blob.make_public()

    return blob.public_url
