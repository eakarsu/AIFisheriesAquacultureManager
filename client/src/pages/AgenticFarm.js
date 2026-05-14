import React, { useState } from 'react';
import api from '../services/api';

// Apply Pass 5 — Agentic farm advisor + traceability + market price.
function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', padding: 18, borderRadius: 8, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Pre({ data }) {
  if (data === null || data === undefined) return null;
  return (
    <pre style={{ background: '#0f172a', color: '#a7f3d0', padding: 12, borderRadius: 6, overflow: 'auto', fontSize: 12 }}>
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function AgenticFarm() {
  // Advisor state
  const [pondNotes, setPondNotes] = useState('');
  const [stockingDensity, setStockingDensity] = useState(20);
  const [mortality, setMortality] = useState(0.5);
  const [fcr, setFcr] = useState(1.4);
  const [doVal, setDoVal] = useState(6.5);
  const [ammonia, setAmmonia] = useState(0.2);
  const [temperature, setTemperature] = useState(28);
  const [advRes, setAdvRes] = useState(null);
  const [advErr, setAdvErr] = useState(null);
  const [advLoading, setAdvLoading] = useState(false);

  // Traceability state
  const [batchId, setBatchId] = useState('BATCH-001');
  const [eventName, setEventName] = useState('hatched');
  const [traceRes, setTraceRes] = useState(null);
  const [traceErr, setTraceErr] = useState(null);

  // Market price state
  const [species, setSpecies] = useState('tilapia');
  const [curPrice, setCurPrice] = useState(3.5);
  const [harvestMonth, setHarvestMonth] = useState(6);
  const [priceRes, setPriceRes] = useState(null);
  const [priceErr, setPriceErr] = useState(null);

  const runAdvise = async () => {
    setAdvLoading(true);
    setAdvErr(null);
    setAdvRes(null);
    try {
      const r = await api.post('/agentic-farm/advise', {
        notes: pondNotes,
        stocking_density: Number(stockingDensity),
        mortality_rate: Number(mortality),
        fcr: Number(fcr),
        water_quality: {
          dissolved_oxygen: Number(doVal),
          ammonia: Number(ammonia),
          temperature: Number(temperature),
        },
      });
      setAdvRes(r.data);
    } catch (e) {
      setAdvErr(e.response?.data?.error || e.message);
      if (e.response?.data) setAdvRes(e.response.data);
    } finally {
      setAdvLoading(false);
    }
  };

  const submitTrace = async () => {
    setTraceErr(null);
    try {
      const r = await api.post('/traceability/log', { batch_id: batchId, event: eventName });
      setTraceRes(r.data);
    } catch (e) {
      setTraceErr(e.response?.data?.error || e.message);
    }
  };

  const fetchTrace = async () => {
    setTraceErr(null);
    try {
      const r = await api.get(`/traceability/log/${encodeURIComponent(batchId)}`);
      setTraceRes(r.data);
    } catch (e) {
      setTraceErr(e.response?.data?.error || e.message);
    }
  };

  const runForecast = async () => {
    setPriceErr(null);
    setPriceRes(null);
    try {
      const r = await api.post('/market-price/forecast', {
        species,
        current_price_per_kg: Number(curPrice),
        harvest_month: Number(harvestMonth),
      });
      setPriceRes(r.data);
    } catch (e) {
      setPriceErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <h2>Agentic Farm Tools (Pass 5)</h2>

      <Section title="Agentic farm advisor">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>Stocking density (fish/m²)<input type="number" value={stockingDensity} onChange={(e) => setStockingDensity(e.target.value)} /></label>
          <label>Mortality rate (%)<input type="number" step="0.1" value={mortality} onChange={(e) => setMortality(e.target.value)} /></label>
          <label>FCR<input type="number" step="0.01" value={fcr} onChange={(e) => setFcr(e.target.value)} /></label>
          <label>Dissolved O₂ (mg/L)<input type="number" step="0.1" value={doVal} onChange={(e) => setDoVal(e.target.value)} /></label>
          <label>Ammonia (mg/L)<input type="number" step="0.01" value={ammonia} onChange={(e) => setAmmonia(e.target.value)} /></label>
          <label>Temperature (°C)<input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} /></label>
        </div>
        <textarea placeholder="Operator notes" value={pondNotes} onChange={(e) => setPondNotes(e.target.value)} style={{ width: '100%', minHeight: 60, marginTop: 8 }} />
        <button onClick={runAdvise} disabled={advLoading} style={{ marginTop: 8 }}>{advLoading ? 'Running…' : 'Run advisor'}</button>
        {advErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{advErr}</div>}
        <Pre data={advRes} />
      </Section>

      <Section title="Traceability log (in-memory; submit to chain via /api/integrations/blockchain/submit when ready)">
        <label>Batch ID<input value={batchId} onChange={(e) => setBatchId(e.target.value)} /></label>{' '}
        <label>Event<input value={eventName} onChange={(e) => setEventName(e.target.value)} /></label>{' '}
        <button onClick={submitTrace}>Add event</button>{' '}
        <button onClick={fetchTrace}>Fetch batch</button>
        {traceErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{traceErr}</div>}
        <Pre data={traceRes} />
      </Section>

      <Section title="Market price forecast">
        <label>Species
          <select value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option>tilapia</option><option>salmon</option><option>shrimp</option><option>catfish</option><option>seabass</option>
          </select>
        </label>{' '}
        <label>Current $/kg<input type="number" step="0.01" value={curPrice} onChange={(e) => setCurPrice(e.target.value)} /></label>{' '}
        <label>Planned harvest month<input type="number" min="1" max="12" value={harvestMonth} onChange={(e) => setHarvestMonth(e.target.value)} /></label>{' '}
        <button onClick={runForecast}>Run forecast</button>
        {priceErr && <div style={{ color: '#b91c1c', marginTop: 8 }}>{priceErr}</div>}
        <Pre data={priceRes} />
      </Section>
    </div>
  );
}
