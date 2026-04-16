import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  User as UserIcon, 
  Calendar, 
  LayoutDashboard, 
  Users as UsersIcon, 
  Clock, 
  LogOut, 
  Bell, 
  Search,
  Settings,
  ChevronRight,
  AlertCircle,
  Shield,
  Upload,
  ClipboardList
} from 'lucide-react';

const DashboardLayout = ({ title, children, role = "Employee" }) => {
  const username = localStorage.getItem('username') || 'User';
  const userRole = localStorage.getItem('role') || role.toLowerCase();
  const roleSlug = userRole.toLowerCase();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const allNavItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: `/${roleSlug}/dashboard`, roles: ['admin', 'manager', 'supervisor'] },
    { icon: <UsersIcon size={20} />, label: 'Employees', path: `/${roleSlug}/employees`, roles: ['admin', 'manager'] },
    { icon: <Calendar size={20} />, label: 'Shifts', path: `/${roleSlug}/shifts`, roles: ['admin', 'manager', 'supervisor'] },
    { icon: <ClipboardList size={20} />, label: 'Leaves', path: `/${roleSlug}/leaves`, roles: ['admin', 'manager', 'supervisor'] },
    { icon: <Upload size={20} />, label: 'Upload', path: `/${roleSlug}/upload`, roles: ['admin', 'manager'] },
    { icon: <Shield size={20} />, label: 'Users', path: `/${roleSlug}/users`, roles: ['admin'] },
    { icon: <Settings size={20} />, label: 'Settings', path: `/${roleSlug}/settings`, roles: ['admin', 'manager', 'supervisor'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole.toLowerCase()));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex' }}>
            <Calendar size={24} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>ShiftAI</span>
        </div>

        <nav className="nav-menu">
          {navItems.map((item, idx) => (
            <NavLink 
              key={idx} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Menu size={20} style={{ cursor: 'pointer', color: 'var(--text-sub)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-sub)' }} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="input-field" 
                style={{ paddingLeft: '40px', width: '240px', background: '#f8fafc' }} 
              />
            </div>
            
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} style={{ color: 'var(--text-sub)' }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid white' }}></div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 12px', borderRadius: '99px', border: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{username}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{role}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="content-body">
          {children}
        </section>
      </main>
    </div>
  );
};

export const ShiftDisplay = ({ schedule, onUpdate }) => {
  const [view, setView] = useState('Timeline'); // Timeline, Table
  const [editingSched, setEditingSched] = useState(null); // { shiftName, empId }
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekStart, setWeekStart] = useState(new Date().toISOString().split('T')[0]);
  const [weekSchedule, setWeekSchedule] = useState({});
  const [selectedShift, setSelectedShift] = useState('Morning');
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const canOverride = role === 'admin' || role === 'manager';

  const shiftColors = {
    'Morning': { bg: '#10b981', text: '#065f46', label: 'SHIFT 1 (6AM-2PM)' },
    'Afternoon': { bg: '#f59e0b', text: '#92400e', label: 'SHIFT 2 (2PM-10PM)' },
    'Night': { bg: '#3b82f6', text: '#1e40af', label: 'SHIFT 3 (10PM-6AM)' }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllEmployees(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWeekSchedule = async (startDate) => {
    const weekData = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      try {
        const res = await axios.get(`http://127.0.0.1:8000/get-schedule?date=${dateStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        weekData[dateStr] = res.data;
      } catch (e) {
        weekData[dateStr] = {};
      }
    }
    setWeekSchedule(weekData);
    setWeekStart(startDate);
  };

  useEffect(() => {
    fetchWeekSchedule(weekStart);
    fetchEmployees();
  }, [weekStart]);

  const handleManualUpdate = async (newEmpId) => {
    if (!editingSched) return;
    try {
      // Find shift_id for the shift name
      const shiftsRes = await axios.get('http://127.0.0.1:8000/shifts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const shift = shiftsRes.data.find(s => s.name === editingSched.shiftName);
      
      await axios.put('http://127.0.0.1:8000/update-schedule', {
        date: new Date().toISOString().split('T')[0],
        shift_id: shift.id,
        old_employee_id: editingSched.empId,
        new_employee_id: newEmpId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingSched(null);
      if (onUpdate) onUpdate();
      else window.location.reload(); 
    } catch (e) {
      alert("Failed to update schedule");
    }
  };

  const renderTimeline = (scheduleData) => {
    console.log('Schedule data:', scheduleData);
    console.log('Selected shift:', selectedShift);
    console.log('Available shifts:', Object.keys(scheduleData || {}));
    
    if (!scheduleData || Object.keys(scheduleData).length === 0) {
      return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-sub)' }}>No shifts assigned for this date.</div>;
    }

    const shift = scheduleData[selectedShift];
    if (!shift) {
      return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-sub)' }}>No {selectedShift} shift assigned.</div>;
    }

    const shiftColor = shiftColors[selectedShift];
    
    // Get all scheduled employees for this date
    const scheduledEmpIds = new Set();
    Object.keys(scheduleData).forEach(shiftName => {
      scheduleData[shiftName].employees.forEach(e => scheduledEmpIds.add(e.id));
    });
    
    // Find employees on weekly off (not scheduled)
    const weeklyOffEmployees = allEmployees.filter(emp => !scheduledEmpIds.has(emp.id));

    return (
      <div style={{ marginTop: '20px' }}>
        {/* Weekly Off Section */}
        {weeklyOffEmployees.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#92400e', marginBottom: '12px' }}>Weekly Off ({weeklyOffEmployees.length})</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {weeklyOffEmployees.map(emp => (
                <span key={emp.id} style={{ 
                  padding: '4px 12px', 
                  background: '#fffbeb', 
                  color: '#92400e', 
                  borderRadius: '99px', 
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid #fcd34d'
                }}>
                  {emp.name} ({emp.emp_id || emp.id})
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Scheduled Employees */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {shift.employees.map(e => (
            <div key={e.id} className="card" style={{ marginBottom: 0, padding: '16px', background: '#1e293b', border: '1px solid #334155' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginLeft: '8px' }}>{e.emp_id || e.id}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{e.name}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'lowercase' }}>{role || 'employee'}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: shiftColor.bg, fontWeight: 600 }}>
                  {selectedShift} ({shift.shift_details.start}-{shift.shift_details.end})
                </span>
              </div>
              {canOverride && (
                <button 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    background: '#8b5cf6', 
                    color: 'white', 
                    fontSize: '13px',
                    padding: '8px'
                  }}
                  onClick={() => { setEditingSched({ shiftName: selectedShift, empId: e.id }); fetchEmployees(); }}
                >
                  Assign Replacement
                </button>
              )}
              {editingSched?.empId === e.id && editingSched?.shiftName === selectedShift && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#334155', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', marginBottom: '8px', fontWeight: 600, color: '#f1f5f9' }}>Replace with:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {allEmployees.filter(emp => !shift.employees.some(se => se.id === emp.id)).map(emp => (
                      <button key={emp.id} className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#475569', color: '#f1f5f9' }} onClick={() => handleManualUpdate(emp.id)}>
                        {emp.name}
                      </button>
                    ))}
                    <button className="btn" style={{ fontSize: '12px', padding: '6px 12px', background: '#64748b', color: '#f1f5f9' }} onClick={() => setEditingSched(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTable = (scheduleData) => (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Shift Name</th>
            <th>Time Slot</th>
            <th>Team Members</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {scheduleData && Object.keys(scheduleData).length > 0 ? (
            Object.keys(scheduleData).map(name => (
              <tr key={name}>
                <td style={{ fontWeight: 600 }}>{name} Shift</td>
                <td style={{ color: 'var(--text-sub)' }}>{scheduleData[name].shift_details.start} - {scheduleData[name].shift_details.end}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {scheduleData[name].employees.map(e => (
                      <span key={e.id} className="badge badge-assigned" style={{ background: '#f1f5f9', color: '#475569' }}>{e.name}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className="badge badge-assigned">Active</span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-sub)' }}>No shifts assigned.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="card">
      <div className="card-title">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700 }}>AI Generated Schedule</span>
          <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>7-Day Schedule View</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="date" 
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="input-field"
            style={{ padding: '6px 10px', fontSize: '13px' }}
          />
          <div className="toggle-bar" style={{ marginBottom: 0 }}>
            <div className={`toggle-item ${view === 'Timeline' ? 'active' : ''}`} onClick={() => setView('Timeline')}>Timeline</div>
            <div className={`toggle-item ${view === 'Table' ? 'active' : ''}`} onClick={() => setView('Table')}>Table</div>
          </div>
        </div>
      </div>
      
      {/* Week Date Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
        {getWeekDates().map((date, idx) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: selectedDate === date ? 'var(--primary)' : '#f1f5f9',
              color: selectedDate === date ? 'white' : 'var(--text)',
              border: selectedDate === date ? 'none' : '1px solid var(--border)',
              whiteSpace: 'nowrap'
            }}
          >
            Day {idx + 1}
          </button>
        ))}
      </div>

      {/* Shift Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
        {Object.keys(weekSchedule[selectedDate] || {}).map(shiftName => (
          <button
            key={shiftName}
            onClick={() => setSelectedShift(shiftName)}
            className="btn"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              background: selectedShift === shiftName ? shiftColors[shiftName]?.bg || '#3b82f6' : '#f1f5f9',
              color: selectedShift === shiftName ? 'white' : 'var(--text)',
              border: selectedShift === shiftName ? 'none' : '1px solid var(--border)',
              whiteSpace: 'nowrap'
            }}
          >
            {shiftName}
          </button>
        ))}
      </div>
      
      {view === 'Timeline' ? renderTimeline(weekSchedule[selectedDate] || {}) : renderTable(weekSchedule[selectedDate] || {})}
      {canOverride && <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '12px' }}>* Tip: Click an employee name to manually reassign them.</p>}
    </div>
  );
};


export const AlertPanel = ({ title, message, type = "info" }) => (
  <div className="alert-panel">
    <AlertCircle size={20} style={{ color: type === 'danger' ? 'var(--danger)' : 'var(--primary)' }} />
    <div>
      <div className="alert-title">{title}</div>
      <div className="alert-message">{message}</div>
    </div>
  </div>
);

export default DashboardLayout;

