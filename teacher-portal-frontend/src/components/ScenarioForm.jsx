import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AssessmentQuestionsForm from "./AssessmentQuestionsForm.jsx";
import PatientHistoryForm from "./PatientHistoryForm.jsx";
import WoundDetailsForm from "./WoundDetailsForm.jsx";

const EMPTY_SCENARIO = {
  scenario_id: "",
  scenario_title: "",
  description: "",
  created_by: "teacher_portal",
  created_at: "",
  updated_at: "",
  vector_store_namespace: "",
  patient_history: {
    name: "",
    age: "",
    gender: "",
    address: "",
    allergies: [],
    current_medications: [],
    medical_history: [],
    surgery_details: {
      procedure: "",
      hospital: "",
      surgeon: "",
      date: "",
      reason: "",
    },
    pain_level: {
      pain_score: "",
      description: "",
      pain_medication: "",
      last_pain_medication: "",
    },
    comfort_needs: {
      needs_water: false,
      needs_bathroom: false,
      comfortable_to_proceed: true,
      current_position: "",
    },
  },
  wound_details: {
    wound_type: "",
    location: "",
    size: "",
    appearance: "",
    wound_age: "",
    suture_type: "",
    expected_healing: "",
    dressing_status: "",
  },
  assessment_questions: [
    {
      id: "q1",
      question: "",
      options: ["", "", "", ""],
      correct_answer: "A",
      explanation: "",
    },
  ],
};

function mergeDeep(base, value) {
  if (Array.isArray(base)) {
    return Array.isArray(value) ? value : base;
  }

  if (typeof base !== "object" || base === null) {
    return value ?? base;
  }

  const output = { ...base, ...(value || {}) };
  for (const key of Object.keys(base)) {
    output[key] = mergeDeep(base[key], value?.[key]);
  }
  return output;
}

function buildInitialState(scenarioData) {
  const merged = mergeDeep(EMPTY_SCENARIO, scenarioData || {});
  merged.description = merged.description || "";
  merged.vector_store_namespace =
    merged.vector_store_namespace || merged.scenario_id || "";
  return merged;
}

function setNestedValue(target, path, value) {
  const keys = path.split(".");
  const clone = structuredClone(target);
  let pointer = clone;

  for (let index = 0; index < keys.length - 1; index += 1) {
    pointer = pointer[keys[index]];
  }

  pointer[keys[keys.length - 1]] = value;
  return clone;
}

function validate(formData) {
  const nextErrors = {};

  if (!formData.scenario_id.trim()) {
    nextErrors.scenario_id = "Scenario ID is required.";
  }

  if (!formData.scenario_title.trim()) {
    nextErrors.scenario_title = "Scenario title is required.";
  }

  if (!formData.patient_history.name.trim()) {
    nextErrors.patient_name = "Patient name is required.";
  }

  if (!formData.assessment_questions.length) {
    nextErrors.assessment_questions = "At least one assessment question is required.";
  }

  formData.assessment_questions.forEach((question, index) => {
    const optionCount = (question.options || []).filter((option) => option.trim()).length;
    if (optionCount !== 4) {
      nextErrors[`question_${index}_options`] = "Each question must have 4 options.";
    }

    const correctAnswerIndex = ["A", "B", "C", "D"].indexOf(question.correct_answer);
    if (
      correctAnswerIndex === -1 ||
      !question.options?.[correctAnswerIndex] ||
      !question.options[correctAnswerIndex].trim()
    ) {
      nextErrors[`question_${index}_correct_answer`] =
        "Correct answer must match a populated option.";
    }
  });

  return nextErrors;
}

function normalizeForSubmit(formData) {
  const normalized = structuredClone(formData);
  normalized.scenario_id = normalized.scenario_id.trim();
  normalized.scenario_title = normalized.scenario_title.trim();
  normalized.description = normalized.description.trim();
  normalized.vector_store_namespace =
    normalized.vector_store_namespace.trim() || normalized.scenario_id;
  normalized.patient_history.age =
    normalized.patient_history.age === "" ? "" : Number(normalized.patient_history.age);
  normalized.patient_history.pain_level.pain_score =
    normalized.patient_history.pain_level.pain_score === ""
      ? ""
      : Number(normalized.patient_history.pain_level.pain_score);

  normalized.assessment_questions = normalized.assessment_questions.map((question, index) => ({
    ...question,
    id: question.id?.trim() || `q${index + 1}`,
    question: question.question.trim(),
    explanation: question.explanation.trim(),
    options: question.options.map((option) => option.trim()),
  }));

  return normalized;
}

export default function ScenarioForm({ scenarioData, onSubmit, mode = "create", submitLabel }) {
  const readOnly = mode === "view";
  const [formData, setFormData] = useState(() => buildInitialState(scenarioData));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData(buildInitialState(scenarioData));
    setErrors({});
    setFormError("");
  }, [scenarioData]);

  const computedSubmitLabel = useMemo(() => {
    if (submitLabel) {
      return submitLabel;
    }
    if (mode === "edit") {
      return "Save Changes";
    }
    return "Create Scenario";
  }, [mode, submitLabel]);

  function handleScenarioFieldChange(field, value) {
    setFormData((current) => {
      const next = { ...current, [field]: value };
      if (field === "scenario_id" && !current.vector_store_namespace) {
        next.vector_store_namespace = value;
      }
      return next;
    });
  }

  function handlePatientFieldChange(path, value) {
    setFormData((current) => ({
      ...current,
      patient_history: setNestedValue(current.patient_history, path, value),
    }));
  }

  function handlePatientListChange(field, index, value) {
    setFormData((current) => {
      const nextItems = [...current.patient_history[field]];
      nextItems[index] = value;
      return {
        ...current,
        patient_history: { ...current.patient_history, [field]: nextItems },
      };
    });
  }

  function handlePatientListAdd(field) {
    setFormData((current) => ({
      ...current,
      patient_history: {
        ...current.patient_history,
        [field]: [...current.patient_history[field], ""],
      },
    }));
  }

  function handlePatientListRemove(field, index) {
    setFormData((current) => ({
      ...current,
      patient_history: {
        ...current.patient_history,
        [field]: current.patient_history[field].filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  }

  function handleWoundFieldChange(field, value) {
    setFormData((current) => ({
      ...current,
      wound_details: { ...current.wound_details, [field]: value },
    }));
  }

  function handleQuestionChange(index, field, value) {
    setFormData((current) => ({
      ...current,
      assessment_questions: current.assessment_questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question
      ),
    }));
  }

  function handleQuestionOptionChange(questionIndex, optionIndex, value) {
    setFormData((current) => ({
      ...current,
      assessment_questions: current.assessment_questions.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }
        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;
        return { ...question, options: nextOptions };
      }),
    }));
  }

  function handleAddQuestion() {
    setFormData((current) => ({
      ...current,
      assessment_questions: [
        ...current.assessment_questions,
        {
          id: `q${current.assessment_questions.length + 1}`,
          question: "",
          options: ["", "", "", ""],
          correct_answer: "A",
          explanation: "",
        },
      ],
    }));
  }

  function handleDeleteQuestion(index) {
    setFormData((current) => ({
      ...current,
      assessment_questions: current.assessment_questions.filter(
        (_, questionIndex) => questionIndex !== index
      ),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (readOnly || !onSubmit) {
      return;
    }

    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Resolve the validation errors before saving.");
      return;
    }

    setFormError("");
    await onSubmit(normalizeForSubmit(formData));
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {formError && <Alert severity="error">{formError}</Alert>}

        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scenario Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Scenario ID"
                  value={formData.scenario_id}
                  onChange={(event) => handleScenarioFieldChange("scenario_id", event.target.value)}
                  fullWidth
                  required
                  error={Boolean(errors.scenario_id)}
                  helperText={errors.scenario_id}
                  InputProps={{ readOnly: readOnly || mode === "edit" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Scenario Title"
                  value={formData.scenario_title}
                  onChange={(event) =>
                    handleScenarioFieldChange("scenario_title", event.target.value)
                  }
                  fullWidth
                  required
                  error={Boolean(errors.scenario_title)}
                  helperText={errors.scenario_title}
                  InputProps={{ readOnly }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Created By"
                  value={formData.created_by}
                  onChange={(event) => handleScenarioFieldChange("created_by", event.target.value)}
                  fullWidth
                  InputProps={{ readOnly }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Vector Store Namespace"
                  value={formData.vector_store_namespace}
                  onChange={(event) =>
                    handleScenarioFieldChange("vector_store_namespace", event.target.value)
                  }
                  fullWidth
                  InputProps={{ readOnly }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(event) =>
                    handleScenarioFieldChange("description", event.target.value)
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  InputProps={{ readOnly }}
                />
              </Grid>
              {mode !== "create" && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Created At"
                      value={formData.created_at || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Updated At"
                      value={formData.updated_at || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>

        <PatientHistoryForm
          data={formData.patient_history}
          readOnly={readOnly}
          errors={errors}
          onFieldChange={handlePatientFieldChange}
          onListChange={handlePatientListChange}
          onListAdd={handlePatientListAdd}
          onListRemove={handlePatientListRemove}
        />

        <WoundDetailsForm
          data={formData.wound_details}
          readOnly={readOnly}
          onFieldChange={handleWoundFieldChange}
        />

        <AssessmentQuestionsForm
          questions={formData.assessment_questions}
          readOnly={readOnly}
          errors={errors}
          onAddQuestion={handleAddQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onQuestionChange={handleQuestionChange}
          onOptionChange={handleQuestionOptionChange}
        />

        {!readOnly && (
          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" size="large">
              {computedSubmitLabel}
            </Button>
          </Stack>
        )}
      </Stack>
    </form>
  );
}
