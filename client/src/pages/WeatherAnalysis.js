import React, { useState } from 'react';
import api from '../services/api';
import AIResponseDisplay from '../components/AIResponseDisplay';

function WeatherAnalysis() {
  const [formData, setFormData] = useState({
    location: '',
    season: 'spring',
    species: '',
    pond_type: 'freshwater',
    current_conditions: ''
  });
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post('/weather/analyze', formData);
      setAiResponse(res.data.analysis || res.data.result || JSON.stringify(res.data));
    } catch (err) {
      setAiResponse('Failed to analyze weather impact. Please check your OpenRouter API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <div className="card-header">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>☁️ Weather Impact Analysis</h2>
          <span className="ai-badge">✨ AI Powered</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Southeast Florida Coast"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Season</label>
                <select
                  className="form-control"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                >
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                  <option value="winter">Winter</option>
                </select>
              </div>
              <div className="form-group">
                <label>Species</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Atlantic Salmon"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pond Type</label>
                <select
                  className="form-control"
                  value={formData.pond_type}
                  onChange={(e) => setFormData({ ...formData, pond_type: e.target.value })}
                >
                  <option value="freshwater">Freshwater</option>
                  <option value="brackish">Brackish</option>
                  <option value="saltwater">Saltwater</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Current Weather Conditions</label>
              <textarea
                className="form-control"
                placeholder="Describe current or expected weather conditions..."
                value={formData.current_conditions}
                onChange={(e) => setFormData({ ...formData, current_conditions: e.target.value })}
                rows={4}
                required
              />
            </div>
            <button type="submit" className="btn btn-ai btn-lg" disabled={loading}>
              {loading ? '⏳ Analyzing...' : '☁️ Analyze Weather Impact'}
            </button>
          </form>
        </div>
      </div>

      {(loading || aiResponse) && (
        <AIResponseDisplay
          response={aiResponse}
          loading={loading}
          title="Weather Impact Analysis"
          onClose={() => { setAiResponse(null); setLoading(false); }}
        />
      )}
    </div>
  );
}

export default WeatherAnalysis;
