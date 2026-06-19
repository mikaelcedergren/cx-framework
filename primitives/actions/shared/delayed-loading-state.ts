import { signal, type Signal } from '@angular/core';

export interface DelayedLoadingState {
  readonly loading$: Signal<boolean>;
  readonly showSpinner$: Signal<boolean>;
  sync(nextLoading: boolean): void;
  destroy(): void;
}

export function createDelayedLoadingState(delayMs = 400): DelayedLoadingState {
  const loadingState = signal(false);
  const showSpinnerState = signal(false);
  let spinnerTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  const clearSpinnerTimer = (): void => {
    if (spinnerTimer === undefined) {
      return;
    }
    globalThis.clearTimeout(spinnerTimer);
    spinnerTimer = undefined;
  };

  return {
    loading$: loadingState.asReadonly(),
    showSpinner$: showSpinnerState.asReadonly(),
    sync(nextLoading: boolean): void {
      if (loadingState() === nextLoading) {
        return;
      }
      loadingState.set(nextLoading);
      clearSpinnerTimer();
      if (!nextLoading) {
        showSpinnerState.set(false);
        return;
      }
      if (delayMs <= 0) {
        showSpinnerState.set(true);
        return;
      }
      showSpinnerState.set(false);
      spinnerTimer = globalThis.setTimeout(() => {
        if (loadingState()) {
          showSpinnerState.set(true);
        }
        spinnerTimer = undefined;
      }, delayMs);
    },
    destroy(): void {
      clearSpinnerTimer();
      showSpinnerState.set(false);
    }
  };
}
