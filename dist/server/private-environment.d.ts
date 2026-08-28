import { type Environment } from "./configuration.js";
export declare const MAX_PRIVATE_ENVIRONMENT_FILE_BYTES: number;
export interface LoadPrivateEnvironmentFileOptions {
    readonly allowedKeys: ReadonlySet<string>;
    readonly environment: NodeJS.ProcessEnv;
    readonly file: string;
    readonly mode: PrivateEnvironmentFileLoadMode;
}
export type PrivateEnvironmentFileLoadMode = "optional-ambient" | "required-authoritative";
export type PrivateEnvironmentFileStartupMode = "skip" | PrivateEnvironmentFileLoadMode;
/**
 * Select one exact startup policy for a role-owned private environment file.
 *
 * Test processes never inspect a private file. Development may explicitly opt out and otherwise
 * keeps ambient-value precedence for local ergonomics. Production cannot opt out: its private
 * values come only from the required role file.
 */
export declare function privateEnvironmentFileStartupMode({ bypassKey, environment, }: {
    readonly bypassKey: string;
    readonly environment: Environment;
}): PrivateEnvironmentFileStartupMode;
/** The parsed file named a key outside the consumer-owned allowlist. */
export declare class UnsupportedPrivateEnvironmentKeyError extends Error {
    readonly key: string;
    constructor(file: string, key: string);
}
/**
 * Load one owner-private environment file without following its final path entry.
 *
 * In `optional-ambient` mode, only an ENOENT from the initial atomic open means that the file is
 * absent and an already-present ambient value retains precedence. In `required-authoritative`
 * mode, absence fails closed and the verified file atomically replaces every allowed ambient key,
 * including deleting allowed keys that the file omits. Every other filesystem condition fails
 * closed. All bytes and keys are verified before the target environment is changed.
 */
export declare function loadPrivateEnvironmentFile({ allowedKeys, environment, file, mode, }: LoadPrivateEnvironmentFileOptions): boolean;
//# sourceMappingURL=private-environment.d.ts.map