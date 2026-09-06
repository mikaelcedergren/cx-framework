import type { JsonValue } from "./errors.js";
import {
  withImmediateTransaction,
  type SqliteRow,
  type SyncSqliteDatabase,
} from "./sqlite.js";
import { assertTimerDelayMilliseconds } from "./timer.js";

export type DurableJobStatus =
  "blocked" | "failed" | "queued" | "running" | "succeeded";

/**
 * `barrier-recovery` is an explicit escape lane for work whose successful completion can make a
 * queue-wide barrier recoverable. A product must atomically materialize the obligation and enough
 * bounded recovery state before enqueueing one. Ordinary work always uses `standard`.
 */
export type DurableJobExecutionClass = "barrier-recovery" | "standard";

export interface DurableJob {
  readonly executionScope: string;
  readonly attempts: number;
  readonly availableAt: number;
  readonly createdAt: number;
  readonly executionClass: DurableJobExecutionClass;
  readonly failureCode: string | null;
  readonly failureMessage: string | null;
  readonly finishedAt: number | null;
  readonly id: string;
  readonly idempotencyKey: string;
  readonly leaseExpiresAt: number | null;
  readonly leaseOwner: string | null;
  readonly leaseToken: string | null;
  readonly maxAttempts: number;
  readonly payload: JsonValue;
  readonly scheduledAt: number;
  readonly startedAt: number | null;
  readonly status: DurableJobStatus;
  readonly type: string;
  readonly updatedAt: number;
}

export interface DurableJobClaim extends DurableJob {
  readonly leaseExpiresAt: number;
  readonly leaseOwner: string;
  readonly leaseToken: string;
  readonly status: "running";
}

export interface EnqueueDurableJob {
  readonly availableAt?: number;
  readonly executionClass?: DurableJobExecutionClass;
  readonly idempotencyKey: string;
  readonly maxAttempts?: number;
  readonly payload: JsonValue;
  readonly type: string;
}

export interface DurableJobEnqueueResult {
  readonly created: boolean;
  readonly job: DurableJob;
}

/** A synchronous enqueue surface that exists only while the store-owned transaction is active. */
export interface DurableJobTransaction {
  enqueue(input: EnqueueDurableJob): DurableJobEnqueueResult;
}

export interface DurableJobFailure {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

/**
 * Release an owned claim without charging an attempt and stop later work from overtaking it.
 *
 * This is deliberately narrower than ordinary retry. It exists for a queue-wide resource barrier
 * such as a full SQLite database: consuming another attempt cannot repair capacity, and letting a
 * later write run first would make the failure order-dependent. The blocked row remains durable
 * across restarts and is always reclaimed before normal queued work once it becomes available.
 * Explicit `barrier-recovery` jobs are the sole exception: they may run while a blocked barrier
 * waits because their product-owned, preallocated recovery state can remove that barrier's cause.
 */
export interface DurableJobDeferral {
  readonly availableAt: number;
  readonly code: string;
  readonly message: string;
  readonly type: "defer";
}

/**
 * Release an owned claim without charging an attempt while allowing unrelated work to continue.
 *
 * Delay is for a job-local prerequisite that is expected to become available later, such as an
 * optional provider being configured. Unlike `DurableJobDeferral`, it never creates or preserves
 * a queue-wide barrier.
 */
export interface DurableJobDelay {
  readonly availableAt: number;
  readonly code: string;
  readonly message: string;
  readonly type: "delay";
}

export type DurableJobDisposition =
  DurableJobDeferral | DurableJobDelay | DurableJobFailure;

export interface DurableJobFailureResult {
  readonly availableAt: number | null;
  readonly status: "blocked" | "failed" | "queued";
}

export interface DurableJobDeferralResult {
  readonly availableAt: number;
  readonly status: "blocked";
}

export interface DurableJobDelayResult {
  readonly availableAt: number;
  readonly status: "queued";
}

export interface DurableJobRecoveryResult {
  readonly failed: number;
  readonly retried: number;
}

export interface DurableJobStore {
  readonly executionScope: string;
  readonly leaseDurationMs: number;
  readonly maxConcurrentJobs: number;
  claim(owner: string): DurableJobClaim | null;
  complete(claim: DurableJobClaim): void;
  delay(claim: DurableJobClaim, delay: DurableJobDelay): DurableJobDelayResult;
  defer(
    claim: DurableJobClaim,
    deferral: DurableJobDeferral,
  ): DurableJobDeferralResult;
  enqueue(input: EnqueueDurableJob): DurableJobEnqueueResult;
  fail(
    claim: DurableJobClaim,
    failure: DurableJobFailure,
  ): DurableJobFailureResult;
  get(id: string): DurableJob | null;
  heartbeat(claim: DurableJobClaim): number;
  pruneTerminal(before: number, limit: number): number;
  recoverExpired(): DurableJobRecoveryResult;
  /** Atomically compose synchronous product writes and durable enqueueing on this database. */
  withTransaction<Result>(
    work: (transaction: DurableJobTransaction) => Result,
  ): Result;
}

export interface DurableJobStoreOptions {
  readonly executionScope: string;
  readonly createJobId: () => string;
  readonly createLeaseToken: () => string;
  readonly database: SyncSqliteDatabase;
  readonly leaseDurationMs: number;
  /**
   * Maximum claims that may be valid across every process sharing this execution scope.
   * Every claim-capable store sharing this scope must configure the same value. Use `1` when
   * queue-wide deferral must preserve strict execution order.
   */
  readonly maxConcurrentJobs: number;
  readonly maxOutstandingJobs: number;
  readonly maxPayloadBytes?: number;
  readonly maxRetainedJobs: number;
  readonly now: () => number;
  readonly recoveryBatchSize: number;
  readonly retryInitialDelayMs: number;
  readonly retryMaximumDelayMs: number;
}

export interface DurableJobExecutionContext {
  readonly executionScope: string;
  readonly attempt: number;
  readonly idempotencyKey: string;
  readonly jobId: string;
  readonly maxAttempts: number;
  readonly signal: AbortSignal;
  heartbeat(): number;
}

export type DurableJobHandler = (
  payload: JsonValue,
  context: DurableJobExecutionContext,
) => Promise<void>;

export interface DurableWorker {
  readonly accepting: boolean;
  readonly running: boolean;
  abortActive(reason?: unknown): void;
  drain(timeoutMs: number): Promise<void>;
  runUntilIdle(): Promise<number>;
  stopClaiming(): void;
}

export interface DurableWorkerOptions {
  readonly classifyFailure: (
    error: unknown,
    claim: DurableJobClaim,
  ) => DurableJobDisposition;
  readonly createAbortController?: () => AbortController;
  readonly handlers: Readonly<Record<string, DurableJobHandler>>;
  readonly heartbeatIntervalMs?: number;
  readonly owner: string;
  readonly scheduleHeartbeat?: (
    intervalMs: number,
    onHeartbeat: () => void,
  ) => () => void;
  readonly scheduleTimeout?: (
    timeoutMs: number,
    onTimeout: () => void,
  ) => () => void;
  readonly store: DurableJobStore;
}

interface DurableJobRow extends SqliteRow {
  readonly execution_scope: string;
  readonly attempts: number;
  readonly available_at: number;
  readonly created_at: number;
  readonly execution_class: string;
  readonly failure_code: string | null;
  readonly failure_message: string | null;
  readonly finished_at: number | null;
  readonly id: string;
  readonly idempotency_key: string;
  readonly lease_expires_at: number | null;
  readonly lease_owner: string | null;
  readonly lease_token: string | null;
  readonly max_attempts: number;
  readonly payload_json: string;
  readonly scheduled_at: number;
  readonly started_at: number | null;
  readonly status: string;
  readonly type: string;
  readonly updated_at: number;
}

interface ExpiredJobRow extends SqliteRow {
  readonly attempts: number;
  readonly barrier: number;
  readonly id: string;
  readonly lease_owner: string;
  readonly lease_token: string;
  readonly max_attempts: number;
}

const JOB_TYPE_PATTERN = /^[a-z][a-z0-9_.:-]{0,127}$/;
const FAILURE_CODE_PATTERN = /^[a-z][a-z0-9_]{0,127}$/;
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const MAX_IDEMPOTENCY_KEY_LENGTH = 512;
const MAX_FAILURE_MESSAGE_LENGTH = 2_048;
const DEFAULT_MAX_PAYLOAD_BYTES = 65_536;
const MAX_BATCH_SIZE = 10_000;
const BARRIER_RECOVERY_RESERVE_BYTES = 4_096;
const UTF8_ENCODER = new TextEncoder();

/** Canonical durable-job table owned through each product's append-only migration history. */
export const DURABLE_JOB_TABLE = "cx_jobs";

/**
 * Immutable durable-job schema history for product-owned migration ledgers.
 *
 * Products assign these statements their own contiguous migration versions. Issued entries are
 * append-only: changing an existing entry would invalidate a product's already-applied migration
 * fingerprint. A new queue capability therefore always adds a new entry.
 */
const ISSUED_DURABLE_JOB_MIGRATIONS = Object.freeze([
  Object.freeze({
    version: 1,
    name: "initial_durable_jobs",
    statements: Object.freeze([
      `CREATE TABLE ${DURABLE_JOB_TABLE} (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('blocked', 'queued', 'running', 'succeeded', 'failed')),
    barrier INTEGER NOT NULL DEFAULT 0 CHECK (barrier IN (0, 1)),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INTEGER NOT NULL CHECK (max_attempts >= 1 AND attempts <= max_attempts),
    scheduled_at INTEGER NOT NULL CHECK (scheduled_at >= 0),
    available_at INTEGER NOT NULL CHECK (available_at >= 0),
    lease_owner TEXT,
    lease_token TEXT UNIQUE,
    lease_expires_at INTEGER,
    started_at INTEGER,
    finished_at INTEGER,
    failure_code TEXT,
    failure_message TEXT,
    created_at INTEGER NOT NULL CHECK (created_at >= 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= 0),
    UNIQUE (type, idempotency_key),
    CHECK (
      (status = 'running' AND lease_owner IS NOT NULL AND lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)
      OR
      (status <> 'running' AND lease_owner IS NULL AND lease_token IS NULL AND lease_expires_at IS NULL)
    ),
    CHECK (
      (status IN ('succeeded', 'failed') AND finished_at IS NOT NULL)
      OR
      (status IN ('blocked', 'queued', 'running') AND finished_at IS NULL)
    ),
    CHECK (
      (barrier = 1 AND status IN ('blocked', 'running'))
      OR
      (barrier = 0 AND status <> 'blocked')
    )
  ) STRICT`,
      `CREATE INDEX cx_jobs_claim_order
   ON ${DURABLE_JOB_TABLE} (status, available_at, created_at, id)`,
      `CREATE INDEX cx_jobs_expired_leases
   ON ${DURABLE_JOB_TABLE} (status, lease_expires_at)
   WHERE status = 'running'`,
      `CREATE INDEX cx_jobs_terminal_retention
   ON ${DURABLE_JOB_TABLE} (status, finished_at, id)
   WHERE status IN ('succeeded', 'failed')`,
    ] as const),
  }),
  Object.freeze({
    version: 2,
    name: "barrier_recovery_execution_class",
    statements: Object.freeze([
      `ALTER TABLE ${DURABLE_JOB_TABLE}
       ADD COLUMN execution_class TEXT NOT NULL DEFAULT 'standard'
         CHECK (execution_class IN ('standard', 'barrier-recovery'))`,
      `ALTER TABLE ${DURABLE_JOB_TABLE}
       ADD COLUMN barrier_recovery_reserve BLOB
         CHECK (
           barrier_recovery_reserve IS NULL
           OR length(barrier_recovery_reserve) = ${BARRIER_RECOVERY_RESERVE_BYTES}
         )`,
      `CREATE TRIGGER cx_jobs_recovery_reserve_insert
       BEFORE INSERT ON ${DURABLE_JOB_TABLE}
       WHEN NEW.execution_class = 'standard' AND NEW.barrier_recovery_reserve IS NOT NULL
       BEGIN
         SELECT RAISE(ABORT, 'standard jobs cannot hold barrier-recovery reserve');
       END`,
      `CREATE TRIGGER cx_jobs_recovery_reserve_update
       BEFORE UPDATE OF execution_class, barrier_recovery_reserve ON ${DURABLE_JOB_TABLE}
       WHEN NEW.execution_class = 'standard' AND NEW.barrier_recovery_reserve IS NOT NULL
       BEGIN
         SELECT RAISE(ABORT, 'standard jobs cannot hold barrier-recovery reserve');
       END`,
    ] as const),
  }),
  Object.freeze({
    version: 3,
    name: "immutable_job_input_identity",
    statements: Object.freeze([
      `CREATE TRIGGER cx_jobs_immutable_input_update
       BEFORE UPDATE OF id, type, payload_json, idempotency_key, execution_class,
                        max_attempts, scheduled_at, created_at
       ON ${DURABLE_JOB_TABLE}
       WHEN NEW.id IS NOT OLD.id
         OR NEW.type IS NOT OLD.type
         OR NEW.payload_json IS NOT OLD.payload_json
         OR NEW.idempotency_key IS NOT OLD.idempotency_key
         OR NEW.execution_class IS NOT OLD.execution_class
         OR NEW.max_attempts IS NOT OLD.max_attempts
         OR NEW.scheduled_at IS NOT OLD.scheduled_at
         OR NEW.created_at IS NOT OLD.created_at
       BEGIN
         SELECT RAISE(ABORT, 'durable job immutable input cannot change after enqueue');
       END`,
      `CREATE TRIGGER cx_jobs_active_delete_guard
       BEFORE DELETE ON ${DURABLE_JOB_TABLE}
       WHEN OLD.status NOT IN ('succeeded', 'failed')
       BEGIN
         SELECT RAISE(ABORT, 'active durable jobs cannot be deleted');
       END`,
      `CREATE TRIGGER cx_jobs_recovery_reserve_contract_insert
       BEFORE INSERT ON ${DURABLE_JOB_TABLE}
       WHEN NEW.execution_class = 'barrier-recovery'
         AND (
           (
             NEW.status IN ('blocked', 'queued')
             AND (
               NEW.barrier_recovery_reserve IS NULL
               OR length(NEW.barrier_recovery_reserve) <> ${BARRIER_RECOVERY_RESERVE_BYTES}
             )
           )
           OR
           (
             NEW.status IN ('running', 'succeeded', 'failed')
             AND NEW.barrier_recovery_reserve IS NOT NULL
           )
         )
       BEGIN
         SELECT RAISE(ABORT, 'barrier-recovery reserve does not match job state');
       END`,
      `CREATE TRIGGER cx_jobs_recovery_reserve_contract_update
       BEFORE UPDATE OF status, execution_class, barrier_recovery_reserve
       ON ${DURABLE_JOB_TABLE}
       WHEN NEW.execution_class = 'barrier-recovery'
         AND NEW.execution_class IS OLD.execution_class
         AND (
           (
             NEW.status IN ('blocked', 'queued')
             AND (
               NEW.barrier_recovery_reserve IS NULL
               OR length(NEW.barrier_recovery_reserve) <> ${BARRIER_RECOVERY_RESERVE_BYTES}
             )
           )
           OR
           (
             NEW.status IN ('running', 'succeeded', 'failed')
             AND NEW.barrier_recovery_reserve IS NOT NULL
           )
         )
       BEGIN
         SELECT RAISE(ABORT, 'barrier-recovery reserve does not match job state');
       END`,
    ] as const),
  }),
  Object.freeze({
    version: 4,
    name: "durable_job_replacement_guard",
    statements: Object.freeze([
      `CREATE TABLE main.cx_jobs_v4_validation (
         invalid_state INTEGER NOT NULL
       ) STRICT`,
      `INSERT INTO main.cx_jobs_v4_validation (invalid_state)
       SELECT NULL
       WHERE EXISTS (
         SELECT 1
         FROM main.${DURABLE_JOB_TABLE}
         WHERE rowid <= 0
            OR NOT (
              (
                execution_class = 'standard'
                AND barrier_recovery_reserve IS NULL
              )
              OR
              (
                execution_class = 'barrier-recovery'
                AND (
                  (
                    status IN ('blocked', 'queued')
                    AND barrier_recovery_reserve IS NOT NULL
                    AND length(barrier_recovery_reserve) = ${BARRIER_RECOVERY_RESERVE_BYTES}
                  )
                  OR
                  (
                    status IN ('running', 'succeeded', 'failed')
                    AND barrier_recovery_reserve IS NULL
                  )
                )
              )
            )
       )`,
      `DROP TABLE main.cx_jobs_v4_validation`,
      `CREATE TRIGGER cx_jobs_insert_conflict_guard
       BEFORE INSERT ON ${DURABLE_JOB_TABLE}
       WHEN NEW.rowid <> -1
         OR EXISTS (
           SELECT 1
           FROM ${DURABLE_JOB_TABLE} AS existing
           WHERE existing.id = NEW.id
              OR (
                existing.type = NEW.type
                AND existing.idempotency_key = NEW.idempotency_key
              )
              OR (
                NEW.lease_token IS NOT NULL
                AND existing.lease_token = NEW.lease_token
              )
       )
       BEGIN
         SELECT RAISE(ABORT, 'durable job insert conflicts cannot replace existing jobs');
       END`,
      `CREATE TRIGGER cx_jobs_rowid_contract_insert
       AFTER INSERT ON ${DURABLE_JOB_TABLE}
       WHEN NEW.rowid <= 0
       BEGIN
         SELECT RAISE(ABORT, 'durable jobs require framework-owned positive row IDs');
       END`,
      `CREATE TRIGGER cx_jobs_update_conflict_guard
       BEFORE UPDATE OF rowid, _rowid_, oid, id, type, idempotency_key, lease_token
       ON ${DURABLE_JOB_TABLE}
       WHEN NEW.rowid IS NOT OLD.rowid
         OR EXISTS (
           SELECT 1
           FROM ${DURABLE_JOB_TABLE} AS existing
           WHERE existing.rowid <> OLD.rowid
             AND (
               existing.id = NEW.id
               OR (
                 existing.type = NEW.type
                 AND existing.idempotency_key = NEW.idempotency_key
               )
               OR (
                 NEW.lease_token IS NOT NULL
                 AND existing.lease_token = NEW.lease_token
               )
             )
       )
       BEGIN
         SELECT RAISE(ABORT, 'durable job update conflicts cannot replace existing jobs');
       END`,
    ] as const),
  }),
] as const);

/** Existing unscoped jobs are held for an explicit offline ownership decision. */
export const LEGACY_DURABLE_JOB_SCOPE = "legacy";

export const DURABLE_JOB_SCHEMA_MIGRATIONS = Object.freeze([
  ...ISSUED_DURABLE_JOB_MIGRATIONS,
  Object.freeze({
    version: 5,
    name: "durable_job_execution_scopes",
    rebuildReferencedTables: true,
    statements: Object.freeze([
      ISSUED_DURABLE_JOB_MIGRATIONS[0].statements[0]
        .replace(
          `CREATE TABLE ${DURABLE_JOB_TABLE}`,
          "CREATE TABLE cx_jobs_scoped",
        )
        .replace(
          "UNIQUE (type, idempotency_key)",
          `execution_class TEXT NOT NULL DEFAULT 'standard' CHECK (execution_class IN ('standard', 'barrier-recovery')),
    barrier_recovery_reserve BLOB CHECK (barrier_recovery_reserve IS NULL OR length(barrier_recovery_reserve) = ${BARRIER_RECOVERY_RESERVE_BYTES}),
    execution_scope TEXT NOT NULL CHECK (length(execution_scope) BETWEEN 1 AND 64 AND execution_scope NOT GLOB '*[^a-z0-9_-]*'),
    UNIQUE (execution_scope, type, idempotency_key)`,
        ),
      `INSERT INTO cx_jobs_scoped (rowid, id, type, payload_json, idempotency_key, status,
         barrier, attempts, max_attempts, scheduled_at, available_at, lease_owner, lease_token,
         lease_expires_at, started_at, finished_at, failure_code, failure_message,
         created_at, updated_at, execution_class, barrier_recovery_reserve, execution_scope)
       SELECT rowid, *, '${LEGACY_DURABLE_JOB_SCOPE}' FROM ${DURABLE_JOB_TABLE}`,
      `DROP TABLE ${DURABLE_JOB_TABLE}`,
      `ALTER TABLE cx_jobs_scoped RENAME TO ${DURABLE_JOB_TABLE}`,
      ...ISSUED_DURABLE_JOB_MIGRATIONS.flatMap(({ statements }) => statements)
        .filter((sql) => /^CREATE (?:INDEX|TRIGGER) /.test(sql))
        .map((sql) =>
          sql
            .replaceAll(
              "existing.type = NEW.type",
              "existing.execution_scope = NEW.execution_scope AND existing.type = NEW.type",
            )
            .replace(
              "BEFORE UPDATE OF rowid,",
              "BEFORE UPDATE OF execution_scope, rowid,",
            )
            .replaceAll(
              `ON ${DURABLE_JOB_TABLE} (status,`,
              `ON ${DURABLE_JOB_TABLE} (execution_scope, status,`,
            ),
        ),
      `CREATE TRIGGER cx_jobs_scope_immutable
       BEFORE UPDATE OF execution_scope ON ${DURABLE_JOB_TABLE}
       WHEN OLD.execution_scope <> '${LEGACY_DURABLE_JOB_SCOPE}' AND NEW.execution_scope IS NOT OLD.execution_scope
       BEGIN
         SELECT RAISE(ABORT, 'durable job execution scope is immutable');
       END`,
    ] as const),
  }),
] as const);

export function validateDurableJobExecutionScope(value: string): string {
  if (
    typeof value !== "string" ||
    !/^[a-z][a-z0-9_-]{0,63}$/.test(value) ||
    value === LEGACY_DURABLE_JOB_SCOPE
  ) {
    throw new Error(
      "A durable job store requires an explicit non-legacy execution scope.",
    );
  }
  return value;
}

/**
 * Explicit offline ownership assignment, never worker recovery. Previously attempted active work
 * requires a product-specific outcome decision first; it is never replayed by assigning a scope.
 * Products synchronize their request metadata inside the same transaction through afterAssign.
 */
export function assignLegacyDurableJobScopes({
  database,
  assignments,
  afterAssign,
}: {
  readonly database: SyncSqliteDatabase;
  readonly assignments: readonly {
    readonly id: string;
    readonly executionScope: string;
  }[];
  readonly afterAssign?: () => void;
}): number {
  assertBoundedBatchSize(assignments.length, "Legacy job assignment batch");
  const selected = assignments.map(({ id, executionScope }) => ({
    id: validateGeneratedIdentifier(id, "legacy job ID"),
    executionScope: validateDurableJobExecutionScope(executionScope),
  }));
  if (new Set(selected.map(({ id }) => id)).size !== selected.length) {
    throw new Error("Legacy job assignments must name each job exactly once.");
  }
  return withImmediateTransaction(database, () => {
    for (const { id, executionScope } of selected) {
      const result = database.run(
        `UPDATE ${DURABLE_JOB_TABLE} SET execution_scope = ?
         WHERE id = ? AND execution_scope = '${LEGACY_DURABLE_JOB_SCOPE}'
           AND (status IN ('succeeded', 'failed') OR (status = 'queued' AND attempts = 0))`,
        [executionScope, id],
      );
      if (result.changes !== 1)
        throw new Error(
          `Legacy job ${id} requires an outcome decision or is already assigned.`,
        );
    }
    const result: unknown = afterAssign?.();
    if (result && typeof result === "object" && "then" in result) {
      throw new Error(
        "Legacy job ownership synchronization must be synchronous.",
      );
    }
    return selected.length;
  });
}

export class JobIdempotencyConflictError extends Error {
  constructor(type: string, idempotencyKey: string) {
    super(
      `Durable job ${type}:${idempotencyKey} was enqueued again with different immutable input.`,
    );
    this.name = "JobIdempotencyConflictError";
  }
}

export class StaleJobClaimError extends Error {
  constructor(jobId: string) {
    super(`Durable job claim is stale or no longer owned: ${jobId}.`);
    this.name = "StaleJobClaimError";
  }
}

export class DurableJobCapacityError extends Error {
  constructor(maximum: number) {
    super(
      `The durable queue already contains its ${maximum} outstanding jobs.`,
    );
    this.name = "DurableJobCapacityError";
  }
}

export class DurableJobRetentionCapacityError extends Error {
  constructor(maximum: number) {
    super(
      `The durable queue retains ${maximum} jobs; prune terminal history before enqueueing more work.`,
    );
    this.name = "DurableJobRetentionCapacityError";
  }
}

export class DurableWorkerDrainTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`The durable worker did not drain within ${timeoutMs}ms.`);
    this.name = "DurableWorkerDrainTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function boundedExponentialBackoff(
  attempt: number,
  initialDelayMs: number,
  maximumDelayMs: number,
): number {
  assertPositiveSafeInteger(attempt, "Job attempt");
  assertPositiveSafeInteger(initialDelayMs, "Initial retry delay");
  assertPositiveSafeInteger(maximumDelayMs, "Maximum retry delay");
  if (maximumDelayMs < initialDelayMs) {
    throw new Error(
      "Maximum retry delay must be greater than or equal to the initial delay.",
    );
  }
  const multiplier = 2 ** Math.min(52, attempt - 1);
  return Math.min(maximumDelayMs, initialDelayMs * multiplier);
}

export function createDurableJobStore({
  executionScope,
  createJobId,
  createLeaseToken,
  database,
  leaseDurationMs,
  maxConcurrentJobs,
  maxOutstandingJobs,
  maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES,
  maxRetainedJobs,
  now,
  recoveryBatchSize,
  retryInitialDelayMs,
  retryMaximumDelayMs,
}: DurableJobStoreOptions): DurableJobStore {
  const scope = validateDurableJobExecutionScope(executionScope);
  for (const [label, value] of [
    ["job ID generator", createJobId],
    ["lease-token generator", createLeaseToken],
    ["job clock", now],
  ] as const) {
    if (typeof value !== "function") {
      throw new Error(`The durable ${label} must be a function.`);
    }
  }
  assertPositiveSafeInteger(leaseDurationMs, "Job lease duration");
  assertPositiveSafeInteger(maxConcurrentJobs, "Concurrent job capacity");
  assertPositiveSafeInteger(maxOutstandingJobs, "Outstanding job capacity");
  if (maxConcurrentJobs > maxOutstandingJobs) {
    throw new Error(
      "Concurrent job capacity cannot exceed outstanding job capacity.",
    );
  }
  assertPositiveSafeInteger(maxPayloadBytes, "Maximum job payload size");
  assertPositiveSafeInteger(maxRetainedJobs, "Retained job capacity");
  if (maxRetainedJobs < maxOutstandingJobs) {
    throw new Error(
      "Retained job capacity must be greater than or equal to outstanding job capacity.",
    );
  }
  assertBoundedBatchSize(recoveryBatchSize, "Job recovery batch size");
  boundedExponentialBackoff(1, retryInitialDelayMs, retryMaximumDelayMs);

  function clock(): number {
    const value = now();
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(
        "The durable job clock must return non-negative epoch milliseconds.",
      );
    }
    return value;
  }

  function recoverExpiredAt(timestamp: number): DurableJobRecoveryResult {
    let retried = 0;
    let failed = 0;
    const expired = database.all<ExpiredJobRow>(
      `SELECT id, lease_owner, lease_token, attempts, max_attempts, barrier
       FROM ${DURABLE_JOB_TABLE}
       WHERE execution_scope = ? AND status = 'running' AND lease_expires_at <= ?
       ORDER BY lease_expires_at, id
       LIMIT ?`,
      [scope, timestamp, recoveryBatchSize],
    );

    for (const row of expired) {
      const id = textColumn(row, "id");
      const leaseOwner = textColumn(row, "lease_owner");
      const leaseToken = textColumn(row, "lease_token");
      const attempts = integerColumn(row, "attempts");
      const maxAttempts = integerColumn(row, "max_attempts");
      const barrier = integerColumn(row, "barrier");
      if (barrier !== 0 && barrier !== 1) {
        throw new Error(
          `SQLite returned an invalid durable barrier flag for ${id}.`,
        );
      }
      if (attempts < maxAttempts) {
        const availableAt = safeAdd(
          timestamp,
          boundedExponentialBackoff(
            attempts,
            retryInitialDelayMs,
            retryMaximumDelayMs,
          ),
          "Recovered job retry time",
        );
        const result = database.run(
          `UPDATE ${DURABLE_JOB_TABLE}
           SET status = CASE WHEN barrier = 1 THEN 'blocked' ELSE 'queued' END,
               available_at = ?, lease_owner = NULL,
               lease_token = NULL, lease_expires_at = NULL, started_at = NULL,
               barrier_recovery_reserve = CASE
                 WHEN execution_class = 'barrier-recovery'
                   THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES})
                 ELSE NULL
               END,
               failure_code = 'lease_expired',
               failure_message = 'The previous worker stopped before completing this job.',
               updated_at = ?
           WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
             AND lease_token = ? AND attempts = ?
             AND lease_expires_at <= ?`,
          [
            availableAt,
            timestamp,
            scope,
            id,
            leaseOwner,
            leaseToken,
            attempts,
            timestamp,
          ],
        );
        assertSingleTransition(result.changes, id);
        retried += 1;
      } else {
        const result = database.run(
          `UPDATE ${DURABLE_JOB_TABLE}
           SET status = 'failed', barrier = 0, lease_owner = NULL, lease_token = NULL,
               lease_expires_at = NULL, failure_code = 'lease_expired',
               failure_message = 'The worker stopped and this job exhausted its attempts.',
               barrier_recovery_reserve = NULL, finished_at = ?, updated_at = ?
           WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
             AND lease_token = ? AND attempts = ?
             AND lease_expires_at <= ?`,
          [
            timestamp,
            timestamp,
            scope,
            id,
            leaseOwner,
            leaseToken,
            attempts,
            timestamp,
          ],
        );
        assertSingleTransition(result.changes, id);
        failed += 1;
      }
    }
    return Object.freeze({ failed, retried });
  }

  function enqueueInCurrentTransaction(
    input: EnqueueDurableJob,
  ): DurableJobEnqueueResult {
    if (!input || typeof input !== "object") {
      throw new Error("A durable job enqueue input is required.");
    }
    const type = validateJobType(input.type);
    const executionClass = validateExecutionClass(
      input.executionClass ?? "standard",
    );
    const idempotencyKey = validateIdempotencyKey(input.idempotencyKey);
    const maxAttempts = input.maxAttempts ?? 3;
    assertPositiveSafeInteger(maxAttempts, "Maximum job attempts");
    const timestamp = clock();
    if (input.availableAt !== undefined) {
      assertNonNegativeSafeInteger(input.availableAt, "Job availability time");
    }
    const payloadJson = serializePayload(input.payload, maxPayloadBytes);

    const existing = database.get<DurableJobRow>(
      `SELECT * FROM ${DURABLE_JOB_TABLE}
       WHERE execution_scope = ? AND type = ? AND idempotency_key = ?`,
      [scope, type, idempotencyKey],
    );
    const scheduledAt =
      input.availableAt ??
      (existing ? integerColumn(existing, "scheduled_at") : timestamp);
    if (existing) {
      assertIdempotentInput(existing, {
        idempotencyKey,
        executionClass,
        maxAttempts,
        payloadJson,
        scheduledAt,
        type,
      });
      return Object.freeze({ created: false, job: parseJob(existing) });
    }

    const totalCount = database.get(
      `SELECT COUNT(*) AS count FROM ${DURABLE_JOB_TABLE}`,
    );
    if (!totalCount) {
      throw new Error("SQLite did not return the retained job count.");
    }
    if (integerColumn(totalCount, "count") >= maxRetainedJobs) {
      throw new DurableJobRetentionCapacityError(maxRetainedJobs);
    }

    const outstandingCount = database.get(
      `SELECT COUNT(*) AS count
       FROM ${DURABLE_JOB_TABLE}
       WHERE execution_scope = ? AND status IN ('blocked', 'queued', 'running')`,
      [scope],
    );
    if (!outstandingCount) {
      throw new Error("SQLite did not return the outstanding job count.");
    }
    if (integerColumn(outstandingCount, "count") >= maxOutstandingJobs) {
      throw new DurableJobCapacityError(maxOutstandingJobs);
    }

    const id = validateGeneratedIdentifier(createJobId(), "job ID");
    const result = database.run(
      `INSERT INTO ${DURABLE_JOB_TABLE}
         (execution_scope, id, type, payload_json, idempotency_key, status, execution_class,
          barrier_recovery_reserve, attempts,
          max_attempts, scheduled_at, available_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'queued', ?,
               CASE WHEN ? = 'barrier-recovery' THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES}) ELSE NULL END,
               0, ?, ?, ?, ?, ?)`,
      [
        scope,
        id,
        type,
        payloadJson,
        idempotencyKey,
        executionClass,
        executionClass,
        maxAttempts,
        scheduledAt,
        scheduledAt,
        timestamp,
        timestamp,
      ],
    );
    if (result.changes !== 1) {
      throw new Error(
        `Durable job enqueue changed ${result.changes} rows instead of one.`,
      );
    }
    const row = database.get<DurableJobRow>(
      `SELECT * FROM ${DURABLE_JOB_TABLE} WHERE execution_scope = ? AND id = ?`,
      [scope, id],
    );
    if (!row) throw new Error("Durable job enqueue did not create its row.");
    return Object.freeze({ created: true, job: parseJob(row) });
  }

  function withJobTransaction<Result>(
    work: (transaction: DurableJobTransaction) => Result,
  ): Result {
    if (typeof work !== "function") {
      throw new Error("Durable job transaction work must be a function.");
    }
    return withImmediateTransaction(database, () => {
      let active = true;
      const transaction: DurableJobTransaction = Object.freeze({
        enqueue(input: EnqueueDurableJob) {
          if (!active) {
            throw new Error(
              "A durable job transaction cannot be used after its transaction ends.",
            );
          }
          return enqueueInCurrentTransaction(input);
        },
      });
      try {
        return work(transaction);
      } finally {
        active = false;
      }
    });
  }

  return Object.freeze({
    executionScope: scope,
    leaseDurationMs,
    maxConcurrentJobs,
    enqueue(input: EnqueueDurableJob) {
      return withJobTransaction((transaction) => transaction.enqueue(input));
    },
    claim(owner: string) {
      const safeOwner = validateGeneratedIdentifier(owner, "worker owner");
      const timestamp = clock();
      const leaseToken = validateGeneratedIdentifier(
        createLeaseToken(),
        "lease token",
      );
      const leaseExpiresAt = safeAdd(
        timestamp,
        leaseDurationMs,
        "Job lease expiry",
      );

      return withImmediateTransaction(database, () => {
        recoverExpiredAt(timestamp);
        const running = database.get(
          `SELECT COUNT(*) AS count, COALESCE(MAX(barrier), 0) AS has_barrier
           FROM ${DURABLE_JOB_TABLE}
           WHERE execution_scope = ? AND status = 'running'`,
          [scope],
        );
        if (!running) {
          throw new Error("SQLite did not return the running job count.");
        }
        const hasRunningBarrier = integerColumn(running, "has_barrier");
        if (hasRunningBarrier !== 0 && hasRunningBarrier !== 1) {
          throw new Error("SQLite returned an invalid running barrier state.");
        }
        if (
          hasRunningBarrier === 1 ||
          integerColumn(running, "count") >= maxConcurrentJobs
        ) {
          return null;
        }
        const blocked = database.get<DurableJobRow>(
          `SELECT *
           FROM ${DURABLE_JOB_TABLE}
           WHERE execution_scope = ? AND status = 'blocked'
           ORDER BY available_at, created_at, id
           LIMIT 1`,
          [scope],
        );
        const hasBlockedBarrier = blocked ? 1 : 0;
        const row = database.get<DurableJobRow>(
          `UPDATE ${DURABLE_JOB_TABLE}
           SET status = 'running', attempts = attempts + 1,
               lease_owner = ?, lease_token = ?, lease_expires_at = ?,
               started_at = ?, updated_at = ?,
               barrier_recovery_reserve = CASE
                 WHEN execution_class = 'barrier-recovery' THEN NULL
                 ELSE barrier_recovery_reserve
               END
           WHERE id = (
             SELECT id FROM (
               SELECT id, available_at, created_at, 0 AS priority
               FROM ${DURABLE_JOB_TABLE}
               WHERE execution_scope = ? AND status = 'blocked' AND available_at <= ?
               UNION ALL
               SELECT id, available_at, created_at, 1 AS priority
               FROM ${DURABLE_JOB_TABLE}
               WHERE execution_scope = ? AND status = 'queued' AND available_at <= ?
                 AND attempts < max_attempts
                 AND (? = 0 OR execution_class = 'barrier-recovery')
             )
             ORDER BY priority, available_at, created_at, id
             LIMIT 1
           )
             AND status IN ('blocked', 'queued') AND available_at <= ?
             AND (status = 'blocked' OR attempts < max_attempts)
           RETURNING *`,
          [
            safeOwner,
            leaseToken,
            leaseExpiresAt,
            timestamp,
            timestamp,
            scope,
            timestamp,
            scope,
            timestamp,
            hasBlockedBarrier,
            timestamp,
          ],
        );
        return row ? parseClaim(row) : null;
      });
    },
    heartbeat(claim: DurableJobClaim) {
      assertClaim(claim);
      const timestamp = clock();
      const requestedLeaseExpiresAt = safeAdd(
        timestamp,
        leaseDurationMs,
        "Job lease expiry",
      );
      const row = database.get(
        `UPDATE ${DURABLE_JOB_TABLE}
         SET lease_expires_at = MAX(lease_expires_at, ?), updated_at = ?
         WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ?
           AND lease_expires_at > ?
         RETURNING lease_expires_at`,
        [
          requestedLeaseExpiresAt,
          timestamp,
          scope,
          claim.id,
          claim.leaseOwner,
          claim.leaseToken,
          claim.attempts,
          timestamp,
        ],
      );
      if (!row) throw new StaleJobClaimError(claim.id);
      return integerColumn(row, "lease_expires_at");
    },
    complete(claim: DurableJobClaim) {
      assertClaim(claim);
      const timestamp = clock();
      const result = database.run(
        `UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'succeeded', barrier = 0, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, failure_code = NULL,
             failure_message = NULL, barrier_recovery_reserve = NULL,
             finished_at = ?, updated_at = ?
         WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ?
           AND lease_expires_at > ?`,
        [
          timestamp,
          timestamp,
          scope,
          claim.id,
          claim.leaseOwner,
          claim.leaseToken,
          claim.attempts,
          timestamp,
        ],
      );
      assertOwnedTransition(result.changes, claim.id);
    },
    delay(claim: DurableJobClaim, delay: DurableJobDelay) {
      assertClaim(claim);
      const safeDelay = validateDelay(delay);
      const timestamp = clock();
      if (safeDelay.availableAt <= timestamp) {
        throw new Error(
          "A durable job delay must become available after the current queue time.",
        );
      }
      const result = database.run(
        `UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'queued', barrier = 0, attempts = attempts - 1,
             available_at = ?, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, started_at = NULL, finished_at = NULL,
             barrier_recovery_reserve = CASE
               WHEN execution_class = 'barrier-recovery'
                 THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES})
               ELSE NULL
             END,
             failure_code = ?, failure_message = ?, updated_at = ?
         WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ? AND attempts > 0
           AND lease_expires_at > ?`,
        [
          safeDelay.availableAt,
          safeDelay.code,
          safeDelay.message,
          timestamp,
          scope,
          claim.id,
          claim.leaseOwner,
          claim.leaseToken,
          claim.attempts,
          timestamp,
        ],
      );
      assertOwnedTransition(result.changes, claim.id);
      return Object.freeze({
        availableAt: safeDelay.availableAt,
        status: "queued",
      });
    },
    defer(claim: DurableJobClaim, deferral: DurableJobDeferral) {
      assertClaim(claim);
      const safeDeferral = validateDeferral(deferral);
      const timestamp = clock();
      if (safeDeferral.availableAt <= timestamp) {
        throw new Error(
          "A durable job deferral must become available after the current queue time.",
        );
      }
      const result = database.run(
        `UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'blocked', barrier = 1, attempts = attempts - 1,
             available_at = ?, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, started_at = NULL, finished_at = NULL,
             barrier_recovery_reserve = CASE
               WHEN execution_class = 'barrier-recovery'
                 THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES})
               ELSE NULL
             END,
             failure_code = ?, failure_message = ?, updated_at = ?
         WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ? AND attempts > 0
           AND lease_expires_at > ?`,
        [
          safeDeferral.availableAt,
          safeDeferral.code,
          safeDeferral.message,
          timestamp,
          scope,
          claim.id,
          claim.leaseOwner,
          claim.leaseToken,
          claim.attempts,
          timestamp,
        ],
      );
      assertOwnedTransition(result.changes, claim.id);
      return Object.freeze({
        availableAt: safeDeferral.availableAt,
        status: "blocked",
      });
    },
    fail(claim: DurableJobClaim, failure: DurableJobFailure) {
      assertClaim(claim);
      const safeFailure = validateFailure(failure);
      const timestamp = clock();
      const retry = safeFailure.retryable && claim.attempts < claim.maxAttempts;
      if (retry) {
        const availableAt = safeAdd(
          timestamp,
          boundedExponentialBackoff(
            claim.attempts,
            retryInitialDelayMs,
            retryMaximumDelayMs,
          ),
          "Job retry time",
        );
        const row = database.get(
          `UPDATE ${DURABLE_JOB_TABLE}
           SET status = CASE WHEN barrier = 1 THEN 'blocked' ELSE 'queued' END,
               available_at = ?, lease_owner = NULL,
               lease_token = NULL, lease_expires_at = NULL, started_at = NULL,
               barrier_recovery_reserve = CASE
                 WHEN execution_class = 'barrier-recovery'
                   THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES})
                 ELSE NULL
               END,
               failure_code = ?, failure_message = ?, updated_at = ?
           WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
             AND lease_token = ? AND attempts = ?
             AND lease_expires_at > ?
           RETURNING status, available_at`,
          [
            availableAt,
            safeFailure.code,
            safeFailure.message,
            timestamp,
            scope,
            claim.id,
            claim.leaseOwner,
            claim.leaseToken,
            claim.attempts,
            timestamp,
          ],
        );
        if (!row) throw new StaleJobClaimError(claim.id);
        const status = statusColumn(row, "status");
        if (status !== "blocked" && status !== "queued") {
          throw new Error(
            `SQLite returned invalid retry status ${status} for ${claim.id}.`,
          );
        }
        return Object.freeze({
          availableAt: integerColumn(row, "available_at"),
          status,
        });
      }

      const result = database.run(
        `UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'failed', barrier = 0, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, failure_code = ?, failure_message = ?,
             barrier_recovery_reserve = NULL, finished_at = ?, updated_at = ?
         WHERE execution_scope = ? AND id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ?
           AND lease_expires_at > ?`,
        [
          safeFailure.code,
          safeFailure.message,
          timestamp,
          timestamp,
          scope,
          claim.id,
          claim.leaseOwner,
          claim.leaseToken,
          claim.attempts,
          timestamp,
        ],
      );
      assertOwnedTransition(result.changes, claim.id);
      return Object.freeze({ availableAt: null, status: "failed" });
    },
    get(id: string) {
      const safeId = validateGeneratedIdentifier(id, "job ID");
      const row = database.get<DurableJobRow>(
        `SELECT * FROM ${DURABLE_JOB_TABLE} WHERE execution_scope = ? AND id = ?`,
        [scope, safeId],
      );
      return row ? parseJob(row) : null;
    },
    recoverExpired() {
      const timestamp = clock();
      return withImmediateTransaction(database, () =>
        recoverExpiredAt(timestamp),
      );
    },
    withTransaction: withJobTransaction,
    pruneTerminal(before: number, limit: number) {
      assertNonNegativeSafeInteger(before, "Job-retention cutoff");
      assertBoundedBatchSize(limit, "Job-retention batch size");
      return database.run(
        `DELETE FROM ${DURABLE_JOB_TABLE}
         WHERE id IN (
           SELECT id
           FROM ${DURABLE_JOB_TABLE}
           WHERE execution_scope = ? AND status IN ('succeeded', 'failed') AND finished_at < ?
           ORDER BY finished_at, id
           LIMIT ?
         )`,
        [scope, before, limit],
      ).changes;
    },
  });
}

export function createDurableWorker({
  classifyFailure,
  createAbortController = () => new AbortController(),
  handlers,
  heartbeatIntervalMs,
  owner,
  scheduleHeartbeat = defaultScheduleHeartbeat,
  scheduleTimeout = defaultScheduleTimeout,
  store,
}: DurableWorkerOptions): DurableWorker {
  const safeOwner = validateGeneratedIdentifier(owner, "worker owner");
  if (typeof classifyFailure !== "function") {
    throw new Error("A durable worker requires a failure classifier.");
  }
  if (typeof createAbortController !== "function") {
    throw new Error("A durable worker requires an abort-controller factory.");
  }
  if (!handlers || typeof handlers !== "object") {
    throw new Error("A durable worker requires a handler map.");
  }
  const handlerEntries = Object.entries(handlers);
  if (handlerEntries.length < 1) {
    throw new Error(
      "A durable worker requires at least one function-valued handler.",
    );
  }
  const registeredHandlers = new Map<string, DurableJobHandler>();
  for (const [type, handler] of handlerEntries) {
    if (typeof handler !== "function") {
      throw new Error(
        "A durable worker requires every registered handler to be a function.",
      );
    }
    registeredHandlers.set(validateJobType(type), handler);
  }
  if (typeof scheduleTimeout !== "function") {
    throw new Error("A durable worker requires a timeout scheduler.");
  }
  if (typeof scheduleHeartbeat !== "function") {
    throw new Error("A durable worker requires a heartbeat scheduler.");
  }
  const safeHeartbeatIntervalMs =
    heartbeatIntervalMs ?? Math.max(1, Math.floor(store.leaseDurationMs / 3));
  assertTimerDelayMilliseconds(
    safeHeartbeatIntervalMs,
    "Worker heartbeat interval",
  );
  if (safeHeartbeatIntervalMs >= store.leaseDurationMs) {
    throw new Error(
      "The worker heartbeat interval must be shorter than the job lease duration.",
    );
  }

  let accepting = true;
  let activeRun: Promise<number> | undefined;
  let activeController: AbortController | undefined;

  async function executeUntilIdle(): Promise<number> {
    let processed = 0;
    while (accepting) {
      const claim = store.claim(safeOwner);
      if (!claim) break;
      const controller = createAbortController();
      if (
        !controller ||
        typeof controller.abort !== "function" ||
        !controller.signal
      ) {
        throw new Error(
          "The durable worker abort factory returned an invalid controller.",
        );
      }
      activeController = controller;
      const handler = registeredHandlers.get(claim.type);
      try {
        if (!handler) {
          store.fail(claim, {
            code: "unknown_job_type",
            message: `No handler is registered for durable job type ${claim.type}.`,
            retryable: false,
          });
        } else {
          let heartbeatFailed = false;
          let heartbeatFailure: unknown;
          const cancelHeartbeat = scheduleHeartbeat(
            safeHeartbeatIntervalMs,
            () => {
              if (heartbeatFailed) return;
              try {
                store.heartbeat(claim);
              } catch (error) {
                if (!heartbeatFailed) {
                  heartbeatFailed = true;
                  heartbeatFailure = error;
                }
                try {
                  controller.abort(error);
                } catch (abortError) {
                  heartbeatFailure = abortError;
                }
              }
            },
          );
          if (typeof cancelHeartbeat !== "function") {
            throw new Error(
              "The durable worker heartbeat scheduler must be cancellable.",
            );
          }

          let handlerError: unknown;
          let handlerFailed = false;
          try {
            await handler(claim.payload, {
              executionScope: claim.executionScope,
              attempt: claim.attempts,
              heartbeat: () => store.heartbeat(claim),
              idempotencyKey: claim.idempotencyKey,
              jobId: claim.id,
              maxAttempts: claim.maxAttempts,
              signal: controller.signal,
            });
          } catch (error) {
            handlerFailed = true;
            handlerError = error;
          } finally {
            cancelHeartbeat();
          }

          if (heartbeatFailed) throw heartbeatFailure;
          if (!handlerFailed) {
            store.complete(claim);
          } else if (handlerError instanceof StaleJobClaimError) {
            throw handlerError;
          } else {
            const disposition = classifyFailure(handlerError, claim);
            if (isDurableJobDelay(disposition)) {
              store.delay(claim, disposition);
            } else if (isDurableJobDeferral(disposition)) {
              store.defer(claim, disposition);
            } else {
              store.fail(claim, disposition);
            }
          }
        }
      } finally {
        if (activeController === controller) activeController = undefined;
      }
      processed += 1;
    }
    return processed;
  }

  return Object.freeze({
    get accepting() {
      return accepting;
    },
    get running() {
      return Boolean(activeRun);
    },
    abortActive(reason?: unknown) {
      accepting = false;
      activeController?.abort(reason);
    },
    async drain(timeoutMs: number) {
      assertTimerDelayMilliseconds(timeoutMs, "Worker drain timeout");
      accepting = false;
      const run = activeRun;
      if (!run) return;

      let cancelTimeout: () => void = () => {};
      const timeout = new Promise<never>((_resolve, reject) => {
        const cancel = scheduleTimeout(timeoutMs, () => {
          reject(new DurableWorkerDrainTimeoutError(timeoutMs));
        });
        if (typeof cancel !== "function") {
          reject(
            new Error(
              "The durable worker timeout scheduler must be cancellable.",
            ),
          );
          return;
        }
        cancelTimeout = cancel;
      });
      try {
        await Promise.race([run, timeout]);
      } finally {
        cancelTimeout();
      }
    },
    runUntilIdle() {
      if (!accepting) return Promise.resolve(0);
      if (activeRun) return activeRun;
      const run = executeUntilIdle();
      activeRun = run.finally(() => {
        activeRun = undefined;
      });
      return activeRun;
    },
    stopClaiming() {
      accepting = false;
    },
  });
}

function parseClaim(row: DurableJobRow): DurableJobClaim {
  const job = parseJob(row);
  if (
    job.status !== "running" ||
    job.leaseOwner === null ||
    job.leaseToken === null ||
    job.leaseExpiresAt === null
  ) {
    throw new Error("SQLite returned a durable job without a complete claim.");
  }
  return Object.freeze({
    ...job,
    leaseExpiresAt: job.leaseExpiresAt,
    leaseOwner: job.leaseOwner,
    leaseToken: job.leaseToken,
    status: "running",
  });
}

function parseJob(row: DurableJobRow): DurableJob {
  const status = statusColumn(row, "status");
  return Object.freeze({
    attempts: integerColumn(row, "attempts"),
    availableAt: integerColumn(row, "available_at"),
    createdAt: integerColumn(row, "created_at"),
    executionScope: textColumn(row, "execution_scope"),
    executionClass: executionClassColumn(row, "execution_class"),
    failureCode: nullableTextColumn(row, "failure_code"),
    failureMessage: nullableTextColumn(row, "failure_message"),
    finishedAt: nullableIntegerColumn(row, "finished_at"),
    id: textColumn(row, "id"),
    idempotencyKey: textColumn(row, "idempotency_key"),
    leaseExpiresAt: nullableIntegerColumn(row, "lease_expires_at"),
    leaseOwner: nullableTextColumn(row, "lease_owner"),
    leaseToken: nullableTextColumn(row, "lease_token"),
    maxAttempts: integerColumn(row, "max_attempts"),
    payload: parseJsonPayload(textColumn(row, "payload_json")),
    scheduledAt: integerColumn(row, "scheduled_at"),
    startedAt: nullableIntegerColumn(row, "started_at"),
    status,
    type: textColumn(row, "type"),
    updatedAt: integerColumn(row, "updated_at"),
  });
}

function assertIdempotentInput(
  row: DurableJobRow,
  input: {
    readonly idempotencyKey: string;
    readonly executionClass: DurableJobExecutionClass;
    readonly maxAttempts: number;
    readonly payloadJson: string;
    readonly scheduledAt: number;
    readonly type: string;
  },
): void {
  if (
    textColumn(row, "type") !== input.type ||
    textColumn(row, "idempotency_key") !== input.idempotencyKey ||
    executionClassColumn(row, "execution_class") !== input.executionClass ||
    textColumn(row, "payload_json") !== input.payloadJson ||
    integerColumn(row, "max_attempts") !== input.maxAttempts ||
    integerColumn(row, "scheduled_at") !== input.scheduledAt
  ) {
    throw new JobIdempotencyConflictError(input.type, input.idempotencyKey);
  }
}

function serializePayload(payload: JsonValue, maximum: number): string {
  let validPayload: boolean;
  try {
    validPayload = isJsonValue(payload);
  } catch (error) {
    throw new Error("Durable job payload validation failed.", { cause: error });
  }
  if (!validPayload) {
    throw new Error("Durable job payloads must contain only JSON values.");
  }

  let serialized: string;
  try {
    const encoded = JSON.stringify(payload);
    if (encoded === undefined) {
      throw new Error("JSON serialization returned no value.");
    }
    serialized = encoded;
  } catch (error) {
    throw new Error("Durable job payload serialization failed.", {
      cause: error,
    });
  }
  if (UTF8_ENCODER.encode(serialized).byteLength > maximum) {
    throw new Error(
      `Durable job payloads must be JSON no larger than ${maximum} UTF-8 bytes.`,
    );
  }
  parseJsonPayload(serialized);
  return serialized;
}

function parseJsonPayload(source: string): JsonValue {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error("Durable job payload contains invalid JSON.", {
      cause: error,
    });
  }
  if (!isJsonValue(value)) {
    throw new Error("Durable job payload contains a non-JSON value.");
  }
  return value;
}

function isJsonValue(
  value: unknown,
  ancestors: Set<object> = new Set(),
): value is JsonValue {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) {
    if (
      ancestors.has(value) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return false;
    }
    const propertyNames = Object.getOwnPropertyNames(value);
    if (propertyNames.length !== value.length + 1) return false;
    ancestors.add(value);
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !("value" in descriptor) ||
        !isJsonValue(descriptor.value, ancestors)
      ) {
        ancestors.delete(value);
        return false;
      }
    }
    ancestors.delete(value);
    return true;
  }
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    ancestors.has(value) ||
    Object.getOwnPropertySymbols(value).length > 0
  ) {
    return false;
  }
  ancestors.add(value);
  for (const descriptor of Object.values(
    Object.getOwnPropertyDescriptors(value),
  )) {
    if (
      !descriptor.enumerable ||
      !("value" in descriptor) ||
      !isJsonValue(descriptor.value, ancestors)
    ) {
      ancestors.delete(value);
      return false;
    }
  }
  ancestors.delete(value);
  return true;
}

function validateFailure(failure: DurableJobFailure): DurableJobFailure {
  if (!FAILURE_CODE_PATTERN.test(failure.code)) {
    throw new Error("Durable job failure codes must be lowercase snake case.");
  }
  if (
    typeof failure.message !== "string" ||
    !failure.message ||
    failure.message !== failure.message.trim() ||
    failure.message.length > MAX_FAILURE_MESSAGE_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(failure.message)
  ) {
    throw new Error(
      `Durable job failure messages must contain between 1 and ${MAX_FAILURE_MESSAGE_LENGTH} safe characters.`,
    );
  }
  if (typeof failure.retryable !== "boolean") {
    throw new Error("Durable job retryability must be a boolean.");
  }
  return failure;
}

function validateDeferral(deferral: DurableJobDeferral): DurableJobDeferral {
  if (deferral.type !== "defer") {
    throw new Error("Durable job deferrals must use the defer disposition.");
  }
  assertNonNegativeSafeInteger(
    deferral.availableAt,
    "Job deferral availability time",
  );
  if (!FAILURE_CODE_PATTERN.test(deferral.code)) {
    throw new Error("Durable job deferral codes must be lowercase snake case.");
  }
  if (
    typeof deferral.message !== "string" ||
    !deferral.message ||
    deferral.message !== deferral.message.trim() ||
    deferral.message.length > MAX_FAILURE_MESSAGE_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(deferral.message)
  ) {
    throw new Error(
      `Durable job deferral messages must contain between 1 and ${MAX_FAILURE_MESSAGE_LENGTH} safe characters.`,
    );
  }
  return deferral;
}

function validateDelay(delay: DurableJobDelay): DurableJobDelay {
  if (delay.type !== "delay") {
    throw new Error("Durable job delays must use the delay disposition.");
  }
  assertNonNegativeSafeInteger(
    delay.availableAt,
    "Job delay availability time",
  );
  if (!FAILURE_CODE_PATTERN.test(delay.code)) {
    throw new Error("Durable job delay codes must be lowercase snake case.");
  }
  if (
    typeof delay.message !== "string" ||
    !delay.message ||
    delay.message !== delay.message.trim() ||
    delay.message.length > MAX_FAILURE_MESSAGE_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(delay.message)
  ) {
    throw new Error(
      `Durable job delay messages must contain between 1 and ${MAX_FAILURE_MESSAGE_LENGTH} safe characters.`,
    );
  }
  return delay;
}

export function isDurableJobDelay(
  disposition: unknown,
): disposition is DurableJobDelay {
  return (
    typeof disposition === "object" &&
    disposition !== null &&
    "type" in disposition &&
    disposition.type === "delay"
  );
}

export function isDurableJobDeferral(
  disposition: unknown,
): disposition is DurableJobDeferral {
  return (
    typeof disposition === "object" &&
    disposition !== null &&
    "type" in disposition &&
    disposition.type === "defer"
  );
}

function validateJobType(value: string): string {
  if (!JOB_TYPE_PATTERN.test(value)) {
    throw new Error(
      "Durable job types must start with a lowercase letter and use lowercase letters, numbers, dots, colons, underscores, or hyphens.",
    );
  }
  return value;
}

function validateIdempotencyKey(value: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    value.length > MAX_IDEMPOTENCY_KEY_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(
      `Durable job idempotency keys must contain between 1 and ${MAX_IDEMPOTENCY_KEY_LENGTH} safe characters.`,
    );
  }
  return value;
}

function validateExecutionClass(
  value: DurableJobExecutionClass,
): DurableJobExecutionClass {
  if (value !== "standard" && value !== "barrier-recovery") {
    throw new Error(
      "Durable job execution class must be standard or barrier-recovery.",
    );
  }
  return value;
}

function validateGeneratedIdentifier(value: string, label: string): string {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(
      `The durable ${label} must contain 8-128 safe identifier characters.`,
    );
  }
  return value;
}

function assertClaim(claim: DurableJobClaim): void {
  validateGeneratedIdentifier(claim.id, "job ID");
  validateGeneratedIdentifier(claim.leaseOwner, "worker owner");
  validateGeneratedIdentifier(claim.leaseToken, "lease token");
  assertPositiveSafeInteger(claim.attempts, "Job claim attempt");
  if (claim.status !== "running") {
    throw new Error("Only a running durable job claim can transition.");
  }
}

function statusColumn(row: SqliteRow, name: string): DurableJobStatus {
  const value = textColumn(row, name);
  if (
    !(
      ["blocked", "failed", "queued", "running", "succeeded"] as const
    ).includes(value as DurableJobStatus)
  ) {
    throw new Error(`SQLite column ${name} contains an invalid job status.`);
  }
  return value as DurableJobStatus;
}

function executionClassColumn(
  row: SqliteRow,
  name: string,
): DurableJobExecutionClass {
  return validateExecutionClass(
    textColumn(row, name) as DurableJobExecutionClass,
  );
}

function textColumn(row: SqliteRow, name: string): string {
  const value = row[name];
  if (typeof value !== "string") {
    throw new Error(`SQLite column ${name} must be text.`);
  }
  return value;
}

function nullableTextColumn(row: SqliteRow, name: string): string | null {
  const value = row[name];
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`SQLite column ${name} must be text or null.`);
  }
  return value;
}

function integerColumn(row: SqliteRow, name: string): number {
  const value = row[name];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      `SQLite column ${name} must be a non-negative safe integer.`,
    );
  }
  return value;
}

function nullableIntegerColumn(row: SqliteRow, name: string): number | null {
  const value = row[name];
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      `SQLite column ${name} must be a non-negative safe integer or null.`,
    );
  }
  return value;
}

function assertOwnedTransition(changes: number, jobId: string): void {
  if (changes !== 1) throw new StaleJobClaimError(jobId);
}

function assertSingleTransition(changes: number, jobId: string): void {
  if (changes !== 1) {
    throw new Error(
      `Durable job ${jobId} did not make one recovery transition.`,
    );
  }
}

function safeAdd(value: number, amount: number, label: string): number {
  const result = value + amount;
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error(`${label} exceeds the safe integer range.`);
  }
  return result;
}

function assertPositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive safe integer.`);
  }
}

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
}

function assertBoundedBatchSize(value: number, label: string): void {
  assertPositiveSafeInteger(value, label);
  if (value > MAX_BATCH_SIZE) {
    throw new Error(`${label} cannot exceed ${MAX_BATCH_SIZE} rows.`);
  }
}

function defaultScheduleTimeout(
  timeoutMs: number,
  onTimeout: () => void,
): () => void {
  const timeout = globalThis.setTimeout(onTimeout, timeoutMs);
  return () => globalThis.clearTimeout(timeout);
}

function defaultScheduleHeartbeat(
  intervalMs: number,
  onHeartbeat: () => void,
): () => void {
  const interval = globalThis.setInterval(onHeartbeat, intervalMs);
  return () => globalThis.clearInterval(interval);
}
