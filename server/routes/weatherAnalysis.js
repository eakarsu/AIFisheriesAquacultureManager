const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryAI } = require('../services/openrouter');

router.use(auth);

// POST /api/weather/analyze - AI weather impact analysis
router.post('/analyze', async (req, res) => {
  try {
    const { location, season, species, pond_type, current_conditions } = req.body;

    const systemPrompt = `You are an expert aquaculture meteorologist and environmental scientist. Analyze weather patterns and their impact on aquaculture operations, including effects on water temperature, dissolved oxygen levels, feeding patterns, disease risk, and overall farm productivity. Provide actionable recommendations for weather-related farm management.`;

    const prompt = `Analyze the weather impact on aquaculture operations with the following information:

Location: ${location || 'Not specified'}
Season: ${season || 'Not specified'}
Species: ${species || 'Not specified'}
Pond Type: ${pond_type || 'Not specified'}
Current Weather Conditions: ${current_conditions || 'Not specified'}

Please provide:
1. Weather impact assessment on water quality
2. Effects on fish feeding behavior and growth
3. Disease risk assessment based on weather conditions
4. Recommended operational adjustments
5. Emergency preparedness recommendations
6. Seasonal management strategies
7. Long-term weather trend implications for the farm`;

    const analysis = await queryAI(prompt, systemPrompt);
    res.json({ analysis });
  } catch (err) {
    console.error('Error analyzing weather impact:', err);
    res.status(500).json({ error: 'Failed to analyze weather impact' });
  }
});

module.exports = router;
