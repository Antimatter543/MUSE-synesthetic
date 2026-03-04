import os
from dotenv import load_dotenv

load_dotenv()

# Set GOOGLE_API_KEY in environment so google-genai SDK picks it up automatically
_api_key = os.getenv("GOOGLE_API_KEY")
if _api_key:
    os.environ["GOOGLE_API_KEY"] = _api_key

GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

ORCHESTRATOR_MODEL = os.getenv(
    "ORCHESTRATOR_MODEL",
    "gemini-2.5-flash-native-audio-preview-12-2025"
)
IMAGE_GEN_MODEL = os.getenv(
    "IMAGE_GEN_MODEL",
    "gemini-2.0-flash-exp-image-generation"
)
SUBAGENT_MODEL = os.getenv("SUBAGENT_MODEL", "gemini-2.5-flash")

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "muse-gallery-images")
FIRESTORE_COLLECTION = os.getenv("FIRESTORE_COLLECTION", "muse_gallery")

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173"
).split(",")
