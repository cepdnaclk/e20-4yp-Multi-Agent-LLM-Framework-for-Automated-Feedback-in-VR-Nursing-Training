import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function ArrayField({ label, items, onAdd, onRemove, onChange, readOnly = false }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{label}</Typography>
      {items.map((item, index) => (
        <Stack key={`${label}-${index}`} direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={item}
            onChange={(event) => onChange(index, event.target.value)}
            InputProps={{ readOnly }}
          />
          {!readOnly && (
            <Button color="error" onClick={() => onRemove(index)}>
              Remove
            </Button>
          )}
        </Stack>
      ))}
      {!readOnly && (
        <Button variant="text" onClick={onAdd}>
          Add Item
        </Button>
      )}
    </Stack>
  );
}

export default function PatientHistoryForm({
  data,
  readOnly,
  errors,
  onFieldChange,
  onListChange,
  onListAdd,
  onListRemove,
}) {
  const surgery = data.surgery_details || {};
  const pain = data.pain_level || {};
  const comfort = data.comfort_needs || {};

  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Patient History
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Name"
              value={data.name || ""}
              onChange={(event) => onFieldChange("name", event.target.value)}
              fullWidth
              required
              error={Boolean(errors.patient_name)}
              helperText={errors.patient_name}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Age"
              type="number"
              value={data.age ?? ""}
              onChange={(event) => onFieldChange("age", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Gender"
              value={data.gender || ""}
              onChange={(event) => onFieldChange("gender", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              value={data.address || ""}
              onChange={(event) => onFieldChange("address", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
        </Grid>

        <Stack spacing={2.5} sx={{ mt: 3 }}>
          <ArrayField
            label="Allergies"
            items={data.allergies || []}
            readOnly={readOnly}
            onAdd={() => onListAdd("allergies")}
            onRemove={(index) => onListRemove("allergies", index)}
            onChange={(index, value) => onListChange("allergies", index, value)}
          />
          <ArrayField
            label="Current Medications"
            items={data.current_medications || []}
            readOnly={readOnly}
            onAdd={() => onListAdd("current_medications")}
            onRemove={(index) => onListRemove("current_medications", index)}
            onChange={(index, value) => onListChange("current_medications", index, value)}
          />
          <ArrayField
            label="Medical History"
            items={data.medical_history || []}
            readOnly={readOnly}
            onAdd={() => onListAdd("medical_history")}
            onRemove={(index) => onListRemove("medical_history", index)}
            onChange={(index, value) => onListChange("medical_history", index, value)}
          />
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" gutterBottom>
          Surgery Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Procedure"
              value={surgery.procedure || ""}
              onChange={(event) => onFieldChange("surgery_details.procedure", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Hospital"
              value={surgery.hospital || ""}
              onChange={(event) => onFieldChange("surgery_details.hospital", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Surgeon"
              value={surgery.surgeon || ""}
              onChange={(event) => onFieldChange("surgery_details.surgeon", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Date"
              type="date"
              value={surgery.date || ""}
              onChange={(event) => onFieldChange("surgery_details.date", event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Reason"
              value={surgery.reason || ""}
              onChange={(event) => onFieldChange("surgery_details.reason", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" gutterBottom>
          Pain Level
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Pain Score"
              type="number"
              value={pain.pain_score ?? ""}
              onChange={(event) => onFieldChange("pain_level.pain_score", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <TextField
              label="Pain Description"
              value={pain.description || ""}
              onChange={(event) => onFieldChange("pain_level.description", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Medication"
              value={pain.pain_medication || ""}
              onChange={(event) => onFieldChange("pain_level.pain_medication", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Last Medication Time"
              value={pain.last_pain_medication || ""}
              onChange={(event) =>
                onFieldChange("pain_level.last_pain_medication", event.target.value)
              }
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" gutterBottom>
          Comfort Needs
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Position"
              value={comfort.current_position || ""}
              onChange={(event) =>
                onFieldChange("comfort_needs.current_position", event.target.value)
              }
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(comfort.needs_water)}
                    onChange={(event) =>
                      onFieldChange("comfort_needs.needs_water", event.target.checked)
                    }
                    disabled={readOnly}
                  />
                }
                label="Needs Water"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(comfort.needs_bathroom)}
                    onChange={(event) =>
                      onFieldChange("comfort_needs.needs_bathroom", event.target.checked)
                    }
                    disabled={readOnly}
                  />
                }
                label="Needs Bathroom"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(comfort.comfortable_to_proceed)}
                    onChange={(event) =>
                      onFieldChange(
                        "comfort_needs.comfortable_to_proceed",
                        event.target.checked
                      )
                    }
                    disabled={readOnly}
                  />
                }
                label="Comfortable To Proceed"
              />
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
