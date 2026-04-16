import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainDashboard from './pages/MainDashboard';
import Shifts from './pages/Shifts';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Settings from './pages/Settings';
import Upload from './pages/Upload';
import Users from './pages/Users';

const PrivateRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to={`/login`} />;
  }

  if (roleRequired && role !== roleRequired) {
    const dashboardPath = `/${role}/dashboard`;
    return <Navigate to={dashboardPath} />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute roleRequired="admin"><MainDashboard /></PrivateRoute>} />
        <Route path="/admin/shifts" element={<PrivateRoute roleRequired="admin"><Shifts /></PrivateRoute>} />
        <Route path="/admin/employees" element={<PrivateRoute roleRequired="admin"><Employees /></PrivateRoute>} />
        <Route path="/admin/leaves" element={<PrivateRoute roleRequired="admin"><Leaves /></PrivateRoute>} />
        <Route path="/admin/upload" element={<PrivateRoute roleRequired="admin"><Upload /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute roleRequired="admin"><Users /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute roleRequired="admin"><Settings /></PrivateRoute>} />
        
        {/* Manager Routes */}
        <Route path="/manager/dashboard" element={<PrivateRoute roleRequired="manager"><MainDashboard /></PrivateRoute>} />
        <Route path="/manager/shifts" element={<PrivateRoute roleRequired="manager"><Shifts /></PrivateRoute>} />
        <Route path="/manager/employees" element={<PrivateRoute roleRequired="manager"><Employees /></PrivateRoute>} />
        <Route path="/manager/leaves" element={<PrivateRoute roleRequired="manager"><Leaves /></PrivateRoute>} />
        <Route path="/manager/upload" element={<PrivateRoute roleRequired="manager"><Upload /></PrivateRoute>} />
        <Route path="/manager/settings" element={<PrivateRoute roleRequired="manager"><Settings /></PrivateRoute>} />

        {/* Supervisor Routes */}
        <Route path="/supervisor/dashboard" element={<PrivateRoute roleRequired="supervisor"><MainDashboard /></PrivateRoute>} />
        <Route path="/supervisor/shifts" element={<PrivateRoute roleRequired="supervisor"><Shifts /></PrivateRoute>} />
        <Route path="/supervisor/leaves" element={<PrivateRoute roleRequired="supervisor"><Leaves /></PrivateRoute>} />
        <Route path="/supervisor/settings" element={<PrivateRoute roleRequired="supervisor"><Settings /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;

