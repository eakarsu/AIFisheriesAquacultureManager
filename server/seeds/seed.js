const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Species,
  Pond,
  FishStock,
  FeedRecord,
  WaterQuality,
  HarvestPlan,
  RegulatoryRecord,
  FeedInventory,
  Employee,
  Equipment,
  DiseaseRecord,
  GrowthRecord,
  FinancialRecord,
  Supplier,
} = require('../models');

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database tables recreated.');

    // ── Users (3) ──────────────────────────────────────────────────────
    const hashedAdmin = await bcrypt.hash(requireDemoPassword(), 10);
    const hashedManager = await bcrypt.hash(requireDemoPassword(), 10);
    const hashedOperator = await bcrypt.hash(requireDemoPassword(), 10);

    await User.bulkCreate([
      { email: 'admin@fisheries.com', password: hashedAdmin, name: 'Admin User', role: 'admin' },
      { email: 'manager@fisheries.com', password: hashedManager, name: 'Farm Manager', role: 'manager' },
      { email: 'operator@fisheries.com', password: hashedOperator, name: 'Field Operator', role: 'operator' },
    ]);
    console.log('Users seeded.');

    // ── Species (15) ───────────────────────────────────────────────────
    await Species.bulkCreate([
      { name: 'Atlantic Salmon', scientific_name: 'Salmo salar', optimal_temp_min: 8, optimal_temp_max: 14, optimal_ph_min: 6.5, optimal_ph_max: 7.5, growth_rate: 1.2, market_value: 12.50, feed_type: 'high-protein pellet', notes: 'Primary cold-water species for commercial production' },
      { name: 'Rainbow Trout', scientific_name: 'Oncorhynchus mykiss', optimal_temp_min: 10, optimal_temp_max: 18, optimal_ph_min: 6.5, optimal_ph_max: 8.0, growth_rate: 1.0, market_value: 9.00, feed_type: 'trout pellet', notes: 'Hardy species suitable for raceways and tanks' },
      { name: 'Tilapia (Nile)', scientific_name: 'Oreochromis niloticus', optimal_temp_min: 22, optimal_temp_max: 30, optimal_ph_min: 6.5, optimal_ph_max: 8.5, growth_rate: 1.5, market_value: 5.50, feed_type: 'omnivore pellet', notes: 'Fast-growing warm-water species with broad diet' },
      { name: 'Channel Catfish', scientific_name: 'Ictalurus punctatus', optimal_temp_min: 20, optimal_temp_max: 30, optimal_ph_min: 6.5, optimal_ph_max: 8.0, growth_rate: 1.3, market_value: 4.50, feed_type: 'sinking pellet', notes: 'Most widely farmed catfish species in the US' },
      { name: 'Largemouth Bass', scientific_name: 'Micropterus salmoides', optimal_temp_min: 18, optimal_temp_max: 27, optimal_ph_min: 6.5, optimal_ph_max: 8.5, growth_rate: 0.8, market_value: 8.00, feed_type: 'carnivore pellet', notes: 'Popular sport fish with growing aquaculture interest' },
      { name: 'Pacific White Shrimp', scientific_name: 'Litopenaeus vannamei', optimal_temp_min: 23, optimal_temp_max: 32, optimal_ph_min: 7.5, optimal_ph_max: 8.5, growth_rate: 2.0, market_value: 14.00, feed_type: 'shrimp crumble', notes: 'Leading farmed shrimp species worldwide' },
      { name: 'Blue Catfish', scientific_name: 'Ictalurus furcatus', optimal_temp_min: 18, optimal_temp_max: 28, optimal_ph_min: 6.5, optimal_ph_max: 8.0, growth_rate: 1.1, market_value: 5.00, feed_type: 'sinking pellet', notes: 'Grows larger than channel catfish' },
      { name: 'Striped Bass', scientific_name: 'Morone saxatilis', optimal_temp_min: 15, optimal_temp_max: 25, optimal_ph_min: 7.0, optimal_ph_max: 8.0, growth_rate: 0.9, market_value: 11.00, feed_type: 'marine pellet', notes: 'Premium market species, hybrid varieties common' },
      { name: 'Red Drum', scientific_name: 'Sciaenops ocellatus', optimal_temp_min: 20, optimal_temp_max: 30, optimal_ph_min: 7.0, optimal_ph_max: 8.5, growth_rate: 1.0, market_value: 10.00, feed_type: 'marine pellet', notes: 'Popular coastal aquaculture species' },
      { name: 'Cobia', scientific_name: 'Rachycentron canadum', optimal_temp_min: 22, optimal_temp_max: 32, optimal_ph_min: 7.5, optimal_ph_max: 8.5, growth_rate: 1.8, market_value: 16.00, feed_type: 'high-protein extruded', notes: 'Fast-growing marine finfish with excellent flesh quality' },
      { name: 'Arctic Char', scientific_name: 'Salvelinus alpinus', optimal_temp_min: 6, optimal_temp_max: 14, optimal_ph_min: 6.5, optimal_ph_max: 7.5, growth_rate: 0.7, market_value: 15.00, feed_type: 'salmonid pellet', notes: 'Cold-water species valued for delicate flavor' },
      { name: 'Brook Trout', scientific_name: 'Salvelinus fontinalis', optimal_temp_min: 7, optimal_temp_max: 16, optimal_ph_min: 6.0, optimal_ph_max: 7.5, growth_rate: 0.6, market_value: 10.50, feed_type: 'trout pellet', notes: 'Native North American char with niche market demand' },
      { name: 'Barramundi', scientific_name: 'Lates calcarifer', optimal_temp_min: 24, optimal_temp_max: 32, optimal_ph_min: 7.0, optimal_ph_max: 8.5, growth_rate: 1.6, market_value: 13.00, feed_type: 'extruded pellet', notes: 'Versatile tropical species farmed in recirculating systems' },
      { name: 'Yellow Perch', scientific_name: 'Perca flavescens', optimal_temp_min: 15, optimal_temp_max: 24, optimal_ph_min: 6.5, optimal_ph_max: 8.0, growth_rate: 0.5, market_value: 11.50, feed_type: 'perch pellet', notes: 'High-value species in Great Lakes regional markets' },
      { name: 'Walleye', scientific_name: 'Sander vitreus', optimal_temp_min: 12, optimal_temp_max: 22, optimal_ph_min: 6.5, optimal_ph_max: 8.0, growth_rate: 0.6, market_value: 14.00, feed_type: 'carnivore pellet', notes: 'Premium freshwater species with strong restaurant demand' },
    ]);
    console.log('Species seeded.');

    // ── Ponds (15) ─────────────────────────────────────────────────────
    await Pond.bulkCreate([
      { name: 'North Pond A1', location: 'North Sector', area_sqm: 2500, depth_m: 2.0, water_type: 'freshwater', capacity: 8000, current_stock: 5500, status: 'active', notes: 'Primary grow-out pond for salmonids' },
      { name: 'North Pond A2', location: 'North Sector', area_sqm: 2200, depth_m: 1.8, water_type: 'freshwater', capacity: 7000, current_stock: 4800, status: 'active', notes: 'Tilapia production pond' },
      { name: 'South Tank B1', location: 'South Sector', area_sqm: 800, depth_m: 3.0, water_type: 'freshwater', capacity: 5000, current_stock: 3200, status: 'active', notes: 'Indoor recirculating tank for trout' },
      { name: 'South Tank B2', location: 'South Sector', area_sqm: 800, depth_m: 3.0, water_type: 'freshwater', capacity: 5000, current_stock: 2800, status: 'active', notes: 'Indoor recirculating tank for char' },
      { name: 'East Raceway C1', location: 'East Sector', area_sqm: 1200, depth_m: 1.2, water_type: 'freshwater', capacity: 6000, current_stock: 4500, status: 'active', notes: 'Flow-through raceway for trout fingerlings' },
      { name: 'East Raceway C2', location: 'East Sector', area_sqm: 1200, depth_m: 1.2, water_type: 'freshwater', capacity: 6000, current_stock: 3800, status: 'maintenance', notes: 'Raceway undergoing liner replacement' },
      { name: 'West Pond D1', location: 'West Sector', area_sqm: 3500, depth_m: 2.5, water_type: 'freshwater', capacity: 10000, current_stock: 7200, status: 'active', notes: 'Largest pond, used for catfish grow-out' },
      { name: 'West Pond D2', location: 'West Sector', area_sqm: 3000, depth_m: 2.2, water_type: 'freshwater', capacity: 9000, current_stock: 6500, status: 'active', notes: 'Bass and perch co-culture' },
      { name: 'Coastal Tank E1', location: 'Coastal Facility', area_sqm: 600, depth_m: 4.0, water_type: 'brackish', capacity: 4000, current_stock: 2500, status: 'active', notes: 'Brackish water tank for shrimp' },
      { name: 'Coastal Tank E2', location: 'Coastal Facility', area_sqm: 600, depth_m: 4.0, water_type: 'brackish', capacity: 4000, current_stock: 3000, status: 'active', notes: 'Brackish water tank for red drum' },
      { name: 'Nursery Pond F1', location: 'Hatchery Building', area_sqm: 500, depth_m: 1.0, water_type: 'freshwater', capacity: 15000, current_stock: 12000, status: 'active', notes: 'Fingerling nursery pond' },
      { name: 'Nursery Tank F2', location: 'Hatchery Building', area_sqm: 500, depth_m: 1.0, water_type: 'freshwater', capacity: 15000, current_stock: 10000, status: 'active', notes: 'Fry rearing tank' },
      { name: 'Research Tank G1', location: 'Research Wing', area_sqm: 600, depth_m: 2.0, water_type: 'freshwater', capacity: 3000, current_stock: 1500, status: 'active', notes: 'Experimental breeding and genetics trials' },
      { name: 'Quarantine Tank H1', location: 'Biosecurity Zone', area_sqm: 500, depth_m: 1.5, water_type: 'freshwater', capacity: 2000, current_stock: 800, status: 'active', notes: 'Isolation tank for new arrivals and sick fish' },
      { name: 'Coastal Pond E3', location: 'Coastal Facility', area_sqm: 5000, depth_m: 1.8, water_type: 'brackish', capacity: 12000, current_stock: 8500, status: 'active', notes: 'Large brackish pond for cobia and barramundi' },
    ]);
    console.log('Ponds seeded.');

    // ── FishStock (15) ─────────────────────────────────────────────────
    await FishStock.bulkCreate([
      { species: 'Atlantic Salmon', population_count: 5500, pond_id: 1, avg_weight: 2.8, health_status: 'healthy', mortality_rate: 2.1, stocking_date: '2024-03-15', notes: 'Spring stocking cohort performing well' },
      { species: 'Rainbow Trout', population_count: 3200, pond_id: 3, avg_weight: 1.5, health_status: 'healthy', mortality_rate: 1.8, stocking_date: '2024-06-01', notes: 'Indoor tank cohort, excellent water quality' },
      { species: 'Tilapia (Nile)', population_count: 4800, pond_id: 2, avg_weight: 0.8, health_status: 'healthy', mortality_rate: 3.2, stocking_date: '2024-09-10', notes: 'Fast growth observed in warm months' },
      { species: 'Channel Catfish', population_count: 7200, pond_id: 7, avg_weight: 1.2, health_status: 'fair', mortality_rate: 4.5, stocking_date: '2024-04-20', notes: 'Minor feed conversion issues noted' },
      { species: 'Largemouth Bass', population_count: 2500, pond_id: 8, avg_weight: 1.0, health_status: 'healthy', mortality_rate: 2.8, stocking_date: '2024-05-15', notes: 'Co-cultured with yellow perch' },
      { species: 'Pacific White Shrimp', population_count: 10000, pond_id: 9, avg_weight: 0.025, health_status: 'healthy', mortality_rate: 8.5, stocking_date: '2025-01-10', notes: 'Post-larval stocking, brackish water' },
      { species: 'Blue Catfish', population_count: 3500, pond_id: 7, avg_weight: 2.1, health_status: 'fair', mortality_rate: 3.8, stocking_date: '2024-02-28', notes: 'Mixed with channel catfish population' },
      { species: 'Striped Bass', population_count: 1800, pond_id: 10, avg_weight: 1.8, health_status: 'healthy', mortality_rate: 2.5, stocking_date: '2024-07-05', notes: 'Hybrid striped bass cohort' },
      { species: 'Red Drum', population_count: 3000, pond_id: 10, avg_weight: 1.3, health_status: 'healthy', mortality_rate: 3.0, stocking_date: '2024-08-20', notes: 'Coastal tank rearing, good feed response' },
      { species: 'Arctic Char', population_count: 2800, pond_id: 4, avg_weight: 0.9, health_status: 'healthy', mortality_rate: 1.5, stocking_date: '2024-10-01', notes: 'Cold-water tank maintaining 10C' },
      { species: 'Barramundi', population_count: 4000, pond_id: 15, avg_weight: 3.2, health_status: 'healthy', mortality_rate: 2.2, stocking_date: '2024-01-15', notes: 'Approaching market size' },
      { species: 'Yellow Perch', population_count: 4000, pond_id: 8, avg_weight: 0.3, health_status: 'fair', mortality_rate: 5.0, stocking_date: '2024-11-01', notes: 'Juvenile cohort, slow winter growth' },
      { species: 'Walleye', population_count: 1500, pond_id: 13, avg_weight: 0.6, health_status: 'healthy', mortality_rate: 3.5, stocking_date: '2025-02-01', notes: 'Research trial for indoor walleye culture' },
      { species: 'Cobia', population_count: 2000, pond_id: 15, avg_weight: 4.5, health_status: 'healthy', mortality_rate: 1.9, stocking_date: '2024-03-01', notes: 'Premium market-ready stock' },
      { species: 'Brook Trout', population_count: 800, pond_id: 14, avg_weight: 0.4, health_status: 'poor', mortality_rate: 12.0, stocking_date: '2025-01-20', notes: 'Quarantine due to suspected fungal infection' },
    ]);
    console.log('FishStock seeded.');

    // ── FeedRecord (15) ────────────────────────────────────────────────
    await FeedRecord.bulkCreate([
      { species: 'Atlantic Salmon', feed_type: 'pellet', quantity_kg: 120, feeding_time: '2025-03-10 07:00:00', protein_content: 45, cost_per_kg: 2.80, pond_id: 1, notes: 'Morning feeding, 2mm pellet' },
      { species: 'Rainbow Trout', feed_type: 'pellet', quantity_kg: 80, feeding_time: '2025-03-10 07:30:00', protein_content: 42, cost_per_kg: 2.50, pond_id: 3, notes: 'Standard trout ration' },
      { species: 'Tilapia (Nile)', feed_type: 'extruded', quantity_kg: 95, feeding_time: '2025-03-10 08:00:00', protein_content: 32, cost_per_kg: 1.40, pond_id: 2, notes: 'Floating extruded feed' },
      { species: 'Channel Catfish', feed_type: 'sinking', quantity_kg: 200, feeding_time: '2025-03-10 06:30:00', protein_content: 28, cost_per_kg: 1.10, pond_id: 7, notes: 'Early morning bottom feed' },
      { species: 'Pacific White Shrimp', feed_type: 'crumble', quantity_kg: 15, feeding_time: '2025-03-10 09:00:00', protein_content: 38, cost_per_kg: 3.50, pond_id: 9, notes: 'Shrimp starter crumble' },
      { species: 'Largemouth Bass', feed_type: 'pellet', quantity_kg: 45, feeding_time: '2025-03-10 07:00:00', protein_content: 48, cost_per_kg: 3.20, pond_id: 8, notes: 'High-protein bass pellet' },
      { species: 'Barramundi', feed_type: 'extruded', quantity_kg: 110, feeding_time: '2025-03-10 08:30:00', protein_content: 46, cost_per_kg: 3.00, pond_id: 15, notes: 'Floating pellet, 4mm diameter' },
      { species: 'Striped Bass', feed_type: 'pellet', quantity_kg: 55, feeding_time: '2025-03-10 07:00:00', protein_content: 44, cost_per_kg: 2.90, pond_id: 10, notes: 'Marine species formulation' },
      { species: 'Arctic Char', feed_type: 'pellet', quantity_kg: 40, feeding_time: '2025-03-10 08:00:00', protein_content: 50, cost_per_kg: 3.40, pond_id: 4, notes: 'Cold-water salmonid feed' },
      { species: 'Cobia', feed_type: 'extruded', quantity_kg: 75, feeding_time: '2025-03-10 09:00:00', protein_content: 52, cost_per_kg: 3.80, pond_id: 15, notes: 'High-energy marine pellet' },
      { species: 'Red Drum', feed_type: 'pellet', quantity_kg: 65, feeding_time: '2025-03-10 16:00:00', protein_content: 40, cost_per_kg: 2.60, pond_id: 10, notes: 'Afternoon feeding session' },
      { species: 'Yellow Perch', feed_type: 'crumble', quantity_kg: 20, feeding_time: '2025-03-10 07:30:00', protein_content: 40, cost_per_kg: 2.70, pond_id: 8, notes: 'Juvenile crumble feed' },
      { species: 'Walleye', feed_type: 'pellet', quantity_kg: 10, feeding_time: '2025-03-10 18:00:00', protein_content: 50, cost_per_kg: 3.60, pond_id: 13, notes: 'Evening feed, low-light preference' },
      { species: 'Blue Catfish', feed_type: 'sinking', quantity_kg: 150, feeding_time: '2025-03-10 06:00:00', protein_content: 30, cost_per_kg: 1.20, pond_id: 7, notes: 'Pre-dawn sinking pellet delivery' },
      { species: 'Brook Trout', feed_type: 'flake', quantity_kg: 5, feeding_time: '2025-03-10 10:00:00', protein_content: 55, cost_per_kg: 4.00, pond_id: 14, notes: 'Medicated flake during quarantine' },
    ]);
    console.log('FeedRecords seeded.');

    // ── WaterQuality (15) ──────────────────────────────────────────────
    await WaterQuality.bulkCreate([
      { pond_id: 1, temperature: 12.5, ph_level: 7.2, dissolved_oxygen: 9.8, ammonia: 0.02, nitrite: 0.01, nitrate: 8.5, turbidity: 3.2, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 2, temperature: 27.0, ph_level: 7.8, dissolved_oxygen: 6.5, ammonia: 0.15, nitrite: 0.08, nitrate: 22.0, turbidity: 12.5, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 3, temperature: 14.0, ph_level: 7.0, dissolved_oxygen: 10.5, ammonia: 0.01, nitrite: 0.005, nitrate: 5.0, turbidity: 1.5, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 4, temperature: 10.0, ph_level: 6.8, dissolved_oxygen: 11.2, ammonia: 0.01, nitrite: 0.003, nitrate: 3.8, turbidity: 1.2, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 5, temperature: 15.0, ph_level: 7.1, dissolved_oxygen: 9.0, ammonia: 0.05, nitrite: 0.02, nitrate: 10.0, turbidity: 4.0, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 7, temperature: 24.0, ph_level: 7.5, dissolved_oxygen: 5.8, ammonia: 0.45, nitrite: 0.12, nitrate: 35.0, turbidity: 25.0, test_date: '2025-03-10 06:00:00', status: 'warning' },
      { pond_id: 8, temperature: 20.0, ph_level: 7.6, dissolved_oxygen: 7.2, ammonia: 0.10, nitrite: 0.05, nitrate: 18.0, turbidity: 8.0, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 9, temperature: 28.0, ph_level: 8.1, dissolved_oxygen: 5.5, ammonia: 0.08, nitrite: 0.04, nitrate: 15.0, turbidity: 10.0, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 10, temperature: 25.0, ph_level: 7.9, dissolved_oxygen: 6.0, ammonia: 0.20, nitrite: 0.10, nitrate: 28.0, turbidity: 14.0, test_date: '2025-03-10 06:00:00', status: 'warning' },
      { pond_id: 11, temperature: 18.0, ph_level: 7.3, dissolved_oxygen: 8.5, ammonia: 0.03, nitrite: 0.01, nitrate: 6.0, turbidity: 2.5, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 12, temperature: 19.0, ph_level: 7.4, dissolved_oxygen: 8.0, ammonia: 0.04, nitrite: 0.02, nitrate: 7.5, turbidity: 3.0, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 13, temperature: 16.0, ph_level: 7.0, dissolved_oxygen: 9.5, ammonia: 0.02, nitrite: 0.01, nitrate: 4.5, turbidity: 2.0, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 14, temperature: 13.0, ph_level: 6.5, dissolved_oxygen: 4.2, ammonia: 1.80, nitrite: 0.85, nitrate: 48.0, turbidity: 42.0, test_date: '2025-03-10 06:00:00', status: 'critical' },
      { pond_id: 15, temperature: 29.0, ph_level: 8.0, dissolved_oxygen: 5.2, ammonia: 0.12, nitrite: 0.06, nitrate: 20.0, turbidity: 11.0, test_date: '2025-03-10 06:00:00', status: 'good' },
      { pond_id: 6, temperature: 14.5, ph_level: 7.2, dissolved_oxygen: 8.8, ammonia: 0.30, nitrite: 0.15, nitrate: 30.0, turbidity: 18.0, test_date: '2025-03-10 06:00:00', status: 'warning' },
    ]);
    console.log('WaterQuality seeded.');

    // ── HarvestPlan (15) ───────────────────────────────────────────────
    await HarvestPlan.bulkCreate([
      { species: 'Atlantic Salmon', pond_id: 1, planned_date: '2025-06-15', estimated_weight_kg: 8000, actual_weight_kg: null, market_price: 12.50, status: 'planned', notes: 'Summer harvest, target 3kg average' },
      { species: 'Rainbow Trout', pond_id: 3, planned_date: '2025-05-01', estimated_weight_kg: 4000, actual_weight_kg: null, market_price: 9.00, status: 'planned', notes: 'Spring harvest for restaurant orders' },
      { species: 'Tilapia (Nile)', pond_id: 2, planned_date: '2025-04-20', estimated_weight_kg: 3500, actual_weight_kg: null, market_price: 5.50, status: 'in_progress', notes: 'Partial harvest started' },
      { species: 'Channel Catfish', pond_id: 7, planned_date: '2025-07-10', estimated_weight_kg: 6000, actual_weight_kg: null, market_price: 4.50, status: 'planned', notes: 'Full pond harvest scheduled' },
      { species: 'Barramundi', pond_id: 15, planned_date: '2025-04-01', estimated_weight_kg: 10000, actual_weight_kg: 9800, market_price: 13.00, status: 'completed', notes: 'Harvest completed, excellent yield' },
      { species: 'Pacific White Shrimp', pond_id: 9, planned_date: '2025-08-15', estimated_weight_kg: 2500, actual_weight_kg: null, market_price: 14.00, status: 'planned', notes: 'First shrimp harvest cycle' },
      { species: 'Cobia', pond_id: 15, planned_date: '2025-05-20', estimated_weight_kg: 7000, actual_weight_kg: null, market_price: 16.00, status: 'planned', notes: 'Premium market, pre-sold to distributor' },
      { species: 'Striped Bass', pond_id: 10, planned_date: '2025-09-01', estimated_weight_kg: 3000, actual_weight_kg: null, market_price: 11.00, status: 'planned', notes: 'Fall harvest for holiday season' },
      { species: 'Red Drum', pond_id: 10, planned_date: '2025-10-15', estimated_weight_kg: 3500, actual_weight_kg: null, market_price: 10.00, status: 'planned', notes: 'Coastal market distribution' },
      { species: 'Arctic Char', pond_id: 4, planned_date: '2026-01-10', estimated_weight_kg: 2000, actual_weight_kg: null, market_price: 15.00, status: 'planned', notes: 'Winter harvest, specialty market' },
      { species: 'Yellow Perch', pond_id: 8, planned_date: '2026-03-01', estimated_weight_kg: 800, actual_weight_kg: null, market_price: 11.50, status: 'planned', notes: 'Regional restaurant contracts' },
      { species: 'Walleye', pond_id: 13, planned_date: '2026-06-01', estimated_weight_kg: 600, actual_weight_kg: null, market_price: 14.00, status: 'planned', notes: 'Research trial harvest' },
      { species: 'Largemouth Bass', pond_id: 8, planned_date: '2025-11-01', estimated_weight_kg: 1500, actual_weight_kg: null, market_price: 8.00, status: 'planned', notes: 'Selective harvest of market-size fish' },
      { species: 'Blue Catfish', pond_id: 7, planned_date: '2025-07-10', estimated_weight_kg: 5000, actual_weight_kg: null, market_price: 5.00, status: 'planned', notes: 'Co-harvested with channel catfish' },
      { species: 'Brook Trout', pond_id: 14, planned_date: '2025-12-01', estimated_weight_kg: 500, actual_weight_kg: null, market_price: 10.50, status: 'cancelled', notes: 'Cancelled due to disease outbreak in quarantine' },
    ]);
    console.log('HarvestPlans seeded.');

    // ── RegulatoryRecord (15) ──────────────────────────────────────────
    await RegulatoryRecord.bulkCreate([
      { regulation_name: 'EPA Water Discharge Permit (NPDES)', authority: 'US Environmental Protection Agency', compliance_status: 'compliant', due_date: '2025-12-31', description: 'National Pollutant Discharge Elimination System permit for effluent water', penalty_amount: 50000, category: 'environmental', notes: 'Annual renewal, last inspection passed' },
      { regulation_name: 'FDA Feed Safety Compliance', authority: 'US Food and Drug Administration', compliance_status: 'compliant', due_date: '2025-06-30', description: 'Feed safety program under the Food Safety Modernization Act', penalty_amount: 25000, category: 'food_safety', notes: 'FSMA Preventive Controls compliant' },
      { regulation_name: 'USDA Organic Certification', authority: 'USDA National Organic Program', compliance_status: 'pending', due_date: '2025-09-15', description: 'Organic certification for select species production lines', penalty_amount: 10000, category: 'food_safety', notes: 'Awaiting final inspection for organic tilapia line' },
      { regulation_name: 'State Aquaculture Operating License', authority: 'State Department of Agriculture', compliance_status: 'compliant', due_date: '2026-01-31', description: 'State-level license to operate commercial aquaculture facility', penalty_amount: 15000, category: 'licensing', notes: 'Renewed annually, in good standing' },
      { regulation_name: 'Environmental Impact Assessment', authority: 'State Environmental Agency', compliance_status: 'compliant', due_date: '2027-03-01', description: 'Five-year environmental impact assessment for facility operations', penalty_amount: 75000, category: 'environmental', notes: 'Assessment valid through 2027' },
      { regulation_name: 'OSHA Workplace Safety Standards', authority: 'Occupational Safety and Health Administration', compliance_status: 'compliant', due_date: '2025-08-15', description: 'Workplace safety compliance for aquaculture facility workers', penalty_amount: 30000, category: 'labor', notes: 'Last audit in January 2025, zero violations' },
      { regulation_name: 'Import Permit for Exotic Species', authority: 'US Fish and Wildlife Service', compliance_status: 'compliant', due_date: '2025-11-30', description: 'Lacey Act compliance for imported barramundi broodstock', penalty_amount: 100000, category: 'import_export', notes: 'CITES documentation on file' },
      { regulation_name: 'Water Rights Allocation Permit', authority: 'State Water Resources Board', compliance_status: 'compliant', due_date: '2026-06-30', description: 'Water withdrawal rights for freshwater pond operations', penalty_amount: 20000, category: 'environmental', notes: 'Allocated 2 million gallons per month' },
      { regulation_name: 'Veterinary Drug Use Authorization', authority: 'FDA Center for Veterinary Medicine', compliance_status: 'compliant', due_date: '2025-10-01', description: 'Authorization for use of approved aquaculture therapeutants', penalty_amount: 40000, category: 'food_safety', notes: 'Currently approved for formalin and oxytetracycline' },
      { regulation_name: 'Fish Transport Health Certificate', authority: 'State Veterinarian Office', compliance_status: 'expired', due_date: '2025-02-28', description: 'Health certification required for interstate fish transport', penalty_amount: 5000, category: 'licensing', notes: 'Renewal application submitted, awaiting processing' },
      { regulation_name: 'Effluent Nutrient Management Plan', authority: 'State Environmental Agency', compliance_status: 'compliant', due_date: '2025-12-31', description: 'Nutrient management plan for aquaculture effluent disposal', penalty_amount: 35000, category: 'environmental', notes: 'Phosphorus and nitrogen within permitted limits' },
      { regulation_name: 'Workers Compensation Insurance', authority: 'State Labor Department', compliance_status: 'compliant', due_date: '2026-03-31', description: 'Mandatory workers compensation coverage for all employees', penalty_amount: 20000, category: 'labor', notes: 'Policy with National Aquaculture Insurance Group' },
      { regulation_name: 'Hazardous Chemical Storage Permit', authority: 'State Fire Marshal', compliance_status: 'non_compliant', due_date: '2025-03-15', description: 'Permit for storage of chemicals used in water treatment', penalty_amount: 15000, category: 'environmental', notes: 'Secondary containment upgrade required by April' },
      { regulation_name: 'Food Processing Facility License', authority: 'State Health Department', compliance_status: 'compliant', due_date: '2025-12-31', description: 'License for on-site fish processing and packing operations', penalty_amount: 25000, category: 'food_safety', notes: 'HACCP plan current and verified' },
      { regulation_name: 'Export Health Certificate', authority: 'USDA APHIS', compliance_status: 'pending', due_date: '2025-07-01', description: 'Health certification for fish product export to EU markets', penalty_amount: 20000, category: 'import_export', notes: 'EU audit scheduled for May 2025' },
    ]);
    console.log('RegulatoryRecords seeded.');

    // ── FeedInventory (15) ─────────────────────────────────────────────
    await FeedInventory.bulkCreate([
      { feed_type: 'High-Protein Salmon Pellet 2mm', brand: 'Skretting', quantity_kg: 3500, unit_cost: 2.80, protein_content: 45, expiry_date: '2025-09-30', supplier: 'Skretting USA', notes: 'Main salmon grow-out feed' },
      { feed_type: 'Trout Grower Pellet 3mm', brand: 'BioMar', quantity_kg: 2200, unit_cost: 2.50, protein_content: 42, expiry_date: '2025-08-15', supplier: 'BioMar North America', notes: 'Standard trout ration' },
      { feed_type: 'Tilapia Floating Pellet 4mm', brand: 'Cargill', quantity_kg: 5000, unit_cost: 1.40, protein_content: 32, expiry_date: '2025-11-30', supplier: 'Cargill Aqua Nutrition', notes: 'Bulk tilapia feed, warehouse B' },
      { feed_type: 'Catfish Sinking Pellet 6mm', brand: 'Purina', quantity_kg: 4500, unit_cost: 1.10, protein_content: 28, expiry_date: '2025-10-15', supplier: 'Purina Mills', notes: 'Primary catfish feed' },
      { feed_type: 'Shrimp Starter Crumble', brand: 'Zeigler', quantity_kg: 800, unit_cost: 3.50, protein_content: 38, expiry_date: '2025-07-31', supplier: 'Zeigler Bros Inc', notes: 'PL stage shrimp feed' },
      { feed_type: 'Marine Fish Extruded 5mm', brand: 'EWOS', quantity_kg: 1800, unit_cost: 3.00, protein_content: 46, expiry_date: '2025-08-30', supplier: 'EWOS / Cargill', notes: 'Barramundi and cobia feed' },
      { feed_type: 'Bass Carnivore Pellet 3mm', brand: 'Skretting', quantity_kg: 1200, unit_cost: 3.20, protein_content: 48, expiry_date: '2025-09-15', supplier: 'Skretting USA', notes: 'High-protein bass formulation' },
      { feed_type: 'Salmonid Cold-Water Pellet 2mm', brand: 'BioMar', quantity_kg: 1500, unit_cost: 3.40, protein_content: 50, expiry_date: '2025-10-31', supplier: 'BioMar North America', notes: 'Arctic char and brook trout' },
      { feed_type: 'Perch Juvenile Crumble', brand: 'Rangen', quantity_kg: 600, unit_cost: 2.70, protein_content: 40, expiry_date: '2025-06-30', supplier: 'Rangen Inc', notes: 'Specialty perch feed' },
      { feed_type: 'Walleye Carnivore Pellet 2mm', brand: 'Rangen', quantity_kg: 400, unit_cost: 3.60, protein_content: 50, expiry_date: '2025-07-15', supplier: 'Rangen Inc', notes: 'Research trial feed' },
      { feed_type: 'Medicated Flake (Oxytetracycline)', brand: 'Aquatic Health', quantity_kg: 100, unit_cost: 8.50, protein_content: 40, expiry_date: '2025-05-31', supplier: 'Aquatic Health Solutions', notes: 'FDA-approved medicated feed, quarantine use only' },
      { feed_type: 'Red Drum Marine Pellet 4mm', brand: 'EWOS', quantity_kg: 1600, unit_cost: 2.60, protein_content: 40, expiry_date: '2025-09-30', supplier: 'EWOS / Cargill', notes: 'Coastal species formulation' },
      { feed_type: 'Cobia High-Energy Extruded 6mm', brand: 'Skretting', quantity_kg: 900, unit_cost: 3.80, protein_content: 52, expiry_date: '2025-08-31', supplier: 'Skretting USA', notes: 'Fast-growth marine species feed' },
      { feed_type: 'Fry Starter Powder', brand: 'Zeigler', quantity_kg: 200, unit_cost: 5.00, protein_content: 55, expiry_date: '2025-06-15', supplier: 'Zeigler Bros Inc', notes: 'Hatchery fry feed, 100-500 micron' },
      { feed_type: 'Striped Bass Pellet 3mm', brand: 'BioMar', quantity_kg: 1100, unit_cost: 2.90, protein_content: 44, expiry_date: '2025-10-15', supplier: 'BioMar North America', notes: 'Hybrid striped bass formulation' },
    ]);
    console.log('FeedInventory seeded.');

    // ── Employee (15) ──────────────────────────────────────────────────
    await Employee.bulkCreate([
      { name: 'Robert Hensley', email: 'r.hensley@fisheries.com', phone: '555-201-1001', role: 'Farm Manager', department: 'Operations', hire_date: '2019-03-15', salary: 82000, status: 'active', notes: 'Overall farm operations management' },
      { name: 'Maria Gonzalez', email: 'm.gonzalez@fisheries.com', phone: '555-201-1002', role: 'Aquaculture Technician', department: 'Operations', hire_date: '2020-06-01', salary: 48000, status: 'active', notes: 'Specializes in salmonid husbandry' },
      { name: 'James Whitfield', email: 'j.whitfield@fisheries.com', phone: '555-201-1003', role: 'Water Quality Specialist', department: 'Quality Control', hire_date: '2020-09-10', salary: 55000, status: 'active', notes: 'Certified water quality analyst' },
      { name: 'Sarah Chen', email: 's.chen@fisheries.com', phone: '555-201-1004', role: 'Feed Specialist', department: 'Operations', hire_date: '2021-01-20', salary: 50000, status: 'active', notes: 'Feed formulation and inventory management' },
      { name: 'David Okafor', email: 'd.okafor@fisheries.com', phone: '555-201-1005', role: 'Harvest Coordinator', department: 'Operations', hire_date: '2021-04-15', salary: 52000, status: 'active', notes: 'Coordinates all harvest logistics' },
      { name: 'Emily Rodriguez', email: 'e.rodriguez@fisheries.com', phone: '555-201-1006', role: 'Lab Technician', department: 'Quality Control', hire_date: '2021-08-01', salary: 46000, status: 'active', notes: 'Disease diagnostics and water testing' },
      { name: 'Michael Torres', email: 'm.torres@fisheries.com', phone: '555-201-1007', role: 'Maintenance Engineer', department: 'Maintenance', hire_date: '2020-02-01', salary: 58000, status: 'active', notes: 'Equipment maintenance and repair' },
      { name: 'Amanda Phillips', email: 'a.phillips@fisheries.com', phone: '555-201-1008', role: 'Administrative Assistant', department: 'Administration', hire_date: '2022-01-10', salary: 38000, status: 'active', notes: 'Front office and recordkeeping' },
      { name: 'Kevin Nakamura', email: 'k.nakamura@fisheries.com', phone: '555-201-1009', role: 'Aquaculture Technician', department: 'Operations', hire_date: '2022-05-15', salary: 45000, status: 'active', notes: 'Warm-water species care, ponds D1 and D2' },
      { name: 'Patricia Dubois', email: 'p.dubois@fisheries.com', phone: '555-201-1010', role: 'Research Scientist', department: 'Research', hire_date: '2019-11-01', salary: 72000, status: 'active', notes: 'PhD in aquaculture genetics, leads R&D trials' },
      { name: 'Anthony Russo', email: 'a.russo@fisheries.com', phone: '555-201-1011', role: 'Maintenance Technician', department: 'Maintenance', hire_date: '2023-03-01', salary: 42000, status: 'active', notes: 'Electrical and plumbing systems' },
      { name: 'Linda Foster', email: 'l.foster@fisheries.com', phone: '555-201-1012', role: 'Compliance Officer', department: 'Administration', hire_date: '2020-10-15', salary: 65000, status: 'active', notes: 'Regulatory compliance and audits' },
      { name: 'Brian Johansson', email: 'b.johansson@fisheries.com', phone: '555-201-1013', role: 'Aquaculture Technician', department: 'Operations', hire_date: '2023-07-01', salary: 43000, status: 'on_leave', notes: 'Medical leave since February 2025' },
      { name: 'Rachel Kim', email: 'r.kim@fisheries.com', phone: '555-201-1014', role: 'Accounting Specialist', department: 'Administration', hire_date: '2021-11-01', salary: 52000, status: 'active', notes: 'Handles AP/AR and payroll' },
      { name: 'Thomas Grant', email: 't.grant@fisheries.com', phone: '555-201-1015', role: 'Aquaculture Technician', department: 'Operations', hire_date: '2022-09-01', salary: 44000, status: 'terminated', notes: 'Employment ended December 2024' },
    ]);
    console.log('Employees seeded.');

    // ── Equipment (15) ─────────────────────────────────────────────────
    await Equipment.bulkCreate([
      { name: 'Paddlewheel Aerator PW-200', type: 'aerator', purchase_date: '2021-05-10', condition: 'good', location: 'West Pond D1', maintenance_due: '2025-05-10', cost: 4500, serial_number: 'AER-2021-0045', notes: '2HP paddlewheel, runs 24/7' },
      { name: 'Submersible Water Pump SP-50', type: 'pump', purchase_date: '2022-01-15', condition: 'good', location: 'Pump House North', maintenance_due: '2025-07-15', cost: 3200, serial_number: 'PMP-2022-0112', notes: '50 GPM submersible pump' },
      { name: 'Automatic Feed Dispenser AF-100', type: 'feeder', purchase_date: '2023-03-20', condition: 'excellent', location: 'North Pond A1', maintenance_due: '2025-09-20', cost: 6800, serial_number: 'FDR-2023-0078', notes: 'Programmable 100kg hopper, solar powered' },
      { name: 'Harvest Seine Net 60m', type: 'net', purchase_date: '2020-08-01', condition: 'fair', location: 'Equipment Barn', maintenance_due: '2025-04-01', cost: 2800, serial_number: 'NET-2020-0033', notes: '60m x 3m, 25mm mesh, needs patching' },
      { name: 'YSI ProDSS Water Quality Meter', type: 'sensor', purchase_date: '2023-09-01', condition: 'excellent', location: 'Lab Building', maintenance_due: '2025-09-01', cost: 8500, serial_number: 'WQM-2023-0015', notes: 'Multi-parameter handheld meter' },
      { name: 'Hach LDO Dissolved Oxygen Sensor', type: 'sensor', purchase_date: '2022-06-15', condition: 'good', location: 'South Tank B1', maintenance_due: '2025-06-15', cost: 2200, serial_number: 'DOS-2022-0067', notes: 'Inline continuous DO monitoring' },
      { name: 'Hanna HI98190 pH Meter', type: 'sensor', purchase_date: '2023-02-10', condition: 'good', location: 'Lab Building', maintenance_due: '2025-08-10', cost: 1500, serial_number: 'PHM-2023-0042', notes: 'Professional grade pH/ORP meter' },
      { name: 'Aluminum Harvest Boat 14ft', type: 'vessel', purchase_date: '2019-04-20', condition: 'fair', location: 'Boat Dock', maintenance_due: '2025-04-20', cost: 12000, serial_number: 'VES-2019-0008', notes: '14ft flat-bottom with 25HP outboard' },
      { name: 'Toyota Forklift 5000lb', type: 'vehicle', purchase_date: '2020-11-05', condition: 'good', location: 'Warehouse A', maintenance_due: '2025-05-05', cost: 28000, serial_number: 'FLT-2020-0021', notes: 'Propane powered, 5000lb capacity' },
      { name: 'Generac 22kW Standby Generator', type: 'generator', purchase_date: '2021-09-15', condition: 'good', location: 'Power Building', maintenance_due: '2025-09-15', cost: 18000, serial_number: 'GEN-2021-0003', notes: 'Primary backup power, natural gas' },
      { name: 'Walk-in Refrigeration Unit', type: 'refrigeration', purchase_date: '2020-06-01', condition: 'good', location: 'Processing Building', maintenance_due: '2025-06-01', cost: 22000, serial_number: 'REF-2020-0011', notes: '10x12 walk-in cooler, 34F' },
      { name: 'Fish Sorting Table ST-8', type: 'processing', purchase_date: '2022-04-10', condition: 'good', location: 'Processing Building', maintenance_due: '2025-10-10', cost: 3500, serial_number: 'SRT-2022-0029', notes: 'Stainless steel, 8ft with water jets' },
      { name: 'Ohaus Defender 5000 Scale', type: 'scale', purchase_date: '2023-01-20', condition: 'excellent', location: 'Processing Building', maintenance_due: '2025-07-20', cost: 1800, serial_number: 'SCL-2023-0055', notes: '150kg capacity, IP67 rated' },
      { name: 'Emperor Aquatics UV Sterilizer', type: 'sterilizer', purchase_date: '2022-08-15', condition: 'good', location: 'Hatchery Building', maintenance_due: '2025-08-15', cost: 5500, serial_number: 'UVS-2022-0019', notes: '120W UV-C, 100 GPM flow rate' },
      { name: 'Caterpillar 50kW Backup Generator', type: 'generator', purchase_date: '2019-12-01', condition: 'fair', location: 'Coastal Facility', maintenance_due: '2025-06-01', cost: 35000, serial_number: 'GEN-2019-0001', notes: 'Diesel backup for coastal operations' },
    ]);
    console.log('Equipment seeded.');

    // ── DiseaseRecord (15) ─────────────────────────────────────────────
    await DiseaseRecord.bulkCreate([
      { species: 'Brook Trout', disease_name: 'Saprolegnia (Water Mold)', pond_id: 14, severity: 'high', symptoms: 'White cotton-like growths on skin and fins, lethargy, loss of appetite', treatment: 'Formalin bath 150 ppm for 1 hour, salt bath 3% for 30 minutes', diagnosis_date: '2025-02-15', status: 'active', notes: 'Quarantine tank, likely stress-induced post-transport' },
      { species: 'Channel Catfish', disease_name: 'Columnaris (Flexibacter)', pond_id: 7, severity: 'medium', symptoms: 'White-grey patches on skin, frayed fins, gill necrosis', treatment: 'Oxytetracycline medicated feed 2.5g/100lb/day for 10 days', diagnosis_date: '2025-01-20', status: 'treated', notes: 'Resolved after full antibiotic course' },
      { species: 'Atlantic Salmon', disease_name: 'Ichthyophthirius (Ich)', pond_id: 1, severity: 'low', symptoms: 'Small white spots on body and fins, flashing behavior', treatment: 'Formalin 25 ppm indefinite bath, raised temperature to 15C', diagnosis_date: '2024-11-05', status: 'resolved', notes: 'Early detection, minimal mortality' },
      { species: 'Tilapia (Nile)', disease_name: 'Aeromonas hydrophila', pond_id: 2, severity: 'medium', symptoms: 'Hemorrhagic septicemia, ulcers, abdominal swelling, reddened fins', treatment: 'Florfenicol medicated feed 10mg/kg/day for 10 days', diagnosis_date: '2025-02-01', status: 'monitoring', notes: 'Post-treatment monitoring for 2 weeks' },
      { species: 'Pacific White Shrimp', disease_name: 'Vibriosis (Vibrio parahaemolyticus)', pond_id: 9, severity: 'high', symptoms: 'Luminescent bacteria in hepatopancreas, lethargy, empty gut', treatment: 'Probiotics in feed, improved water exchange rate, biosecurity measures', diagnosis_date: '2024-12-10', status: 'treated', notes: 'Mortality contained below 15% through quick response' },
      { species: 'Rainbow Trout', disease_name: 'Enteric Redmouth (Yersinia ruckeri)', pond_id: 3, severity: 'low', symptoms: 'Reddening around mouth and throat, exophthalmia, darkened skin', treatment: 'Vaccination of remaining stock, oxytetracycline in feed', diagnosis_date: '2024-10-15', status: 'resolved', notes: 'Outbreak controlled, vaccination program implemented' },
      { species: 'Red Drum', disease_name: 'Cryptocaryon irritans (Marine Ich)', pond_id: 10, severity: 'medium', symptoms: 'White spots on body, rapid gill movement, rubbing against surfaces', treatment: 'Copper sulfate 0.15 ppm continuous bath, reduced stocking density', diagnosis_date: '2025-03-01', status: 'active', notes: 'Ongoing treatment in coastal tank' },
      { species: 'Largemouth Bass', disease_name: 'Largemouth Bass Virus (LMBV)', pond_id: 8, severity: 'low', symptoms: 'Buoyancy issues, surface swimming, distended swim bladder', treatment: 'No direct treatment; reduce stressors, improve water quality', diagnosis_date: '2024-08-20', status: 'monitoring', notes: 'Low-level presence, monitoring mortality rates' },
      { species: 'Atlantic Salmon', disease_name: 'Sea Lice (Lepeophtheirus salmonis)', pond_id: 1, severity: 'low', symptoms: 'External parasites on skin, localized lesions, reduced growth', treatment: 'Hydrogen peroxide bath 1500 ppm for 20 minutes', diagnosis_date: '2024-09-10', status: 'resolved', notes: 'Freshwater system, rare occurrence, traced to incoming stock' },
      { species: 'Barramundi', disease_name: 'Streptococcosis (Streptococcus iniae)', pond_id: 15, severity: 'medium', symptoms: 'Erratic swimming, exophthalmia, hemorrhages at fin bases', treatment: 'Amoxicillin medicated feed 80mg/kg/day for 10 days', diagnosis_date: '2025-01-05', status: 'treated', notes: 'Temperature spike likely precipitated outbreak' },
      { species: 'Cobia', disease_name: 'Photobacteriosis (Photobacterium damselae)', pond_id: 15, severity: 'high', symptoms: 'Skin ulcers, splenomegaly, high acute mortality', treatment: 'Florfenicol injection 10mg/kg, removal of affected individuals', diagnosis_date: '2024-07-15', status: 'resolved', notes: 'Lost 8% of stock, improved biosecurity protocols' },
      { species: 'Arctic Char', disease_name: 'Bacterial Kidney Disease (Renibacterium)', pond_id: 4, severity: 'low', symptoms: 'Kidney swelling, lethargy, minor skin lesions, reduced appetite', treatment: 'Erythromycin injection 10mg/kg, quarantine of affected fish', diagnosis_date: '2025-02-20', status: 'monitoring', notes: 'Chronic low-grade infection, carrier status suspected' },
      { species: 'Walleye', disease_name: 'Lymphocystis', pond_id: 13, severity: 'low', symptoms: 'Wart-like nodules on fins and skin', treatment: 'No treatment; self-limiting viral disease, improve husbandry', diagnosis_date: '2025-03-05', status: 'monitoring', notes: 'Cosmetic issue, does not affect mortality' },
      { species: 'Yellow Perch', disease_name: 'Heteropolaria (Epistylis)', pond_id: 8, severity: 'medium', symptoms: 'White tufts on skin, secondary bacterial infections, fin erosion', treatment: 'Formalin 25 ppm bath, improved water quality management', diagnosis_date: '2025-01-15', status: 'treated', notes: 'Linked to high organic load in pond D2' },
      { species: 'Blue Catfish', disease_name: 'Enteric Septicemia of Catfish (Edwardsiella)', pond_id: 7, severity: 'medium', symptoms: 'Petechial hemorrhages, ascites, pale gills, erratic swimming', treatment: 'Aquaflor medicated feed (florfenicol), water quality optimization', diagnosis_date: '2024-06-20', status: 'resolved', notes: 'Summer outbreak during high water temps' },
    ]);
    console.log('DiseaseRecords seeded.');

    // ── GrowthRecord (15) ──────────────────────────────────────────────
    await GrowthRecord.bulkCreate([
      { species: 'Atlantic Salmon', pond_id: 1, sample_date: '2025-03-01', avg_weight_g: 2800, avg_length_cm: 55, feed_conversion_ratio: 1.2, survival_rate: 97.5, notes: 'Nearing market size, excellent growth curve' },
      { species: 'Rainbow Trout', pond_id: 3, sample_date: '2025-03-01', avg_weight_g: 1500, avg_length_cm: 42, feed_conversion_ratio: 1.3, survival_rate: 98.0, notes: 'Consistent growth in recirculating system' },
      { species: 'Tilapia (Nile)', pond_id: 2, sample_date: '2025-03-01', avg_weight_g: 800, avg_length_cm: 30, feed_conversion_ratio: 1.5, survival_rate: 96.5, notes: 'Moderate growth, winter slowdown observed' },
      { species: 'Channel Catfish', pond_id: 7, sample_date: '2025-03-01', avg_weight_g: 1200, avg_length_cm: 38, feed_conversion_ratio: 1.8, survival_rate: 95.0, notes: 'FCR slightly elevated, adjusting feed ration' },
      { species: 'Largemouth Bass', pond_id: 8, sample_date: '2025-03-01', avg_weight_g: 1000, avg_length_cm: 35, feed_conversion_ratio: 1.6, survival_rate: 96.8, notes: 'Steady growth, training to pellet feed successful' },
      { species: 'Pacific White Shrimp', pond_id: 9, sample_date: '2025-03-01', avg_weight_g: 18, avg_length_cm: 12, feed_conversion_ratio: 1.4, survival_rate: 88.0, notes: 'Post-larvae 50 days, good size distribution' },
      { species: 'Blue Catfish', pond_id: 7, sample_date: '2025-03-01', avg_weight_g: 2100, avg_length_cm: 50, feed_conversion_ratio: 1.7, survival_rate: 95.5, notes: 'Larger individuals, approaching harvest weight' },
      { species: 'Striped Bass', pond_id: 10, sample_date: '2025-03-01', avg_weight_g: 1800, avg_length_cm: 45, feed_conversion_ratio: 1.4, survival_rate: 97.0, notes: 'Hybrid vigor apparent, strong performance' },
      { species: 'Red Drum', pond_id: 10, sample_date: '2025-03-01', avg_weight_g: 1300, avg_length_cm: 40, feed_conversion_ratio: 1.5, survival_rate: 96.0, notes: 'Good growth in brackish conditions' },
      { species: 'Arctic Char', pond_id: 4, sample_date: '2025-03-01', avg_weight_g: 900, avg_length_cm: 32, feed_conversion_ratio: 1.1, survival_rate: 98.5, notes: 'Excellent FCR in cold-water system' },
      { species: 'Barramundi', pond_id: 15, sample_date: '2025-03-01', avg_weight_g: 3200, avg_length_cm: 58, feed_conversion_ratio: 1.3, survival_rate: 97.2, notes: 'Market-ready, premium size class' },
      { species: 'Yellow Perch', pond_id: 8, sample_date: '2025-03-01', avg_weight_g: 300, avg_length_cm: 20, feed_conversion_ratio: 2.0, survival_rate: 93.0, notes: 'Slow winter growth, expected to accelerate in spring' },
      { species: 'Walleye', pond_id: 13, sample_date: '2025-03-01', avg_weight_g: 600, avg_length_cm: 28, feed_conversion_ratio: 1.8, survival_rate: 95.5, notes: 'Research cohort, pellet training ongoing' },
      { species: 'Cobia', pond_id: 15, sample_date: '2025-03-01', avg_weight_g: 4500, avg_length_cm: 60, feed_conversion_ratio: 1.2, survival_rate: 97.8, notes: 'Exceptional growth rate, above projections' },
      { species: 'Brook Trout', pond_id: 14, sample_date: '2025-03-01', avg_weight_g: 400, avg_length_cm: 22, feed_conversion_ratio: 2.5, survival_rate: 82.0, notes: 'Growth impacted by disease, high FCR from reduced feed intake' },
    ]);
    console.log('GrowthRecords seeded.');

    // ── FinancialRecord (15) ───────────────────────────────────────────
    await FinancialRecord.bulkCreate([
      { category: 'feed_purchase', type: 'expense', amount: 28500, description: 'Monthly bulk feed order from Skretting and BioMar', date: '2025-03-01', payment_method: 'bank_transfer', reference_number: 'PO-2025-0301', status: 'paid', notes: 'Net 30 terms, paid on time' },
      { category: 'fish_sales', type: 'income', amount: 45000, description: 'Barramundi harvest sale to Pacific Seafood Distributors', date: '2025-03-05', payment_method: 'bank_transfer', reference_number: 'INV-2025-0087', status: 'received', notes: '9800 kg at $4.59/kg wholesale (processed)' },
      { category: 'labor', type: 'expense', amount: 48000, description: 'Monthly payroll for all 13 active employees', date: '2025-03-15', payment_method: 'direct_deposit', reference_number: 'PAY-2025-0315', status: 'paid', notes: 'Includes benefits and taxes' },
      { category: 'equipment_maintenance', type: 'expense', amount: 3200, description: 'Quarterly maintenance on aerators, pumps, and generators', date: '2025-03-10', payment_method: 'credit_card', reference_number: 'MNT-2025-Q1', status: 'paid', notes: 'Performed by Torres and Russo' },
      { category: 'utilities', type: 'expense', amount: 8500, description: 'Electricity, water, and natural gas for all facilities', date: '2025-03-01', payment_method: 'auto_debit', reference_number: 'UTL-2025-0301', status: 'paid', notes: 'Higher than usual due to cold snap in February' },
      { category: 'fish_sales', type: 'income', amount: 12000, description: 'Rainbow trout sales to local restaurants and markets', date: '2025-02-20', payment_method: 'check', reference_number: 'INV-2025-0072', status: 'received', notes: 'Weekly restaurant deliveries' },
      { category: 'veterinary', type: 'expense', amount: 4800, description: 'Fish health consultation and disease diagnostics', date: '2025-02-25', payment_method: 'check', reference_number: 'VET-2025-0225', status: 'paid', notes: 'Dr. Patterson, quarterly health assessment' },
      { category: 'transport', type: 'expense', amount: 2200, description: 'Refrigerated truck rental for barramundi delivery', date: '2025-03-06', payment_method: 'credit_card', reference_number: 'TRN-2025-0306', status: 'paid', notes: 'Cold chain logistics to Portland distribution center' },
      { category: 'licensing', type: 'expense', amount: 1500, description: 'Annual state aquaculture operating license renewal', date: '2025-01-15', payment_method: 'check', reference_number: 'LIC-2025-0115', status: 'paid', notes: 'State Department of Agriculture' },
      { category: 'insurance', type: 'expense', amount: 6200, description: 'Quarterly premium for facility and livestock insurance', date: '2025-01-01', payment_method: 'bank_transfer', reference_number: 'INS-2025-Q1', status: 'paid', notes: 'National Aquaculture Insurance Group' },
      { category: 'fish_sales', type: 'income', amount: 32000, description: 'Channel catfish sales to Southern Fish Co-op', date: '2025-02-10', payment_method: 'bank_transfer', reference_number: 'INV-2025-0058', status: 'received', notes: 'Bulk wholesale, live hauler pickup' },
      { category: 'feed_purchase', type: 'expense', amount: 5600, description: 'Specialty feed order: medicated flake and shrimp crumble', date: '2025-02-15', payment_method: 'credit_card', reference_number: 'PO-2025-0215', status: 'paid', notes: 'Zeigler and Aquatic Health Solutions' },
      { category: 'marketing', type: 'expense', amount: 1800, description: 'Trade show booth at Aquaculture America 2025', date: '2025-02-01', payment_method: 'credit_card', reference_number: 'MKT-2025-0201', status: 'paid', notes: 'Annual industry conference attendance' },
      { category: 'fish_sales', type: 'income', amount: 18500, description: 'Tilapia fillet sales to regional grocery chain', date: '2025-03-12', payment_method: 'bank_transfer', reference_number: 'INV-2025-0091', status: 'pending', notes: 'Net 30 payment terms, invoice sent' },
      { category: 'equipment_maintenance', type: 'expense', amount: 8900, description: 'Replacement parts for coastal facility backup generator', date: '2025-03-08', payment_method: 'bank_transfer', reference_number: 'MNT-2025-0308', status: 'paid', notes: 'Caterpillar authorized service center' },
    ]);
    console.log('FinancialRecords seeded.');

    // ── Supplier (15) ──────────────────────────────────────────────────
    await Supplier.bulkCreate([
      { name: 'Skretting USA', contact_person: 'Laura Mitchell', email: 'l.mitchell@skretting.com', phone: '555-800-1001', address: '2401 Industrial Blvd, Tooele, UT 84074', product_types: 'fish feed, shrimp feed', rating: 4.8, payment_terms: 'Net 30', status: 'preferred', notes: 'Primary salmon and marine species feed supplier' },
      { name: 'BioMar North America', contact_person: 'Erik Svensson', email: 'e.svensson@biomar.com', phone: '555-800-1002', address: '1550 Braeburn Dr, Broomfield, CO 80020', product_types: 'fish feed, feed additives', rating: 4.7, payment_terms: 'Net 30', status: 'preferred', notes: 'Trout and striped bass feed, excellent technical support' },
      { name: 'Cargill Aqua Nutrition', contact_person: 'Mark Henderson', email: 'm.henderson@cargill.com', phone: '555-800-1003', address: '15407 McGinty Rd W, Wayzata, MN 55391', product_types: 'fish feed, bulk commodities', rating: 4.5, payment_terms: 'Net 45', status: 'active', notes: 'Tilapia and general warm-water feeds, competitive bulk pricing' },
      { name: 'Purina Mills (Land O Lakes)', contact_person: 'Jennifer Adams', email: 'j.adams@purinamills.com', phone: '555-800-1004', address: '100 Danforth Dr, Gray Summit, MO 63039', product_types: 'catfish feed, pond feed', rating: 4.3, payment_terms: 'Net 30', status: 'active', notes: 'Primary catfish feed supplier' },
      { name: 'Zeigler Bros Inc', contact_person: 'Daniel Zeigler', email: 'd.zeigler@zeiglerfeed.com', phone: '555-800-1005', address: '400 Gardners Station Rd, Gardners, PA 17324', product_types: 'specialty feed, shrimp feed, larval diet', rating: 4.6, payment_terms: 'Net 30', status: 'active', notes: 'Shrimp starter and fry diets' },
      { name: 'Rangen Inc', contact_person: 'Steve Collins', email: 's.collins@rangen.com', phone: '555-800-1006', address: '115 13th Ave S, Buhl, ID 83316', product_types: 'trout feed, perch feed, walleye feed', rating: 4.4, payment_terms: 'Net 30', status: 'active', notes: 'Specialty coolwater and coldwater species feeds' },
      { name: 'Aquatic Health Solutions', contact_person: 'Dr. Karen Whitley', email: 'k.whitley@aquatichealth.com', phone: '555-800-1007', address: '920 SE Oak St, Portland, OR 97214', product_types: 'medicated feed, therapeutants, diagnostics', rating: 4.9, payment_terms: 'COD', status: 'active', notes: 'FDA-approved medicated feed and disease diagnostics' },
      { name: 'Pentair Aquatic Eco-Systems', contact_person: 'Brian Kessler', email: 'b.kessler@pentair.com', phone: '555-800-1008', address: '2395 Apopka Blvd, Apopka, FL 32703', product_types: 'aeration equipment, pumps, tanks, filtration', rating: 4.6, payment_terms: 'Net 30', status: 'preferred', notes: 'Primary equipment supplier for recirculating systems' },
      { name: 'YSI Inc (Xylem)', contact_person: 'Rachel Stein', email: 'r.stein@ysi.com', phone: '555-800-1009', address: '1725 Brannum Ln, Yellow Springs, OH 45387', product_types: 'water quality instruments, sensors, probes', rating: 4.8, payment_terms: 'Net 30', status: 'active', notes: 'ProDSS meters and replacement probes' },
      { name: 'Hanna Instruments', contact_person: 'Marco Bianchi', email: 'm.bianchi@hannainst.com', phone: '555-800-1010', address: '584 Park East Dr, Woonsocket, RI 02895', product_types: 'pH meters, photometers, reagents', rating: 4.4, payment_terms: 'Net 30', status: 'active', notes: 'Lab testing equipment and reagent supplies' },
      { name: 'Emperor Aquatics Inc', contact_person: 'Thomas Park', email: 't.park@emperoraquatics.com', phone: '555-800-1011', address: '2229 Sanatoga Station Rd, Pottstown, PA 19464', product_types: 'UV sterilizers, ozone systems', rating: 4.5, payment_terms: 'Net 30', status: 'active', notes: 'UV sterilization for hatchery and RAS systems' },
      { name: 'Pacific Seafood Distributors', contact_person: 'Andrew Yamamoto', email: 'a.yamamoto@pacificseafood.com', phone: '555-800-1012', address: '3380 SE Powell Blvd, Portland, OR 97202', product_types: 'fish distribution, cold chain logistics', rating: 4.7, payment_terms: 'Net 15', status: 'preferred', notes: 'Primary buyer and distributor for harvested product' },
      { name: 'Southern Fish Cooperative', contact_person: 'Billy Ray Thompson', email: 'b.thompson@southernfishcoop.com', phone: '555-800-1013', address: '1100 Catfish Row, Belzoni, MS 39038', product_types: 'catfish purchasing, live hauling', rating: 4.2, payment_terms: 'Net 15', status: 'active', notes: 'Regional catfish buying co-op' },
      { name: 'Caterpillar Authorized Service', contact_person: 'Jim Delaney', email: 'j.delaney@catservice.com', phone: '555-800-1014', address: '500 Industrial Park Rd, Springfield, IL 62703', product_types: 'generator parts, diesel engines, service', rating: 4.3, payment_terms: 'Net 30', status: 'active', notes: 'Authorized service for CAT backup generators' },
      { name: 'National Aquaculture Insurance Group', contact_person: 'Patricia Olsen', email: 'p.olsen@naig.com', phone: '555-800-1015', address: '222 Fisheries Ln, Annapolis, MD 21401', product_types: 'aquaculture insurance, crop insurance, liability', rating: 4.6, payment_terms: 'Quarterly', status: 'active', notes: 'Facility insurance, livestock coverage, workers comp' },
    ]);
    console.log('Suppliers seeded.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
