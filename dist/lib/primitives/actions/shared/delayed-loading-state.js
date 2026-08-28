import { signal } from '@angular/core';
export function createDelayedLoadingState(delayMs = 400) {
    const loadingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingState" }] : /* istanbul ignore next */ []));
    const showSpinnerState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showSpinnerState" }] : /* istanbul ignore next */ []));
    let spinnerTimer;
    const clearSpinnerTimer = () => {
        if (spinnerTimer === undefined) {
            return;
        }
        globalThis.clearTimeout(spinnerTimer);
        spinnerTimer = undefined;
    };
    return {
        loading$: loadingState.asReadonly(),
        showSpinner$: showSpinnerState.asReadonly(),
        sync(nextLoading) {
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
        destroy() {
            clearSpinnerTimer();
            showSpinnerState.set(false);
        }
    };
}
