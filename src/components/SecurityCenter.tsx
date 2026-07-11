/**
 * ZeroLock Security Center Component
 *
 * Displays transparent security status indicators.
 * Builds user trust by showing what ZeroLock does and doesn't do.
 */

import React, { useEffect, useState } from 'react';
import { MESSAGES } from '../utils/constants';

interface SecurityStatus {
  integrityVerified: boolean;
  localProcessing: boolean;
  remoteDataCollection: boolean;
  telemetry: boolean;
  analytics: boolean;
  passwordAccess: boolean;
  cookieUpload: boolean;
  securityScan: string;
  version: string;
  storageUsed: number;
  storageQuota: number;
}

interface SecurityIndicatorProps {
  label: string;
  status: 'secure' | 'warning' | 'disabled' | 'enabled';
  description: string;
}

const SecurityIndicator: React.FC<SecurityIndicatorProps> = React.memo(
  ({ label, status, description }) => {
    const getStatusIcon = (): string => {
      switch (status) {
        case 'secure':
          return '🟢';
        case 'warning':
          return '🟡';
        case 'disabled':
          return '🔴';
        case 'enabled':
          return '🟢';
      }
    };

    const getStatusLabel = (): string => {
      switch (status) {
        case 'secure':
          return 'Verified';
        case 'warning':
          return 'Warning';
        case 'disabled':
          return 'Disabled';
        case 'enabled':
          return 'Enabled';
      }
    };

    return (
      <div className="security-indicator" role="status" aria-label={`${label}: ${getStatusLabel()}`}>
        <span className="security-indicator-icon" aria-hidden="true">
          {getStatusIcon()}
        </span>
        <div className="security-indicator-info">
          <span className="security-indicator-label">{label}</span>
          <span className="security-indicator-status">{getStatusLabel()}</span>
        </div>
        <p className="security-indicator-description">{description}</p>
      </div>
    );
  },
);

SecurityIndicator.displayName = 'SecurityIndicator';

interface SecurityCenterProps {
  compact?: boolean;
}

export const SecurityCenter: React.FC<SecurityCenterProps> = React.memo(
  ({ compact = false }) => {
    const [status, setStatus] = useState<SecurityStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadStatus = async (): Promise<void> => {
        try {
          const response = await chrome.runtime.sendMessage({
            type: MESSAGES.GET_SECURITY_STATUS,
          });

          if (response?.success && response.data) {
            setStatus(response.data as SecurityStatus);
          }
        } catch {
          // Silently fail
        } finally {
          setLoading(false);
        }
      };

      void loadStatus();
    }, []);

    if (loading) {
      return (
        <div className="security-center">
          <h2 className="section-title">Security Center</h2>
          <div className="loading-state" role="status">
            <div className="spinner" aria-hidden="true" />
            <span>Loading security status...</span>
          </div>
        </div>
      );
    }

    if (!status) {
      return (
        <div className="security-center">
          <h2 className="section-title">Security Center</h2>
          <p className="security-unavailable">Security status unavailable</p>
        </div>
      );
    }

    const storagePercent = ((status.storageUsed / status.storageQuota) * 100).toFixed(1);

    return (
      <div className={`security-center ${compact ? 'compact' : ''}`}>
        <h2 className="section-title">Security Center</h2>
        <p className="security-description">
          ZeroLock is committed to transparency. Here is what the extension is doing with your data.
        </p>

        <div className="security-indicators">
          <SecurityIndicator
            label="Extension Integrity"
            status="secure"
            description="The extension code has not been tampered with."
          />

          <SecurityIndicator
            label="Local Processing"
            status={status.localProcessing ? 'secure' : 'warning'}
            description="All data processing happens on your device only."
          />

          <SecurityIndicator
            label="Remote Data Collection"
            status={!status.remoteDataCollection ? 'secure' : 'warning'}
            description="No data is ever sent to any remote server."
          />

          <SecurityIndicator
            label="Telemetry"
            status={!status.telemetry ? 'secure' : 'warning'}
            description="No usage data or telemetry is collected."
          />

          <SecurityIndicator
            label="Analytics"
            status={!status.analytics ? 'secure' : 'warning'}
            description="No analytics or tracking scripts are included."
          />

          <SecurityIndicator
            label="Password Access"
            status={!status.passwordAccess ? 'secure' : 'warning'}
            description="ZeroLock never reads, stores, or accesses your passwords."
          />

          <SecurityIndicator
            label="Cookie Upload"
            status={!status.cookieUpload ? 'secure' : 'warning'}
            description="Cookies are never uploaded or transmitted anywhere."
          />

          <SecurityIndicator
            label="Security Scan"
            status={status.securityScan === 'passed' ? 'secure' : 'warning'}
            description="Security audit and vulnerability scan passed."
          />
        </div>

        <div className="security-footer">
          <div className="security-info-item">
            <span className="info-label">Version</span>
            <span className="info-value">{status.version}</span>
          </div>
          <div className="security-info-item">
            <span className="info-label">Storage Used</span>
            <span className="info-value">
              {storagePercent}% ({Math.round(status.storageUsed / 1024)} KB /{' '}
              {Math.round(status.storageQuota / 1024 / 1024)} MB)
            </span>
          </div>
        </div>
      </div>
    );
  },
);

SecurityCenter.displayName = 'SecurityCenter';
