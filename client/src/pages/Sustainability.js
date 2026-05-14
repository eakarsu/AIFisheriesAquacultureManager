import React, { useState } from 'react';
import api from '../services/api';

function Sustainability() {
  const [form, setForm] = useState({
    mortality_rate: 5,
    fcr: 1.5,
    water_quality_score: 85,
    stocking_density_kg_m3: 25,
    notes: ''
  });
  const [includeAi, setIncludeAi] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        mortality_rate: parseFloat(form.mortality_rate),
        fcr: parseFloat(form.fcr),
        water_quality_score: parseFloat(form.water_quality_score),
        stocking_density_kg_m3: parseFloat(form.stocking_density_kg_m3),
        notes: form.notes,
        include_ai_narrative: includeAi
      };
      const res = await api.post('/sustainability/score', payload);
      setResult(res.data?.data || res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Score request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>🌱 Sustainability Score</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Compute a 0-100 sustainability score and get AI-driven recommendations and ASC certification readiness.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: 16 }}>
          <h3>Inputs</h3>
          <div className="form-group">
            <label>Mortality Rate (%)</label>
            <input type="number" step="0.1" value={form.mortality_rate}
              onChange={(e) => setForm({ ...form, mortality_rate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Feed Conversion Ratio (FCR)</label>
            <input type="number" step="0.01" value={form.fcr}
              onChange={(e) => setForm({ ...form, fcr: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Water Quality Score (0-100)</label>
            <input type="number" step="1" min="0" max="100" value={form.water_quality_score}
              onChange={(e) => setForm({ ...form, water_quality_score: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Stocking Density (kg/m³)</label>
            <input type="number" step="0.1" value={form.stocking_density_kg_m3}
              onChange={(e) => setForm({ ...form, stocking_density_kg_m3: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
            <input type="checkbox" checked={includeAi} onChange={(e) => setIncludeAi(e.target.checked)} />
            Include AI narrative & ASC readiness
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Scoring...' : 'Compute Score'}
          </button>
          {error && <div style={{ marginTop: 12, color: '#dc2626' }}>{error}</div>}
        </form>

        <div className="card" style={{ padding: 16 }}>
          <h3>Result</h3>
          {!result && !loading && <p style={{ color: '#9ca3af' }}>Submit to see results.</p>}
          {loading && <p>Computing sustainability score...</p>}
          {result && (
            <>
              {result.score !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: result.score >= 75 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 700
                  }}>
                    {Math.round(result.score)}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>Sustainability Score</div>
                    {result.rating && <div style={{ color: '#6b7280' }}>{result.rating}</div>}
                  </div>
                </div>
              )}
              {result.breakdown && typeof result.breakdown === 'object' && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Breakdown</strong>
                  <ul>
                    {Object.entries(result.breakdown).map(([k, v]) => (
                      <li key={k}>{k}: {v}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(result.strengths) && result.strengths.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: '#10b981' }}>Strengths</strong>
                  <ul>{result.strengths.map((s, i) => <li key={i}>{typeof s === 'string' ? s : (s.strength || JSON.stringify(s))}</li>)}</ul>
                </div>
              )}
              {Array.isArray(result.weaknesses) && result.weaknesses.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: '#ef4444' }}>Weaknesses</strong>
                  <ul>{result.weaknesses.map((s, i) => <li key={i}>{typeof s === 'string' ? s : (s.weakness || JSON.stringify(s))}</li>)}</ul>
                </div>
              )}
              {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Recommendations</strong>
                  <ul>{result.recommendations.map((s, i) => <li key={i}>{typeof s === 'string' ? s : (s.action || s.recommendation || JSON.stringify(s))}</li>)}</ul>
                </div>
              )}
              {result.asc_readiness && (
                <div style={{ padding: 12, background: '#ecfdf5', borderLeft: '4px solid #10b981', borderRadius: 4 }}>
                  <strong>ASC Certification Readiness</strong>
                  <p style={{ margin: '4px 0 0' }}>{typeof result.asc_readiness === 'string' ? result.asc_readiness : JSON.stringify(result.asc_readiness)}</p>
                </div>
              )}
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Raw Response</summary>
                <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', maxHeight: 240 }}>{JSON.stringify(result, null, 2)}</pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sustainability;
