"""Tests for MUSE tools (with mocked Gemini calls)."""
import pytest
from unittest.mock import MagicMock, patch


def test_generate_image_success():
    mock_image = MagicMock()
    mock_image.image.image_bytes = b"fake-jpeg-bytes"
    mock_response = MagicMock()
    mock_response.generated_images = [mock_image]

    with patch("app.tools.image_generation.genai") as mock_genai:
        mock_client = MagicMock()
        mock_genai.Client.return_value = mock_client
        mock_client.models.generate_images.return_value = mock_response

        from app.tools.image_generation import generate_synesthetic_image
        result = generate_synesthetic_image(
            prompt="A crimson sunset that sounds like a cello",
            style="watercolor",
            mood="melancholic",
        )

    assert result["success"] is True
    assert "image_b64" in result
    assert result["style"] == "watercolor"
    assert result["mood"] == "melancholic"
    assert "watercolor" in result["prompt_used"]


def test_generate_image_failure():
    with patch("app.tools.image_generation.genai") as mock_genai:
        mock_genai.Client.side_effect = Exception("API error")

        from app.tools.image_generation import generate_synesthetic_image
        result = generate_synesthetic_image(prompt="test")

    assert result["success"] is False
    assert "error" in result


def test_generate_image_empty_response():
    mock_response = MagicMock()
    mock_response.generated_images = []

    with patch("app.tools.image_generation.genai") as mock_genai:
        mock_client = MagicMock()
        mock_genai.Client.return_value = mock_client
        mock_client.models.generate_images.return_value = mock_response

        from app.tools.image_generation import generate_synesthetic_image
        result = generate_synesthetic_image(prompt="test")

    assert result["success"] is False


def test_get_gallery_no_firestore():
    """get_gallery returns empty list gracefully when Firestore unavailable."""
    with patch("app.services.firestore.get_firestore_client", return_value=None):
        from app.tools.gallery import get_gallery
        result = get_gallery("test-session")

    assert result["count"] == 0
    assert result["entries"] == []


def test_save_to_gallery_no_services():
    """save_to_gallery returns success with data-uri fallback when GCS unavailable."""
    import base64
    fake_b64 = base64.b64encode(b"fake").decode()

    with patch("app.services.cloud_storage.get_gcs_client", return_value=None), \
         patch("app.services.firestore.get_firestore_client", return_value=None):
        from app.tools.gallery import save_to_gallery
        result = save_to_gallery(
            session_id="test-session",
            image_b64=fake_b64,
            prompt="test prompt",
            mode="visual",
        )

    assert result["success"] is True
    assert "entry_id" in result
