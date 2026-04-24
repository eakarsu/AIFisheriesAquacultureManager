const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function queryAI(prompt, systemPrompt) {
  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Fisheries & Aquaculture Manager',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemPrompt || 'You are an expert fisheries and aquaculture management AI assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    throw new Error('No response from AI model');
  } catch (error) {
    console.error('OpenRouter AI query error:', error.message);
    throw error;
  }
}

module.exports = { queryAI };
