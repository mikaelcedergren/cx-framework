/** The user intent behind a request to remove a work-bearing surface. */
export type CxDismissReason = 'cancel' | 'dismiss';
/**
 * A synchronous request emitted before a user-initiated dismissal commits.
 * Call `preventDefault()` inside the output handler; calling it after the
 * handler returns cannot undo a committed dismissal.
 */
export declare class CxDismissRequest {
    /** The user intent that initiated this request. */
    readonly reason: CxDismissReason;
    private prevented;
    constructor(
    /** The user intent that initiated this request. */
    reason: CxDismissReason);
    /** Whether an output handler prevented this dismissal. */
    get defaultPrevented(): boolean;
    /** Prevent the surface from dismissing when called synchronously from its output handler. */
    preventDefault(): void;
}
//# sourceMappingURL=dismiss-request.d.ts.map