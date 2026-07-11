/**
 * ZeroLock Timer Selector Component
 *
 * Material Design timer selection with presets and custom input.
 * Keyboard accessible, screen reader friendly.
 */

import React, { useState, useId } from 'react';
import { TIMER_DURATIONS, TIMER_PRESETS } from '../storage/types';
import { TIMER } from '../utils/constants';
import { validatePositiveInt } from '../security/sanitizer';

interface TimerSelectorProps {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  label?: string;
}

export const TimerSelector: React.FC<TimerSelectorProps> = React.memo(
  ({ value, onChange, disabled = false, label = 'Timer Duration' }) => {
    const [isCustom, setIsCustom] = useState(false);
    const [customValue, setCustomValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const baseId = useId();

    const handlePresetClick = (minutes: number): void => {
      setIsCustom(false);
      setCustomValue('');
      setError(null);
      onChange(minutes);
    };

    const handleCustomToggle = (): void => {
      setIsCustom(true);
      setCustomValue('');
      setError(null);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const raw = e.target.value;
      setCustomValue(raw);

      if (!raw) {
        setError(null);
        return;
      }

      const validated = validatePositiveInt(raw, TIMER.MIN_MINUTES, TIMER.MAX_MINUTES);
      if (validated === null) {
        setError(`Enter a value between ${TIMER.MIN_MINUTES} and ${TIMER.MAX_MINUTES} minutes`);
      } else {
        setError(null);
        onChange(validated);
      }
    };

    const isPresetSelected = !isCustom && TIMER_DURATIONS.includes(value as typeof TIMER_DURATIONS[number]);

    return (
      <div className="timer-selector" role="group" aria-label={label}>
        <span className="timer-selector-label">{label}</span>

        <div className="timer-presets">
          {TIMER_DURATIONS.map((minutes) => {
            const presetId = `${baseId}-preset-${minutes}`;
            return (
              <button
                key={minutes}
                id={presetId}
                type="button"
                className={`timer-preset-btn ${isPresetSelected && value === minutes ? 'active' : ''}`}
                onClick={() => handlePresetClick(minutes)}
                disabled={disabled}
                aria-pressed={isPresetSelected && value === minutes}
                aria-label={TIMER_PRESETS[minutes]}
              >
                {TIMER_PRESETS[minutes]}
              </button>
            );
          })}
        </div>

        <div className="timer-custom">
          <button
            type="button"
            className={`timer-custom-btn ${isCustom ? 'active' : ''}`}
            onClick={handleCustomToggle}
            disabled={disabled}
            aria-pressed={isCustom}
          >
            Custom
          </button>

          {isCustom && (
            <div className="timer-custom-input-wrapper">
              <input
                type="number"
                className={`timer-custom-input ${error ? 'has-error' : ''}`}
                value={customValue}
                onChange={handleCustomChange}
                placeholder="Minutes"
                min={TIMER.MIN_MINUTES}
                max={TIMER.MAX_MINUTES}
                disabled={disabled}
                aria-label="Custom timer in minutes"
                aria-describedby={error ? `${baseId}-error` : undefined}
                aria-invalid={!!error}
                autoFocus
              />
              <span className="timer-custom-unit">minutes</span>
            </div>
          )}

          {error && isCustom && (
            <p id={`${baseId}-error`} className="timer-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  },
);

TimerSelector.displayName = 'TimerSelector';
