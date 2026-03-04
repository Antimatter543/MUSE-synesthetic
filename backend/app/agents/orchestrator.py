from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from app.config import ORCHESTRATOR_MODEL
from app.prompts.orchestrator_system import ORCHESTRATOR_SYSTEM_PROMPT
from app.tools.image_generation import generate_synesthetic_image
from app.tools.gallery import save_to_gallery, get_gallery


def create_orchestrator() -> LlmAgent:
    """Create the MuseOrchestrator live streaming agent."""
    tools = [
        FunctionTool(generate_synesthetic_image),
        FunctionTool(save_to_gallery),
        FunctionTool(get_gallery),
    ]

    agent = LlmAgent(
        name="MuseOrchestrator",
        model=ORCHESTRATOR_MODEL,
        description=(
            "MUSE — a real-time synesthetic AI that translates between senses. "
            "Sees camera input, hears audio, speaks creative interpretations, "
            "and generates synesthetic artwork."
        ),
        instruction=ORCHESTRATOR_SYSTEM_PROMPT,
        tools=tools,
    )

    return agent
