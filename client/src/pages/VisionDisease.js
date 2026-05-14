import React, { useState } from 'react';
import api from '../services/api';

export default function VisionDisease() {
  const [file, setFile] = useState(null);
  const [pondId, setPondId] = useState('');
  const [species, setSpecies] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (pondId) fd.append('pond_id', pondId);
      if (species) fd.append('species', species);
      if (notes) fd.append('notes', notes);
      const res = await api.post('/vision-disease/diagnose', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Vision diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>🔬 Vision-Based Disease Diagnosis</h1>
      <p style={{ color: '#6b7280' }}>Upload a fish photo for AI-powered pathology diagnosis. Detects lesions, parasites, gill discoloration.</p>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 24, borderRadius: 8, marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label>Pond ID</label>
            <input value={pondId} onChange={(e) => setPondId(e.target.value)} type="number" style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
          <div>
            <label>Species (optional)</label>
            <input value={species} onChange={(e) => setSpecies(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Fish Photo</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
          {preview && (
            <div style={{ marginTop: 8 }}>
              <img src={preview} alt="preview" style={{ maxWidth: 240, maxHeight: 240, border: '1px solid #d1d5db', borderRadius: 6 }} />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: 16, padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>
          {loading ? 'Analyzing...' : 'Diagnose with AI Vision'}
        </button>

        {error && <div style={{ marginTop: 16, color: '#dc2626' }}>{error}</div>}
      </form>

      {result && (
        <div style={{ marginTop: 24, background: 'white', padding: 24, borderRadius: 8 }}>
          <h2>Diagnosis Result</h2>
          {result.analysis && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p><strong>Detected:</strong> {String(result.analysis.detected)}</p>
                <p><strong>Disease:</strong> {result.analysis.disease_name}</p>
                <p><strong>Severity:</strong> {result.analysis.severity}</p>
                <p><strong>Confidence:</strong> {result.analysis.confidence_pct}%</p>
                <p><strong>Quarantine?</strong> {String(result.analysis.quarantine_recommended)}</p>
              </div>
              <div>
                <p><strong>Symptoms:</strong></p>
                <ul>{(result.analysis.symptoms || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                <p><strong>Treatment:</strong> {result.analysis.treatment}</p>
              </div>
            </div>
          )}
          {result.record && (
            <p style={{ marginTop: 16, color: '#10b981' }}>✓ Disease record #{result.record.id} created automatically.</p>
          )}
        </div>
      )}
    </div>
  );
}
