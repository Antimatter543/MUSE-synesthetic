from google.adk.agents import LlmAgent as Agent

from app.config import SUBAGENT_MODEL
from app.prompts.narrative_system import NARRATIVE_SYSTEM_PROMPT


def create_narrative_agent() -> Agent:
    """Create the NarrativeAgent for ongoing journey story arcs."""
    agent = Agent(
        name="NarrativeAgent",
        model=SUBAGENT_MODEL,
        description=(
            "Builds ongoing narrative arcs from accumulated environmental "
            "observations, generating illustrated journey segments."
        ),
        instruction=NARRATIVE_SYSTEM_PROMPT,
        output_key="narrative_segment",
    )
    return agent
