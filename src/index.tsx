import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { enforceHttps } from './utils/security';

// Enforce HTTPS in production
enforceHttps();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
