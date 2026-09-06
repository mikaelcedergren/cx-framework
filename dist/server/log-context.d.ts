export interface LogContext {
    readonly requestId?: string;
    readonly runId?: string;
    readonly jobId?: string;
    readonly effectId?: string;
}
/** Capture only correlation references, never an HTTP request or a product record. */
export declare function currentLogContext(): Readonly<LogContext>;
/** Replace context at an operation boundary; explicitly carry parent references into child work. */
export declare function runWithLogContext<T>(context: LogContext, operation: () => T): T;
export declare function validateLogContext(context: LogContext): Readonly<LogContext>;
//# sourceMappingURL=log-context.d.ts.map