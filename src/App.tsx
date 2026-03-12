import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { PropertyProvider } from './contexts/PropertyContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VerificationProvider } from './contexts/VerificationContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import BrowseListings from './pages/BrowseListings';
import Login from './pages/Login';
import AboutUs from './pages/AboutUs';
import B2B from './pages/B2B';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import CookieConsentBanner from './components/CookieConsentBanner';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import Offline from './pages/Offline';
import ProtectedRoute from "./routes/ProtectedRoute";
import { trackTrafficClick, trackTrafficPageView } from './utils/trafficAnalytics';

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
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminUserProfile = lazy(() => import('./pages/admin/UserProfile'));
const AdminReportsManagement = lazy(() => import('./pages/admin/ReportsManagement'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ListingManagement = lazy(() => import('./pages/admin/ListingManagement'));
const AnalyticsReports = lazy(() => import('./pages/admin/AnalyticsReports'));
const PostBuyRequest = lazy(() => import('./pages/PostBuyRequest'));
const BrowseBuyerRequestsPage = lazy(() => import('./pages/BrowseBuyerRequestsPage'));
const BuyerRequestDetails = lazy(() => import('./pages/BuyerRequestDetails'));
const IDVerificationUpload = lazy(() => import('./pages/IDVerificationUpload'));
const AdminIDVerification = lazy(() => import('./pages/AdminIDVerification'));
const AdminContentEditor = lazy(() => import('./pages/admin/AdminContentEditor'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const SellerProfile = lazy(() => import('./pages/SellerProfile'));
const BulkApplications = lazy(() => import('./pages/BulkApplications'));
const AdminBulkApplications = lazy(() => import('./pages/admin/BulkApplications'));
const BulkOrdersBoard = lazy(() => import('./pages/BulkOrdersBoard'));
const BulkOrderCreate = lazy(() => import('./pages/BulkOrderCreate'));
const BulkOrderDetails = lazy(() => import('./pages/BulkOrderDetails'));
const BulkSellerOrders = lazy(() => import('./pages/BulkSellerOrders'));
const AdminBulkOrders = lazy(() => import('./pages/admin/BulkOrders'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#FAF7F2' }}>
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#A0452E' }}></div>
      <p className="text-sm font-medium text-stone-500">Loading…</p>
    </div>
  </div>
);

const ShareListingRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/listings/${id}` : "/browse"} replace />;
};

const ShareBuyRequestRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/request/${id}` : "/request"} replace />;
};

const shouldPadForMobileNav = (pathname: string, signedIn: boolean) => {
  if (!signedIn) return false;

  return (
    pathname === '/' ||
    pathname === '/b2b' ||
    pathname === '/bulk' ||
    pathname === '/about' ||
    pathname === '/profile' ||
    pathname === '/messages' ||
    pathname === '/favorites' ||
    pathname === '/request' ||
    pathname.startsWith('/browse') ||
    pathname.startsWith('/bulk/') ||
    pathname.startsWith('/seller/') ||
    pathname.startsWith('/sellers/')
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationsProvider>
          <PropertyProvider>
            <VerificationProvider>
              <Router>
                <AppShell />
              </Router>
            </VerificationProvider>
          </PropertyProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

const AppShell = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    trackTrafficPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let path = href;
      try {
        const url = new URL(href, window.location.origin);
        path = url.pathname;
      } catch {
        // keep raw href for simple relative paths
      }

      if (!path.startsWith("/") || path.startsWith("/admin")) return;

      trackTrafficClick({
        action: "link_click",
        pagePath: window.location.pathname,
        target: path,
      });
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF7F2' }}>
      <Navbar />
      <div className={`flex-1 py-4 ${shouldPadForMobileNav(location.pathname, !!user) ? "pb-24 lg:pb-4" : ""}`}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route
              path="/create-listing"
              element={
                <ProtectedRoute>
                  <CreateListing />
                </ProtectedRoute>
              }
            />
            <Route path="/browse" element={<BrowseListings />} />
            <Route path="/browse/:category" element={<BrowseListings />} />
            <Route path="/listings" element={<Navigate to="/browse" replace />} />
            <Route path="/marketplace" element={<Navigate to="/browse" replace />} />
            <Route path="/find-services" element={<Navigate to="/browse/services" replace />} />
            <Route path="/request" element={<BrowseBuyerRequestsPage />} />
            <Route
              path="/request/new"
              element={
                <ProtectedRoute>
                  <PostBuyRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request/:id"
              element={<BuyerRequestDetails />}
            />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/b2b" element={<B2B />} />
            <Route path="/bulk" element={<BulkApplications />} />
            <Route path="/bulk-buyer" element={<Navigate to="/bulk?role=buyer" replace />} />
            <Route path="/bulk-seller" element={<Navigate to="/bulk?role=seller" replace />} />
            <Route
              path="/bulk/orders"
              element={
                <ProtectedRoute>
                  <BulkOrdersBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk/orders/new"
              element={
                <ProtectedRoute>
                  <BulkOrderCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk/orders/:id"
              element={
                <ProtectedRoute>
                  <BulkOrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk/seller/orders"
              element={
                <ProtectedRoute>
                  <BulkSellerOrders />
                </ProtectedRoute>
              }
            />
            <Route path="/contact" element={<AboutUs />} />
            <Route path="/help" element={<AboutUs />} />
            <Route path="/features" element={<Navigate to="/" replace />} />
            <Route path="/pricing" element={<Navigate to="/" replace />} />
            <Route path="/blog" element={<Navigate to="/" replace />} />
            <Route path="/careers" element={<Home />} />
            <Route path="/cookies" element={<PrivacyPolicy />} />
            <Route path="/status" element={<Navigate to="/" replace />} />
            <Route path="/feedback" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
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
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/l/:id" element={<ShareListingRedirect />} />
            <Route path="/share/listing/:id" element={<ShareListingRedirect />} />
            <Route path="/r/:id" element={<ShareBuyRequestRedirect />} />
            <Route path="/share/request/:id" element={<ShareBuyRequestRedirect />} />
            <Route path="/seller/:userId" element={<SellerProfile />} />
            <Route path="/sellers/:userId" element={<SellerProfile />} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/listings-approval" element={<ProtectedRoute><AdminListingsApproval /></ProtectedRoute>} />
            <Route path="/admin/id-verification" element={<ProtectedRoute><AdminIDVerification /></ProtectedRoute>} />
            <Route
              path="/admin/moderation/*"
              element={
                <ProtectedRoute>
                  <Moderation />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/profile-verification" element={<ProtectedRoute><AdminIDVerification /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
            <Route path="/admin/users/:userId" element={<ProtectedRoute><AdminUserProfile /></ProtectedRoute>} />
            <Route path="/admin/reports-management" element={<ProtectedRoute><AdminReportsManagement /></ProtectedRoute>} />
            <Route path="/admin/content-editor" element={<ProtectedRoute><AdminContentEditor /></ProtectedRoute>} />
            <Route path="/admin/listing-management" element={<ProtectedRoute><ListingManagement /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsReports /></ProtectedRoute>} />
            <Route path="/admin/bulk-applications" element={<ProtectedRoute><AdminBulkApplications /></ProtectedRoute>} />
            <Route path="/admin/bulk-orders" element={<ProtectedRoute><AdminBulkOrders /></ProtectedRoute>} />
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/notifications" element={<Navigate to="/profile" replace />} />
            <Route path="/profile/notifications" element={<Navigate to="/profile" replace />} />
            <Route path="/error" element={<ServerError />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
      <WhatsAppFloatingButton />
      <CookieConsentBanner />
    </div>
  );
};
