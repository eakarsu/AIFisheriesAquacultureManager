const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function queryAI(prompt, systemPrompt, options = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY env var is required');
  }
  const fetch = (await import('node-fetch')).default;
  const { temperature = 0.7, maxTokens = 2000, model } = options;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3001',
      'X-Title': 'AI Fisheries & Aquaculture Manager',
    },
    body: JSON.stringify({
      model: model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert fisheries and aquaculture management AI assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }
  const data = await response.json();
  if (data.choices && data.choices.length > 0) {
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
    };
  }
  throw new Error('No response from AI model');
}

/**
 * Vision-capable AI call. Supports an array of image URLs/base64-data-URIs
 * appended to a multimodal user message. Falls back to text-only if no
 * images are provided.
 */
async function queryAIVision(prompt, systemPrompt, images = [], options = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY env var is required');
  }
  const fetch = (await import('node-fetch')).default;
  const { temperature = 0.4, maxTokens = 2000, model } = options;

  const userContent = [{ type: 'text', text: prompt }];
  for (const img of images) {
    userContent.push({ type: 'image_url', image_url: { url: img } });
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3001',
      'X-Title': 'AI Fisheries & Aquaculture Manager',
    },
    body: JSON.stringify({
      model: model || process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert fish pathologist with vision capabilities.' },
        { role: 'user', content: userContent },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter Vision API error: ${response.status} - ${errorBody}`);
  }
  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model,
    usage: data.usage,
  };
}

/**
 * Robust 3-strategy JSON parser for LLM responses.
 *  1. Strip ```json fences and parse.
 *  2. Find first {...} block via regex.
 *  3. Find first [...] block via regex.
 * Returns null on total failure.
 */
function parseAIJson(text) {
  if (!text || typeof text !== 'string') return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch (_) {}
  }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) {
    try { return JSON.parse(obj[0]); } catch (_) {}
  }
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) {
    try { return JSON.parse(arr[0]); } catch (_) {}
  }
  try { return JSON.parse(text.trim()); } catch (_) { return null; }
}

module.exports = { queryAI, queryAIVision, parseAIJson };
