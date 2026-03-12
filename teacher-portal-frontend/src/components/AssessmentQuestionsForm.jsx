import {
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function QuestionCard({ question, index, readOnly, onQuestionChange, onOptionChange, onDelete, errors }) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1">Question {index + 1}</Typography>
          {!readOnly && (
            <Button color="error" onClick={onDelete}>
              Delete Question
            </Button>
          )}
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Question"
              value={question.question || ""}
              onChange={(event) => onQuestionChange("question", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>

          {optionLabels.map((label, optionIndex) => (
            <Grid item xs={12} md={6} key={`${question.id || index}-${label}`}>
              <TextField
                label={`Option ${label}`}
                value={question.options?.[optionIndex] || ""}
                onChange={(event) => onOptionChange(optionIndex, event.target.value)}
                fullWidth
                error={Boolean(errors[`question_${index}_options`])}
                helperText={optionIndex === 0 ? errors[`question_${index}_options`] : ""}
                InputProps={{ readOnly }}
              />
            </Grid>
          ))}

          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Correct Answer"
              value={question.correct_answer || ""}
              onChange={(event) => onQuestionChange("correct_answer", event.target.value)}
              fullWidth
              error={Boolean(errors[`question_${index}_correct_answer`])}
              helperText={errors[`question_${index}_correct_answer`]}
              InputProps={{ readOnly }}
            >
              {optionLabels.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              label="Explanation"
              value={question.explanation || ""}
              onChange={(event) => onQuestionChange("explanation", event.target.value)}
              fullWidth
              multiline
              minRows={2}
              InputProps={{ readOnly }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function AssessmentQuestionsForm({
  questions,
  readOnly,
  errors,
  onAddQuestion,
  onDeleteQuestion,
  onQuestionChange,
  onOptionChange,
}) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <div>
            <Typography variant="h6">Assessment Questions</Typography>
            {errors.assessment_questions && (
              <Typography variant="body2" color="error">
                {errors.assessment_questions}
              </Typography>
            )}
          </div>
          {!readOnly && (
            <Button variant="contained" onClick={onAddQuestion}>
              Add Question
            </Button>
          )}
        </Stack>

        <Stack spacing={2}>
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id || `question-${index}`}
              question={question}
              index={index}
              readOnly={readOnly}
              errors={errors}
              onDelete={() => onDeleteQuestion(index)}
              onQuestionChange={(field, value) => onQuestionChange(index, field, value)}
              onOptionChange={(optionIndex, value) => onOptionChange(index, optionIndex, value)}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
