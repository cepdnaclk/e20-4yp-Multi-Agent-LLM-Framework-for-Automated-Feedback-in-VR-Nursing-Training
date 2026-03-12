import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import ScenarioForm from "../components/ScenarioForm.jsx";
import { getScenarioById } from "../api/backend.js";

export default function ScenarioDetails() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadScenario() {
      setLoading(true);
      setError("");
      try {
        const data = await getScenarioById(scenarioId);
        setScenario(data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load scenario.");
      } finally {
        setLoading(false);
      }
    }

    loadScenario();
  }, [scenarioId]);

  return (
    <section className="page-grid">
      <div className="page-header">
        <div>
          <h1>Scenario Details</h1>
          <p>Review the scenario in read-only clinical form layout.</p>
        </div>
        {scenario && (
          <Button variant="contained" onClick={() => navigate(`/scenarios/${scenarioId}/edit`)}>
            Edit Scenario
          </Button>
        )}
      </div>

      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? <CircularProgress /> : scenario && <ScenarioForm scenarioData={scenario} mode="view" />}
      </Stack>
    </section>
  );
}
