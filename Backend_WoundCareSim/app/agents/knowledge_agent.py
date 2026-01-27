import json

from pydantic import ValidationError
from app.agents.agent_base import BaseAgent
from app.utils.schema import EvaluatorResponse

class KnowledgeAgent(BaseAgent):
    """
    Evaluates the student's nursing knowledge and clinical reasoning.
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
        """
        Evaluate nursing knowledge and return a structured object.
        """

        # CRITICAL: Check for empty input first
        # For HISTORY step, empty input means no conversation
        # For ASSESSMENT step, this check won't trigger (MCQ logic is separate)
        if current_step == "history" and (not student_input or student_input.strip() == ""):
            return EvaluatorResponse(
                agent_name="KnowledgeAgent",
                step=current_step,
                strengths=[],
                issues_detected=[
                    "No patient history obtained",
                    "Failed to gather critical medical information",
                    "Cannot assess without patient data"
                ],
                explanation="The student did not gather any patient history. Understanding the patient's medical background, allergies, current medications, and surgical history is essential for safe wound care. Without this knowledge, the student cannot make informed clinical decisions.",
                verdict="Inappropriate",
                confidence=1.0
            )

        system_prompt = (
            "You are a nursing knowledge evaluator.\n"
            "Your task is to evaluate ONLY the student's nursing knowledge and reasoning.\n\n"
            "You MUST respond with valid JSON matching this structure:\n"
            "{\n"
            '  "agent_name": "KnowledgeAgent",\n'
            '  "step": "Current Step Name",\n'
            '  "strengths": ["List of correct knowledge demonstrated..."],\n'
            '  "issues_detected": ["List of knowledge gaps or errors..."],\n'
            '  "explanation": "Why this knowledge matters clinically...",\n'
            '  "verdict": "Appropriate" | "Partially Appropriate" | "Inappropriate",\n'
            '  "confidence": 0.0 to 1.0\n'
            "}\n\n"
            "Strict Rules:\n"
            "- Output RAW JSON only. No markdown formatting.\n"
            "- Do NOT evaluate physical execution (clinical skills).\n"
            "- Do NOT evaluate politeness (communication).\n"
            "- Base evaluation ONLY on the actual student input provided.\n"
            "- Do NOT assume or invent student knowledge.\n"
        )

        user_prompt = (
            f"CURRENT PROCEDURE STEP: {current_step}\n"
            f"STUDENT CONTEXT INPUT: {student_input}\n"
            f"SCENARIO CONTEXT: {scenario_metadata.get('patient_history', 'N/A')}\n"
            f"KNOWLEDGE EXPECTATIONS:\n"
            f"- Focus on conceptual understanding, not physical execution\n"
            f"- Do NOT evaluate procedural sequencing\n"
            f"REFERENCE GUIDELINES: {rag_response}\n"
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
            response_data["agent_name"] = "KnowledgeAgent"

            return EvaluatorResponse(**response_data)

        # UPDATED EXCEPT BLOCK: Catch ValidationError
        except (json.JSONDecodeError, ValueError, ValidationError) as e:
            print(f"Agent Parsing Failed: {e}")
            return EvaluatorResponse(
                agent_name="KnowledgeAgent",
                step=current_step,
                strengths=[],
                issues_detected=["Error parsing evaluator response"],
                explanation=f"Failed to parse LLM output. Raw: {raw_response[:50]}...",
                verdict="Inappropriate",
                confidence=0.0
            )
