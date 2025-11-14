import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PropertyProvider } from './contexts/PropertyContext';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import ListProperty from './pages/ListProperty';
import ListService from './pages/ListService';
import BrowseListings from './pages/BrowseListings';
import FindServices from './pages/FindServices';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import BackendTest from './components/BackendTest'; // ADD THIS LINE

function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
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
            </Routes>
          </div>
        </Router>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App;