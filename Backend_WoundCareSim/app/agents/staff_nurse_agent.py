from app.agents.agent_base import BaseAgent


class StaffNurseAgent(BaseAgent):
    """
    Staff Nurse Model (Week-8)

    Responsibilities:
    - Provide realistic supervisory responses
    - Confirm supervision / permission when asked
    - Confirm suitability of materials when explicitly requested
    - Offer brief, professional guidance

    Does NOT:
    - Evaluate student performance
    - Identify missing points
    - Score or block progression
    - Use RAG or Firestore directly
    """

    def __init__(self):
        super().__init__()

    async def respond(
        self,
        student_input: str,
        scenario_metadata: dict,
    ) -> str:
        """
        Generate a staff nurse response based on student request
        and known scenario information.

        Returns:
            Plain text response (no JSON).
        """

        patient = scenario_metadata.get("patient_history", {})
        wound = scenario_metadata.get("wound_details", {})

        patient_name = patient.get("name", "the patient")
        patient_age = patient.get("age", "unknown age")
        surgery = patient.get("surgery_details", {}).get("procedure", "the procedure")
        wound_location = wound.get("location", "the wound site")

        system_prompt = (
            "You are a senior staff nurse supervising a student nurse.\n"
            "Your role is to provide supervision and confirmation ONLY.\n\n"

            "Rules:\n"
            "- Do NOT evaluate the student.\n"
            "- Do NOT identify missing history points.\n"
            "- Do NOT judge correctness of actions.\n"
            "- Do NOT provide medical advice beyond confirmation.\n"
            "- Do NOT mention evaluation criteria or guidelines.\n"
            "- Respond briefly, professionally, and realistically.\n"
            "- If information is not available, say you cannot confirm it.\n\n"

            "You only know:\n"
            "- Patient identity\n"
            "- Wound location\n"
            "- That wound care has been prescribed\n"
        )

        user_prompt = (
            f"PATIENT:\n"
            f"Name: {patient_name}\n"
            f"Age: {patient_age}\n"
            f"Surgery: {surgery}\n"
            f"Wound Location: {wound_location}\n\n"
            f"STUDENT REQUEST:\n{student_input}\n"
        )

        response_text = await self.run(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
        )

        # Fallback to avoid empty responses
        if not response_text:
            return "Yes, please proceed carefully and let me know if you need assistance."

        return response_text.strip()
