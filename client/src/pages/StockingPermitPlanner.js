import React, { useState } from 'react';

export default function StockingPermitPlanner() {
  const [payload, setPayload] = useState('{"site":"Pond 4","planned_biomass_kg":18000,"licensed_biomass_kg":22000,"disease_risk_score":32,"water_quality_score":74}');
  const [result, setResult] = useState(null);
  const run = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/stocking-permit-planner/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(JSON.parse(payload || '{}')),
    });
    setResult(await res.json());
  };
  return <div className="page"><h1>Stocking Permit Planner</h1><textarea rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} /><button onClick={run}>Score Permit</button>{result && <pre>{JSON.stringify(result, null, 2)}</pre>}</div>;
}
