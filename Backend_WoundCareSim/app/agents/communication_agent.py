import json
from pydantic import ValidationError
from app.agents.agent_base import BaseAgent
from app.utils.schema import EvaluatorResponse


class CommunicationAgent(BaseAgent):
    """
    Evaluates communication skills during history taking.
    Now grounded with RAG guideline context.
    """

    def __init__(self):
        super().__init__()

    async def evaluate(
        self,
        current_step: str,
        student_input: str,
        scenario_metadata: dict,
        rag_response: str,
    ) -> EvaluatorResponse:

        if not student_input or student_input.strip() == "":
            return EvaluatorResponse(
                agent_name="CommunicationAgent",
                step=current_step,
                strengths=[],
                issues_detected=["No patient communication detected"],
                explanation="The student did not engage with the patient.",
                verdict="Inappropriate",
                confidence=0.0
            )

        system_prompt = (
            "You are a nursing communication evaluator for history-taking.\n\n"
            "REFERENCE COMMUNICATION GUIDELINES:\n"
            "═══════════════════════════════════════════════════════════════\n"
            f"{rag_response}\n"
            "═══════════════════════════════════════════════════════════════\n\n"
            "Evaluate ONLY communication behavior:\n"
            "- Professional introduction\n"
            "- Respectful tone\n"
            "- Empathy and listening\n"
            "- Patient-centered approach\n\n"
            "Do NOT evaluate clinical knowledge.\n\n"
            "Return JSON only."
        )

        user_prompt = (
            "TRANSCRIPT:\n"
            "═══════════════════════════════════════════════════════════════\n"
            f"{student_input}\n"
            "═══════════════════════════════════════════════════════════════"
        )

        raw_response = await self.run(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
        )

        try:
            clean_json = raw_response.replace("```json", "").replace("```", "").strip()
            response_data = json.loads(clean_json)

            response_data["step"] = current_step
            response_data["agent_name"] = "CommunicationAgent"

            valid_verdicts = ["Appropriate", "Partially Appropriate", "Inappropriate"]
            if response_data.get("verdict") not in valid_verdicts:
                response_data["verdict"] = "Inappropriate"

            try:
                confidence = float(response_data.get("confidence", 0.0))
                response_data["confidence"] = round(max(0.0, min(1.0, confidence)), 2)
            except:
                response_data["confidence"] = 0.0

            return EvaluatorResponse(**response_data)

        except (json.JSONDecodeError, ValidationError):
            return EvaluatorResponse(
                agent_name="CommunicationAgent",
                step=current_step,
                strengths=[],
                issues_detected=["Failed to parse evaluator output"],
                explanation="Evaluation system error.",
                verdict="Inappropriate",
                confidence=0.0
            )
