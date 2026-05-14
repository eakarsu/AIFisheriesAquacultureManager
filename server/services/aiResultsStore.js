const { AiResult } = require('../models');

async function saveAiResult(payload) {
  try {
    const row = await AiResult.create(payload);
    return row.id;
  } catch (e) {
    console.warn('[ai_results] persist failed (non-fatal):', e.message);
    return null;
  }
}

module.exports = { saveAiResult };
