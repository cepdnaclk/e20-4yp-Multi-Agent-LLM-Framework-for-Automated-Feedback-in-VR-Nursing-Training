from types import SimpleNamespace

import pytest

from app.rag import retriever


@pytest.mark.asyncio
async def test_retrieve_with_rag_returns_text_for_valid_query(monkeypatch):
    async def fake_create(**kwargs):
        return SimpleNamespace(
            output=[
                SimpleNamespace(
                    type="message",
                    content=[SimpleNamespace(type="text", text="Relevant wound-care guidance")],
                )
            ]
        )

    monkeypatch.setattr(retriever.client.responses, "create", fake_create)

    result = await retriever.retrieve_with_rag("hand hygiene", "scenario_001")

    assert result["text"] == "Relevant wound-care guidance"
    assert result["raw_response"] is not None


@pytest.mark.asyncio
async def test_retrieve_with_rag_returns_empty_string_on_api_failure(monkeypatch):
    async def fake_create(**kwargs):
        raise RuntimeError("OpenAI unavailable")

    monkeypatch.setattr(retriever.client.responses, "create", fake_create)

    result = await retriever.retrieve_with_rag("hand hygiene", "scenario_001")

    assert result["text"] == ""
    assert result["raw_response"] is None

