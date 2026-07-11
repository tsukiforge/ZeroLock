/**
 * ZeroLock Dashboard Component
 *
 * Main dashboard displaying all managed websites with their timer status.
 * Entry point for the popup interface.
 */

import React from 'react';
import { AddWebsiteForm } from './AddWebsiteForm';
import { WebsiteItem } from './WebsiteItem';
import type { WebsiteEntry } from '../storage/types';

interface TimerStatusData {
  remaining: number;
  expiryTime: number;
  status: 'running' | 'expired' | 'paused';
}

interface DashboardProps {
  websites: Record<string, WebsiteEntry>;
  timerStatuses: Record<string, TimerStatusData>;
  loading: boolean;
  onAddWebsite: (
    domain: string,
    data: { timerMinutes: number; autoLogout: boolean; closeTabs: boolean },
  ) => Promise<boolean>;
  onRemoveWebsite: (domain: string) => Promise<boolean>;
  onUpdateWebsite: (domain: string, updates: Partial<WebsiteEntry>) => Promise<boolean>;
  onLogout: (domain: string) => void;
  onStartTimer: (domain: string) => Promise<boolean>;
  onStopTimer: (domain: string) => Promise<boolean>;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(
  ({
    websites,
    timerStatuses,
    loading,
    onAddWebsite,
    onRemoveWebsite,
    onUpdateWebsite,
    onLogout,
    onStartTimer,
    onStopTimer,
  }) => {
    const websiteEntries = Object.entries(websites);
    const activeCount = websiteEntries.filter(([, entry]) => entry.isActive).length;

    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1 className="dashboard-title">ZeroLock</h1>
          <p className="dashboard-subtitle">Session Manager</p>
          <div className="dashboard-stats">
            <span className="stat">
              <strong>{websiteEntries.length}</strong> websites
            </span>
            <span className="stat-separator" aria-hidden="true">•</span>
            <span className="stat">
              <strong>{activeCount}</strong> active
            </span>
          </div>
        </header>

        <AddWebsiteForm onAdd={onAddWebsite} disabled={loading} />

        <section className="website-list-section">
          <h2 className="section-title">
            Managed Websites
            {websiteEntries.length > 0 && (
              <span className="section-count">({websiteEntries.length})</span>
            )}
          </h2>

          {loading ? (
            <div className="loading-state" role="status">
              <div className="spinner" aria-hidden="true" />
              <span>Loading websites...</span>
            </div>
          ) : websiteEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">🔒</div>
              <p className="empty-state-title">No websites yet</p>
              <p className="empty-state-description">
                Add a website above to start managing your sessions.
              </p>
              <div className="empty-state-examples">
                <span>Try: discord.com, github.com, reddit.com</span>
              </div>
            </div>
          ) : (
            <div className="website-list" role="list" aria-label="Managed websites">
              {websiteEntries.map(([domain, entry]) => (
                <WebsiteItem
                  key={domain}
                  domain={domain}
                  entry={entry}
                  timerStatus={timerStatuses[domain]}
                  onRemove={onRemoveWebsite}
                  onUpdate={onUpdateWebsite}
                  onLogout={onLogout}
                  onStartTimer={onStartTimer}
                  onStopTimer={onStopTimer}
                  disabled={loading}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  },
);

Dashboard.displayName = 'Dashboard';
