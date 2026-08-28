import { type Signal } from '@angular/core';
export interface DelayedLoadingState {
    readonly loading$: Signal<boolean>;
    readonly showSpinner$: Signal<boolean>;
    sync(nextLoading: boolean): void;
    destroy(): void;
}
export declare function createDelayedLoadingState(delayMs?: number): DelayedLoadingState;
//# sourceMappingURL=delayed-loading-state.d.ts.map