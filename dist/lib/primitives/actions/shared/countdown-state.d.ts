import { type Signal } from '@angular/core';
export interface CountdownState {
    readonly active$: Signal<boolean>;
    sync(nextActive: boolean): void;
    destroy(): void;
}
export declare function createCountdownState(durationMs?: number, onComplete?: () => void): CountdownState;
//# sourceMappingURL=countdown-state.d.ts.map