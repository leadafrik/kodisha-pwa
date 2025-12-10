import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PropertyProvider } from './contexts/PropertyContext';
import { AuthProvider } from './contexts/AuthContext';
import { VerificationProvider } from './contexts/VerificationContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import BrowseListings from './pages/BrowseListings';
import Login from './pages/Login';
import AboutUs from './pages/AboutUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import Offline from './pages/Offline';
import ProtectedRoute from "./routes/ProtectedRoute";

// Lazy load heavy components
const Profile = lazy(() => import('./pages/Profile'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const BackendTest = lazy(() => import('./components/BackendTest'));
const PhoneVerification = lazy(() => import('./pages/PhoneVerification'));
const VerificationWizard = lazy(() => import('./pages/VerificationWizard'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const PaymentTestPanel = lazy(() => import('./pages/PaymentTestPanel'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Moderation = lazy(() => import('./pages/Moderation'));
const AdminListingsApproval = lazy(() => import('./pages/AdminListingsApproval'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Messages = lazy(() => import('./pages/Messages'));
const AdminProfileVerification = lazy(() => import('./pages/admin/ProfileVerification'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminReportsManagement = lazy(() => import('./pages/admin/ReportsManagement'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const PostBuyRequest = lazy(() => import('./pages/PostBuyRequest'));
const BrowseBuyerRequestsPage = lazy(() => import('./pages/BrowseBuyerRequestsPage'));
const BuyerRequestDetails = lazy(() => import('./pages/BuyerRequestDetails'));
const IDVerificationUpload = lazy(() => import('./pages/IDVerificationUpload'));
const AdminIDVerification = lazy(() => import('./pages/AdminIDVerification'));

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
        <NotificationsProvider>
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
                      path="/create-listing"
                      element={
                        <ProtectedRoute>
                          <CreateListing />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/browse" element={<BrowseListings />} />
                    <Route path="/find-services" element={<BrowseListings />} />
                    <Route path="/request" element={<BrowseBuyerRequestsPage />} />
                    <Route 
                      path="/request/:id" 
                      element={
                        <ProtectedRoute>
                          <BuyerRequestDetails />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/request/new" 
                      element={
                        <ProtectedRoute>
                          <PostBuyRequest />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/about" element={<AboutUs />} />
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
                    <Route 
                      path="/verify-id" 
                      element={
                        <ProtectedRoute>
                          <IDVerificationUpload />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/listings/:id" element={<ProtectedRoute><ListingDetails /></ProtectedRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/listings-approval" element={<ProtectedRoute><AdminListingsApproval /></ProtectedRoute>} />
                    <Route path="/admin/id-verification" element={<ProtectedRoute><AdminIDVerification /></ProtectedRoute>} />
                    <Route path="/admin/moderation" element={<Moderation />} />
                    <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
                    <Route path="/admin/profile-verification" element={<ProtectedRoute><AdminProfileVerification /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
                    <Route path="/admin/reports-management" element={<ProtectedRoute><AdminReportsManagement /></ProtectedRoute>} />
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
        </NotificationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
