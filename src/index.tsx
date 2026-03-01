import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { enforceHttps } from './utils/security';
import { initSentry } from './config/sentry';
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// Initialize Sentry error tracking
initSentry();

// Enforce HTTPS in production
enforceHttps();

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  // Prevent default to avoid double-logging in dev tools
  if (process.env.NODE_ENV === 'production') {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
  // Prevent default to avoid double-logging
  if (process.env.NODE_ENV === 'production') {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline support and app installation
registerServiceWorker({
  onSuccess: (registration) => {
    console.log('Service Worker registered successfully:', registration);
  },
  onUpdate: (registration) => {
    console.log('Service Worker updated:', registration);
    if (registration.waiting) {
      let isRefreshing = false;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isRefreshing) return;
        isRefreshing = true;
        window.location.reload();
      });

      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
});
