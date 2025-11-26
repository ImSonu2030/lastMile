import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/AuthContext';
import Register from './pages/Register';
// import Login from './pages/Login'; 
// import DriverDashboard from './pages/DriverDashboard';
// import RiderDashboard from './pages/RiderDashboard';

// Helper component for protecting routes
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />; // Redirect if wrong role
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/driver" element={
            <ProtectedRoute allowedRole="driver">
              <DriverDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/rider" element={
            <ProtectedRoute allowedRole="rider">
              <RiderDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}