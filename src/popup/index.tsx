/**
 * ZeroLock Popup Entry Point
 *
 * Renders the main popup interface with the dashboard.
 * This is the primary UI users interact with.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './App';
import '../styles/main.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
);
