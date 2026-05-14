import React, { useState } from 'react';
import api from '../services/api';

export default function MortalityPredict() {
  const [pondId, setPondId] = useState('');
  const [horizon, setHorizon] = useState(7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/sustainability/mortality-predict', {
        pond_id: parseInt(pondId),
        horizon_days: parseInt(horizon),
      });
      setResult(res.data);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err.message || 'Prediction failed';
      if (status === 503) {
        setError(`${msg} — deterministic prediction still returned below.`);
        if (err.response?.data) setResult(err.response.data);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (r) => (r === 'high' ? '#ef4444' : r === 'medium' ? '#f59e0b' : '#10b981');

  return (
    <div style={{ padding: 24 }}>
      <h2>📉 Mortality Predictor</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        7- or 30-day mortality forecast for a pond using recent water quality, density, and historic mortality.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: 16 }}>
          <h3>Inputs</h3>
          <div className="form-group">
            <label>Pond ID</label>
            <input type="number" value={pondId} onChange={(e) => setPondId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Horizon</label>
            <select value={horizon} onChange={(e) => setHorizon(e.target.value)}>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !pondId}>
            {loading ? 'Predicting...' : 'Predict Mortality'}
          </button>
          {error && <div style={{ marginTop: 12, color: '#dc2626' }}>{error}</div>}
        </form>

        <div className="card" style={{ padding: 16 }}>
          <h3>Result</h3>
          {!result && !loading && <p style={{ color: '#9ca3af' }}>Submit to see forecast.</p>}
          {loading && <p>Predicting mortality...</p>}
          {result && (
            <>
              {result.predicted_mortality_pct != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: riskColor(result.risk),
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    {result.predicted_mortality_pct}%
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {result.horizon_days}-day forecast
                    </div>
                    <div style={{ color: '#6b7280' }}>Risk: {result.risk}</div>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <strong>Snapshot</strong>
                <ul>
                  <li>Baseline mortality: {result.baseline_mortality_pct}%</li>
                  <li>Density: {result.density_kg_per_m3} kg/m³</li>
                  <li>Population: {result.total_population}</li>
                  <li>Water readings used: {result.water_readings_used}</li>
                  <li>7-day predicted: {result.predicted_7d_pct}%</li>
                  <li>30-day predicted: {result.predicted_30d_pct}%</li>
                </ul>
              </div>
              {Array.isArray(result.drivers) && result.drivers.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Drivers</strong>
                  <ul>
                    {result.drivers.map((d, i) => (
                      <li key={i}>
                        {d.name} (weight {d.weight})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.ai_narrative && (
                <div style={{ marginBottom: 12 }}>
                  <strong>AI Narrative</strong>
                  {result.ai_narrative.narrative && <p>{result.ai_narrative.narrative}</p>}
                  {Array.isArray(result.ai_narrative.interventions) && result.ai_narrative.interventions.length > 0 && (
                    <>
                      <strong style={{ display: 'block', marginTop: 8 }}>Interventions</strong>
                      <ul>
                        {result.ai_narrative.interventions.map((i, idx) => (
                          <li key={idx}>
                            {typeof i === 'string'
                              ? i
                              : `${i.action || ''}${i.priority ? ` [${i.priority}]` : ''}${
                                  i.expected_impact_pct != null ? ` (~${i.expected_impact_pct}%)` : ''
                                }`}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {Array.isArray(result.ai_narrative.monitoring) && result.ai_narrative.monitoring.length > 0 && (
                    <>
                      <strong style={{ display: 'block', marginTop: 8 }}>Monitor</strong>
                      <ul>
                        {result.ai_narrative.monitoring.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Raw Response</summary>
                <pre
                  style={{
                    background: '#f9fafb',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 240,
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
