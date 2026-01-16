from typing import Dict, List, Any, Optional

from app.rag.retriever import retrieve_with_rag
from app.core.coordinator import Coordinator
from app.services.session_manager import SessionManager
from app.utils.mcq_evaluator import MCQEvaluator
from app.utils.schema import EvaluatorResponse
from app.services.conversation_manager import ConversationManager


class EvaluationService:
    """
    Orchestrates evaluator agents and aggregates feedback.

    Week-7 FINAL:
    - Session is the single source of scenario data
    - No Firestore calls here
    """

    def __init__(
        self,
        coordinator: Coordinator,
        session_manager: SessionManager
    ):
        self.coordinator = coordinator
        self.session_manager = session_manager
        self.mcq_evaluator = MCQEvaluator()
        self.conversation_manager = ConversationManager()

    # ------------------------------------------------
    # Context preparation
    # ------------------------------------------------
    async def prepare_agent_context(
        self,
        session_id: str,
        step: str
    ) -> Dict[str, Any]:

        session = self.session_manager.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        scenario_metadata = session["scenario_metadata"]

        transcript = ""
        action_events: List[Dict[str, Any]] = []

        if step == "HISTORY":
            transcript = self.conversation_manager.get_aggregated_transcript(
                session_id=session_id,
                step=step
            )

        elif step in ["CLEANING", "DRESSING"]:
            action_events = session.get("action_events", [])

        rag_query = transcript or (
            f"{step} procedure actions" if action_events else "clinical nursing evaluation"
        )

        rag = await retrieve_with_rag(
            query=rag_query,
            scenario_id=session["scenario_id"]
        )

        return {
            "step": step,
            "scenario_metadata": scenario_metadata,
            "transcript": transcript,
            "action_events": action_events,
            "rag_context": rag.get("text", "")
        }

    # ------------------------------------------------
    # Evaluation aggregation
    # ------------------------------------------------
    async def aggregate_evaluations(
        self,
        session_id: str,
        evaluator_outputs: List[EvaluatorResponse],
        student_mcq_answers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:

        session = self.session_manager.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        step = evaluator_outputs[0].step

        coordinator_output = self.coordinator.aggregate(
            evaluations=evaluator_outputs,
            current_step=step
        )

        if step == "ASSESSMENT":
            assessment_questions = session["scenario_metadata"].get(
                "assessment_questions", []
            )

            if assessment_questions and student_mcq_answers:
                mcq_result = self.mcq_evaluator.validate_mcq_answers(
                    student_answers=student_mcq_answers,
                    assessment_questions=assessment_questions
                )
            else:
                mcq_result = {
                    "total_questions": 0,
                    "correct_count": 0,
                    "feedback": [],
                    "summary": "No MCQ questions available"
                }

            coordinator_output["mcq_result"] = mcq_result

        self.session_manager.store_last_evaluation(
            session_id=session_id,
            evaluation=coordinator_output
        )

        return coordinator_output
