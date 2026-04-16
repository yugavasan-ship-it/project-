import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout, { AlertPanel } from '../components/DashboardLayout';
import { Users, UserPlus, Edit2, Trash2, Save, X } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ emp_id: '', name: '', skills: '', preferred_shift: 'Morning', max_hours: 40 });
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'User';
  const canEdit = role === 'admin' || role === 'manager';

  const getToken = () => {
    const t = localStorage.getItem('token');
    if (!t) { navigate('/login'); return null; }
    return t;
  };

  const fetchEmployees = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      const dataToSend = { ...formData, skills: formData.skills.split(',').map(s => s.trim()) };
      const res = await axios.post(`${API_URL}/employees`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.msg);
      setIsAdding(false);
      setFormData({ emp_id: '', name: '', skills: '', preferred_shift: 'Morning', max_hours: 40 });
      fetchEmployees();
    } catch (error) {
      setMsg('Error adding employee');
      if (error.response?.status === 401) navigate('/login');
    }
  };

  const handleUpdate = async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      const emp = employees.find(e => e.id === id);
      const dataToSend = {
        emp_id: emp.emp_id,
        name: emp.name,
        skills: Array.isArray(emp.skills) ? emp.skills : emp.skills.split(',').map(s => s.trim()),
        preferred_shift: emp.preferred_shift,
        max_hours: emp.max_hours
      };
      const res = await axios.put(`${API_URL}/employees/${id}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.msg);
      setEditingId(null);
      fetchEmployees();
    } catch (error) {
      setMsg('Error updating employee');
      if (error.response?.status === 401) navigate('/login');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will trigger an AI schedule re-calculation.")) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.delete(`${API_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.msg);
      fetchEmployees();
    } catch (error) {
      setMsg('Error deleting employee');
      if (error.response?.status === 401) navigate('/login');
    }
  };

  const handleChange = (id, field, value) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, [field]: value } : emp));
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(query) ||
      emp.emp_id?.toLowerCase().includes(query) ||
      (Array.isArray(emp.skills) ? emp.skills.join(' ').toLowerCase().includes(query) : emp.skills?.toLowerCase().includes(query))
    );
  });

  return (
    <DashboardLayout title={canEdit ? "Employee Management" : "Team Directory"} role={role.charAt(0).toUpperCase() + role.slice(1)}>
      {msg && <AlertPanel title="System Update" message={msg} type={msg.includes('Error') ? 'danger' : 'success'} />}

      <div className="card">
        <div className="card-title">
          <span>{canEdit ? "Manage Employees" : "Team Members"}</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Search employees..." 
              className="input-field" 
              style={{ width: '200px', padding: '6px 12px', fontSize: '13px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {canEdit && !isAdding && (
              <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                <UserPlus size={16} /> Add Employee
              </button>
            )}
            <Users size={18} color="var(--primary)" />
          </div>
        </div>

        {isAdding && (
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '16px' }}>Add New Employee</h4>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <input className="input-field" placeholder="Employee ID (e.g. EMP001)" value={formData.emp_id} onChange={e => setFormData({ ...formData, emp_id: e.target.value })} required />
              <input className="input-field" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              <input className="input-field" placeholder="Skills (comma separated)" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
              <select className="input-field" value={formData.preferred_shift} onChange={e => setFormData({ ...formData, preferred_shift: e.target.value })}>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
              <input type="number" className="input-field" placeholder="Max Hours/Week" value={formData.max_hours} onChange={e => setFormData({ ...formData, max_hours: e.target.value })} required />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn" onClick={() => setIsAdding(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-sub)', padding: '20px', textAlign: 'center' }}>Loading employees...</p>
        ) : employees.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No employees found. Upload an Excel file or add employees manually.</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No employees match your search.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Skills</th>
                  <th>Preferred Shift</th>
                  <th>Max Hours</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      {editingId === emp.id
                        ? <input className="input-field" value={emp.emp_id || ''} onChange={e => handleChange(emp.id, 'emp_id', e.target.value)} />
                        : <span style={{ fontSize: '13px', color: 'var(--text-sub)', fontFamily: 'monospace' }}>{emp.emp_id || '—'}</span>
                      }
                    </td>
                    <td>
                      {editingId === emp.id
                        ? <input className="input-field" value={emp.name} onChange={e => handleChange(emp.id, 'name', e.target.value)} />
                        : <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      }
                    </td>
                    <td>
                      {editingId === emp.id
                        ? <input className="input-field" value={Array.isArray(emp.skills) ? emp.skills.join(', ') : emp.skills} onChange={e => handleChange(emp.id, 'skills', e.target.value)} />
                        : (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(Array.isArray(emp.skills) ? emp.skills : []).map(s => (
                              <span key={s} className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{s}</span>
                            ))}
                          </div>
                        )
                      }
                    </td>
                    <td>
                      {editingId === emp.id
                        ? (
                          <select className="input-field" value={emp.preferred_shift} onChange={e => handleChange(emp.id, 'preferred_shift', e.target.value)}>
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                            <option value="Night">Night</option>
                          </select>
                        )
                        : emp.preferred_shift
                      }
                    </td>
                    <td>
                      {editingId === emp.id
                        ? <input type="number" className="input-field" value={emp.max_hours} onChange={e => handleChange(emp.id, 'max_hours', e.target.value)} />
                        : `${emp.max_hours}h`
                      }
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {editingId === emp.id ? (
                            <>
                              <button onClick={() => handleUpdate(emp.id)} className="btn btn-primary" style={{ padding: '6px' }}><Save size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="btn" style={{ padding: '6px' }}><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setEditingId(emp.id)} className="btn" style={{ padding: '6px', background: '#e0f2fe', color: '#0369a1' }}><Edit2 size={14} /></button>
                              <button onClick={() => handleDelete(emp.id)} className="btn" style={{ padding: '6px', background: '#fee2e2', color: '#dc2626' }}><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
