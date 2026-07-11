/**
 * ZeroLock Options App Component
 *
 * Full options page with:
 * - General settings (theme, idle detection, browser close, etc.)
 * - Whitelist management
 * - Blacklist management
 * - Security Center
 * - Panic Button
 * - About section
 */

import React, { useState, useCallback } from 'react';
import { SecurityCenter } from '../components/SecurityCenter';
import { PanicButton } from '../components/PanicButton';
import { useTheme } from '../hooks/useTheme';
import { useConfig } from '../hooks/useConfig';
import { useLists } from '../hooks/useLists';
import { useWebsites } from '../hooks/useWebsites';
import { sanitizeDomain } from '../security/sanitizer';
import { getDomainLabel } from '../security/validator';
import { APP } from '../utils/constants';
import type { AppConfig } from '../storage/types';

type OptionsTab = 'general' | 'whitelist' | 'blacklist' | 'security' | 'about';

export const OptionsApp: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const { config, loading: configLoading, updateConfig, timerPresets } = useConfig();
  const {
    whitelist,
    blacklist,
    loading: listsLoading,
    addToWhitelist,
    removeFromWhitelist,
    addToBlacklist,
    removeFromBlacklist,
  } = useLists();
  const { refresh: refreshWebsites } = useWebsites();

  const [activeTab, setActiveTab] = useState<OptionsTab>('general');
  const [whitelistDomain, setWhitelistDomain] = useState('');
  const [blacklistDomain, setBlacklistDomain] = useState('');
  const [listError, setListError] = useState<string | null>(null);

  const handleClearData = useCallback(async (): Promise<void> => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await chrome.storage.local.clear();
      await refreshWebsites();
      window.location.reload();
    }
  }, [refreshWebsites]);

  const handleAddToWhitelist = useCallback(async (): Promise<void> => {
    const sanitized = sanitizeDomain(whitelistDomain);
    if (!sanitized) {
      setListError('Invalid domain');
      return;
    }
    const success = await addToWhitelist(sanitized, getDomainLabel(sanitized));
    if (success) {
      setWhitelistDomain('');
      setListError(null);
    } else {
      setListError('Failed to add. Already in list or list full.');
    }
  }, [whitelistDomain, addToWhitelist]);

  const handleAddToBlacklist = useCallback(async (): Promise<void> => {
    const sanitized = sanitizeDomain(blacklistDomain);
    if (!sanitized) {
      setListError('Invalid domain');
      return;
    }
    const success = await addToBlacklist(sanitized, getDomainLabel(sanitized));
    if (success) {
      setBlacklistDomain('');
      setListError(null);
    } else {
      setListError('Failed to add. Already in list or list full.');
    }
  }, [blacklistDomain, addToBlacklist]);

  const handleConfigUpdate = useCallback(
    async (key: keyof AppConfig, value: unknown): Promise<void> => {
      await updateConfig({ [key]: value } as Partial<AppConfig>);
    },
    [updateConfig],
  );

  const tabs: Array<{ id: OptionsTab; label: string; icon: string }> = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'whitelist', label: 'Whitelist', icon: '✅' },
    { id: 'blacklist', label: 'Blacklist', icon: '⛔' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <div className={`options-container ${isDark ? 'dark' : 'light'}`}>
      <header className="options-header">
        <h1 className="options-title">{APP.FULL_NAME}</h1>
        <nav className="options-tabs" role="tablist" aria-label="Settings tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`options-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="options-content">
        {/* General Settings */}
        {activeTab === 'general' && (
          <section id="panel-general" className="options-panel" role="tabpanel">
            <h2 className="section-title">General Settings</h2>

            <div className="settings-group">
              <label className="settings-row">
                <span className="settings-label">Theme</span>
                <select
                  className="form-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  disabled={configLoading}
                  aria-label="Select theme"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>

              <label className="settings-row">
                <span className="settings-label">Default Timer</span>
                <select
                  className="form-select"
                  value={config.defaultTimerMinutes}
                  onChange={(e) => handleConfigUpdate('defaultTimerMinutes', parseInt(e.target.value, 10))}
                  disabled={configLoading}
                  aria-label="Default timer duration"
                >
                  {Object.entries(timerPresets).map(([minutes, label]) => (
                    <option key={minutes} value={minutes}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="settings-group">
              <h3 className="settings-subtitle">Notifications</h3>
              <label className="toggle-label settings-toggle">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={config.notificationsEnabled}
                  onChange={(e) => handleConfigUpdate('notificationsEnabled', e.target.checked)}
                  disabled={configLoading}
                />
                <span className="toggle-switch" aria-hidden="true" />
                <span className="toggle-text">Enable Notifications</span>
              </label>
            </div>

            <div className="settings-group">
              <h3 className="settings-subtitle">Idle Detection</h3>
              <label className="toggle-label settings-toggle">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={config.idleDetectionEnabled}
                  onChange={(e) => handleConfigUpdate('idleDetectionEnabled', e.target.checked)}
                  disabled={configLoading}
                />
                <span className="toggle-switch" aria-hidden="true" />
                <span className="toggle-text">Enable Idle Detection</span>
              </label>

              {config.idleDetectionEnabled && (
                <label className="settings-row">
                  <span className="settings-label">Idle Timeout</span>
                  <select
                    className="form-select"
                    value={config.idleTimeoutMinutes}
                    onChange={(e) => handleConfigUpdate('idleTimeoutMinutes', parseInt(e.target.value, 10))}
                    disabled={configLoading}
                    aria-label="Idle timeout duration"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </label>
              )}
            </div>

            <div className="settings-group">
              <h3 className="settings-subtitle">Auto Logout Triggers</h3>
              <label className="toggle-label settings-toggle">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={config.logoutOnBrowserClose}
                  onChange={(e) => handleConfigUpdate('logoutOnBrowserClose', e.target.checked)}
                  disabled={configLoading}
                />
                <span className="toggle-switch" aria-hidden="true" />
                <span className="toggle-text">Logout when Chrome closes</span>
              </label>

              <label className="toggle-label settings-toggle">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={config.logoutOnLock}
                  onChange={(e) => handleConfigUpdate('logoutOnLock', e.target.checked)}
                  disabled={configLoading}
                />
                <span className="toggle-switch" aria-hidden="true" />
                <span className="toggle-text">Logout when PC is locked</span>
              </label>
            </div>

            <div className="settings-group">
              <h3 className="settings-subtitle">Danger Zone</h3>
              <p className="settings-description">
                Reset all extension data. This cannot be undone.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClearData}
              >
                Reset All Data
              </button>
            </div>
          </section>
        )}

        {/* Whitelist */}
        {activeTab === 'whitelist' && (
          <section id="panel-whitelist" className="options-panel" role="tabpanel">
            <h2 className="section-title">Whitelist</h2>
            <p className="section-description">
              Websites in the whitelist will never be automatically logged out.
              Useful for accounts you want to keep signed in (e.g., Google, GitHub, banking).
            </p>

            <div className="list-add-form">
              <input
                type="text"
                className="form-input"
                value={whitelistDomain}
                onChange={(e) => {
                  setWhitelistDomain(e.target.value);
                  setListError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddToWhitelist();
                  }
                }}
                placeholder="Enter domain (e.g., accounts.google.com)"
                disabled={listsLoading}
                aria-label="Domain to add to whitelist"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToWhitelist}
                disabled={listsLoading || !whitelistDomain.trim()}
              >
                Add to Whitelist
              </button>
            </div>

            {listError && <p className="form-error" role="alert">{listError}</p>}

            {whitelist.length === 0 ? (
              <div className="empty-state small">
                <p>No whitelisted websites.</p>
              </div>
            ) : (
              <div className="list-items">
                {whitelist.map((entry) => (
                  <div key={entry.domain} className="list-item">
                    <div className="list-item-info">
                      <span className="list-item-label">{entry.label}</span>
                      <span className="list-item-domain">{entry.domain}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => removeFromWhitelist(entry.domain)}
                      disabled={listsLoading}
                      aria-label={`Remove ${entry.label} from whitelist`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Blacklist */}
        {activeTab === 'blacklist' && (
          <section id="panel-blacklist" className="options-panel" role="tabpanel">
            <h2 className="section-title">Blacklist</h2>
            <p className="section-description">
              Websites in the blacklist will always be logged out automatically.
              The Panic Button also logs out all blacklisted websites.
            </p>

            <div className="list-add-form">
              <input
                type="text"
                className="form-input"
                value={blacklistDomain}
                onChange={(e) => {
                  setBlacklistDomain(e.target.value);
                  setListError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddToBlacklist();
                  }
                }}
                placeholder="Enter domain (e.g., discord.com)"
                disabled={listsLoading}
                aria-label="Domain to add to blacklist"
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleAddToBlacklist}
                disabled={listsLoading || !blacklistDomain.trim()}
              >
                Add to Blacklist
              </button>
            </div>

            {listError && <p className="form-error" role="alert">{listError}</p>}

            {blacklist.length === 0 ? (
              <div className="empty-state small">
                <p>No blacklisted websites.</p>
              </div>
            ) : (
              <div className="list-items">
                {blacklist.map((entry) => (
                  <div key={entry.domain} className="list-item">
                    <div className="list-item-info">
                      <span className="list-item-label">{entry.label}</span>
                      <span className="list-item-domain">{entry.domain}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => removeFromBlacklist(entry.domain)}
                      disabled={listsLoading}
                      aria-label={`Remove ${entry.label} from blacklist`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="blacklist-panic-section">
              <h3 className="settings-subtitle">Panic Button</h3>
              <p className="settings-description">
                Immediately log out all blacklisted and active websites.
              </p>
              <PanicButton />
            </div>
          </section>
        )}

        {/* Security Center */}
        {activeTab === 'security' && (
          <section id="panel-security" className="options-panel" role="tabpanel">
            <SecurityCenter />
          </section>
        )}

        {/* About */}
        {activeTab === 'about' && (
          <section id="panel-about" className="options-panel" role="tabpanel">
            <h2 className="section-title">About ZeroLock</h2>

            <div className="about-section">
              <h3>Privacy First Session Manager</h3>
              <p>
                ZeroLock adalah ekstensi Google Chrome yang membantu pengguna mengelola
                sesi login website secara otomatis untuk meningkatkan keamanan dan privasi.
              </p>
              <p>
                Dirancang dengan prinsip <strong>Privacy by Design</strong> — seluruh
                proses berjalan secara lokal di perangkat pengguna tanpa mengirimkan data
                sensitif ke server mana pun.
              </p>
            </div>

            <div className="about-section">
              <h3>What ZeroLock Never Does</h3>
              <ul className="about-list">
                <li>✅ Never stores passwords</li>
                <li>✅ Never reads passwords</li>
                <li>✅ Never sends cookies</li>
                <li>✅ Never sends authentication tokens</li>
                <li>✅ Never collects personal data</li>
                <li>✅ Never tracks browsing activity</li>
                <li>✅ No analytics or telemetry</li>
              </ul>
            </div>

            <div className="about-section">
              <h3>Permissions</h3>
              <dl className="permissions-list">
                <dt>cookies</dt>
                <dd>Used to remove website sessions when logging out.</dd>

                <dt>notifications</dt>
                <dd>Used to alert when session timers expire.</dd>

                <dt>storage</dt>
                <dd>Stores configuration locally on your device.</dd>

                <dt>tabs</dt>
                <dd>Closes tabs if the Close Tabs option is enabled.</dd>

                <dt>idle</dt>
                <dd>Detects when you are away to trigger logout.</dd>

                <dt>alarms</dt>
                <dd>Runs timer checks in the background.</dd>

                <dt>contextMenus</dt>
                <dd>Adds a right-click option to logout from sites.</dd>
              </dl>
            </div>

            <div className="about-section">
              <h3>Technical Details</h3>
              <div className="about-info-grid">
                <div className="about-info-item">
                  <span className="info-label">Version</span>
                  <span className="info-value">{APP.VERSION}</span>
                </div>
                <div className="about-info-item">
                  <span className="info-label">Manifest</span>
                  <span className="info-value">V3</span>
                </div>
                <div className="about-info-item">
                  <span className="info-label">License</span>
                  <span className="info-value">{APP.LICENSE}</span>
                </div>
                <div className="about-info-item">
                  <span className="info-label">Architecture</span>
                  <span className="info-value">100% Local</span>
                </div>
                <div className="about-info-item">
                  <span className="info-label">Data Storage</span>
                  <span className="info-value">chrome.storage.local</span>
                </div>
                <div className="about-info-item">
                  <span className="info-label">Network</span>
                  <span className="info-value">No Network Access</span>
                </div>
              </div>
            </div>

            <div className="about-footer">
              <p>{APP.COPYRIGHT}</p>
              <p>Made with ❤️ for Privacy & Security.</p>
            </div>
          </section>
        )}
      </main>

      <footer className="options-footer">
        <span>{APP.COPYRIGHT}</span>
        <a
          href={APP.HOMEPAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
};
