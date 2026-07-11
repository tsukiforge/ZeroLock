/**
 * ZeroLock Add Website Form Component
 *
 * Form for adding a new website to manage.
 * Includes domain input, timer selection, and auto-logout toggle.
 */

import React, { useState, useId } from 'react';
import { TimerSelector } from './TimerSelector';
import { sanitizeDomain } from '../security/sanitizer';
import { TIMER } from '../utils/constants';

interface AddWebsiteFormProps {
  onAdd: (domain: string, data: { timerMinutes: number; autoLogout: boolean; closeTabs: boolean }) => Promise<boolean>;
  disabled?: boolean;
}

export const AddWebsiteForm: React.FC<AddWebsiteFormProps> = React.memo(
  ({ onAdd, disabled = false }) => {
    const [domain, setDomain] = useState('');
    const [timerMinutes, setTimerMinutes] = useState<number>(TIMER.DEFAULT_MINUTES);
    const [autoLogout, setAutoLogout] = useState(true);
    const [closeTabs, setCloseTabs] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const baseId = useId();

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      setError(null);

      if (!domain.trim()) {
        setError('Please enter a domain');
        return;
      }

      const sanitized = sanitizeDomain(domain);
      if (!sanitized) {
        setError('Invalid domain format (e.g., "example.com")');
        return;
      }

      setIsAdding(true);
      const success = await onAdd(sanitized, {
        timerMinutes,
        autoLogout,
        closeTabs,
      });

      if (success) {
        // Reset form
        setDomain('');
        setTimerMinutes(TIMER.DEFAULT_MINUTES);
        setAutoLogout(true);
        setCloseTabs(false);
      } else {
        setError('Failed to add website. It may already exist.');
      }

      setIsAdding(false);
    };

    const handleDomainKeyDown = (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const form = (e.target as HTMLElement).closest('form');
        if (form) {
          form.requestSubmit();
        }
      }
    };

    return (
      <form className="add-website-form" onSubmit={handleSubmit} noValidate>
        <h2 className="section-title">Add Website</h2>

        <div className="form-group">
          <label htmlFor={`${baseId}-domain`} className="form-label">
            Domain
          </label>
          <input
            id={`${baseId}-domain`}
            type="text"
            className={`form-input ${error ? 'has-error' : ''}`}
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setError(null);
            }}
            onKeyDown={handleDomainKeyDown}
            placeholder="e.g., discord.com"
            disabled={disabled || isAdding}
            aria-describedby={error ? `${baseId}-error` : undefined}
            aria-invalid={!!error}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          <p className="form-hint">
            Enter the domain (not URL). Example: <code>discord.com</code>
          </p>
          {error && (
            <p id={`${baseId}-error`} className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <TimerSelector
          value={timerMinutes}
          onChange={setTimerMinutes}
          disabled={disabled || isAdding}
        />

        <div className="form-toggles">
          <label className="toggle-label" htmlFor={`${baseId}-autologout`}>
            <input
              id={`${baseId}-autologout`}
              type="checkbox"
              className="toggle-input"
              checked={autoLogout}
              onChange={(e) => setAutoLogout(e.target.checked)}
              disabled={disabled || isAdding}
            />
            <span className="toggle-switch" aria-hidden="true" />
            <span className="toggle-text">Auto Logout</span>
          </label>

          <label className="toggle-label" htmlFor={`${baseId}-closetabs`}>
            <input
              id={`${baseId}-closetabs`}
              type="checkbox"
              className="toggle-input"
              checked={closeTabs}
              onChange={(e) => setCloseTabs(e.target.checked)}
              disabled={disabled || isAdding}
            />
            <span className="toggle-switch" aria-hidden="true" />
            <span className="toggle-text">Close Tabs</span>
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary form-submit"
          disabled={disabled || isAdding || !domain.trim()}
        >
          {isAdding ? 'Adding...' : 'Add Website'}
        </button>
      </form>
    );
  },
);

AddWebsiteForm.displayName = 'AddWebsiteForm';
