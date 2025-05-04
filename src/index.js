import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { trackAppInitialization } from './utils/performance';
import { logSystemEvent, LOG_SEVERITY } from './utils/logging';

// Initialize performance monitoring
trackAppInitialization();

// Log application start
logSystemEvent('Application started', 'info', {
  startTime: new Date().toISOString()
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
