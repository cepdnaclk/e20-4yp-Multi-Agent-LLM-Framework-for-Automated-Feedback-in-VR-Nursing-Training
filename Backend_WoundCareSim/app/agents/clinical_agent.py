import json
from app.agents.agent_base import BaseAgent


class ClinicalAgent(BaseAgent):
    """
    Hybrid Clinical Agent (Deterministic + LLM Explanation)

    - Prerequisite validation is deterministic.
    - LLM is used ONLY for educational explanation.
    - Prevents hallucinated missing prerequisites.
    """

    # ---------------------------------------------------------
    # DETERMINISTIC PREREQUISITE MAP
    # ---------------------------------------------------------
    PREREQUISITE_MAP = {
        "action_initial_hand_hygiene": [],
        "action_clean_trolley": [
            "action_initial_hand_hygiene"
        ],
        "action_hand_hygiene_after_cleaning": [
            "action_initial_hand_hygiene",
            "action_clean_trolley"
        ],
        "action_select_solution": [
            "action_initial_hand_hygiene",
            "action_clean_trolley",
            "action_hand_hygiene_after_cleaning"
        ],
        "action_verify_solution": [
            "action_initial_hand_hygiene",
            "action_clean_trolley",
            "action_hand_hygiene_after_cleaning",
            "action_select_solution"
        ],
        "action_select_dressing": [
            "action_initial_hand_hygiene",
            "action_clean_trolley",
            "action_hand_hygiene_after_cleaning",
            "action_select_solution",
            "action_verify_solution"
        ],
        "action_verify_dressing": [
            "action_initial_hand_hygiene",
            "action_clean_trolley",
            "action_hand_hygiene_after_cleaning",
            "action_select_solution",
            "action_verify_solution",
            "action_select_dressing"
        ],
        "action_arrange_materials": [
            "action_initial_hand_hygiene",
            "action_clean_trolley",
            "action_hand_hygiene_after_cleaning",
            "action_select_solution",
            "action_verify_solution",
            "action_select_dressing",
            "action_verify_dressing"
        ],
        "action_bring_trolley": [
            "action_initial_hand_hygiene",
            "action_clean_trolley",
            "action_hand_hygiene_after_cleaning",
            "action_select_solution",
            "action_verify_solution",
            "action_select_dressing",
            "action_verify_dressing",
            "action_arrange_materials"
        ],
    }

    # ---------------------------------------------------------
    # REAL-TIME FEEDBACK
    # ---------------------------------------------------------
    async def get_real_time_feedback(
        self,
        action_type: str,
        performed_actions: list[dict],
        rag_guidelines: str
    ) -> dict:

        completed = [a["action_type"] for a in performed_actions]

        prerequisites = self.PREREQUISITE_MAP.get(action_type, [])

        missing = [
            prereq for prereq in prerequisites
            if prereq not in completed
        ]

        # -------------------------------------------------
        # DETERMINE STATUS (100% deterministic)
        # -------------------------------------------------
        if not missing:
            status = "complete"
            can_proceed = True
        else:
            status = "missing_prerequisites"
            can_proceed = False

        # -------------------------------------------------
        # FORMAT ACTION NAMES
        # -------------------------------------------------
        formatted_missing = [
            self._format_action_name(a) for a in missing
        ]
        current_action_name = self._format_action_name(action_type)

        # -------------------------------------------------
        # OPTIONAL LLM EXPLANATION (EDUCATIONAL ONLY)
        # -------------------------------------------------
        explanation_text = None

        try:
            if status == "complete":
                explanation_text = (
                    f"You performed {current_action_name} correctly."
                )
            else:
                explanation_text = await self._generate_explanation(
                    action_type=action_type,
                    missing_actions=formatted_missing
                )
        except Exception:
            # Fail-safe fallback
            if status == "complete":
                explanation_text = (
                    f"You performed {current_action_name} correctly."
                )
            else:
                explanation_text = (
                    f"You missed {', '.join(formatted_missing)}. "
                    "Please complete them first."
                )

        return {
            "status": status,
            "message": explanation_text,
            "missing_actions": missing,
            "can_proceed": can_proceed,
            "action_type": action_type,
            "total_actions_so_far": len(performed_actions) + 1
        }

    # ---------------------------------------------------------
    # LLM EXPLANATION GENERATOR
    # ---------------------------------------------------------
    async def _generate_explanation(
        self,
        action_type: str,
        missing_actions: list[str]
    ) -> str:

        system_prompt = """
You are a nursing clinical educator.

The student attempted an action before completing required preparation steps.

Explain briefly:
- Why the missing steps are necessary
- Emphasize patient safety
- Keep explanation concise and professional
"""

        user_prompt = f"""
Current action: {self._format_action_name(action_type)}
Missing prerequisites: {', '.join(missing_actions)}

Provide educational feedback.
"""

        response = await self.run(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2
        )

        return response.strip()

    # ---------------------------------------------------------
    # FORMAT ACTION NAMES
    # ---------------------------------------------------------
    def _format_action_name(self, action_type: str) -> str:

        action_names = {
            "action_initial_hand_hygiene": "Initial Hand Hygiene",
            "action_clean_trolley": "Clean The Dressing Trolley",
            "action_hand_hygiene_after_cleaning": "Hand Hygiene After Trolley Cleaning",
            "action_select_solution": "Select Prescribed Cleaning Solution",
            "action_verify_solution": "Verify Cleaning Solution With Staff Nurse",
            "action_select_dressing": "Select Dressing Materials",
            "action_verify_dressing": "Verify Sterile Dressing Packet With Staff Nurse",
            "action_arrange_materials": "Arrange Solutions And Materials On Trolley",
            "action_bring_trolley": "Bring Prepared Trolley To Patient Area",
        }

        return action_names.get(
            action_type,
            action_type.replace("action_", "").replace("_", " ").title()
        )
