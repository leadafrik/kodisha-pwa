import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PropertyProvider } from './contexts/PropertyContext';
import { AuthProvider } from './contexts/AuthContext';
import { VerificationProvider } from './contexts/VerificationContext';
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
import ListAgrovet from './pages/ListAgrovet';
import PhoneVerification from './pages/PhoneVerification';
import VerificationWizard from './pages/VerificationWizard';
import ListingDetails from './pages/ListingDetails';

function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <VerificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              <div className="flex-1 py-4">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/list-property" element={<ListProperty />} />
                  <Route path="/list-service" element={<ListService />} />
                  <Route path="/list-agrovet" element={<ListAgrovet />} />
                  <Route path="/browse" element={<BrowseListings />} />
                  <Route path="/find-services" element={<FindServices />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/backend-test" element={<BackendTest />} />
                  <Route path="/verify-phone" element={<PhoneVerification />} />
                  <Route path="/verify" element={<VerificationWizard />} />
                  <Route path="/listings/:id" element={<ListingDetails />} />
                </Routes>
              </div>
            </div>
          </Router>
        </VerificationProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App;
