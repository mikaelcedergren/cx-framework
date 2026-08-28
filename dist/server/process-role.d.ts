import { type ServerReleaseIdentity } from "./server-identity.js";
export type ServerProcessRole = Readonly<{
    kind: "web";
}> | Readonly<{
    kind: "worker";
    key: string;
}>;
export type ValidatedServerProcessRole = Readonly<{
    kind: "web";
    entrypoint: string;
}> | Readonly<{
    kind: "worker";
    key: string;
    entrypoint: string;
}>;
export interface AssertServerProcessRoleOptions {
    readonly artifactRoot: string;
    readonly entrypointUrl: string | URL;
    readonly identity: ServerReleaseIdentity;
    readonly role: ServerProcessRole;
}
/**
 * Prove that the executing module is the exact web or worker entrypoint sealed into a release.
 * Development processes without a release identity do not call this function; a sealed process
 * must never infer its role from a mutable working directory or an environment label.
 */
export declare function assertServerProcessRole({ artifactRoot, entrypointUrl, identity, role, }: AssertServerProcessRoleOptions): ValidatedServerProcessRole;
//# sourceMappingURL=process-role.d.ts.map