require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.BACKEND_PORT || 4001;

// Middleware
app.use(cors({ origin: `http://localhost:3001`, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

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
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database sync and server start
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err);
    process.exit(1);
  });

module.exports = app;
