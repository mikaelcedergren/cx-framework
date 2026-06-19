import { signal, type Signal } from '@angular/core';

export interface CountdownState {
  readonly active$: Signal<boolean>;
  sync(nextActive: boolean): void;
  destroy(): void;
}

export function createCountdownState(durationMs = 6000, onComplete?: () => void): CountdownState {
  const activeState = signal(false);
  let countdownTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  const clearCountdownTimer = (): void => {
    if (countdownTimer === undefined) {
      return;
    }
    globalThis.clearTimeout(countdownTimer);
    countdownTimer = undefined;
  };

  return {
    active$: activeState.asReadonly(),
    sync(nextActive: boolean): void {
      if (!nextActive) {
        clearCountdownTimer();
        activeState.set(false);
        return;
      }

      clearCountdownTimer();
      activeState.set(true);
      countdownTimer = globalThis.setTimeout(() => {
        activeState.set(false);
        countdownTimer = undefined;
        onComplete?.();
      }, durationMs);
    },
    destroy(): void {
      clearCountdownTimer();
      activeState.set(false);
    },
  };
}
