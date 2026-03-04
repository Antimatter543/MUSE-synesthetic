from google.adk.agents import LlmAgent as Agent

from app.config import SUBAGENT_MODEL
from app.prompts.poetry_system import POETRY_SYSTEM_PROMPT


def create_poetry_agent() -> Agent:
    """Create the PoetryAgent for structured poem generation."""
    agent = Agent(
        name="PoetryAgent",
        model=SUBAGENT_MODEL,
        description=(
            "Generates structured poems (haiku, sonnet, free verse) from "
            "synesthetic sensory descriptions provided by MUSE."
        ),
        instruction=POETRY_SYSTEM_PROMPT,
        output_key="generated_poem",
    )
    return agent
