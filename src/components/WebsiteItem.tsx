/**
 * ZeroLock Website Item Component
 *
 * Displays a single website entry with timer status and action controls.
 * Material Design card style with dark/light mode support.
 */

import React, { useState, useId } from 'react';
import type { WebsiteEntry } from '../storage/types';
import { TimerSelector } from './TimerSelector';
import { formatRemainingTime } from '../utils/timer';
import { getDomainLabel } from '../security/validator';
import { sanitizeDomain } from '../security/sanitizer';

interface TimerStatusData {
  remaining: number;
  expiryTime: number;
  status: 'running' | 'expired' | 'paused';
}

interface WebsiteItemProps {
  domain: string;
  entry: WebsiteEntry;
  timerStatus?: TimerStatusData;
  onRemove: (domain: string) => void;
  onUpdate: (domain: string, updates: Partial<WebsiteEntry>) => void;
  onLogout: (domain: string) => void;
  onStartTimer: (domain: string) => void;
  onStopTimer: (domain: string) => void;
  disabled?: boolean;
}

export const WebsiteItem: React.FC<WebsiteItemProps> = React.memo(
  ({
    domain,
    entry,
    timerStatus,
    onRemove,
    onUpdate,
    onLogout,
    onStartTimer,
    onStopTimer,
    disabled = false,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const baseId = useId();

    const sanitizedDomain = sanitizeDomain(domain) ?? domain;
    const label = getDomainLabel(sanitizedDomain);

    const handleRemove = async (): Promise<void> => {
      setIsRemoving(true);
      await onRemove(domain);
    };

    const handleTimerChange = (minutes: number): void => {
      onUpdate(domain, { timerMinutes: minutes });
    };

    const handleAutoLogoutToggle = (): void => {
      onUpdate(domain, { autoLogout: !entry.autoLogout });
    };

    const handleCloseTabsToggle = (): void => {
      onUpdate(domain, { closeTabs: !entry.closeTabs });
    };

    const handleTimerToggle = (): void => {
      if (entry.isActive) {
        onStopTimer(domain);
      } else {
        onStartTimer(domain);
      }
    };

    const getStatusIcon = (): string => {
      if (!entry.isActive) return '⏸️';
      if (timerStatus?.status === 'expired') return '⚠️';
      return '⏱️';
    };

    const getStatusLabel = (): string => {
      if (!entry.isActive) return 'Paused';
      if (timerStatus?.status === 'expired') return 'Expired';
      if (timerStatus && timerStatus.expiryTime > 0) {
        return formatRemainingTime(timerStatus.expiryTime);
      }
      return 'Running';
    };

    const getStatusClass = (): string => {
      if (!entry.isActive) return 'status-paused';
      if (timerStatus?.status === 'expired') return 'status-expired';
      return 'status-running';
    };

    return (
      <div className={`website-item ${isExpanded ? 'expanded' : ''}`} role="listitem">
        <div className="website-item-header">
          <div className="website-item-icon" aria-hidden="true">
            {getStatusIcon()}
          </div>

          <div className="website-item-info">
            <span className="website-item-domain">{label}</span>
            <span className="website-item-url">{sanitizedDomain}</span>
          </div>

          <div className={`website-item-status ${getStatusClass()}`}>
            <span className="status-dot" aria-hidden="true" />
            <span className="status-text">{getStatusLabel()}</span>
          </div>

          <div className="website-item-actions">
            <button
              type="button"
              className={`action-btn timer-toggle ${entry.isActive ? 'active' : ''}`}
              onClick={handleTimerToggle}
              disabled={disabled}
              aria-label={entry.isActive ? 'Pause timer' : 'Start timer'}
              title={entry.isActive ? 'Pause Timer' : 'Start Timer'}
            >
              {entry.isActive ? '⏸' : '▶️'}
            </button>

            <button
              type="button"
              className="action-btn logout-btn"
              onClick={() => onLogout(domain)}
              disabled={disabled}
              aria-label={`Logout from ${label}`}
              title="Logout Now"
            >
              🚪
            </button>

            <button
              type="button"
              className={`action-btn expand-btn ${isExpanded ? 'active' : ''}`}
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={disabled}
              aria-label={isExpanded ? 'Collapse settings' : 'Expand settings'}
              aria-expanded={isExpanded}
              title="Settings"
            >
              ⚙️
            </button>

            <button
              type="button"
              className="action-btn remove-btn"
              onClick={handleRemove}
              disabled={disabled || isRemoving}
              aria-label={`Remove ${label}`}
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="website-item-details" role="region" aria-label={`${label} settings`}>
            <TimerSelector
              value={entry.timerMinutes}
              onChange={handleTimerChange}
              disabled={disabled}
              label="Timer Duration"
            />

            <div className="website-item-toggles">
              <label className="toggle-label" htmlFor={`${baseId}-autologout`}>
                <input
                  id={`${baseId}-autologout`}
                  type="checkbox"
                  className="toggle-input"
                  checked={entry.autoLogout}
                  onChange={handleAutoLogoutToggle}
                  disabled={disabled}
                />
                <span className="toggle-switch" aria-hidden="true" />
                <span className="toggle-text">Auto Logout</span>
              </label>

              <label className="toggle-label" htmlFor={`${baseId}-closetabs`}>
                <input
                  id={`${baseId}-closetabs`}
                  type="checkbox"
                  className="toggle-input"
                  checked={entry.closeTabs}
                  onChange={handleCloseTabsToggle}
                  disabled={disabled}
                />
                <span className="toggle-switch" aria-hidden="true" />
                <span className="toggle-text">Close Tabs</span>
              </label>
            </div>
          </div>
        )}
      </div>
    );
  },
);

WebsiteItem.displayName = 'WebsiteItem';
