import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  if (event.reason && typeof event.reason === 'object' && !(event.reason instanceof Error)) {
    try {
      console.error('Rejection details:', JSON.stringify(event.reason, Object.getOwnPropertyNames(event.reason)));
    } catch (e) {
      console.error('Could not stringify rejection reason');
    }
  }
});

// Global error handling for synchronous errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', { message, source, lineno, colno, error });
  if (error && typeof error === 'object' && !(error instanceof Error)) {
    try {
      console.error('Error object details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {}
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
