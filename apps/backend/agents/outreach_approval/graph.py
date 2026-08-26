"""Two-node graph: await_approval (interrupt()s until a human decides)
-> persist_decision (writes the decision the same way the old direct-write
code did). generate() starts a run per draft and lets it pause; decide()
resumes the exact same run with the human's decision — the interrupt is
what decide() actually drives, not a decorative wrapper around it.

Compiled once, at app startup, against the persistent checkpointer set up in
main.py's lifespan (see core/checkpointer.py) — needs init_outreach_approval_graph()
called before get_outreach_approval_graph() is usable.
"""

from __future__ import annotations

from bson import ObjectId
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import interrupt

from agents.outreach_approval.state import OutreachApprovalState
from models.outreach_draft import OutreachDraftEditedText
from repositories import outreach_draft_repository


def await_approval_node(state: OutreachApprovalState) -> dict:
    decision = interrupt({"draft_id": state["draft_id"]})
    return {"decision": decision["status"], "edited_text": decision.get("editedText")}


async def persist_decision_node(state: OutreachApprovalState) -> dict:
    edited_text = state.get("edited_text")
    edited_text_doc = OutreachDraftEditedText(**edited_text) if edited_text else None
    doc = await outreach_draft_repository.update_status(
        ObjectId(state["draft_id"]), ObjectId(state["user_id"]), state["decision"], edited_text_doc
    )
    return {"final_status": doc.status if doc else None}


def _build_graph() -> StateGraph:
    graph = StateGraph(OutreachApprovalState)
    graph.add_node("await_approval", await_approval_node)
    graph.add_node("persist_decision", persist_decision_node)
    graph.set_entry_point("await_approval")
    graph.add_edge("await_approval", "persist_decision")
    graph.add_edge("persist_decision", END)
    return graph


_compiled_graph: CompiledStateGraph | None = None


def init_outreach_approval_graph(checkpointer: BaseCheckpointSaver) -> None:
    global _compiled_graph
    _compiled_graph = _build_graph().compile(checkpointer=checkpointer)


def get_outreach_approval_graph() -> CompiledStateGraph:
    if _compiled_graph is None:
        raise RuntimeError("Outreach approval graph not initialized — call init_outreach_approval_graph() at app startup")
    return _compiled_graph
