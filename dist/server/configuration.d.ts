export declare class ConfigurationError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
export type Environment = Readonly<Record<string, string | undefined>>;
export type NodeEnvironment = "development" | "test" | "production";
/** Parse NODE_ENV without normalising mistakes into a different runtime policy. */
export declare function nodeEnvironmentValue(environment: Environment): NodeEnvironment;
/** Parse the production-only release-validation switch while proving NODE_ENV exact. */
export declare function releaseValidationEnvironmentValue(environment: Environment): boolean;
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