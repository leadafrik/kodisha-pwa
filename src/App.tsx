import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PropertyProvider } from './contexts/PropertyContext';
import { AuthProvider } from './contexts/AuthContext';
import { VerificationProvider } from './contexts/VerificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import BrowseListings from './pages/BrowseListings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import ListUnified from './pages/ListUnified';
import BackendTest from './components/BackendTest';
import PhoneVerification from './pages/PhoneVerification';
import VerificationWizard from './pages/VerificationWizard';
import ListingDetails from './pages/ListingDetails';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import Offline from './pages/Offline';
import PaymentTestPanel from './pages/PaymentTestPanel';
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PropertyProvider>
          <VerificationProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 py-4">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                      path="/list"
                      element={
                        <ProtectedRoute>
                          <ListUnified />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/list-property"
                      element={
                        <ProtectedRoute>
                          <ListUnified initialCategory="land" initialLandType="rental" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/list-service"
                      element={
                        <ProtectedRoute>
                          <ListUnified
                            initialCategory="service"
                            initialServiceType="equipment"
                          />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/list-agrovet"
                      element={
                        <ProtectedRoute>
                          <ListUnified initialCategory="agrovet" />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/browse" element={<BrowseListings />} />
                    <Route path="/find-services" element={<BrowseListings />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/backend-test" element={<BackendTest />} />
                    <Route 
                      path="/payment-test" 
                      element={
                        <ProtectedRoute>
                          <PaymentTestPanel />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/verify-phone" element={<PhoneVerification />} />
                    <Route path="/verify" element={<VerificationWizard />} />
                    <Route path="/listings/:id" element={<ListingDetails />} />
                    <Route path="/error" element={<ServerError />} />
                    <Route path="/offline" element={<Offline />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </Router>
          </VerificationProvider>
        </PropertyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
