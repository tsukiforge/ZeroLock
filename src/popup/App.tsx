/**
 * ZeroLock Popup App Component
 *
 * Main popup interface combining dashboard, panic button, and navigation.
 * 320px width popup with full functionality.
 */

import React, { useState, useCallback } from 'react';
import { Dashboard } from '../components/Dashboard';
import { SecurityCenter } from '../components/SecurityCenter';
import { PanicButton } from '../components/PanicButton';
import { useWebsites } from '../hooks/useWebsites';
import { useTheme } from '../hooks/useTheme';
import { APP } from '../utils/constants';

type PopupView = 'dashboard' | 'security' | 'settings';

export const PopupApp: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const {
    websites,
    timerStatuses,
    loading: websitesLoading,
    addWebsite,
    removeWebsite,
    updateWebsite,
    startTimer,
    stopTimer,
    refresh: _refresh,
  } = useWebsites();

  const [view, setView] = useState<PopupView>('dashboard');
  

  const handleLogout = useCallback(async (domain: string): Promise<void> => {
    try {
      await chrome.runtime.sendMessage({
        type: 'logoutNow',
        payload: { domain },
      });
    } catch {
      // Silently fail
    }
  }, []);

  const handleOpenOptions = useCallback((): void => {
    void chrome.runtime.openOptionsPage();
  }, []);

  const renderHeader = (): React.ReactNode => (
    <nav className="popup-nav" role="tablist" aria-label="Main navigation">
      <button
        type="button"
        className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
        onClick={() => setView('dashboard')}
        role="tab"
        aria-selected={view === 'dashboard'}
        aria-label="Dashboard"
      >
        📊 Dashboard
      </button>
      <button
        type="button"
        className={`nav-btn ${view === 'security' ? 'active' : ''}`}
        onClick={() => setView('security')}
        role="tab"
        aria-selected={view === 'security'}
        aria-label="Security Center"
      >
        🛡️ Security
      </button>
      <button
        type="button"
        className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
        onClick={() => setView('settings')}
        role="tab"
        aria-selected={view === 'settings'}
        aria-label="Settings"
      >
        ⚙️ Settings
      </button>
    </nav>
  );

  const renderSettings = (): React.ReactNode => (
    <div className="settings-panel">
      <h2 className="section-title">Settings</h2>

      <div className="settings-section">
        <label className="theme-label">
          <span>Theme</span>
          <select
            className="form-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            aria-label="Select theme"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <div className="settings-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleOpenOptions}
        >
          Open Full Settings
        </button>
      </div>
    </div>
  );

  return (
    <div className={`popup-container ${isDark ? 'dark' : 'light'}`}>
      {renderHeader()}

      <main className="popup-content">
        {view === 'dashboard' && (
          <>
            <Dashboard
              websites={websites}
              timerStatuses={timerStatuses}
              loading={websitesLoading}
              onAddWebsite={addWebsite}
              onRemoveWebsite={removeWebsite}
              onUpdateWebsite={updateWebsite}
              onLogout={handleLogout}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
            />

            <PanicButton disabled={websitesLoading} />
          </>
        )}

        {view === 'security' && (
          <SecurityCenter compact />
        )}

        {view === 'settings' && renderSettings()}
      </main>

      <footer className="popup-footer">
        <span className="footer-text">{APP.COPYRIGHT}</span>
        <button
          type="button"
          className="footer-link"
          onClick={handleOpenOptions}
          aria-label="Open extension options"
        >
          Options
        </button>
      </footer>
    </div>
  );
};
