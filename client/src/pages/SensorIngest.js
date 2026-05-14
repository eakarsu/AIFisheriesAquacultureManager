import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function SensorIngest() {
  const [pondId, setPondId] = useState('');
  const [ph, setPh] = useState('');
  const [temp, setTemp] = useState('');
  const [doxy, setDoxy] = useState('');
  const [ammonia, setAmmonia] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/sensors/alerts?limit=20');
      setAlerts(res.data?.data || []);
    } catch (_) {}
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const reading = {
        ph: ph ? parseFloat(ph) : undefined,
        temperature: temp ? parseFloat(temp) : undefined,
        dissolved_oxygen: doxy ? parseFloat(doxy) : undefined,
        ammonia: ammonia ? parseFloat(ammonia) : undefined,
        ts: new Date().toISOString(),
      };
      const res = await api.post('/sensors/ingest', { pond_id: parseInt(pondId), readings: [reading] });
      setResult(res.data);
      fetchAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to ingest sensor data');
    } finally {
      setLoading(false);
    }
  };

  const ackAlert = async (id) => {
    try {
      await api.put(`/sensors/alerts/${id}/ack`);
      fetchAlerts();
    } catch (_) {}
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>📡 IoT Sensor Ingest</h1>
      <p style={{ color: '#6b7280' }}>Manually or programmatically post water quality readings. Out-of-range readings auto-create alerts.</p>

      <form onSubmit={handleIngest} style={{ background: 'white', padding: 24, borderRadius: 8, marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <div><label>Pond ID</label><input type="number" required value={pondId} onChange={(e) => setPondId(e.target.value)} style={{ width: '100%', padding: 8 }} /></div>
          <div><label>pH (6.5-8.5)</label><input type="number" step="0.01" value={ph} onChange={(e) => setPh(e.target.value)} style={{ width: '100%', padding: 8 }} /></div>
          <div><label>Temp °C (15-32)</label><input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} style={{ width: '100%', padding: 8 }} /></div>
          <div><label>DO mg/L (4-14)</label><input type="number" step="0.1" value={doxy} onChange={(e) => setDoxy(e.target.value)} style={{ width: '100%', padding: 8 }} /></div>
          <div><label>NH₃ mg/L (≤0.5)</label><input type="number" step="0.01" value={ammonia} onChange={(e) => setAmmonia(e.target.value)} style={{ width: '100%', padding: 8 }} /></div>
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 16, padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>
          {loading ? 'Ingesting...' : 'Ingest Reading'}
        </button>
        {error && <div style={{ color: '#dc2626', marginTop: 12 }}>{error}</div>}
        {result && <div style={{ color: '#10b981', marginTop: 12 }}>✓ {result.ingested} reading(s) ingested. {result.alerts?.length || 0} alerts triggered.</div>}
      </form>

      <h2 style={{ marginTop: 32 }}>Recent Alerts</h2>
      <div style={{ background: 'white', padding: 0, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: 12, textAlign: 'left' }}>Pond</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Metric</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Value</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Range</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Severity</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Created</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} style={{ borderTop: '1px solid #e5e7eb', opacity: a.acknowledged ? 0.5 : 1 }}>
                <td style={{ padding: 12 }}>{a.pond_id}</td>
                <td style={{ padding: 12 }}>{a.metric}</td>
                <td style={{ padding: 12 }}>{a.observed_value}</td>
                <td style={{ padding: 12 }}>{a.expected_min} – {a.expected_max}</td>
                <td style={{ padding: 12, color: a.severity === 'critical' ? '#dc2626' : '#f59e0b' }}>{a.severity}</td>
                <td style={{ padding: 12 }}>{new Date(a.createdAt).toLocaleString()}</td>
                <td style={{ padding: 12 }}>
                  {!a.acknowledged && (
                    <button onClick={() => ackAlert(a.id)} style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4 }}>Ack</button>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No alerts.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
