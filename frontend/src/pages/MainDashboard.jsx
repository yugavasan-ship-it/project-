import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardLayout, { ShiftDisplay } from '../components/DashboardLayout';
import DashboardCharts from '../components/DashboardCharts';

const API_URL = 'http://127.0.0.1:8000';

export default function MainDashboard() {
  const [schedule, setSchedule] = useState(null);
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'User';
  const today = new Date().toISOString().split('T')[0];

  const fetchSchedule = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return navigate('/login');
    try {
      const res = await axios.get(`${API_URL}/get-schedule?date=${today}`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setSchedule(res.data);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) navigate('/login');
    }
  };

  const fetchSummary = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API_URL}/dashboard-summary`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchSummary();
    
    // Requirements: Dashboard must update without manual refresh
    const interval = setInterval(() => {
        fetchSchedule();
        fetchSummary();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout title={`${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`} role={role.charAt(0).toUpperCase() + role.slice(1)}>
      <DashboardCharts summary={summary} role={role} />
      <div style={{ marginTop: '24px' }}>
        <ShiftDisplay schedule={schedule} onUpdate={fetchSchedule} />
      </div>
    </DashboardLayout>
  );
}
