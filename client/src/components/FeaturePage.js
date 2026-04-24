import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import AIResponseDisplay from './AIResponseDisplay';
import Toast from './Toast';

function FeaturePage({ config }) {
  const { title, apiEndpoint, columns, formFields, aiEnabled, aiEndpoint, aiButtonLabel } = config;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(apiEndpoint);
      setItems(res.data);
    } catch (err) {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchItems();
    setAiResponse(null);
    setSelectedItem(null);
    setShowForm(false);
    setShowDetail(false);
    setCurrentPage(1);
    setSearch('');
  }, [fetchItems]);

  const filteredItems = items.filter(item =>
    Object.values(item).some(val =>
      String(val || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreate = () => {
    setEditMode(false);
    setFormData({});
    setShowForm(true);
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    setAiResponse(null);
  };

  const handleEdit = () => {
    setFormData({ ...selectedItem });
    setEditMode(true);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = () => {
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`${apiEndpoint}/${selectedItem.id}`);
      addToast('Record deleted successfully');
      setShowDelete(false);
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      addToast('Failed to delete record', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`${apiEndpoint}/${formData.id}`, formData);
        addToast('Record updated successfully');
      } else {
        await api.post(apiEndpoint, formData);
        addToast('Record created successfully');
      }
      setShowForm(false);
      setFormData({});
      fetchItems();
    } catch (err) {
      addToast(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleAI = async (item) => {
    setAiLoading(true);
    setSelectedItem(item);
    setAiResponse(null);
    try {
      const res = await api.post(`${apiEndpoint}/${item.id}/${aiEndpoint}`);
      setAiResponse(res.data.analysis || res.data.optimization || res.data.prediction || res.data.diagnosis || res.data.check || res.data.result || res.data);
    } catch (err) {
      addToast('AI analysis failed. Check your OpenRouter API key.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return '—';
    if (key.includes('date') || key === 'hire_date' || key === 'purchase_date' || key === 'expiry_date' || key === 'stocking_date' || key === 'diagnosis_date' || key === 'sample_date' || key === 'feeding_time' || key === 'test_date' || key === 'maintenance_due' || key === 'due_date' || key === 'planned_date') {
      return value ? new Date(value).toLocaleDateString() : '—';
    }
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  const getBadgeClass = (value) => {
    const v = String(value).toLowerCase().replace(/\s/g, '_');
    const badgeMap = ['good', 'healthy', 'active', 'compliant', 'completed', 'resolved', 'excellent', 'preferred',
      'warning', 'fair', 'pending', 'in_progress', 'moderate', 'monitoring', 'on_leave',
      'critical', 'poor', 'danger', 'non_compliant', 'expired', 'high', 'terminated',
      'inactive', 'cancelled', 'drained', 'low', 'treated', 'maintenance', 'planned',
      'income', 'expense'];
    if (badgeMap.includes(v)) return `badge badge-${v}`;
    return null;
  };

  const renderCellValue = (key, value) => {
    const badgeClass = getBadgeClass(value);
    if (badgeClass) return <span className={badgeClass}>{String(value).replace(/_/g, ' ')}</span>;
    return formatValue(key, value);
  };

  return (
    <div>
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder={`Search ${title}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        />
        <button className="btn btn-primary" onClick={handleCreate}>+ Add New</button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span className="loading-text">Loading...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No records found</h3>
          <p>Add your first record to get started.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {columns.map(col => <th key={col.key}>{col.label}</th>)}
                  {aiEnabled && <th>AI Action</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)}>
                    <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    {columns.map(col => (
                      <td key={col.key}>{renderCellValue(col.key, item[col.key])}</td>
                    ))}
                    {aiEnabled && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-ai btn-sm" onClick={() => handleAI(item)}>
                          ✨ {aiButtonLabel || 'Analyze'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] < p - 1 && <span style={{ color: '#94A3B8' }}>...</span>}
                    <button className={currentPage === p ? 'active' : ''} onClick={() => setCurrentPage(p)}>
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* AI Response */}
      {(aiLoading || aiResponse) && (
        <AIResponseDisplay
          response={aiResponse}
          loading={aiLoading}
          title={aiButtonLabel}
          onClose={() => { setAiResponse(null); setAiLoading(false); }}
        />
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-backdrop" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Details</h2>
              <button className="modal-close" onClick={() => setShowDetail(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {Object.entries(selectedItem)
                  .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className={`detail-item ${key === 'notes' || key === 'description' || key === 'symptoms' || key === 'treatment' || key === 'address' ? 'full-width' : ''}`}>
                      <div className="detail-label">{key.replace(/_/g, ' ')}</div>
                      <div className="detail-value">
                        {renderCellValue(key, value)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="modal-footer">
              {aiEnabled && (
                <button className="btn btn-ai btn-sm" onClick={() => { setShowDetail(false); handleAI(selectedItem); }}>
                  ✨ {aiButtonLabel}
                </button>
              )}
              <button className="btn btn-warning btn-sm" onClick={handleEdit}>✏️ Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Record' : 'Add New Record'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  {formFields.map(field => (
                    <div key={field.key} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`} style={field.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
                      <label>{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          className="form-control"
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          required
                        >
                          <option value="">Select...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          className="form-control"
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          rows={3}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="form-control"
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          step={field.step}
                          min={field.min}
                          max={field.max}
                          required={field.type !== 'textarea'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="modal-backdrop" onClick={() => setShowDelete(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-body">
              <div className="confirm-dialog">
                <div className="confirm-icon">⚠️</div>
                <h2 style={{ marginBottom: 8 }}>Confirm Delete</h2>
                <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                <div className="confirm-actions">
                  <button className="btn btn-outline" onClick={() => setShowDelete(false)}>Cancel</button>
                  <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturePage;
