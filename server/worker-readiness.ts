import {
  nodeEnvironmentValue,
  releaseValidationEnvironmentValue,
  type Environment,
} from "./configuration.js";
import {
  acquireServerReleaseIdentityFileLease,
  parseServerReleaseArtifactDeclaration,
  parseServerReleaseIdentity,
  type ServerReleaseIdentity,
} from "./server-identity.js";

export const SERVER_WORKER_READINESS_TYPE = "cx-server-worker-ready";

export interface ServerWorkerReadiness {
  readonly schemaVersion: 1;
  readonly type: typeof SERVER_WORKER_READINESS_TYPE;
  readonly productId: string;
  readonly releaseId: string;
  readonly serverBuildId: string;
  readonly workerKey: string;
  readonly entrypoint: string;
}

export interface CreateServerWorkerReadinessOptions {
  readonly identity: ServerReleaseIdentity;
  readonly productId: string;
  readonly workerKey: string;
}

export interface ServerWorkerReadinessChannel {
  readonly connected?: boolean;
  ref(): void;
  send(
    message: ServerWorkerReadiness,
    callback: (error: Error | null) => void,
  ): boolean;
  unref(): void;
}

export interface SignalServerWorkerReadinessOptions {
  readonly channel?: ServerWorkerReadinessChannel;
  readonly environment?: Environment;
}

export interface AcquireServerWorkerReadinessLeaseOptions {
  readonly environment?: Environment;
  readonly identity: ServerReleaseIdentity | undefined;
  readonly workerKey: string;
}

/** A production worker's open proof of the exact release identity it initialized. */
export interface ServerWorkerReadinessLease {
  readonly closed: boolean;
  readonly entrypoint: string;
  readonly identityFile: string;
  readonly releaseId: string;
  readonly serverBuildId: string;
  readonly workerKey: string;
  close(): void;
}

export function createServerWorkerReadiness({
  identity,
  productId,
  workerKey,
}: CreateServerWorkerReadinessOptions): ServerWorkerReadiness {
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
 * that read-only descriptor until the idempotent close handle is invoked.
 */
export function acquireServerWorkerReadinessLease({
  environment = process.env,
  identity,
  workerKey,
}: AcquireServerWorkerReadinessLeaseOptions):
  ServerWorkerReadinessLease | undefined {
  const requestedWorkerKey = releaseIdentifier(workerKey, "workerKey");
  const nodeEnvironment = nodeEnvironmentValue(environment);
  if (releaseValidationEnvironmentValue(environment)) {
    return undefined;
  }
  if (nodeEnvironment !== "production") return undefined;
  if (identity === undefined) {
    throw new Error(
      "Production server worker readiness requires a sealed release identity.",
    );
  }

  const pinnedIdentity = parseServerReleaseIdentity(identity);
  const worker = declaredWorker(pinnedIdentity, requestedWorkerKey);
  const identityLease = acquireServerReleaseIdentityFileLease({
    environment,
    identity,
  });
  return Object.freeze({
    get closed(): boolean {
      return identityLease.closed;
    },
    close(): void {
      identityLease.close();
    },
    entrypoint: worker.entrypoint,
    identityFile: identityLease.identityFile,
    releaseId: pinnedIdentity.releaseId,
    serverBuildId: pinnedIdentity.serverBuildId,
    workerKey: worker.key,
  });
}

export function parseServerWorkerReadiness(
  value: unknown,
): ServerWorkerReadiness {
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
    throw new Error(
      `Server worker readiness type must be ${SERVER_WORKER_READINESS_TYPE}.`,
    );
  }
  const productId = productIdentifier(message["productId"]);
  const releaseId = releaseIdentifier(message["releaseId"], "releaseId");
  const workerKey = releaseIdentifier(message["workerKey"], "workerKey");
  const serverBuildId = stringMatching(
    message["serverBuildId"],
    /^server-[a-f0-9]{64}$/,
    "serverBuildId",
  );
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
    entrypoint: declaration.workers[0]!.entrypoint,
  });
}

/**
 * Send one readiness receipt only inside shared release validation. Ordinary production and
 * development workers have no IPC parent, so the same startup path remains portable.
 */
export async function signalServerWorkerReadiness(
  readiness: ServerWorkerReadiness,
  {
    channel = processChannel(),
    environment = process.env,
  }: SignalServerWorkerReadinessOptions = {},
): Promise<boolean> {
  if (!releaseValidationEnvironmentValue(environment)) {
    return false;
  }
  const pinned = parseServerWorkerReadiness(readiness);
  if (
    !channel ||
    channel.connected === false ||
    typeof channel.ref !== "function" ||
    typeof channel.unref !== "function"
  ) {
    throw new Error(
      "Server worker release validation requires an open referenceable IPC channel.",
    );
  }

  try {
    channel.ref();
  } catch (error) {
    throw new Error(
      "Could not keep the server worker validation IPC channel active.",
      { cause: error },
    );
  }

  let sendFailure: unknown;
  try {
    await new Promise<void>((resolve, reject) => {
      try {
        channel.send(pinned, (error) => {
          if (error) {
            reject(
              new Error("Could not send server worker readiness over IPC.", {
                cause: error,
              }),
            );
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(
          new Error("Could not send server worker readiness over IPC.", {
            cause: error,
          }),
        );
      }
    });
  } catch (error) {
    sendFailure = error;
  }

  if (sendFailure !== undefined) {
    try {
      channel.unref();
    } catch (releaseError) {
      throw new AggregateError(
        [sendFailure, releaseError],
        "Server worker readiness failed and its IPC lifecycle reference could not be released.",
      );
    }
    throw sendFailure;
  }
  return true;
}

function declaredWorker(identity: ServerReleaseIdentity, workerKey: string) {
  const worker = identity.workers.find(
    (candidate) => candidate.key === workerKey,
  );
  if (!worker) {
    throw new Error(
      `Server release identity does not declare worker ${workerKey}.`,
    );
  }
  return worker;
}

function processChannel(): ServerWorkerReadinessChannel | undefined {
  const channel = process.channel;
  if (typeof process.send !== "function" || !channel) return undefined;
  return {
    get connected() {
      return process.connected;
    },
    ref() {
      channel.ref();
    },
    send(message, callback) {
      return process.send!(message, callback);
    },
    unref() {
      channel.unref();
    },
  };
}

function productIdentifier(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new Error("Server worker readiness productId is invalid.");
  }
  return value;
}

function releaseIdentifier(value: unknown, label: string): string {
  return stringMatching(
    value,
    /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i,
    label,
  );
}

function stringMatching(
  value: unknown,
  pattern: RegExp,
  label: string,
): string {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new Error(`Server worker readiness ${label} is invalid.`);
  }
  return value;
}

function plainObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  const prototype = Object.getPrototypeOf(value) as unknown;
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} must be a plain object.`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): void {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error("Server worker readiness fields are invalid.");
  }
}
