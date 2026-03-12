import { Card, CardActions, CardContent, Button, Chip, Stack, Typography } from "@mui/material";

export default function ScenarioCard({ scenario, onView, onEdit, onStart }) {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <div>
            <Typography variant="overline" color="text.secondary">
              Scenario ID
            </Typography>
            <Typography variant="h6">{scenario.scenario_id}</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {scenario.title}
            </Typography>
          </div>
          <Chip label="Ready for VR" color="success" variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {scenario.description || "No description provided."}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button variant="outlined" onClick={onView}>
          View
        </Button>
        <Button variant="outlined" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="contained" onClick={onStart}>
          Start Session
        </Button>
      </CardActions>
    </Card>
  );
}
