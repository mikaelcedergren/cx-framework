export const MAX_TIMER_DELAY_MS = 2_147_483_647;
export function assertTimerDelayMilliseconds(value, label) {
    if (!Number.isInteger(value) || value < 1) {
        throw new Error(`${label} must be a positive whole number.`);
    }
    if (value > MAX_TIMER_DELAY_MS) {
        throw new Error(`${label} cannot exceed ${MAX_TIMER_DELAY_MS}ms.`);
    }
}
