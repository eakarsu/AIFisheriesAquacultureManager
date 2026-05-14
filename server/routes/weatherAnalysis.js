const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');
const { Pond } = require('../models');

router.use(auth);

/**
 * Fetch current weather from OpenWeather (or compatible). Closes audit
 * gap #3 (no real weather API integration).
 *
 * Falls back to user-supplied `current_conditions` if WEATHER_API_KEY is
 * not set or fetch fails.
 */
async function fetchWeather({ lat, lon, location }) {
  if (!process.env.WEATHER_API_KEY) return null;
  const fetch = (await import('node-fetch')).default;
  try {
    const url = lat != null && lon != null
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      temperature_c: data.main?.temp,
      humidity: data.main?.humidity,
      pressure_hpa: data.main?.pressure,
      wind_speed_ms: data.wind?.speed,
      condition: data.weather?.[0]?.description,
      city: data.name,
      raw: data,
    };
  } catch (e) {
    console.warn('[weather] fetch failed', e.message);
    return null;
  }
}

router.post('/analyze', aiRateLimiter, async (req, res) => {
  const startedAt = Date.now();
  try {
    const { location, season, species, pond_type, current_conditions, pond_id, lat, lon } = req.body;

    let actualWeather = null;
    let pond = null;
    if (pond_id) {
      pond = await Pond.findByPk(pond_id);
    }
    actualWeather = await fetchWeather({
      lat,
      lon,
      location: location || pond?.location,
    });

    const systemPrompt = `You are an expert aquaculture meteorologist and environmental scientist. Analyze weather patterns and their impact on aquaculture operations. Respond with STRICT JSON only.`;
    const prompt = `Analyze weather impact for aquaculture operation:

Location: ${location || pond?.location || 'Not specified'}
Season: ${season || 'Not specified'}
Species: ${species || 'Not specified'}
Pond Type: ${pond_type || pond?.water_type || 'Not specified'}
${actualWeather ? `Live Weather: ${JSON.stringify(actualWeather)}` : `User-Provided Conditions: ${current_conditions || 'Not specified'}`}

Return JSON of shape:
{
  "water_quality_impact": "string",
  "feeding_recommendation": "string",
  "disease_risk": "low|medium|high",
  "operational_adjustments": ["string"],
  "emergency_prep": ["string"],
  "seasonal_strategy": "string",
  "next_48h_risk": "low|medium|high",
  "summary": "string"
}`;

    const ai = await queryAI(prompt, systemPrompt);
    const parsed = parseAIJson(ai.content);
    const duration = Date.now() - startedAt;

    await saveAiResult({
      feature: 'weather.analyze',
      user_id: req.user?.id,
      entity_type: pond_id ? 'pond' : null,
      entity_id: pond_id || null,
      input: { location, season, species, weather: actualWeather, current_conditions },
      output: parsed,
      raw: ai.content,
      model: ai.model,
      tokens_in: ai.usage?.prompt_tokens || null,
      tokens_out: ai.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.json({ analysis: ai.content, parsed, weather: actualWeather, duration_ms: duration });
  } catch (err) {
    console.error('Error analyzing weather impact:', err);
    res.status(500).json({ error: 'Failed to analyze weather impact' });
  }
});

module.exports = router;
