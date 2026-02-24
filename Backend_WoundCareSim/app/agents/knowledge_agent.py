import json
from pydantic import ValidationError
from app.agents.agent_base import BaseAgent
from app.utils.schema import EvaluatorResponse


class KnowledgeAgent(BaseAgent):
    """
    RAG-grounded Knowledge Evaluator.
    Returns structured checklist flags for deterministic scoring.
    """

    async def evaluate(
        self,
        current_step: str,
        student_input: str,
        scenario_metadata: dict,
        rag_response: str,
    ) -> EvaluatorResponse:

        if not student_input or student_input.strip() == "":
            return EvaluatorResponse(
                agent_name="KnowledgeAgent",
                step=current_step,
                strengths=[],
                issues_detected=["No history obtained"],
                explanation="No clinical history was gathered.",
                verdict="Inappropriate",
                confidence=0.0,
                metadata={
                    "identity_asked": False,
                    "allergies_asked": False,
                    "pain_assessed": False,
                    "medical_history_asked": False,
                    "procedure_explained": False,
                }
            )

        system_prompt = f"""
                        You are evaluating nursing history-taking.

                        REFERENCE GUIDELINES:
                        {rag_response}

                        Return ONLY JSON with these boolean fields:
                        - identity_asked
                        - allergies_asked
                        - pain_assessed
                        - medical_history_asked
                        - procedure_explained

                        Also include:
                        - strengths (list)
                        - issues_detected (list)
                        - explanation (string)
                        """

        raw_response = await self.run(
            system_prompt=system_prompt,
            user_prompt=student_input,
            temperature=0.1,
        )

        try:
            clean_json = raw_response.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_json)

            flags = {
                "identity_asked": bool(data.get("identity_asked")),
                "allergies_asked": bool(data.get("allergies_asked")),
                "pain_assessed": bool(data.get("pain_assessed")),
                "medical_history_asked": bool(data.get("medical_history_asked")),
                "procedure_explained": bool(data.get("procedure_explained")),
            }

            # Determine verdict (informational only)
            items_count = sum(flags.values())

            if items_count == 5:
                verdict = "Appropriate"
            elif items_count >= 3:
                verdict = "Partially Appropriate"
            else:
                verdict = "Inappropriate"

            return EvaluatorResponse(
                agent_name="KnowledgeAgent",
                step=current_step,
                strengths=data.get("strengths", []),
                issues_detected=data.get("issues_detected", []),
                explanation=data.get("explanation", ""),
                verdict=verdict,
                confidence=1.0,  # No longer used for math
                metadata=flags
            )

        except (json.JSONDecodeError, ValidationError):
            return EvaluatorResponse(
                agent_name="KnowledgeAgent",
                step=current_step,
                strengths=[],
                issues_detected=["Evaluation parsing failed"],
                explanation="System parsing error.",
                verdict="Inappropriate",
                confidence=0.0,
                metadata={}
            )
