const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fisheries_manager',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

// ---- User ----
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'user' },
});

// ---- FishStock ----
const FishStock = sequelize.define('FishStock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  species: { type: DataTypes.STRING },
  population_count: { type: DataTypes.INTEGER },
  pond_id: { type: DataTypes.INTEGER },
  avg_weight: { type: DataTypes.FLOAT },
  health_status: { type: DataTypes.STRING },
  mortality_rate: { type: DataTypes.FLOAT },
  stocking_date: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
});

// ---- FeedRecord ----
const FeedRecord = sequelize.define('FeedRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  species: { type: DataTypes.STRING },
  feed_type: { type: DataTypes.STRING },
  quantity_kg: { type: DataTypes.FLOAT },
  feeding_time: { type: DataTypes.DATE },
  protein_content: { type: DataTypes.FLOAT },
  cost_per_kg: { type: DataTypes.FLOAT },
  pond_id: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
});

// ---- WaterQuality ----
const WaterQuality = sequelize.define('WaterQuality', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pond_id: { type: DataTypes.INTEGER },
  temperature: { type: DataTypes.FLOAT },
  ph_level: { type: DataTypes.FLOAT },
  dissolved_oxygen: { type: DataTypes.FLOAT },
  ammonia: { type: DataTypes.FLOAT },
  nitrite: { type: DataTypes.FLOAT },
  nitrate: { type: DataTypes.FLOAT },
  turbidity: { type: DataTypes.FLOAT },
  test_date: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING },
});

// ---- HarvestPlan ----
const HarvestPlan = sequelize.define('HarvestPlan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  species: { type: DataTypes.STRING },
  pond_id: { type: DataTypes.INTEGER },
  planned_date: { type: DataTypes.DATE },
  estimated_weight_kg: { type: DataTypes.FLOAT },
  actual_weight_kg: { type: DataTypes.FLOAT },
  market_price: { type: DataTypes.FLOAT },
  status: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- RegulatoryRecord ----
const RegulatoryRecord = sequelize.define('RegulatoryRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  regulation_name: { type: DataTypes.STRING },
  authority: { type: DataTypes.STRING },
  compliance_status: { type: DataTypes.STRING },
  due_date: { type: DataTypes.DATE },
  description: { type: DataTypes.TEXT },
  penalty_amount: { type: DataTypes.FLOAT },
  category: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- Species ----
const Species = sequelize.define('Species', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  scientific_name: { type: DataTypes.STRING },
  optimal_temp_min: { type: DataTypes.FLOAT },
  optimal_temp_max: { type: DataTypes.FLOAT },
  optimal_ph_min: { type: DataTypes.FLOAT },
  optimal_ph_max: { type: DataTypes.FLOAT },
  growth_rate: { type: DataTypes.FLOAT },
  market_value: { type: DataTypes.FLOAT },
  feed_type: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- Pond ----
const Pond = sequelize.define('Pond', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  area_sqm: { type: DataTypes.FLOAT },
  depth_m: { type: DataTypes.FLOAT },
  water_type: { type: DataTypes.STRING },
  capacity: { type: DataTypes.INTEGER },
  current_stock: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- FeedInventory ----
const FeedInventory = sequelize.define('FeedInventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  feed_type: { type: DataTypes.STRING },
  brand: { type: DataTypes.STRING },
  quantity_kg: { type: DataTypes.FLOAT },
  unit_cost: { type: DataTypes.FLOAT },
  protein_content: { type: DataTypes.FLOAT },
  expiry_date: { type: DataTypes.DATE },
  supplier: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- Employee ----
const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  hire_date: { type: DataTypes.DATE },
  salary: { type: DataTypes.FLOAT },
  status: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- Equipment ----
const Equipment = sequelize.define('Equipment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  purchase_date: { type: DataTypes.DATE },
  condition: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  maintenance_due: { type: DataTypes.DATE },
  cost: { type: DataTypes.FLOAT },
  serial_number: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- DiseaseRecord ----
const DiseaseRecord = sequelize.define('DiseaseRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  species: { type: DataTypes.STRING },
  disease_name: { type: DataTypes.STRING },
  pond_id: { type: DataTypes.INTEGER },
  severity: { type: DataTypes.STRING },
  symptoms: { type: DataTypes.TEXT },
  treatment: { type: DataTypes.TEXT },
  diagnosis_date: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  image_url: { type: DataTypes.STRING }, // for vision-based diagnosis (audit gap closure)
  user_id: { type: DataTypes.INTEGER }, // row-level scoping
});

// ---- GrowthRecord ----
const GrowthRecord = sequelize.define('GrowthRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  species: { type: DataTypes.STRING },
  pond_id: { type: DataTypes.INTEGER },
  sample_date: { type: DataTypes.DATE },
  avg_weight_g: { type: DataTypes.FLOAT },
  avg_length_cm: { type: DataTypes.FLOAT },
  feed_conversion_ratio: { type: DataTypes.FLOAT },
  survival_rate: { type: DataTypes.FLOAT },
  notes: { type: DataTypes.TEXT },
});

// ---- FinancialRecord ----
const FinancialRecord = sequelize.define('FinancialRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM('income', 'expense') },
  amount: { type: DataTypes.FLOAT },
  description: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATE },
  payment_method: { type: DataTypes.STRING },
  reference_number: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- Supplier ----
const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  contact_person: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  product_types: { type: DataTypes.STRING },
  rating: { type: DataTypes.FLOAT },
  payment_terms: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
});

// ---- AiResult ----
// Replaces the audit-flagged "AI outputs in notes field" pattern with a
// proper persistent table that stores model attribution and structured outputs.
const AiResult = sequelize.define('AiResult', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  feature: { type: DataTypes.STRING, allowNull: false },
  user_id: { type: DataTypes.INTEGER },
  entity_type: { type: DataTypes.STRING },
  entity_id: { type: DataTypes.INTEGER },
  input: { type: DataTypes.JSONB },
  output: { type: DataTypes.JSONB },
  raw: { type: DataTypes.TEXT },
  model: { type: DataTypes.STRING },
  tokens_in: { type: DataTypes.INTEGER },
  tokens_out: { type: DataTypes.INTEGER },
  duration_ms: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING, defaultValue: 'completed' },
  error: { type: DataTypes.TEXT },
}, { indexes: [{ fields: ['feature'] }, { fields: ['entity_type', 'entity_id'] }] });

// ---- WaterQualityAlert ----
const WaterQualityAlert = sequelize.define('WaterQualityAlert', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pond_id: { type: DataTypes.INTEGER },
  metric: { type: DataTypes.STRING },
  observed_value: { type: DataTypes.FLOAT },
  expected_min: { type: DataTypes.FLOAT },
  expected_max: { type: DataTypes.FLOAT },
  severity: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT },
  acknowledged: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// ---- Associations (closes audit gap: no FKs/cascades previously) ----
Pond.hasMany(FishStock, { foreignKey: 'pond_id', onDelete: 'CASCADE' });
FishStock.belongsTo(Pond, { foreignKey: 'pond_id' });

Pond.hasMany(FeedRecord, { foreignKey: 'pond_id', onDelete: 'SET NULL' });
FeedRecord.belongsTo(Pond, { foreignKey: 'pond_id' });

Pond.hasMany(WaterQuality, { foreignKey: 'pond_id', onDelete: 'CASCADE' });
WaterQuality.belongsTo(Pond, { foreignKey: 'pond_id' });

Pond.hasMany(HarvestPlan, { foreignKey: 'pond_id', onDelete: 'SET NULL' });
HarvestPlan.belongsTo(Pond, { foreignKey: 'pond_id' });

Pond.hasMany(DiseaseRecord, { foreignKey: 'pond_id', onDelete: 'CASCADE' });
DiseaseRecord.belongsTo(Pond, { foreignKey: 'pond_id' });

Pond.hasMany(GrowthRecord, { foreignKey: 'pond_id', onDelete: 'CASCADE' });
GrowthRecord.belongsTo(Pond, { foreignKey: 'pond_id' });

Pond.hasMany(WaterQualityAlert, { foreignKey: 'pond_id', onDelete: 'CASCADE' });
WaterQualityAlert.belongsTo(Pond, { foreignKey: 'pond_id' });

User.hasMany(DiseaseRecord, { foreignKey: 'user_id' });
DiseaseRecord.belongsTo(User, { foreignKey: 'user_id' });

const db = {
  sequelize,
  Sequelize,
  User,
  FishStock,
  FeedRecord,
  WaterQuality,
  HarvestPlan,
  RegulatoryRecord,
  Species,
  Pond,
  FeedInventory,
  Employee,
  Equipment,
  DiseaseRecord,
  GrowthRecord,
  FinancialRecord,
  Supplier,
  AiResult,
  WaterQualityAlert,
};

module.exports = db;
