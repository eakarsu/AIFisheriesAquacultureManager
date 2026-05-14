const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAIVision, parseAIJson } = require('../services/openrouter');
const { saveAiResult } = require('../services/aiResultsStore');
const { DiseaseRecord } = require('../models');

router.use(auth);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'fish_photos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG/PNG/WEBP/GIF allowed'), ok);
  },
});

/**
 * POST /api/vision-disease/diagnose
 *
 * Closes audit gap #2: vision-based fish disease detection. Accepts
 * multipart `image` upload + optional `pond_id`/`species` form fields.
 * Calls multimodal LLM to identify lesions/parasites/discoloration and
 * auto-creates a DiseaseRecord.
 */
router.post('/diagnose', aiRateLimiter, upload.single('image'), async (req, res) => {
  const startedAt = Date.now();
  try {
    if (!req.file) return res.status(400).json({ error: 'image upload required' });
    const { pond_id, species, notes } = req.body || {};

    // Encode the image as a data URI for the multimodal LLM.
    const buf = fs.readFileSync(req.file.path);
    const base64 = buf.toString('base64');
    const mime = req.file.mimetype || 'image/jpeg';
    const dataUri = `data:${mime};base64,${base64}`;

    const systemPrompt = `You are an expert fish pathologist with vision capabilities. Examine the uploaded fish photo for signs of disease (fin rot, gill damage, lesions, parasites such as Ich/Costia, color anomalies, eye cloudiness). Respond with STRICT JSON only.`;
    const prompt = `Pond: ${pond_id || 'unknown'}, Species hint: ${species || 'unknown'}.
Examine the image and return JSON:
{
  "detected": true|false,
  "disease_name": "...",
  "severity": "mild|moderate|severe",
  "symptoms": ["..."],
  "confidence_pct": 0-100,
  "treatment": "...",
  "quarantine_recommended": true|false,
  "notes": "..."
}`;

    const ai = await queryAIVision(prompt, systemPrompt, [dataUri]);
    const parsed = parseAIJson(ai.content) || {};
    const duration = Date.now() - startedAt;

    // Auto-create DiseaseRecord with structured fields.
    const record = await DiseaseRecord.create({
      species: species || parsed.species || 'unknown',
      disease_name: parsed.disease_name || 'Unspecified (vision)',
      pond_id: pond_id || null,
      severity: parsed.severity || 'moderate',
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms.join(', ') : (parsed.symptoms || ''),
      treatment: parsed.treatment || '',
      diagnosis_date: new Date(),
      status: parsed.detected === false ? 'no_disease_detected' : 'pending',
      notes: notes || parsed.notes || '',
      image_url: `/uploads/fish_photos/${path.basename(req.file.path)}`,
      user_id: req.user?.id,
    });

    await saveAiResult({
      feature: 'vision_disease.diagnose',
      user_id: req.user?.id,
      entity_type: 'disease_record',
      entity_id: record.id,
      input: { pond_id, species, image: req.file.originalname, size: req.file.size },
      output: parsed,
      raw: ai.content,
      model: ai.model,
      tokens_in: ai.usage?.prompt_tokens || null,
      tokens_out: ai.usage?.completion_tokens || null,
      duration_ms: duration,
    });

    res.status(201).json({
      record,
      analysis: parsed,
      raw: ai.content,
      model: ai.model,
    });
  } catch (e) {
    console.error('Vision-disease error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
