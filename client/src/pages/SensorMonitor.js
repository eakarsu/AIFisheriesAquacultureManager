import React, { useState } from 'react';
import api from '../services/api';

export default function SensorMonitor() {
  const [pondId, setPondId] = useState('');
  const [hours, setHours] = useState(24);
  const [snapshot, setSnapshot] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSnapshot = async () => {
    setLoading(true);
    setError('');
    setSnapshot(null);
    try {
      const params = new URLSearchParams();
      if (pondId) params.set('pond_id', pondId);
      params.set('hours', String(hours));
      const res = await api.get(`/sensors/monitor?${params.toString()}`);
      setSnapshot(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Snapshot failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSummary = async () => {
    setAiLoading(true);
    setError('');
    setAiResult(null);
    try {
      const res = await api.post('/sensors/monitor-summary', {
        pond_id: pondId ? parseInt(pondId) : undefined,
        hours: parseInt(hours),
      });
      setAiResult(res.data);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err.message || 'AI summary failed';
      if (status === 503) {
        setError(`${msg}`);
        if (err.response?.data) setAiResult(err.response.data);
      } else {
        setError(msg);
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>📊 Real-time Sensor Monitor</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Aggregated water-quality means, open alerts, and AI summary across the most recent readings.
      </p>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Pond ID (optional)</label>
            <input type="number" value={pondId} onChange={(e) => setPondId(e.target.value)} placeholder="all" />
          </div>
          <div className="form-group">
            <label>Window (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={fetchSnapshot} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Snapshot'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn" onClick={fetchAiSummary} disabled={aiLoading}>
              {aiLoading ? 'Summarizing...' : 'AI Summary'}
            </button>
          </div>
        </div>
        {error && <div style={{ marginTop: 12, color: '#dc2626' }}>{error}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3>Snapshot</h3>
          {!snapshot && !loading && <p style={{ color: '#9ca3af' }}>Click Refresh.</p>}
          {snapshot && (
            <>
              <div style={{ marginBottom: 12 }}>
                <strong>Means ({snapshot.summary?.window_hours}h, {snapshot.summary?.sample_count} samples)</strong>
                <ul>
                  <li>pH: {snapshot.summary?.mean_ph ?? '—'}</li>
                  <li>Temp °C: {snapshot.summary?.mean_temperature_c ?? '—'}</li>
                  <li>DO mg/L: {snapshot.summary?.mean_dissolved_oxygen ?? '—'}</li>
                  <li>NH₃ mg/L: {snapshot.summary?.mean_ammonia ?? '—'}</li>
                </ul>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Open alerts</strong>
                <div>
                  Critical: {snapshot.alert_counts?.critical ?? 0} · Warning: {snapshot.alert_counts?.warning ?? 0}
                </div>
              </div>
              {Array.isArray(snapshot.open_alerts) && snapshot.open_alerts.length > 0 && (
                <ul>
                  {snapshot.open_alerts.slice(0, 5).map((a) => (
                    <li key={a.id}>
                      [{a.severity}] {a.metric} = {a.observed_value} (pond #{a.pond_id})
                    </li>
                  ))}
                </ul>
              )}
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Raw</summary>
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
                  {JSON.stringify(snapshot, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3>AI Summary</h3>
          {!aiResult && !aiLoading && <p style={{ color: '#9ca3af' }}>Click AI Summary.</p>}
          {aiLoading && <p>Generating AI summary...</p>}
          {aiResult && (
            <>
              {aiResult.ai_summary?.headline && (
                <p style={{ fontSize: 16, fontWeight: 600 }}>{aiResult.ai_summary.headline}</p>
              )}
              {Array.isArray(aiResult.ai_summary?.risks) && aiResult.ai_summary.risks.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Risks</strong>
                  <ul>
                    {aiResult.ai_summary.risks.map((r, i) => (
                      <li key={i}>
                        [{r.severity}] {r.metric}: {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(aiResult.ai_summary?.actions) && aiResult.ai_summary.actions.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Actions</strong>
                  <ul>
                    {aiResult.ai_summary.actions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResult.error && <div style={{ color: '#dc2626' }}>{aiResult.error}</div>}
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Raw</summary>
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
                  {JSON.stringify(aiResult, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
