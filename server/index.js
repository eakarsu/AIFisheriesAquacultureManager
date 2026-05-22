require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.BACKEND_PORT || 4001;

// --- Security middleware ---
app.use(helmet({ contentSecurityPolicy: false }));

// CORS allowlist driven by env (comma-separated). Default localhost:3001.
const corsAllowlist = (process.env.CLIENT_URL || 'http://localhost:3001')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsAllowlist.includes('*') || corsAllowlist.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Use combined log in prod, dev log in development.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static uploads (fish photos for vision-disease)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const fishStockRoutes = require('./routes/fishStock');
const feedOptimizationRoutes = require('./routes/feedOptimization');
const waterQualityRoutes = require('./routes/waterQuality');
const harvestPlanRoutes = require('./routes/harvestPlan');
const regulatoryRoutes = require('./routes/regulatory');
const speciesRoutes = require('./routes/species');
const pondsRoutes = require('./routes/ponds');
const feedInventoryRoutes = require('./routes/feedInventory');
const employeesRoutes = require('./routes/employees');
const equipmentRoutes = require('./routes/equipment');
const diseaseDetectionRoutes = require('./routes/diseaseDetection');
const growthAnalysisRoutes = require('./routes/growthAnalysis');
const financialRoutes = require('./routes/financial');
const suppliersRoutes = require('./routes/suppliers');
const weatherAnalysisRoutes = require('./routes/weatherAnalysis');
const sensorsRoutes = require('./routes/sensors');
const visionDiseaseRoutes = require('./routes/visionDisease');
const aiResultsRoutes = require('./routes/aiResults');
const sustainabilityRoutes = require('./routes/sustainability');
const integrationsRoutes = require('./routes/integrations');
const agenticFarmRoutes = require('./routes/agenticFarm');

app.use('/api/auth', authRoutes);
app.use('/api/fish-stocks', fishStockRoutes);
app.use('/api/feed-records', feedOptimizationRoutes);
app.use('/api/water-quality', waterQualityRoutes);
app.use('/api/harvest-plans', harvestPlanRoutes);
app.use('/api/regulatory', regulatoryRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/ponds', pondsRoutes);
app.use('/api/feed-inventory', feedInventoryRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/diseases', diseaseDetectionRoutes);
app.use('/api/growth-records', growthAnalysisRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/weather', weatherAnalysisRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/vision-disease', visionDiseaseRoutes);
app.use('/api/ai-results', aiResultsRoutes);
app.use('/api/sustainability', sustainabilityRoutes);
app.use('/api/integrations', integrationsRoutes);
// Apply Pass 5 — agentic-farm/advise, traceability/log, market-price/forecast
app.use('/api', agenticFarmRoutes);
app.use('/api/agentic-farm-manager', require('./routes/agenticFarmManager'));
app.use('/api/cv-disease-monitor', require('./routes/cvDiseaseMonitor'));
app.use('/api/realtime-water-optim', require('./routes/realtimeWaterOptim'));
app.use('/api/traceability-chain', require('./routes/traceabilityChain'));
app.use('/api/equipment-maintenance', require('./routes/equipmentMaintenance'));
app.use('/api/sustainability-cert', require('./routes/sustainabilityCertification'));
app.use('/api/market-price-forecast', require('./routes/marketPriceForecast'));
app.use('/api/stocking-permit-planner', require('./routes/stockingPermitPlanner'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// In production we DO NOT use sync({ alter: true }) — too risky.
// Use `npm run db:migrate` (Sequelize CLI) in production deployments.
// Default to safe behavior in production; opt-in alter only in dev.
const isProd = process.env.NODE_ENV === 'production';
const syncOptions = isProd ? {} : { alter: process.env.DB_ALTER_SYNC !== 'false' };
sequelize
  .sync(syncOptions)
  .then(() => {
    console.log(`Database synced successfully (alter=${syncOptions.alter || false})`);
    
// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('./routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CORS allowlist: ${corsAllowlist.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err);
    process.exit(1);
  });

module.exports = app;
