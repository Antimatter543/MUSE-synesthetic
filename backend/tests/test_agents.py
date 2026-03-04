"""Tests for MUSE agent instantiation."""
import pytest

from app.agents.orchestrator import create_orchestrator
from app.agents.poetry_agent import create_poetry_agent
from app.agents.narrative_agent import create_narrative_agent


def test_orchestrator_created():
    agent = create_orchestrator()
    assert agent.name == "MuseOrchestrator"
    assert len(agent.tools) == 3


def test_poetry_agent_created():
    agent = create_poetry_agent()
    assert agent.name == "PoetryAgent"
    assert agent.output_key == "generated_poem"


def test_narrative_agent_created():
    agent = create_narrative_agent()
    assert agent.name == "NarrativeAgent"
    assert agent.output_key == "narrative_segment"


def test_orchestrator_has_required_tools():
    agent = create_orchestrator()
    tool_names = [t.name for t in agent.tools]
    assert "generate_synesthetic_image" in tool_names
    assert "save_to_gallery" in tool_names
    assert "get_gallery" in tool_names
