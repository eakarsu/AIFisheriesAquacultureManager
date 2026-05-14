import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function AiResults() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [feature, setFeature] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchResults = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (feature) params.feature = feature;
      const res = await api.get('/ai-results', { params });
      setData(res.data.data || []);
      setPagination(res.data.pagination || pagination);
    } catch (_) {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  useEffect(() => { fetchResults(1); }, [fetchResults]);

  return (
    <div style={{ padding: 24 }}>
      <h1>🤖 AI Run History</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input placeholder="Filter feature (e.g. diseases.diagnose)" value={feature} onChange={(e) => setFeature(e.target.value)} style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }} />
        <button onClick={() => fetchResults(1)} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>Search</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Feature</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Entity</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Model</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Tokens</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Duration</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} style={{ borderTop: '1px solid #e5e7eb', cursor: 'pointer' }}>
                  <td style={{ padding: 12 }}>{r.id}</td>
                  <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 13 }}>{r.feature}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{r.entity_type}{r.entity_id ? `:${r.entity_id}` : ''}</td>
                  <td style={{ padding: 12 }}>{r.status}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{r.model || '—'}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{(r.tokens_in || 0) + (r.tokens_out || 0) || '—'}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{r.duration_ms ? `${r.duration_ms}ms` : '—'}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No AI runs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <div>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</div>
        <div>
          <button disabled={pagination.page <= 1} onClick={() => fetchResults(pagination.page - 1)} style={{ marginRight: 8 }}>Previous</button>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchResults(pagination.page + 1)}>Next</button>
        </div>
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 8, padding: 24, maxWidth: 800, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <h2>AI Result #{selected.id}</h2>
            <p><strong>Feature:</strong> {selected.feature}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            {selected.error && <p style={{ color: '#dc2626' }}><strong>Error:</strong> {selected.error}</p>}
            <h3>Input</h3>
            <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(selected.input, null, 2)}</pre>
            <h3>Output</h3>
            <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(selected.output, null, 2)}</pre>
            <button onClick={() => setSelected(null)} style={{ marginTop: 16, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
