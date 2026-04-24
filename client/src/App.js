import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import FeaturePage from './components/FeaturePage';
import WeatherAnalysis from './pages/WeatherAnalysis';
import Layout from './components/Layout';
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const featureConfigs = {
  'fish-stocks': {
    title: 'Fish Stock Population Modeling',
    apiEndpoint: '/fish-stocks',
    icon: '🐟',
    aiEnabled: true,
    aiEndpoint: 'analyze',
    aiButtonLabel: 'AI Population Analysis',
    columns: [
      { key: 'species', label: 'Species' },
      { key: 'population_count', label: 'Population' },
      { key: 'avg_weight', label: 'Avg Weight (kg)' },
      { key: 'health_status', label: 'Health Status' },
      { key: 'mortality_rate', label: 'Mortality %' }
    ],
    formFields: [
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'population_count', label: 'Population Count', type: 'number' },
      { key: 'pond_id', label: 'Pond ID', type: 'number' },
      { key: 'avg_weight', label: 'Avg Weight (kg)', type: 'number', step: '0.01' },
      { key: 'health_status', label: 'Health Status', type: 'select', options: ['healthy', 'fair', 'poor', 'critical'] },
      { key: 'mortality_rate', label: 'Mortality Rate (%)', type: 'number', step: '0.1' },
      { key: 'stocking_date', label: 'Stocking Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'feed-records': {
    title: 'Feed Optimization',
    apiEndpoint: '/feed-records',
    icon: '🌾',
    aiEnabled: true,
    aiEndpoint: 'optimize',
    aiButtonLabel: 'AI Feed Optimization',
    columns: [
      { key: 'species', label: 'Species' },
      { key: 'feed_type', label: 'Feed Type' },
      { key: 'quantity_kg', label: 'Quantity (kg)' },
      { key: 'protein_content', label: 'Protein %' },
      { key: 'cost_per_kg', label: 'Cost/kg ($)' }
    ],
    formFields: [
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'feed_type', label: 'Feed Type', type: 'select', options: ['pellet', 'crumble', 'flake', 'extruded', 'sinking'] },
      { key: 'quantity_kg', label: 'Quantity (kg)', type: 'number', step: '0.1' },
      { key: 'feeding_time', label: 'Feeding Time', type: 'text' },
      { key: 'protein_content', label: 'Protein Content (%)', type: 'number', step: '0.1' },
      { key: 'cost_per_kg', label: 'Cost per kg ($)', type: 'number', step: '0.01' },
      { key: 'pond_id', label: 'Pond ID', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'water-quality': {
    title: 'Water Quality Monitoring',
    apiEndpoint: '/water-quality',
    icon: '💧',
    aiEnabled: true,
    aiEndpoint: 'analyze',
    aiButtonLabel: 'AI Quality Analysis',
    columns: [
      { key: 'pond_id', label: 'Pond ID' },
      { key: 'temperature', label: 'Temp (°C)' },
      { key: 'ph_level', label: 'pH' },
      { key: 'dissolved_oxygen', label: 'DO (mg/L)' },
      { key: 'status', label: 'Status' }
    ],
    formFields: [
      { key: 'pond_id', label: 'Pond ID', type: 'number' },
      { key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1' },
      { key: 'ph_level', label: 'pH Level', type: 'number', step: '0.01' },
      { key: 'dissolved_oxygen', label: 'Dissolved Oxygen (mg/L)', type: 'number', step: '0.1' },
      { key: 'ammonia', label: 'Ammonia (mg/L)', type: 'number', step: '0.01' },
      { key: 'nitrite', label: 'Nitrite (mg/L)', type: 'number', step: '0.01' },
      { key: 'nitrate', label: 'Nitrate (mg/L)', type: 'number', step: '0.1' },
      { key: 'turbidity', label: 'Turbidity (NTU)', type: 'number', step: '0.1' },
      { key: 'test_date', label: 'Test Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['good', 'warning', 'critical'] }
    ]
  },
  'harvest-plans': {
    title: 'Harvest Timing & Planning',
    apiEndpoint: '/harvest-plans',
    icon: '📅',
    aiEnabled: true,
    aiEndpoint: 'predict',
    aiButtonLabel: 'AI Harvest Prediction',
    columns: [
      { key: 'species', label: 'Species' },
      { key: 'pond_id', label: 'Pond ID' },
      { key: 'planned_date', label: 'Planned Date' },
      { key: 'estimated_weight_kg', label: 'Est. Weight (kg)' },
      { key: 'status', label: 'Status' }
    ],
    formFields: [
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'pond_id', label: 'Pond ID', type: 'number' },
      { key: 'planned_date', label: 'Planned Date', type: 'date' },
      { key: 'estimated_weight_kg', label: 'Estimated Weight (kg)', type: 'number', step: '0.1' },
      { key: 'actual_weight_kg', label: 'Actual Weight (kg)', type: 'number', step: '0.1' },
      { key: 'market_price', label: 'Market Price ($/kg)', type: 'number', step: '0.01' },
      { key: 'status', label: 'Status', type: 'select', options: ['planned', 'in_progress', 'completed', 'cancelled'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'regulatory': {
    title: 'Regulatory Compliance',
    apiEndpoint: '/regulatory',
    icon: '📋',
    aiEnabled: true,
    aiEndpoint: 'check',
    aiButtonLabel: 'AI Compliance Check',
    columns: [
      { key: 'regulation_name', label: 'Regulation' },
      { key: 'authority', label: 'Authority' },
      { key: 'compliance_status', label: 'Status' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'category', label: 'Category' }
    ],
    formFields: [
      { key: 'regulation_name', label: 'Regulation Name', type: 'text' },
      { key: 'authority', label: 'Authority', type: 'text' },
      { key: 'compliance_status', label: 'Compliance Status', type: 'select', options: ['compliant', 'non_compliant', 'pending', 'expired'] },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'penalty_amount', label: 'Penalty Amount ($)', type: 'number', step: '0.01' },
      { key: 'category', label: 'Category', type: 'select', options: ['environmental', 'food_safety', 'licensing', 'labor', 'import_export'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'species': {
    title: 'Species Management',
    apiEndpoint: '/species',
    icon: '🐠',
    aiEnabled: false,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'scientific_name', label: 'Scientific Name' },
      { key: 'optimal_temp_min', label: 'Min Temp (°C)' },
      { key: 'optimal_temp_max', label: 'Max Temp (°C)' },
      { key: 'market_value', label: 'Market Value ($)' }
    ],
    formFields: [
      { key: 'name', label: 'Common Name', type: 'text' },
      { key: 'scientific_name', label: 'Scientific Name', type: 'text' },
      { key: 'optimal_temp_min', label: 'Min Temperature (°C)', type: 'number', step: '0.1' },
      { key: 'optimal_temp_max', label: 'Max Temperature (°C)', type: 'number', step: '0.1' },
      { key: 'optimal_ph_min', label: 'Min pH', type: 'number', step: '0.1' },
      { key: 'optimal_ph_max', label: 'Max pH', type: 'number', step: '0.1' },
      { key: 'growth_rate', label: 'Growth Rate', type: 'text' },
      { key: 'market_value', label: 'Market Value ($/kg)', type: 'number', step: '0.01' },
      { key: 'feed_type', label: 'Feed Type', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'ponds': {
    title: 'Pond & Tank Management',
    apiEndpoint: '/ponds',
    icon: '🏊',
    aiEnabled: false,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'location', label: 'Location' },
      { key: 'area_sqm', label: 'Area (sqm)' },
      { key: 'water_type', label: 'Water Type' },
      { key: 'status', label: 'Status' }
    ],
    formFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'area_sqm', label: 'Area (sqm)', type: 'number', step: '0.1' },
      { key: 'depth_m', label: 'Depth (m)', type: 'number', step: '0.1' },
      { key: 'water_type', label: 'Water Type', type: 'select', options: ['freshwater', 'brackish', 'saltwater'] },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'current_stock', label: 'Current Stock', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'maintenance', 'drained'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'feed-inventory': {
    title: 'Feed Inventory',
    apiEndpoint: '/feed-inventory',
    icon: '📦',
    aiEnabled: false,
    columns: [
      { key: 'feed_type', label: 'Feed Type' },
      { key: 'brand', label: 'Brand' },
      { key: 'quantity_kg', label: 'Quantity (kg)' },
      { key: 'unit_cost', label: 'Unit Cost ($)' },
      { key: 'expiry_date', label: 'Expiry Date' }
    ],
    formFields: [
      { key: 'feed_type', label: 'Feed Type', type: 'text' },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'quantity_kg', label: 'Quantity (kg)', type: 'number', step: '0.1' },
      { key: 'unit_cost', label: 'Unit Cost ($)', type: 'number', step: '0.01' },
      { key: 'protein_content', label: 'Protein Content (%)', type: 'number', step: '0.1' },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { key: 'supplier', label: 'Supplier', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'employees': {
    title: 'Employee Management',
    apiEndpoint: '/employees',
    icon: '👥',
    aiEnabled: false,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status' },
      { key: 'email', label: 'Email' }
    ],
    formFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'department', label: 'Department', type: 'select', options: ['Operations', 'Quality Control', 'Administration', 'Maintenance', 'Research'] },
      { key: 'hire_date', label: 'Hire Date', type: 'date' },
      { key: 'salary', label: 'Salary ($)', type: 'number', step: '0.01' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'on_leave', 'terminated'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'equipment': {
    title: 'Equipment Tracking',
    apiEndpoint: '/equipment',
    icon: '🔧',
    aiEnabled: false,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'condition', label: 'Condition' },
      { key: 'location', label: 'Location' },
      { key: 'maintenance_due', label: 'Maintenance Due' }
    ],
    formFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['excellent', 'good', 'fair', 'poor'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'maintenance_due', label: 'Maintenance Due', type: 'date' },
      { key: 'cost', label: 'Cost ($)', type: 'number', step: '0.01' },
      { key: 'serial_number', label: 'Serial Number', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'diseases': {
    title: 'Disease Detection & Management',
    apiEndpoint: '/diseases',
    icon: '🦠',
    aiEnabled: true,
    aiEndpoint: 'diagnose',
    aiButtonLabel: 'AI Diagnosis',
    columns: [
      { key: 'species', label: 'Species' },
      { key: 'disease_name', label: 'Disease' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' },
      { key: 'diagnosis_date', label: 'Diagnosis Date' }
    ],
    formFields: [
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'disease_name', label: 'Disease Name', type: 'text' },
      { key: 'pond_id', label: 'Pond ID', type: 'number' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'moderate', 'high', 'critical'] },
      { key: 'symptoms', label: 'Symptoms', type: 'textarea' },
      { key: 'treatment', label: 'Treatment', type: 'textarea' },
      { key: 'diagnosis_date', label: 'Diagnosis Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'treated', 'monitoring', 'resolved'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'growth-records': {
    title: 'Growth Rate Analysis',
    apiEndpoint: '/growth-records',
    icon: '📊',
    aiEnabled: true,
    aiEndpoint: 'analyze',
    aiButtonLabel: 'AI Growth Analysis',
    columns: [
      { key: 'species', label: 'Species' },
      { key: 'pond_id', label: 'Pond ID' },
      { key: 'sample_date', label: 'Sample Date' },
      { key: 'avg_weight_g', label: 'Avg Weight (g)' },
      { key: 'feed_conversion_ratio', label: 'FCR' }
    ],
    formFields: [
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'pond_id', label: 'Pond ID', type: 'number' },
      { key: 'sample_date', label: 'Sample Date', type: 'date' },
      { key: 'avg_weight_g', label: 'Avg Weight (g)', type: 'number', step: '0.1' },
      { key: 'avg_length_cm', label: 'Avg Length (cm)', type: 'number', step: '0.1' },
      { key: 'feed_conversion_ratio', label: 'Feed Conversion Ratio', type: 'number', step: '0.01' },
      { key: 'survival_rate', label: 'Survival Rate (%)', type: 'number', step: '0.1' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'financial': {
    title: 'Financial Records',
    apiEndpoint: '/financial',
    icon: '💰',
    aiEnabled: false,
    columns: [
      { key: 'category', label: 'Category' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount ($)' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' }
    ],
    formFields: [
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: ['income', 'expense'] },
      { key: 'amount', label: 'Amount ($)', type: 'number', step: '0.01' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['bank_transfer', 'check', 'cash', 'credit_card'] },
      { key: 'reference_number', label: 'Reference Number', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['completed', 'pending', 'cancelled'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  'suppliers': {
    title: 'Supplier Management',
    apiEndpoint: '/suppliers',
    icon: '🏢',
    aiEnabled: false,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'contact_person', label: 'Contact' },
      { key: 'product_types', label: 'Products' },
      { key: 'rating', label: 'Rating' },
      { key: 'status', label: 'Status' }
    ],
    formFields: [
      { key: 'name', label: 'Company Name', type: 'text' },
      { key: 'contact_person', label: 'Contact Person', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'product_types', label: 'Product Types', type: 'text' },
      { key: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5 },
      { key: 'payment_terms', label: 'Payment Terms', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'preferred'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout><Dashboard configs={featureConfigs} /></Layout></PrivateRoute>} />
        {Object.entries(featureConfigs).map(([key, config]) => (
          <Route
            key={key}
            path={`/${key}`}
            element={
              <PrivateRoute>
                <Layout>
                  <FeaturePage config={config} />
                </Layout>
              </PrivateRoute>
            }
          />
        ))}
        <Route path="/weather" element={<PrivateRoute><Layout><WeatherAnalysis /></Layout></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
