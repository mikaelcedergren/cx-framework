import type { JsonValue } from "./errors.js";
import { type SyncSqliteDatabase } from "./sqlite.js";
export type DurableJobStatus = "blocked" | "failed" | "queued" | "running" | "succeeded";
/**
 * `barrier-recovery` is an explicit escape lane for work whose successful completion can make a
 * queue-wide barrier recoverable. A product must atomically materialize the obligation and enough
 * bounded recovery state before enqueueing one. Ordinary work always uses `standard`.
 */
export type DurableJobExecutionClass = "barrier-recovery" | "standard";
export interface DurableJob {
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
export type DurableJobDisposition = DurableJobDeferral | DurableJobDelay | DurableJobFailure;
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
    readonly leaseDurationMs: number;
    readonly maxConcurrentJobs: number;
    claim(owner: string): DurableJobClaim | null;
    complete(claim: DurableJobClaim): void;
    delay(claim: DurableJobClaim, delay: DurableJobDelay): DurableJobDelayResult;
    defer(claim: DurableJobClaim, deferral: DurableJobDeferral): DurableJobDeferralResult;
    enqueue(input: EnqueueDurableJob): DurableJobEnqueueResult;
    fail(claim: DurableJobClaim, failure: DurableJobFailure): DurableJobFailureResult;
    get(id: string): DurableJob | null;
    heartbeat(claim: DurableJobClaim): number;
    pruneTerminal(before: number, limit: number): number;
    recoverExpired(): DurableJobRecoveryResult;
    /** Atomically compose synchronous product writes and durable enqueueing on this database. */
    withTransaction<Result>(work: (transaction: DurableJobTransaction) => Result): Result;
}
export interface DurableJobStoreOptions {
    readonly createJobId: () => string;
    readonly createLeaseToken: () => string;
    readonly database: SyncSqliteDatabase;
    readonly leaseDurationMs: number;
    /**
     * Maximum claims that may be valid across every process sharing this database.
     * Every claim-capable store sharing this table must configure the same value. Use `1` when
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
    readonly attempt: number;
    readonly idempotencyKey: string;
    readonly jobId: string;
    readonly maxAttempts: number;
    readonly signal: AbortSignal;
    heartbeat(): number;
}
export type DurableJobHandler = (payload: JsonValue, context: DurableJobExecutionContext) => Promise<void>;
export interface DurableWorker {
    readonly accepting: boolean;
    readonly running: boolean;
    abortActive(reason?: unknown): void;
    drain(timeoutMs: number): Promise<void>;
    runUntilIdle(): Promise<number>;
    stopClaiming(): void;
}
export interface DurableWorkerOptions {
    readonly classifyFailure: (error: unknown, claim: DurableJobClaim) => DurableJobDisposition;
    readonly createAbortController?: () => AbortController;
    readonly handlers: Readonly<Record<string, DurableJobHandler>>;
    readonly heartbeatIntervalMs?: number;
    readonly owner: string;
    readonly scheduleHeartbeat?: (intervalMs: number, onHeartbeat: () => void) => () => void;
    readonly scheduleTimeout?: (timeoutMs: number, onTimeout: () => void) => () => void;
    readonly store: DurableJobStore;
}
/** Canonical durable-job table owned through each product's append-only migration history. */
export declare const DURABLE_JOB_TABLE = "cx_jobs";
/**
 * Immutable durable-job schema history for product-owned migration ledgers.
 *
 * Products assign these statements their own contiguous migration versions. Issued entries are
 * append-only: changing an existing entry would invalidate a product's already-applied migration
 * fingerprint. A new queue capability therefore always adds a new entry.
 */
export declare const DURABLE_JOB_SCHEMA_MIGRATIONS: readonly [Readonly<{
    version: 1;
    name: "initial_durable_jobs";
    statements: readonly ["CREATE TABLE cx_jobs (\n    id TEXT PRIMARY KEY,\n    type TEXT NOT NULL,\n    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),\n    idempotency_key TEXT NOT NULL,\n    status TEXT NOT NULL CHECK (status IN ('blocked', 'queued', 'running', 'succeeded', 'failed')),\n    barrier INTEGER NOT NULL DEFAULT 0 CHECK (barrier IN (0, 1)),\n    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),\n    max_attempts INTEGER NOT NULL CHECK (max_attempts >= 1 AND attempts <= max_attempts),\n    scheduled_at INTEGER NOT NULL CHECK (scheduled_at >= 0),\n    available_at INTEGER NOT NULL CHECK (available_at >= 0),\n    lease_owner TEXT,\n    lease_token TEXT UNIQUE,\n    lease_expires_at INTEGER,\n    started_at INTEGER,\n    finished_at INTEGER,\n    failure_code TEXT,\n    failure_message TEXT,\n    created_at INTEGER NOT NULL CHECK (created_at >= 0),\n    updated_at INTEGER NOT NULL CHECK (updated_at >= 0),\n    UNIQUE (type, idempotency_key),\n    CHECK (\n      (status = 'running' AND lease_owner IS NOT NULL AND lease_token IS NOT NULL AND lease_expires_at IS NOT NULL)\n      OR\n      (status <> 'running' AND lease_owner IS NULL AND lease_token IS NULL AND lease_expires_at IS NULL)\n    ),\n    CHECK (\n      (status IN ('succeeded', 'failed') AND finished_at IS NOT NULL)\n      OR\n      (status IN ('blocked', 'queued', 'running') AND finished_at IS NULL)\n    ),\n    CHECK (\n      (barrier = 1 AND status IN ('blocked', 'running'))\n      OR\n      (barrier = 0 AND status <> 'blocked')\n    )\n  ) STRICT", "CREATE INDEX cx_jobs_claim_order\n   ON cx_jobs (status, available_at, created_at, id)", "CREATE INDEX cx_jobs_expired_leases\n   ON cx_jobs (status, lease_expires_at)\n   WHERE status = 'running'", "CREATE INDEX cx_jobs_terminal_retention\n   ON cx_jobs (status, finished_at, id)\n   WHERE status IN ('succeeded', 'failed')"];
}>, Readonly<{
    version: 2;
    name: "barrier_recovery_execution_class";
    statements: readonly ["ALTER TABLE cx_jobs\n       ADD COLUMN execution_class TEXT NOT NULL DEFAULT 'standard'\n         CHECK (execution_class IN ('standard', 'barrier-recovery'))", "ALTER TABLE cx_jobs\n       ADD COLUMN barrier_recovery_reserve BLOB\n         CHECK (\n           barrier_recovery_reserve IS NULL\n           OR length(barrier_recovery_reserve) = 4096\n         )", "CREATE TRIGGER cx_jobs_recovery_reserve_insert\n       BEFORE INSERT ON cx_jobs\n       WHEN NEW.execution_class = 'standard' AND NEW.barrier_recovery_reserve IS NOT NULL\n       BEGIN\n         SELECT RAISE(ABORT, 'standard jobs cannot hold barrier-recovery reserve');\n       END", "CREATE TRIGGER cx_jobs_recovery_reserve_update\n       BEFORE UPDATE OF execution_class, barrier_recovery_reserve ON cx_jobs\n       WHEN NEW.execution_class = 'standard' AND NEW.barrier_recovery_reserve IS NOT NULL\n       BEGIN\n         SELECT RAISE(ABORT, 'standard jobs cannot hold barrier-recovery reserve');\n       END"];
}>, Readonly<{
    version: 3;
    name: "immutable_job_input_identity";
    statements: readonly ["CREATE TRIGGER cx_jobs_immutable_input_update\n       BEFORE UPDATE OF id, type, payload_json, idempotency_key, execution_class,\n                        max_attempts, scheduled_at, created_at\n       ON cx_jobs\n       WHEN NEW.id IS NOT OLD.id\n         OR NEW.type IS NOT OLD.type\n         OR NEW.payload_json IS NOT OLD.payload_json\n         OR NEW.idempotency_key IS NOT OLD.idempotency_key\n         OR NEW.execution_class IS NOT OLD.execution_class\n         OR NEW.max_attempts IS NOT OLD.max_attempts\n         OR NEW.scheduled_at IS NOT OLD.scheduled_at\n         OR NEW.created_at IS NOT OLD.created_at\n       BEGIN\n         SELECT RAISE(ABORT, 'durable job immutable input cannot change after enqueue');\n       END", "CREATE TRIGGER cx_jobs_active_delete_guard\n       BEFORE DELETE ON cx_jobs\n       WHEN OLD.status NOT IN ('succeeded', 'failed')\n       BEGIN\n         SELECT RAISE(ABORT, 'active durable jobs cannot be deleted');\n       END", "CREATE TRIGGER cx_jobs_recovery_reserve_contract_insert\n       BEFORE INSERT ON cx_jobs\n       WHEN NEW.execution_class = 'barrier-recovery'\n         AND (\n           (\n             NEW.status IN ('blocked', 'queued')\n             AND (\n               NEW.barrier_recovery_reserve IS NULL\n               OR length(NEW.barrier_recovery_reserve) <> 4096\n             )\n           )\n           OR\n           (\n             NEW.status IN ('running', 'succeeded', 'failed')\n             AND NEW.barrier_recovery_reserve IS NOT NULL\n           )\n         )\n       BEGIN\n         SELECT RAISE(ABORT, 'barrier-recovery reserve does not match job state');\n       END", "CREATE TRIGGER cx_jobs_recovery_reserve_contract_update\n       BEFORE UPDATE OF status, execution_class, barrier_recovery_reserve\n       ON cx_jobs\n       WHEN NEW.execution_class = 'barrier-recovery'\n         AND NEW.execution_class IS OLD.execution_class\n         AND (\n           (\n             NEW.status IN ('blocked', 'queued')\n             AND (\n               NEW.barrier_recovery_reserve IS NULL\n               OR length(NEW.barrier_recovery_reserve) <> 4096\n             )\n           )\n           OR\n           (\n             NEW.status IN ('running', 'succeeded', 'failed')\n             AND NEW.barrier_recovery_reserve IS NOT NULL\n           )\n         )\n       BEGIN\n         SELECT RAISE(ABORT, 'barrier-recovery reserve does not match job state');\n       END"];
}>, Readonly<{
    version: 4;
    name: "durable_job_replacement_guard";
    statements: readonly ["CREATE TABLE main.cx_jobs_v4_validation (\n         invalid_state INTEGER NOT NULL\n       ) STRICT", "INSERT INTO main.cx_jobs_v4_validation (invalid_state)\n       SELECT NULL\n       WHERE EXISTS (\n         SELECT 1\n         FROM main.cx_jobs\n         WHERE rowid <= 0\n            OR NOT (\n              (\n                execution_class = 'standard'\n                AND barrier_recovery_reserve IS NULL\n              )\n              OR\n              (\n                execution_class = 'barrier-recovery'\n                AND (\n                  (\n                    status IN ('blocked', 'queued')\n                    AND barrier_recovery_reserve IS NOT NULL\n                    AND length(barrier_recovery_reserve) = 4096\n                  )\n                  OR\n                  (\n                    status IN ('running', 'succeeded', 'failed')\n                    AND barrier_recovery_reserve IS NULL\n                  )\n                )\n              )\n            )\n       )", "DROP TABLE main.cx_jobs_v4_validation", "CREATE TRIGGER cx_jobs_insert_conflict_guard\n       BEFORE INSERT ON cx_jobs\n       WHEN NEW.rowid <> -1\n         OR EXISTS (\n           SELECT 1\n           FROM cx_jobs AS existing\n           WHERE existing.id = NEW.id\n              OR (\n                existing.type = NEW.type\n                AND existing.idempotency_key = NEW.idempotency_key\n              )\n              OR (\n                NEW.lease_token IS NOT NULL\n                AND existing.lease_token = NEW.lease_token\n              )\n       )\n       BEGIN\n         SELECT RAISE(ABORT, 'durable job insert conflicts cannot replace existing jobs');\n       END", "CREATE TRIGGER cx_jobs_rowid_contract_insert\n       AFTER INSERT ON cx_jobs\n       WHEN NEW.rowid <= 0\n       BEGIN\n         SELECT RAISE(ABORT, 'durable jobs require framework-owned positive row IDs');\n       END", "CREATE TRIGGER cx_jobs_update_conflict_guard\n       BEFORE UPDATE OF rowid, _rowid_, oid, id, type, idempotency_key, lease_token\n       ON cx_jobs\n       WHEN NEW.rowid IS NOT OLD.rowid\n         OR EXISTS (\n           SELECT 1\n           FROM cx_jobs AS existing\n           WHERE existing.rowid <> OLD.rowid\n             AND (\n               existing.id = NEW.id\n               OR (\n                 existing.type = NEW.type\n                 AND existing.idempotency_key = NEW.idempotency_key\n               )\n               OR (\n                 NEW.lease_token IS NOT NULL\n                 AND existing.lease_token = NEW.lease_token\n               )\n             )\n       )\n       BEGIN\n         SELECT RAISE(ABORT, 'durable job update conflicts cannot replace existing jobs');\n       END"];
}>];
export declare class JobIdempotencyConflictError extends Error {
    constructor(type: string, idempotencyKey: string);
}
export declare class StaleJobClaimError extends Error {
    constructor(jobId: string);
}
export declare class DurableJobCapacityError extends Error {
    constructor(maximum: number);
}
export declare class DurableJobRetentionCapacityError extends Error {
    constructor(maximum: number);
}
export declare class DurableWorkerDrainTimeoutError extends Error {
    readonly timeoutMs: number;
    constructor(timeoutMs: number);
}
export declare function boundedExponentialBackoff(attempt: number, initialDelayMs: number, maximumDelayMs: number): number;
export declare function createDurableJobStore({ createJobId, createLeaseToken, database, leaseDurationMs, maxConcurrentJobs, maxOutstandingJobs, maxPayloadBytes, maxRetainedJobs, now, recoveryBatchSize, retryInitialDelayMs, retryMaximumDelayMs, }: DurableJobStoreOptions): DurableJobStore;
export declare function createDurableWorker({ classifyFailure, createAbortController, handlers, heartbeatIntervalMs, owner, scheduleHeartbeat, scheduleTimeout, store, }: DurableWorkerOptions): DurableWorker;
export declare function isDurableJobDelay(disposition: unknown): disposition is DurableJobDelay;
export declare function isDurableJobDeferral(disposition: unknown): disposition is DurableJobDeferral;
//# sourceMappingURL=jobs.d.ts.map