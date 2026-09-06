import { MessageChannel } from "node:worker_threads";
import { nodeEnvironmentValue, releaseValidationEnvironmentValue, } from "./configuration.js";
import { acquireServerReleaseIdentityFileLease, parseServerReleaseArtifactDeclaration, parseServerReleaseIdentity, } from "./server-identity.js";
export const SERVER_WORKER_READINESS_TYPE = "cx-server-worker-ready";
export function createServerWorkerReadiness({ identity, productId, workerKey, }) {
    const pinnedIdentity = parseServerReleaseIdentity(identity);
    const id = productIdentifier(productId);
    const worker = declaredWorker(pinnedIdentity, workerKey);
    return parseServerWorkerReadiness({
        schemaVersion: 1,
        type: SERVER_WORKER_READINESS_TYPE,
        productId: id,
        releaseId: pinnedIdentity.releaseId,
        serverBuildId: pinnedIdentity.serverBuildId,
        workerKey: worker.key,
        entrypoint: worker.entrypoint,
    });
}
/**
 * Acquire the ordinary production worker's readiness lease after its real runtime initializes.
 * Development returns no lease, and isolated release validation remains IPC-only. Production
 * reopens the configured release identity, proves it is the exact startup snapshot, and retains
 * that read-only descriptor plus a timerless event-loop reference until the idempotent close
 * handle is invoked. The reference keeps an intentionally idle listener-free worker supervised.
 */
export function acquireServerWorkerReadinessLease({ environment = process.env, identity, workerKey, }) {
    const requestedWorkerKey = releaseIdentifier(workerKey, "workerKey");
    const nodeEnvironment = nodeEnvironmentValue(environment);
    if (releaseValidationEnvironmentValue(environment)) {
        return undefined;
    }
    if (nodeEnvironment !== "production")
        return undefined;
    if (identity === undefined) {
        throw new Error("Production server worker readiness requires a sealed release identity.");
    }
    const pinnedIdentity = parseServerReleaseIdentity(identity);
    const worker = declaredWorker(pinnedIdentity, requestedWorkerKey);
    const identityLease = acquireServerReleaseIdentityFileLease({
        environment,
        identity,
    });
    let lifetimeReference;
    try {
        lifetimeReference = createWorkerLifetimeReference();
    }
    catch (error) {
        try {
            identityLease.close();
        }
        catch (closeError) {
            throw new AggregateError([error, closeError], "Worker readiness failed and its identity descriptor could not be released.");
        }
        throw error;
    }
    return Object.freeze({
        get closed() {
            return identityLease.closed && lifetimeReference.closed;
        },
        close() {
            const failures = [];
            for (const close of [
                () => identityLease.close(),
                () => lifetimeReference.close(),
            ]) {
                try {
                    close();
                }
                catch (error) {
                    failures.push(error);
                }
            }
            if (failures.length === 1)
                throw failures[0];
            if (failures.length > 1) {
                throw new AggregateError(failures, "Worker readiness lease cleanup was incomplete.");
            }
        },
        entrypoint: worker.entrypoint,
        identityFile: identityLease.identityFile,
        releaseId: pinnedIdentity.releaseId,
        serverBuildId: pinnedIdentity.serverBuildId,
        workerKey: worker.key,
    });
}
/**
 * Keep an initialized listener-free runtime alive without polling or creating work.
 * Close during shutdown. This is only a process lifetime reference, not a readiness
 * proof; production workers use their release-bound readiness lease instead.
 */
export function createWorkerLifetimeReference() {
    const channel = new MessageChannel();
    let closed = false;
    try {
        channel.port1.ref();
        channel.port2.unref();
    }
    catch (error) {
        const failures = [error];
        for (const port of [channel.port1, channel.port2]) {
            try {
                port.close();
            }
            catch (closeError) {
                failures.push(closeError);
            }
        }
        throw failures.length === 1
            ? error
            : new AggregateError(failures, "Worker lifetime setup failed and its message ports could not be released.");
    }
    return Object.freeze({
        get closed() {
            return closed;
        },
        close() {
            if (closed)
                return;
            const failures = [];
            for (const port of [channel.port1, channel.port2]) {
                try {
                    port.close();
                }
                catch (error) {
                    failures.push(error);
                }
            }
            closed = true;
            if (failures.length === 1)
                throw failures[0];
            if (failures.length > 1) {
                throw new AggregateError(failures, "Worker lifetime message-port cleanup was incomplete.");
            }
        },
    });
}
export function parseServerWorkerReadiness(value) {
    const message = plainObject(value, "Server worker readiness message");
    assertExactKeys(message, [
        "entrypoint",
        "productId",
        "releaseId",
        "schemaVersion",
        "serverBuildId",
        "type",
        "workerKey",
    ]);
    if (message["schemaVersion"] !== 1) {
        throw new Error("Server worker readiness schemaVersion must be 1.");
    }
    if (message["type"] !== SERVER_WORKER_READINESS_TYPE) {
        throw new Error(`Server worker readiness type must be ${SERVER_WORKER_READINESS_TYPE}.`);
    }
    const productId = productIdentifier(message["productId"]);
    const releaseId = releaseIdentifier(message["releaseId"], "releaseId");
    const workerKey = releaseIdentifier(message["workerKey"], "workerKey");
    const serverBuildId = stringMatching(message["serverBuildId"], /^server-[a-f0-9]{64}$/, "serverBuildId");
    const declaration = parseServerReleaseArtifactDeclaration({
        entrypoint: "cx-web-entrypoint.mjs",
        workers: [{ key: workerKey, entrypoint: message["entrypoint"] }],
    });
    return Object.freeze({
        schemaVersion: 1,
        type: SERVER_WORKER_READINESS_TYPE,
        productId,
        releaseId,
        serverBuildId,
        workerKey,
        entrypoint: declaration.workers[0].entrypoint,
    });
}
/**
 * Send one readiness receipt only inside shared release validation. Ordinary production and
 * development workers have no IPC parent, so the same startup path remains portable.
 */
export async function signalServerWorkerReadiness(readiness, { channel = processChannel(), environment = process.env, } = {}) {
    if (!releaseValidationEnvironmentValue(environment)) {
        return false;
    }
    const pinned = parseServerWorkerReadiness(readiness);
    if (!channel ||
        channel.connected === false ||
        typeof channel.ref !== "function" ||
        typeof channel.unref !== "function") {
        throw new Error("Server worker release validation requires an open referenceable IPC channel.");
    }
    try {
        channel.ref();
    }
    catch (error) {
        throw new Error("Could not keep the server worker validation IPC channel active.", { cause: error });
    }
    let sendFailure;
    try {
        await new Promise((resolve, reject) => {
            try {
                channel.send(pinned, (error) => {
                    if (error) {
                        reject(new Error("Could not send server worker readiness over IPC.", {
                            cause: error,
                        }));
                        return;
                    }
                    resolve();
                });
            }
            catch (error) {
                reject(new Error("Could not send server worker readiness over IPC.", {
                    cause: error,
                }));
            }
        });
    }
    catch (error) {
        sendFailure = error;
    }
    if (sendFailure !== undefined) {
        try {
            channel.unref();
        }
        catch (releaseError) {
            throw new AggregateError([sendFailure, releaseError], "Server worker readiness failed and its IPC lifecycle reference could not be released.");
        }
        throw sendFailure;
    }
    return true;
}
function declaredWorker(identity, workerKey) {
    const worker = identity.workers.find((candidate) => candidate.key === workerKey);
    if (!worker) {
        throw new Error(`Server release identity does not declare worker ${workerKey}.`);
    }
    return worker;
}
function processChannel() {
    const channel = process.channel;
    if (typeof process.send !== "function" || !channel)
        return undefined;
    return {
        get connected() {
            return process.connected;
        },
        ref() {
            channel.ref();
        },
        send(message, callback) {
            return process.send(message, callback);
        },
        unref() {
            channel.unref();
        },
    };
}
function productIdentifier(value) {
    if (typeof value !== "string" || !/^[a-z][a-z0-9-]*$/.test(value)) {
        throw new Error("Server worker readiness productId is invalid.");
    }
    return value;
}
function releaseIdentifier(value, label) {
    return stringMatching(value, /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i, label);
}
function stringMatching(value, pattern, label) {
    if (typeof value !== "string" || !pattern.test(value)) {
        throw new Error(`Server worker readiness ${label} is invalid.`);
    }
    return value;
}
function plainObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be an object.`);
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
        throw new Error(`${label} must be a plain object.`);
    }
    return value;
}
function assertExactKeys(value, expectedKeys) {
    const actual = Object.keys(value).sort();
    const expected = [...expectedKeys].sort();
    if (actual.length !== expected.length ||
        actual.some((key, index) => key !== expected[index])) {
        throw new Error("Server worker readiness fields are invalid.");
    }
}
