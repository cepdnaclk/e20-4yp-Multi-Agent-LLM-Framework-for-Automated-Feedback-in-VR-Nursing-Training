import { Card, CardContent, Grid, TextField, Typography } from "@mui/material";

export default function WoundDetailsForm({ data, readOnly, onFieldChange }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Wound Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Wound Type"
              value={data.wound_type || ""}
              onChange={(event) => onFieldChange("wound_type", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Location"
              value={data.location || ""}
              onChange={(event) => onFieldChange("location", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Size"
              value={data.size || ""}
              onChange={(event) => onFieldChange("size", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Appearance"
              value={data.appearance || ""}
              onChange={(event) => onFieldChange("appearance", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Wound Age"
              value={data.wound_age || ""}
              onChange={(event) => onFieldChange("wound_age", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Suture Type"
              value={data.suture_type || ""}
              onChange={(event) => onFieldChange("suture_type", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Expected Healing"
              value={data.expected_healing || ""}
              onChange={(event) => onFieldChange("expected_healing", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Dressing Status"
              value={data.dressing_status || ""}
              onChange={(event) => onFieldChange("dressing_status", event.target.value)}
              fullWidth
              InputProps={{ readOnly }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
