import { signal } from '@angular/core';
export function createCountdownState(durationMs = 6000, onComplete) {
    const activeState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeState" }] : /* istanbul ignore next */ []));
    let countdownTimer;
    const clearCountdownTimer = () => {
        if (countdownTimer === undefined) {
            return;
        }
        globalThis.clearTimeout(countdownTimer);
        countdownTimer = undefined;
    };
    return {
        active$: activeState.asReadonly(),
        sync(nextActive) {
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
        destroy() {
            clearCountdownTimer();
            activeState.set(false);
        },
    };
}
