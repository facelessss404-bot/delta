import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/authStateContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboardFull';
import CommanderDashboard from './pages/CommanderDashboardFull';
import CadetDashboard from './pages/CadetDashboardFull';
import NoticeBoard from './pages/NoticeBoard';
import Notes from './pages/Notes';
import Leaves from './pages/Leaves';
import Results from './pages/Results';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Reports from './pages/ReportsFull';
import AuditLogs from './pages/AuditLogs';
import AdminAccounts from './pages/AdminAccounts';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Attendance from './pages/Attendance';
import Academics from './pages/Academics';
import Subjects from './pages/Subjects';
import PhysicalTraining from './pages/PhysicalTraining';
import CadetProfile from './pages/CadetProfile';
import LegacyAttendance from './pages/LegacyAttendance';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'commander']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/commander" element={
            <ProtectedRoute allowedRoles={['commander']}>
              <CommanderDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/cadet" element={
            <ProtectedRoute allowedRoles={['cadet']}>
              <CadetDashboard />
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><Attendance /></ProtectedRoute>} />
          <Route path="/academics" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><Academics /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute allowedRoles={['admin', 'commander']}><Subjects /></ProtectedRoute>} />
          <Route path="/physical" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><PhysicalTraining /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['cadet']}><CadetProfile /></ProtectedRoute>} />
          <Route path="/legacy-attendance" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><LegacyAttendance /></ProtectedRoute>} />

          <Route path="/notices" element={
            <ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}>
              <NoticeBoard />
            </ProtectedRoute>
          } />
          <Route path="/notes" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><Notes /></ProtectedRoute>} />
          <Route path="/leaves" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><Leaves /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><Results /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'commander']}><Reports /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['admin', 'commander']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/admins" element={<ProtectedRoute allowedRoles={['commander']}><AdminAccounts /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['admin', 'commander', 'cadet']}><Notifications /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    );
}

export default App;
