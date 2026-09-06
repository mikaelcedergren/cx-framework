export declare class ConfigurationError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
export type Environment = Readonly<Record<string, string | undefined>>;
export type NodeEnvironment = "development" | "test" | "production";
export interface ExecutionPolicy {
    readonly executionScope: string;
    readonly dataMode: "shared" | "isolated";
    readonly scheduleOwner: boolean;
}
/** Trusted process configuration; never derive queue ownership from a request or NODE_ENV. */
export declare function resolveExecutionPolicy(environment: Environment): ExecutionPolicy;
/** Parse NODE_ENV without normalising mistakes into a different runtime policy. */
export declare function nodeEnvironmentValue(environment: Environment): NodeEnvironment;
/** Parse the production-only release-validation switch while proving NODE_ENV exact. */
export declare function releaseValidationEnvironmentValue(environment: Environment): boolean;
/**
 * Resolve the one mutable operational root used by a product process.
 *
 * Ordinary development uses the process working directory. A synthetic release-validation
 * process must declare one canonical absolute CX_RUNTIME_ROOT; ordinary processes may not set the
 * release-only override. The returned path is always the real directory identity so environment
 * files, databases, browser releases, and logs cannot disagree at a symbolic-link boundary.
 */
export declare function resolveOperationalRoot(environment: Environment, { cwd }?: {
    readonly cwd?: string;
}): string;
export declare function requiredEnvironmentValue(environment: Environment, name: string): string;
export declare function optionalEnvironmentValue(environment: Environment, name: string, fallback?: string): string | undefined;
export declare function booleanEnvironmentValue(environment: Environment, name: string, fallback: boolean): boolean;
export declare function integerEnvironmentValue(environment: Environment, name: string, { fallback, minimum, maximum, }?: {
    fallback?: number;
    minimum?: number;
    maximum?: number;
}): number;
export declare function portEnvironmentValue(environment: Environment, name?: string, fallback?: number): number;
export declare function localBindHost(environment: Environment, { name, fallback, }?: {
    name?: string;
    fallback?: string;
}): string;
//# sourceMappingURL=configuration.d.ts.map