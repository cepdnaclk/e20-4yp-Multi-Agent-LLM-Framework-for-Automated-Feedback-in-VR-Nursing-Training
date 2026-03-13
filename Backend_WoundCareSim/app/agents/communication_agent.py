import ast
import json
import logging
import re

from pydantic import ValidationError

from app.agents.agent_base import BaseAgent
from app.utils.schema import EvaluatorResponse

logger = logging.getLogger(__name__)


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
        clinical_context: dict = None,
    ) -> EvaluatorResponse:
        clinical_context = clinical_context or {}
        risk_factors = clinical_context.get("risk_factors", [])
        has_diabetes = "diabetes" in risk_factors

        if not student_input or student_input.strip() == "":
            return EvaluatorResponse(
                agent_name="CommunicationAgent",
                step=current_step,
                strengths=[],
                issues_detected=["No patient communication detected"],
                explanation="The student did not engage with the patient.",
                verdict="Inappropriate",
                confidence=1.0,
            )

        student_lines = [
            line for line in student_input.splitlines()
            if line.strip().lower().startswith("student:")
        ]
        if not student_lines:
            return EvaluatorResponse(
                agent_name="CommunicationAgent",
                step=current_step,
                strengths=[],
                issues_detected=["No patient communication detected - student asked no questions"],
                explanation="The student did not ask any questions or communicate with the patient during history taking.",
                verdict="Inappropriate",
                confidence=1.0,
            )

        clinical_context_note = ""
        if has_diabetes:
            clinical_context_note = (
                "\nPATIENT CLINICAL CONTEXT:\n"
                "This patient has Type 2 Diabetes Mellitus.\n"
                "When evaluating communication, consider whether the student showed"
                " appropriate sensitivity to diabetes-related healing and infection risk."
            )

        system_prompt = (
            "You are a nursing communication evaluator for history-taking.\n\n"
            "REFERENCE COMMUNICATION GUIDELINES:\n"
            "----------------------------------------\n"
            f"{rag_response}\n"
            "----------------------------------------\n\n"
            "Evaluate only communication behavior:\n"
            "- Professional introduction\n"
            "- Respectful tone\n"
            "- Empathy and listening\n"
            "- Patient-centered approach\n\n"
            "Do not evaluate clinical knowledge.\n"
            f"{clinical_context_note}\n\n"
            "Return only valid JSON. No markdown. No commentary.\n"
            "Use this exact schema:\n"
            "{\n"
            '  "strengths": ["brief point"],\n'
            '  "issues_detected": ["brief point"],\n'
            '  "explanation": "one short paragraph",\n'
            '  "verdict": "Appropriate",\n'
            '  "confidence": 0.85\n'
            "}"
        )

        user_prompt = (
            "TRANSCRIPT:\n"
            "----------------------------------------\n"
            f"{student_input}\n"
            "----------------------------------------"
        )

        raw_response = await self.run(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
        )

        return self._parse_response(raw_response, current_step, student_input)

    def _parse_response(
        self,
        raw_response: str,
        current_step: str,
        student_input: str,
    ) -> EvaluatorResponse:
        """
        Robustly extract and parse JSON from the LLM response.
        Falls back to a deterministic heuristic if parsing fails.
        """
        for idx, candidate in enumerate(self._json_candidates(raw_response), start=1):
            try:
                response_data = self._load_json_lenient(candidate)
                return self._build_response(response_data, current_step)
            except (json.JSONDecodeError, ValidationError, SyntaxError, ValueError) as e:
                logger.warning(f"CommunicationAgent parse attempt {idx} failed: {e}")

        logger.error(
            "CommunicationAgent failed to parse LLM output.\n"
            f"Raw response was:\n{raw_response}"
        )
        return self._heuristic_fallback(current_step, student_input)

    def _json_candidates(self, raw_response: str) -> list[str]:
        stripped = raw_response.strip()
        candidates = []

        fenced = re.sub(r"```json\s*", "", stripped, flags=re.IGNORECASE)
        fenced = re.sub(r"```\s*", "", fenced)
        if fenced:
            candidates.append(fenced.strip())

        match = re.search(r"\{.*\}", stripped, re.DOTALL)
        if match:
            extracted = match.group().strip()
            if extracted not in candidates:
                candidates.append(extracted)

        repaired = re.sub(r",(\s*[}\]])", r"\1", fenced)
        if repaired and repaired not in candidates:
            candidates.append(repaired.strip())

        return candidates

    def _load_json_lenient(self, candidate: str) -> dict:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            python_like = re.sub(r"\btrue\b", "True", candidate, flags=re.IGNORECASE)
            python_like = re.sub(r"\bfalse\b", "False", python_like, flags=re.IGNORECASE)
            python_like = re.sub(r"\bnull\b", "None", python_like, flags=re.IGNORECASE)
            loaded = ast.literal_eval(python_like)
            if not isinstance(loaded, dict):
                raise ValueError("Parsed response is not a dict")
            return loaded

    def _build_response(self, response_data: dict, current_step: str) -> EvaluatorResponse:
        """
        Validate and normalise parsed JSON into an EvaluatorResponse.
        """
        response_data["step"] = current_step
        response_data["agent_name"] = "CommunicationAgent"

        if not isinstance(response_data.get("strengths"), list):
            response_data["strengths"] = []
        if not isinstance(response_data.get("issues_detected"), list):
            response_data["issues_detected"] = []

        valid_verdicts = ["Appropriate", "Partially Appropriate", "Inappropriate"]
        if response_data.get("verdict") not in valid_verdicts:
            logger.warning(
                "CommunicationAgent received invalid verdict: "
                f"'{response_data.get('verdict')}'. Defaulting to 'Inappropriate'."
            )
            response_data["verdict"] = "Inappropriate"

        try:
            confidence = float(response_data.get("confidence", 0.0))
            response_data["confidence"] = round(max(0.0, min(1.0, confidence)), 2)
        except (TypeError, ValueError):
            response_data["confidence"] = 0.0

        return EvaluatorResponse(**response_data)

    def _heuristic_fallback(self, current_step: str, student_input: str) -> EvaluatorResponse:
        student_lines = [
            line.split(":", 1)[1].strip() if ":" in line else line.strip()
            for line in student_input.splitlines()
            if line.strip().lower().startswith("student:")
        ]
        joined = " ".join(student_lines).lower()

        polite_intro_markers = [
            "hello",
            "good morning",
            "good afternoon",
            "good evening",
        ]
        self_intro_markers = [
            "i am your nurse",
            "i am your student nurse",
            "i am the nursing student",
            "i am here to",
        ]
        rude_markers = [
            "answer quickly",
            "i do not have time",
            "or not",
            "get this over with",
            "listen carefully",
            "state your",
        ]
        empathy_markers = ["how are you feeling", "pain", "comfort", "understand", "sorry"]
        explanation_markers = [
            "i will explain",
            "i am going to explain",
            "before we begin",
            "before i continue",
        ]

        has_polite_intro = any(marker in joined for marker in polite_intro_markers) and any(
            marker in joined for marker in self_intro_markers
        )
        has_rude_language = any(marker in joined for marker in rude_markers)
        asks_questions = "?" in student_input or any(
            token in joined for token in ["do you", "can you", "could you", "have you", "how much", "what is your"]
        )
        shows_empathy = any(marker in joined for marker in empathy_markers)
        explains_process = any(marker in joined for marker in explanation_markers)

        strengths = []
        issues = []

        if has_polite_intro:
            strengths.append("Introduced self professionally")
        else:
            issues.append("Professional introduction was limited or missing")

        if asks_questions:
            strengths.append("Used direct patient-focused questions")
        else:
            issues.append("Patient-centered questioning was limited")

        if shows_empathy or explains_process:
            strengths.append("Used supportive communication")
        else:
            issues.append("Empathy or explanation could be improved")

        if has_rude_language:
            issues.insert(0, "Tone included abrupt or pressuring language")
            verdict = "Inappropriate"
        elif has_polite_intro and asks_questions and (shows_empathy or explains_process):
            verdict = "Appropriate"
        elif asks_questions or has_polite_intro:
            verdict = "Partially Appropriate"
        else:
            verdict = "Inappropriate"

        return EvaluatorResponse(
            agent_name="CommunicationAgent",
            step=current_step,
            strengths=strengths[:3],
            issues_detected=issues[:3],
            explanation=(
                "Fallback heuristic was used because the evaluator response could not be parsed. "
                "The verdict was based on introduction quality, tone, empathy, and patient-centered questioning."
            ),
            verdict=verdict,
            confidence=0.35,
        )
