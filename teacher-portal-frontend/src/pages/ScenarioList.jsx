import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Stack } from "@mui/material";

import ScenarioCard from "../components/ScenarioCard.jsx";
import { getScenarios } from "../api/backend.js";

export default function ScenarioList() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleLoadScenarios() {
    setLoading(true);
    setError("");
    try {
      const data = await getScenarios();
      setScenarios(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleLoadScenarios();
  }, []);

  return (
    <section className="page-grid">
      <div className="page-header">
        <div>
          <h1>Scenario List</h1>
          <p>Browse saved scenarios, open them in the structured viewer, or launch VR sessions.</p>
        </div>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={handleLoadScenarios}>
            {loading ? "Loading..." : "Refresh Scenarios"}
          </Button>
          <Button variant="outlined" onClick={() => navigate("/scenarios/create")}>
            New Scenario
          </Button>
        </Stack>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="scenario-list">
        {scenarios.length === 0 ? (
          <div className="panel">
            <p className="muted">No scenarios loaded yet. Use refresh to query the backend.</p>
          </div>
        ) : (
          scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.scenario_id}
              scenario={scenario}
              onView={() => navigate(`/scenarios/${scenario.scenario_id}`)}
              onEdit={() => navigate(`/scenarios/${scenario.scenario_id}/edit`)}
              onStart={() =>
                navigate("/sessions/start", {
                  state: { scenarioId: scenario.scenario_id },
                })
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
