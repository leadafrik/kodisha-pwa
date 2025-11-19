import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PropertyProvider } from './contexts/PropertyContext';
import { AuthProvider } from './contexts/AuthContext';
import { VerificationProvider } from './contexts/VerificationContext'; // ✅ ADD THIS
import Home from './pages/Home';
import ListProperty from './pages/ListProperty';
import ListService from './pages/ListService';
import BrowseListings from './pages/BrowseListings';
import FindServices from './pages/FindServices';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import BackendTest from './components/BackendTest';

function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <VerificationProvider> {/* ✅ WRAP WITH VERIFICATION PROVIDER */}
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/list-service" element={<ListService />} />
                <Route path="/browse" element={<BrowseListings />} />
                <Route path="/find-services" element={<FindServices />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/backend-test" element={<BackendTest />} />
              </Routes>
            </div>
          </Router>
        </VerificationProvider> {/* ✅ CLOSE VERIFICATION PROVIDER */}
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App;