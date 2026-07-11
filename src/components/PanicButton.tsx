/**
 * ZeroLock Panic Button Component
 *
 * Emergency logout button that logs out all blacklisted and active websites.
 * Includes confirmation dialog to prevent accidental activation.
 */

import React, { useState, useCallback } from 'react';
import { MESSAGES } from '../utils/constants';

interface PanicButtonProps {
  disabled?: boolean;
  onComplete?: (result: { domainsLoggedOut: string[]; totalCookiesRemoved: number }) => void;
}

export const PanicButton: React.FC<PanicButtonProps> = React.memo(
  ({ disabled = false, onComplete }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<{
      domainCount: number;
      cookieCount: number;
    } | null>(null);

    const handleExecute = useCallback(async (): Promise<void> => {
      setIsExecuting(true);
      setResult(null);

      try {
        const response = await chrome.runtime.sendMessage({
          type: MESSAGES.PANIC_LOGOUT,
        });

        if (response?.success && response.data) {
          const data = response.data as {
            domainsLoggedOut: string[];
            totalCookiesRemoved: number;
          };
          setResult({
            domainCount: data.domainsLoggedOut.length,
            cookieCount: data.totalCookiesRemoved,
          });

          onComplete?.(data);
        }
      } catch {
        setResult({ domainCount: 0, cookieCount: 0 });
      } finally {
        setIsExecuting(false);
        setShowConfirm(false);
      }
    }, [onComplete]);

    const handleCancel = useCallback((): void => {
      setShowConfirm(false);
    }, []);

    return (
      <div className="panic-button-container">
        {!showConfirm ? (
          <button
            type="button"
            className="btn btn-danger panic-button"
            onClick={() => setShowConfirm(true)}
            disabled={disabled || isExecuting}
            aria-label="Emergency logout all websites"
          >
            <span className="panic-icon" aria-hidden="true">🔴</span>
            Panic Button
          </button>
        ) : (
          <div className="panic-confirm" role="alertdialog" aria-label="Confirm panic logout">
            <p className="panic-confirm-text">
              Are you sure? This will log you out of all managed websites immediately.
            </p>
            <div className="panic-confirm-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleExecute}
                disabled={isExecuting}
              >
                {isExecuting ? 'Logging out...' : 'Yes, Logout All'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isExecuting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="panic-result" role="status">
            <span className="panic-result-icon" aria-hidden="true">✅</span>
            <span>
              Logged out of <strong>{result.domainCount}</strong> websites
              {result.cookieCount > 0 && ` (${result.cookieCount} cookies removed)`}
            </span>
            <button
              type="button"
              className="panic-result-dismiss"
              onClick={() => setResult(null)}
              aria-label="Dismiss result"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  },
);

PanicButton.displayName = 'PanicButton';
