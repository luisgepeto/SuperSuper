import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Get base path from Vite's import.meta.env.BASE_URL
// This will be '/' for local/custom domains and '/SuperSuper/' for GitHub Pages
const basePath = import.meta.env.BASE_URL;

// Expose pipeline function globally for debugging in browser console
import('@xenova/transformers').then(({ pipeline }) => {
  window.pipeline = pipeline;
  console.log('[Debug] window.pipeline is now available for testing');
}).catch((error) => {
  console.error('[Debug] Failed to load pipeline:', error);
});

// Service Worker Registration
console.log('Checking for SW support');
if ('serviceWorker' in navigator) {
  console.log('SW available, registering.');
  window.addEventListener('load', () => {
    // Use base path for service worker registration
    const swPath = `${basePath}sw.js`;
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user to reload
                if (confirm('New version available! Reload to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });

  // Listen for controlling service worker changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
else{
  console.log('SW not supported');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);