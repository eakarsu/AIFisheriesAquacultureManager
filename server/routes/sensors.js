const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { WaterQuality, WaterQualityAlert, Pond } = require('../models');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

router.use(auth);

/**
 * Real-time IoT sensor ingest pipeline.
 *
 * Closes audit gap #1: previously water quality could only be entered
 * manually via CRUD; no MQTT/HTTP webhook for IoT pH/temp/DO probes.
 *
 * POST /api/sensors/ingest
 * Body: { pond_id, readings: [{ ph, temperature, dissolved_oxygen, ammonia, ts? }, ...] }
 *
 * Stores each reading as a WaterQuality row, runs threshold detection, and
 * inserts WaterQualityAlert rows when out-of-range.
 */
router.post('/ingest', async (req, res) => {
  try {
    const { pond_id, readings } = req.body || {};
    if (!pond_id || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: 'pond_id and non-empty readings array required' });
    }

    // Sane safety bounds for an aquaculture pond. Adjust per species via Species table later.
    const THRESHOLDS = {
      ph: { min: 6.5, max: 8.5, name: 'pH' },
      temperature: { min: 15, max: 32, name: 'Temperature (°C)' },
      dissolved_oxygen: { min: 4.0, max: 14.0, name: 'Dissolved O₂ (mg/L)' },
      ammonia: { min: 0, max: 0.5, name: 'Ammonia (mg/L)' },
    };

    const created = [];
    const alerts = [];

    for (const r of readings) {
      const row = await WaterQuality.create({
        pond_id,
        ph: r.ph,
        temperature: r.temperature,
        dissolved_oxygen: r.dissolved_oxygen,
        ammonia: r.ammonia,
        nitrate: r.nitrate || null,
        turbidity: r.turbidity || null,
        sample_date: r.ts ? new Date(r.ts) : new Date(),
        notes: 'sensor-ingested',
      });
      created.push(row.id);

      for (const [key, t] of Object.entries(THRESHOLDS)) {
        const v = r[key];
        if (v == null || isNaN(v)) continue;
        if (v < t.min || v > t.max) {
          const severity = (v < t.min * 0.85 || v > t.max * 1.15) ? 'critical' : 'warning';
          const alert = await WaterQualityAlert.create({
            pond_id,
            metric: key,
            observed_value: v,
            expected_min: t.min,
            expected_max: t.max,
            severity,
            message: `${t.name} reading ${v} outside [${t.min}, ${t.max}] for pond ${pond_id}`,
          });
          alerts.push(alert);
        }
      }
    }

    res.status(201).json({
      ingested: created.length,
      reading_ids: created,
      alerts,
    });
  } catch (e) {
    console.error('Sensor ingest error:', e);
    res.status(500).json({ error: 'Failed to ingest sensor readings' });
  }
});

// GET /api/sensors/alerts (paginated)
router.get('/alerts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.pond_id) where.pond_id = req.query.pond_id;
    if (req.query.acknowledged != null) where.acknowledged = req.query.acknowledged === 'true';

    const { rows, count } = await WaterQualityAlert.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) || 1 },
    });
  } catch (e) {
    console.error('List alerts error:', e);
    res.status(500).json({ error: 'Failed to list alerts' });
  }
});

router.put('/alerts/:id/ack', async (req, res) => {
  try {
    const a = await WaterQualityAlert.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Alert not found' });
    await a.update({ acknowledged: true });
    res.json(a);
  } catch (e) {
    res.status(500).json({ error: 'Failed to ack alert' });
  }
});

/**
 * GET /api/sensors/monitor
 *
 * Real-time monitoring dashboard summary. Aggregates the latest 50 water
 * readings + open critical/warning alerts across the whole farm (or a single
 * pond when ?pond_id= is supplied) and returns rolling means and counts.
 *
 * Query: pond_id?, hours? (default 24)
 */
router.get('/monitor', async (req, res) => {
  try {
    const pond_id = req.query.pond_id ? Number(req.query.pond_id) : null;
    const hours = Math.max(1, Math.min(168, Number(req.query.hours) || 24));
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const where = {};
    if (pond_id) where.pond_id = pond_id;
    const recent = await WaterQuality.findAll({ where, order: [['createdAt', 'DESC']], limit: 200 });
    const inWindow = recent.filter((r) => new Date(r.createdAt) >= since);

    const mean = (arr, key) => {
      const vals = arr.map((x) => Number(x[key])).filter((v) => !isNaN(v) && v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : null;
    };

    const summary = {
      pond_id,
      window_hours: hours,
      sample_count: inWindow.length,
      mean_ph: mean(inWindow, 'ph'),
      mean_temperature_c: mean(inWindow, 'temperature'),
      mean_dissolved_oxygen: mean(inWindow, 'dissolved_oxygen'),
      mean_ammonia: mean(inWindow, 'ammonia'),
    };

    const alertWhere = { acknowledged: false };
    if (pond_id) alertWhere.pond_id = pond_id;
    const openAlerts = await WaterQualityAlert.findAll({
      where: alertWhere,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    const counts = openAlerts.reduce(
      (acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      },
      { critical: 0, warning: 0 }
    );

    res.json({
      summary,
      open_alerts: openAlerts,
      alert_counts: counts,
      latest_readings: recent.slice(0, 10),
    });
  } catch (e) {
    console.error('Monitor error:', e);
    res.status(500).json({ error: 'Failed to build monitor snapshot' });
  }
});

/**
 * POST /api/sensors/monitor-summary
 *
 * AI-summarized version of /monitor. Returns a strict-JSON narrative + risks
 * + actions for the same aggregated data. Returns 503 when no API key.
 *
 * Body: { pond_id?: number, hours?: number }
 */
router.post('/monitor-summary', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const pond_id = req.body?.pond_id || null;
    const hours = Math.max(1, Math.min(168, Number(req.body?.hours) || 24));
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const where = {};
    if (pond_id) where.pond_id = pond_id;
    const recent = await WaterQuality.findAll({ where, order: [['createdAt', 'DESC']], limit: 200 });
    const inWindow = recent.filter((r) => new Date(r.createdAt) >= since);

    const mean = (arr, key) => {
      const vals = arr.map((x) => Number(x[key])).filter((v) => !isNaN(v) && v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : null;
    };
    const stats = {
      pond_id,
      window_hours: hours,
      sample_count: inWindow.length,
      mean_ph: mean(inWindow, 'ph'),
      mean_temperature_c: mean(inWindow, 'temperature'),
      mean_dissolved_oxygen: mean(inWindow, 'dissolved_oxygen'),
      mean_ammonia: mean(inWindow, 'ammonia'),
    };
    const alertWhere = { acknowledged: false };
    if (pond_id) alertWhere.pond_id = pond_id;
    const openAlerts = await WaterQualityAlert.findAll({
      where: alertWhere,
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    const alertCounts = openAlerts.reduce(
      (acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      },
      { critical: 0, warning: 0 }
    );

    try {
      const systemPrompt = 'You are an aquaculture operations analyst. Given numeric water quality stats and open alerts, return strict JSON.';
      const prompt = `Real-time sensor snapshot${pond_id ? ` for pond #${pond_id}` : ' (whole farm)'} over the last ${hours}h.
Stats: ${JSON.stringify(stats, null, 2)}
Open alerts: ${JSON.stringify(alertCounts)}
First few alerts: ${JSON.stringify(openAlerts.slice(0, 5).map((a) => ({ metric: a.metric, severity: a.severity, value: a.observed_value, message: a.message })), null, 2)}

Return JSON ONLY:
{
  "headline": "1-sentence status",
  "risks": [{ "metric": "ph|temperature|dissolved_oxygen|ammonia", "severity": "high|medium|low", "reason": "string" }],
  "actions": ["..."]
}`;
      const aiResp = await queryAI(prompt, systemPrompt);
      const summary = parseAIJson(aiResp.content || aiResp) || { raw: aiResp.content || aiResp };
      const duration = Date.now() - startedAt;
      await saveAiResult({
        feature: 'sensors.monitor_summary',
        user_id: req.user?.id,
        entity_type: pond_id ? 'pond' : 'farm',
        entity_id: pond_id,
        input: { pond_id, hours },
        output: { stats, alert_counts: alertCounts, summary },
        duration_ms: duration,
      }).catch(() => {});
      return res.json({ stats, alert_counts: alertCounts, ai_summary: summary, duration_ms: duration });
    } catch (aiErr) {
      console.error('Monitor summary AI failed:', aiErr.message);
      if (/OPENROUTER_API_KEY/i.test(aiErr.message)) {
        return res.status(503).json({
          error: 'AI service unavailable (OPENROUTER_API_KEY not configured)',
          stats,
          alert_counts: alertCounts,
        });
      }
      return res.status(502).json({ error: 'AI provider error', detail: aiErr.message, stats, alert_counts: alertCounts });
    }
  } catch (e) {
    console.error('Monitor-summary error:', e);
    res.status(500).json({ error: 'Failed to summarize monitor snapshot' });
  }
});

module.exports = router;
