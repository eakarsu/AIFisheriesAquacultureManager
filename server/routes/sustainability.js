const express = require('express');
const router = express.Router();
const { Pond, FishStock, FeedRecord, WaterQuality } = require('../models');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');

router.use(auth);

/**
 * POST /api/sustainability/score
 *
 * Computes a 0-100 sustainability score for a pond (or all ponds) based on
 * water quality, feed conversion, mortality, stocking density, and water
 * use intensity. Augments with AI-generated narrative when available.
 *
 * Body: { pond_id?: number }
 *   omit pond_id to score all ponds owned by the user (aggregated).
 */
router.post('/score', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const { pond_id } = req.body || {};

    // Pull data
    const pondWhere = pond_id ? { where: { id: pond_id } } : {};
    const ponds = await Pond.findAll(pondWhere);
    if (ponds.length === 0) {
      return res.status(404).json({ error: 'No ponds found' });
    }

    const stocks = await FishStock.findAll(pond_id ? { where: { pond_id } } : {});
    const feeds = await FeedRecord.findAll(pond_id ? { where: { pond_id } } : {});
    const waters = await WaterQuality.findAll(pond_id ? { where: { pond_id } } : {});

    // Local sustainability heuristic ---------------------------------
    // 1. Mortality factor (0-25): mortality 0% → 25, 10%+ → 0
    const avgMortality = stocks.length
      ? stocks.reduce((s, x) => s + Number(x.mortality_rate || 0), 0) / stocks.length
      : 5;
    const mortalityScore = Math.max(0, 25 - avgMortality * 2.5);

    // 2. Feed conversion (0-25): FCR <= 1.2 → 25, FCR >= 2.5 → 0
    const totalFeedKg = feeds.reduce((s, f) => s + Number(f.amount_kg || 0), 0);
    const totalGainKg = stocks.reduce((s, x) => s + Number(x.population_count || 0) * Number(x.avg_weight || 0), 0);
    const fcr = totalGainKg > 0 ? totalFeedKg / totalGainKg : 2.0;
    const fcrScore = Math.max(0, Math.min(25, 25 - (fcr - 1.2) * 19.2));

    // 3. Water quality (0-25): average DO 6+ great, pH 6.5-8.5 ideal
    let waterScore = 0;
    if (waters.length > 0) {
      const avgDO = waters.reduce((s, w) => s + Number(w.dissolved_oxygen || 0), 0) / waters.length;
      const avgPh = waters.reduce((s, w) => s + Number(w.ph || 7), 0) / waters.length;
      const doScore = Math.max(0, Math.min(15, (avgDO / 8) * 15));
      const phScore = (avgPh >= 6.5 && avgPh <= 8.5) ? 10 : Math.max(0, 10 - Math.abs(avgPh - 7.5) * 4);
      waterScore = doScore + phScore;
    } else {
      waterScore = 12; // neutral
    }

    // 4. Stocking density (0-25): density per m3
    const totalVolume = ponds.reduce((s, p) => s + Number(p.volume_m3 || 0), 0);
    const totalPopulation = stocks.reduce((s, x) => s + Number(x.population_count || 0), 0);
    const densityKgPerM3 = totalVolume > 0
      ? (stocks.reduce((s, x) => s + Number(x.population_count || 0) * Number(x.avg_weight || 0), 0)) / totalVolume
      : 20;
    // Ideal 5-15 kg/m3, hot zone above 30
    const densityScore = densityKgPerM3 <= 15
      ? 25
      : densityKgPerM3 >= 35
        ? 0
        : Math.max(0, 25 - (densityKgPerM3 - 15) * 1.25);

    const total = Math.round(mortalityScore + fcrScore + waterScore + densityScore);
    const grade = total >= 90 ? 'A' : total >= 75 ? 'B' : total >= 60 ? 'C' : total >= 40 ? 'D' : 'F';

    const breakdown = {
      mortality: { score: Math.round(mortalityScore), avg_pct: Number(avgMortality.toFixed(2)), max: 25 },
      feed_conversion: { score: Math.round(fcrScore), fcr: Number(fcr.toFixed(2)), max: 25 },
      water_quality: { score: Math.round(waterScore), max: 25 },
      stocking_density: { score: Math.round(densityScore), kg_per_m3: Number(densityKgPerM3.toFixed(2)), max: 25 },
    };

    // AI narrative ---------------------------------------------------
    let aiNarrative = null;
    try {
      const systemPrompt = 'You are an aquaculture sustainability auditor. Given numeric breakdown of a farm sustainability score, produce a strict-JSON narrative.';
      const prompt = `Sustainability score for ${pond_id ? `pond #${pond_id}` : 'all ponds'}:
Total: ${total}/100 (Grade ${grade})
Breakdown: ${JSON.stringify(breakdown, null, 2)}

Return JSON ONLY:
{
  "narrative": "2-3 sentence executive summary",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": [
    { "area": "mortality|feed|water|density", "action": "string", "expected_impact": "string" }
  ],
  "asc_certification_readiness": "ready|gaps_minor|gaps_major"
}`;
      const aiResp = await queryAI(prompt, systemPrompt);
      aiNarrative = parseAIJson(aiResp) || { raw: aiResp };
    } catch (aiErr) {
      console.error('Sustainability AI narrative failed:', aiErr.message);
      aiNarrative = {
        narrative: `Score ${total}/100 (Grade ${grade}). AI narrative unavailable.`,
        recommendations: [],
      };
    }

    const duration = Date.now() - startedAt;
    await saveAiResult({
      feature: 'sustainability.score',
      user_id: req.user?.id,
      entity_type: pond_id ? 'pond' : 'farm',
      entity_id: pond_id || null,
      input: { pond_id, totalVolume, totalPopulation },
      output: { total, grade, breakdown, ai_narrative: aiNarrative },
      duration_ms: duration,
    }).catch(() => {});

    res.json({ total, grade, breakdown, ai_narrative: aiNarrative, duration_ms: duration });
  } catch (err) {
    console.error('Sustainability score error:', err);
    res.status(500).json({ error: 'Failed to compute sustainability score' });
  }
});

/**
 * POST /api/sustainability/mortality-predict
 *
 * Short-horizon mortality predictor for a pond. Combines recent water-quality
 * trend, current stocking density and species mortality_rate to produce a
 * deterministic 7- and 30-day predicted mortality rate plus risk drivers.
 * AI is consulted for narrative + interventions; if the OPENROUTER_API_KEY is
 * missing the route still returns the deterministic values with a 503 hint.
 *
 * Body: { pond_id: number, horizon_days?: 7|30 }
 */
router.post('/mortality-predict', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const { pond_id, horizon_days } = req.body || {};
    if (!pond_id) return res.status(400).json({ error: 'pond_id required' });
    const horizon = horizon_days === 30 ? 30 : 7;

    const pond = await Pond.findByPk(pond_id);
    if (!pond) return res.status(404).json({ error: 'Pond not found' });

    const stocks = await FishStock.findAll({ where: { pond_id } });
    const waters = await WaterQuality.findAll({ where: { pond_id } });
    // Take last 14 readings if any
    const recent = waters
      .slice()
      .sort((a, b) => new Date(b.sample_date || b.createdAt) - new Date(a.sample_date || a.createdAt))
      .slice(0, 14);

    const baselineMortality = stocks.length
      ? stocks.reduce((s, x) => s + Number(x.mortality_rate || 0), 0) / stocks.length
      : 2;

    let waterStress = 0;
    if (recent.length > 0) {
      const avgDO = recent.reduce((s, w) => s + Number(w.dissolved_oxygen || 6), 0) / recent.length;
      const avgPh = recent.reduce((s, w) => s + Number(w.ph || 7), 0) / recent.length;
      const avgAmm = recent.reduce((s, w) => s + Number(w.ammonia || 0), 0) / recent.length;
      if (avgDO < 5) waterStress += (5 - avgDO) * 1.4;
      if (avgPh < 6.5 || avgPh > 8.5) waterStress += Math.abs(avgPh - 7.5) * 0.6;
      if (avgAmm > 0.5) waterStress += (avgAmm - 0.5) * 2.5;
    }

    const totalPop = stocks.reduce((s, x) => s + Number(x.population_count || 0), 0);
    const totalKg = stocks.reduce((s, x) => s + Number(x.population_count || 0) * Number(x.avg_weight || 0), 0);
    const volume = Number(pond.volume_m3 || 0);
    const densityKgPerM3 = volume > 0 ? totalKg / volume : 0;
    let densityStress = 0;
    if (densityKgPerM3 > 20) densityStress = (densityKgPerM3 - 20) * 0.25;

    // Daily increment to the baseline rate
    const dailyAdd = waterStress * 0.05 + densityStress * 0.03;
    const predicted7 = Math.min(40, Number((baselineMortality + dailyAdd * 7).toFixed(2)));
    const predicted30 = Math.min(60, Number((baselineMortality + dailyAdd * 30).toFixed(2)));
    const predicted = horizon === 30 ? predicted30 : predicted7;
    const risk = predicted >= 12 ? 'high' : predicted >= 6 ? 'medium' : 'low';

    const drivers = [];
    if (waterStress > 0.5) drivers.push({ name: 'water_quality', weight: Number(waterStress.toFixed(2)) });
    if (densityStress > 0.5) drivers.push({ name: 'stocking_density', weight: Number(densityStress.toFixed(2)) });
    if (baselineMortality > 4) drivers.push({ name: 'historic_mortality', weight: Number(baselineMortality.toFixed(2)) });
    if (drivers.length === 0) drivers.push({ name: 'stable_conditions', weight: 0 });

    const deterministic = {
      pond_id,
      horizon_days: horizon,
      baseline_mortality_pct: Number(baselineMortality.toFixed(2)),
      predicted_mortality_pct: predicted,
      predicted_7d_pct: predicted7,
      predicted_30d_pct: predicted30,
      risk,
      drivers,
      density_kg_per_m3: Number(densityKgPerM3.toFixed(2)),
      total_population: totalPop,
      water_readings_used: recent.length,
    };

    let aiNarrative = null;
    let aiUnavailable = false;
    try {
      const systemPrompt = 'You are a fisheries veterinary consultant. Given numeric mortality forecast inputs, return strict JSON.';
      const prompt = `Pond #${pond_id} mortality forecast (${horizon} day horizon).
Inputs: ${JSON.stringify(deterministic, null, 2)}

Return JSON ONLY:
{
  "narrative": "2-3 sentence summary",
  "top_drivers": ["..."],
  "interventions": [
    { "action": "string", "priority": "high|medium|low", "expected_impact_pct": number }
  ],
  "monitoring": ["specific metrics to watch in next ${horizon} days"]
}`;
      const aiResp = await queryAI(prompt, systemPrompt);
      aiNarrative = parseAIJson(aiResp.content || aiResp) || { raw: aiResp.content || aiResp };
    } catch (aiErr) {
      console.error('Mortality predict AI failed:', aiErr.message);
      if (/OPENROUTER_API_KEY/i.test(aiErr.message)) {
        aiUnavailable = true;
      }
      aiNarrative = {
        narrative: `${horizon}-day predicted mortality ${predicted}% (risk ${risk}). AI narrative unavailable.`,
        interventions: [],
      };
    }

    const duration = Date.now() - startedAt;
    await saveAiResult({
      feature: 'sustainability.mortality_predict',
      user_id: req.user?.id,
      entity_type: 'pond',
      entity_id: pond_id,
      input: { pond_id, horizon },
      output: { ...deterministic, ai_narrative: aiNarrative },
      duration_ms: duration,
    }).catch(() => {});

    if (aiUnavailable) {
      return res.status(503).json({
        error: 'AI service unavailable (OPENROUTER_API_KEY not configured)',
        ...deterministic,
        ai_narrative: aiNarrative,
        duration_ms: duration,
      });
    }

    res.json({ ...deterministic, ai_narrative: aiNarrative, duration_ms: duration });
  } catch (err) {
    console.error('Mortality predict error:', err);
    res.status(500).json({ error: 'Failed to predict mortality' });
  }
});

module.exports = router;
