/**
 * A synchronous request emitted before a user-initiated dismissal commits.
 * Call `preventDefault()` inside the output handler; calling it after the
 * handler returns cannot undo a committed dismissal.
 */
export class CxDismissRequest {
    reason;
    prevented = false;
    constructor(
    /** The user intent that initiated this request. */
    reason) {
        this.reason = reason;
    }
    /** Whether an output handler prevented this dismissal. */
    get defaultPrevented() {
        return this.prevented;
    }
    /** Prevent the surface from dismissing when called synchronously from its output handler. */
    preventDefault() {
        this.prevented = true;
    }
}
