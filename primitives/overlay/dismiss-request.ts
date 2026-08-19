/** The user intent behind a request to remove a work-bearing surface. */
export type CxDismissReason = 'cancel' | 'dismiss';

/**
 * A synchronous request emitted before a user-initiated dismissal commits.
 * Call `preventDefault()` inside the output handler; calling it after the
 * handler returns cannot undo a committed dismissal.
 */
export class CxDismissRequest {
  private prevented = false;

  constructor(
    /** The user intent that initiated this request. */
    public readonly reason: CxDismissReason,
  ) {}

  /** Whether an output handler prevented this dismissal. */
  public get defaultPrevented(): boolean {
    return this.prevented;
  }

  /** Prevent the surface from dismissing when called synchronously from its output handler. */
  public preventDefault(): void {
    this.prevented = true;
  }
}
