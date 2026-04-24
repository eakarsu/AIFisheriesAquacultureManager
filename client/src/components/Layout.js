import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const aiFeatures = [
  { path: '/fish-stocks', icon: '🐟', label: 'Fish Stock Modeling' },
  { path: '/feed-records', icon: '🌾', label: 'Feed Optimization' },
  { path: '/water-quality', icon: '💧', label: 'Water Quality' },
  { path: '/harvest-plans', icon: '📅', label: 'Harvest Timing' },
  { path: '/regulatory', icon: '📋', label: 'Regulatory Compliance' },
  { path: '/diseases', icon: '🦠', label: 'Disease Detection' },
  { path: '/growth-records', icon: '📊', label: 'Growth Analysis' },
  { path: '/weather', icon: '☁️', label: 'Weather Analysis' },
];

const mgmtFeatures = [
  { path: '/species', icon: '🐠', label: 'Species' },
  { path: '/ponds', icon: '🏊', label: 'Ponds & Tanks' },
  { path: '/feed-inventory', icon: '📦', label: 'Feed Inventory' },
  { path: '/employees', icon: '👥', label: 'Employees' },
  { path: '/equipment', icon: '🔧', label: 'Equipment' },
  { path: '/financial', icon: '💰', label: 'Financial' },
  { path: '/suppliers', icon: '🏢', label: 'Suppliers' },
];

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h1>🐟 Fisheries AI</h1>
          <div className="subtitle">Aquaculture Management</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">AI-Powered Features</div>
          {aiFeatures.map((f) => (
            <div
              key={f.path}
              className={`sidebar-link ${location.pathname === f.path ? 'active' : ''}`}
              onClick={() => navigate(f.path)}
            >
              <span className="link-icon">{f.icon}</span>
              <span>{f.label}</span>
              <span className="ai-dot"></span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Management</div>
          {mgmtFeatures.map((f) => (
            <div
              key={f.path}
              className={`sidebar-link ${location.pathname === f.path ? 'active' : ''}`}
              onClick={() => navigate(f.path)}
            >
              <span className="link-icon">{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="main-area">
        <header className="top-header">
          <div className="page-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            AI Fisheries & Aquaculture Manager
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">{(user.name || 'U')[0]}</div>
              <span>{user.name || 'User'}</span>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
