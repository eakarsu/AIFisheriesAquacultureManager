import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const featureDescriptions = {
  'fish-stocks': 'AI-powered population modeling, growth tracking, and sustainability analysis for fish stocks.',
  'feed-records': 'Optimize feeding schedules, protein content, and cost efficiency using AI recommendations.',
  'water-quality': 'Monitor water parameters in real-time with AI-driven quality assessment and alerts.',
  'harvest-plans': 'AI predictions for optimal harvest timing, yield estimation, and market price forecasting.',
  'regulatory': 'Automated compliance checking and risk assessment for fisheries regulations.',
  'species': 'Manage species profiles with optimal conditions, growth rates, and market values.',
  'ponds': 'Track pond and tank infrastructure, capacity, water types, and operational status.',
  'feed-inventory': 'Manage feed stock levels, brands, costs, and expiry tracking.',
  'employees': 'Employee records, roles, departments, and workforce management.',
  'equipment': 'Track equipment condition, maintenance schedules, and asset management.',
  'diseases': 'AI-powered disease diagnosis, treatment recommendations, and outbreak prevention.',
  'growth-records': 'Analyze growth rates, feed conversion ratios, and survival rates with AI insights.',
  'financial': 'Track income, expenses, payments, and financial reporting for farm operations.',
  'suppliers': 'Manage supplier relationships, ratings, product types, and payment terms.',
};

function Dashboard({ configs }) {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const endpoints = Object.entries(configs).map(([key, cfg]) => ({
          key,
          endpoint: cfg.apiEndpoint
        }));
        const results = await Promise.allSettled(
          endpoints.map(({ endpoint }) => api.get(endpoint))
        );
        const newCounts = {};
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            newCounts[endpoints[idx].key] = result.value.data.length;
          } else {
            newCounts[endpoints[idx].key] = 0;
          }
        });
        setCounts(newCounts);
      } catch (err) {
        console.error('Failed to fetch counts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, [configs]);

  const totalSpecies = counts['species'] || 0;
  const totalPonds = counts['ponds'] || 0;
  const totalEmployees = counts['employees'] || 0;
  const totalHarvests = counts['harvest-plans'] || 0;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🐠</div>
          <div className="stat-info">
            <h3>{totalSpecies}</h3>
            <p>Species Managed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🏊</div>
          <div className="stat-info">
            <h3>{totalPonds}</h3>
            <p>Active Ponds & Tanks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">👥</div>
          <div className="stat-info">
            <h3>{totalEmployees}</h3>
            <p>Team Members</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📅</div>
          <div className="stat-info">
            <h3>{totalHarvests}</h3>
            <p>Harvest Plans</p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#1E293B' }}>
        Feature Modules
      </h2>

      <div className="features-grid">
        {Object.entries(configs).map(([key, cfg]) => (
          <div key={key} className="feature-card" onClick={() => navigate(`/${key}`)}>
            <div className="card-icon">{cfg.icon}</div>
            <h3>{cfg.title}</h3>
            <p>{featureDescriptions[key]}</p>
            <div className="card-footer">
              <span className="item-count">
                {loading ? '...' : `${counts[key] || 0} records`}
              </span>
              {cfg.aiEnabled && <span className="ai-badge">✨ AI Powered</span>}
            </div>
          </div>
        ))}
        {/* Weather card - not in configs */}
        <div className="feature-card" onClick={() => navigate('/weather')}>
          <div className="card-icon">☁️</div>
          <h3>Weather Impact Analysis</h3>
          <p>AI analysis of weather patterns and their impact on aquaculture operations and fish health.</p>
          <div className="card-footer">
            <span className="item-count">AI Analysis</span>
            <span className="ai-badge">✨ AI Powered</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
