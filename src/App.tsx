import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PropertyProvider } from './contexts/PropertyContext';
import { AuthProvider } from './contexts/AuthContext';
import { VerificationProvider } from './contexts/VerificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import BrowseListings from './pages/BrowseListings';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import Offline from './pages/Offline';
import ProtectedRoute from "./routes/ProtectedRoute";

// Lazy load heavy components
const Profile = lazy(() => import('./pages/Profile'));
const ListUnified = lazy(() => import('./pages/ListUnified'));
const BackendTest = lazy(() => import('./components/BackendTest'));
const PhoneVerification = lazy(() => import('./pages/PhoneVerification'));
const VerificationWizard = lazy(() => import('./pages/VerificationWizard'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const PaymentTestPanel = lazy(() => import('./pages/PaymentTestPanel'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Moderation = lazy(() => import('./pages/Moderation'));
const Favorites = lazy(() => import('./pages/Favorites'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

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
                  <Suspense fallback={<LoadingFallback />}>
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
                    <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                    <Route path="/admin/moderation" element={<Moderation />} />
                    <Route path="/legal/terms" element={<TermsOfService />} />
                    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                    <Route path="/error" element={<ServerError />} />
                    <Route path="/offline" element={<Offline />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </div>
                              <Footer />
              </div>
            </Router>
          </VerificationProvider>
        </PropertyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
