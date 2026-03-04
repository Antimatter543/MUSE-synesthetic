import base64
import logging
from typing import Optional

from google import genai
from google.genai import types as genai_types

logger = logging.getLogger(__name__)


def generate_synesthetic_image(
    prompt: str,
    style: str = "abstract expressionist",
    mood: str = "evocative",
    reference_description: Optional[str] = None,
) -> dict:
    """Generate a synesthetic artwork image using Gemini image generation.

    Args:
        prompt: Description of the synesthetic experience to visualize.
        style: Artistic style (e.g., "abstract expressionist", "watercolor",
               "digital art", "oil painting").
        mood: Emotional quality (e.g., "melancholic", "joyful", "ethereal").
        reference_description: Optional description of a reference visual to
                               incorporate.

    Returns:
        Dict with 'image_b64' (base64 JPEG), 'image_url' (if uploaded),
        'prompt_used', and 'success' flag.
    """
    from app.config import IMAGE_GEN_MODEL

    full_prompt = (
        f"Create a {style} artwork that captures this synesthetic experience: "
        f"{prompt}. "
        f"Mood: {mood}. "
    )
    if reference_description:
        full_prompt += (
            f"Incorporate elements inspired by: {reference_description}. "
        )
    full_prompt += (
        "The image should feel like a translation between senses — "
        "where colors have sound, textures have temperature, and light has "
        "emotional weight. Make it visually striking and emotionally resonant."
    )

    try:
        client = genai.Client()
        response = client.models.generate_images(
            model=IMAGE_GEN_MODEL,
            prompt=full_prompt,
            config=genai_types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
                output_mime_type="image/jpeg",
            ),
        )

        if response.generated_images:
            image_bytes = response.generated_images[0].image.image_bytes
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            return {
                "success": True,
                "image_b64": image_b64,
                "prompt_used": full_prompt,
                "style": style,
                "mood": mood,
            }
        else:
            return {
                "success": False,
                "error": "No image generated",
                "prompt_used": full_prompt,
            }

    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "prompt_used": full_prompt,
        }
