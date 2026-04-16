import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Calendar } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('username', username);
      
      if (response.data.role === 'admin') navigate('/admin/dashboard');
      else if (response.data.role === 'manager') navigate('/manager/dashboard');
      else if (response.data.role === 'supervisor') navigate('/supervisor/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--background)', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '12px', display: 'inline-flex', marginBottom: '16px' }}>
            <Calendar size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>ShiftAI Login</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.875rem', marginTop: '8px' }}>Manage shifts with AI-powered efficiency</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px', textAlign: 'center', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '8px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-sub)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '44px' }}
                placeholder="Enter your username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                autoComplete="off"
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-sub)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoComplete="new-password"
              />
            </div>
          </div>


          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', height: '48px', justifyContent: 'center', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-sub)' }}>
          Powered by DeepMind AI Engine
        </p>
      </div>
    </div>
  );
}
