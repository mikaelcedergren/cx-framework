import { withImmediateTransaction, } from "./sqlite.js";
import { assertTimerDelayMilliseconds } from "./timer.js";
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
export const DURABLE_JOB_SCHEMA_MIGRATIONS = Object.freeze([
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
        ]),
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
        ]),
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
        ]),
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
        ]),
    }),
]);
export class JobIdempotencyConflictError extends Error {
    constructor(type, idempotencyKey) {
        super(`Durable job ${type}:${idempotencyKey} was enqueued again with different immutable input.`);
        this.name = "JobIdempotencyConflictError";
    }
}
export class StaleJobClaimError extends Error {
    constructor(jobId) {
        super(`Durable job claim is stale or no longer owned: ${jobId}.`);
        this.name = "StaleJobClaimError";
    }
}
export class DurableJobCapacityError extends Error {
    constructor(maximum) {
        super(`The durable queue already contains its ${maximum} outstanding jobs.`);
        this.name = "DurableJobCapacityError";
    }
}
export class DurableJobRetentionCapacityError extends Error {
    constructor(maximum) {
        super(`The durable queue retains ${maximum} jobs; prune terminal history before enqueueing more work.`);
        this.name = "DurableJobRetentionCapacityError";
    }
}
export class DurableWorkerDrainTimeoutError extends Error {
    timeoutMs;
    constructor(timeoutMs) {
        super(`The durable worker did not drain within ${timeoutMs}ms.`);
        this.name = "DurableWorkerDrainTimeoutError";
        this.timeoutMs = timeoutMs;
    }
}
export function boundedExponentialBackoff(attempt, initialDelayMs, maximumDelayMs) {
    assertPositiveSafeInteger(attempt, "Job attempt");
    assertPositiveSafeInteger(initialDelayMs, "Initial retry delay");
    assertPositiveSafeInteger(maximumDelayMs, "Maximum retry delay");
    if (maximumDelayMs < initialDelayMs) {
        throw new Error("Maximum retry delay must be greater than or equal to the initial delay.");
    }
    const multiplier = 2 ** Math.min(52, attempt - 1);
    return Math.min(maximumDelayMs, initialDelayMs * multiplier);
}
export function createDurableJobStore({ createJobId, createLeaseToken, database, leaseDurationMs, maxConcurrentJobs, maxOutstandingJobs, maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES, maxRetainedJobs, now, recoveryBatchSize, retryInitialDelayMs, retryMaximumDelayMs, }) {
    for (const [label, value] of [
        ["job ID generator", createJobId],
        ["lease-token generator", createLeaseToken],
        ["job clock", now],
    ]) {
        if (typeof value !== "function") {
            throw new Error(`The durable ${label} must be a function.`);
        }
    }
    assertPositiveSafeInteger(leaseDurationMs, "Job lease duration");
    assertPositiveSafeInteger(maxConcurrentJobs, "Concurrent job capacity");
    assertPositiveSafeInteger(maxOutstandingJobs, "Outstanding job capacity");
    if (maxConcurrentJobs > maxOutstandingJobs) {
        throw new Error("Concurrent job capacity cannot exceed outstanding job capacity.");
    }
    assertPositiveSafeInteger(maxPayloadBytes, "Maximum job payload size");
    assertPositiveSafeInteger(maxRetainedJobs, "Retained job capacity");
    if (maxRetainedJobs < maxOutstandingJobs) {
        throw new Error("Retained job capacity must be greater than or equal to outstanding job capacity.");
    }
    assertBoundedBatchSize(recoveryBatchSize, "Job recovery batch size");
    boundedExponentialBackoff(1, retryInitialDelayMs, retryMaximumDelayMs);
    function clock() {
        const value = now();
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error("The durable job clock must return non-negative epoch milliseconds.");
        }
        return value;
    }
    function recoverExpiredAt(timestamp) {
        let retried = 0;
        let failed = 0;
        const expired = database.all(`SELECT id, lease_owner, lease_token, attempts, max_attempts, barrier
       FROM ${DURABLE_JOB_TABLE}
       WHERE status = 'running' AND lease_expires_at <= ?
       ORDER BY lease_expires_at, id
       LIMIT ?`, [timestamp, recoveryBatchSize]);
        for (const row of expired) {
            const id = textColumn(row, "id");
            const leaseOwner = textColumn(row, "lease_owner");
            const leaseToken = textColumn(row, "lease_token");
            const attempts = integerColumn(row, "attempts");
            const maxAttempts = integerColumn(row, "max_attempts");
            const barrier = integerColumn(row, "barrier");
            if (barrier !== 0 && barrier !== 1) {
                throw new Error(`SQLite returned an invalid durable barrier flag for ${id}.`);
            }
            if (attempts < maxAttempts) {
                const availableAt = safeAdd(timestamp, boundedExponentialBackoff(attempts, retryInitialDelayMs, retryMaximumDelayMs), "Recovered job retry time");
                const result = database.run(`UPDATE ${DURABLE_JOB_TABLE}
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
           WHERE id = ? AND status = 'running' AND lease_owner = ?
             AND lease_token = ? AND attempts = ?
             AND lease_expires_at <= ?`, [
                    availableAt,
                    timestamp,
                    id,
                    leaseOwner,
                    leaseToken,
                    attempts,
                    timestamp,
                ]);
                assertSingleTransition(result.changes, id);
                retried += 1;
            }
            else {
                const result = database.run(`UPDATE ${DURABLE_JOB_TABLE}
           SET status = 'failed', barrier = 0, lease_owner = NULL, lease_token = NULL,
               lease_expires_at = NULL, failure_code = 'lease_expired',
               failure_message = 'The worker stopped and this job exhausted its attempts.',
               barrier_recovery_reserve = NULL, finished_at = ?, updated_at = ?
           WHERE id = ? AND status = 'running' AND lease_owner = ?
             AND lease_token = ? AND attempts = ?
             AND lease_expires_at <= ?`, [
                    timestamp,
                    timestamp,
                    id,
                    leaseOwner,
                    leaseToken,
                    attempts,
                    timestamp,
                ]);
                assertSingleTransition(result.changes, id);
                failed += 1;
            }
        }
        return Object.freeze({ failed, retried });
    }
    function enqueueInCurrentTransaction(input) {
        if (!input || typeof input !== "object") {
            throw new Error("A durable job enqueue input is required.");
        }
        const type = validateJobType(input.type);
        const executionClass = validateExecutionClass(input.executionClass ?? "standard");
        const idempotencyKey = validateIdempotencyKey(input.idempotencyKey);
        const maxAttempts = input.maxAttempts ?? 3;
        assertPositiveSafeInteger(maxAttempts, "Maximum job attempts");
        const timestamp = clock();
        if (input.availableAt !== undefined) {
            assertNonNegativeSafeInteger(input.availableAt, "Job availability time");
        }
        const payloadJson = serializePayload(input.payload, maxPayloadBytes);
        const existing = database.get(`SELECT * FROM ${DURABLE_JOB_TABLE}
       WHERE type = ? AND idempotency_key = ?`, [type, idempotencyKey]);
        const scheduledAt = input.availableAt ??
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
        const totalCount = database.get(`SELECT COUNT(*) AS count FROM ${DURABLE_JOB_TABLE}`);
        if (!totalCount) {
            throw new Error("SQLite did not return the retained job count.");
        }
        if (integerColumn(totalCount, "count") >= maxRetainedJobs) {
            throw new DurableJobRetentionCapacityError(maxRetainedJobs);
        }
        const outstandingCount = database.get(`SELECT COUNT(*) AS count
       FROM ${DURABLE_JOB_TABLE}
       WHERE status IN ('blocked', 'queued', 'running')`);
        if (!outstandingCount) {
            throw new Error("SQLite did not return the outstanding job count.");
        }
        if (integerColumn(outstandingCount, "count") >= maxOutstandingJobs) {
            throw new DurableJobCapacityError(maxOutstandingJobs);
        }
        const id = validateGeneratedIdentifier(createJobId(), "job ID");
        const result = database.run(`INSERT INTO ${DURABLE_JOB_TABLE}
         (id, type, payload_json, idempotency_key, status, execution_class,
          barrier_recovery_reserve, attempts,
          max_attempts, scheduled_at, available_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'queued', ?,
               CASE WHEN ? = 'barrier-recovery' THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES}) ELSE NULL END,
               0, ?, ?, ?, ?, ?)`, [
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
        ]);
        if (result.changes !== 1) {
            throw new Error(`Durable job enqueue changed ${result.changes} rows instead of one.`);
        }
        const row = database.get(`SELECT * FROM ${DURABLE_JOB_TABLE} WHERE id = ?`, [id]);
        if (!row)
            throw new Error("Durable job enqueue did not create its row.");
        return Object.freeze({ created: true, job: parseJob(row) });
    }
    function withJobTransaction(work) {
        if (typeof work !== "function") {
            throw new Error("Durable job transaction work must be a function.");
        }
        return withImmediateTransaction(database, () => {
            let active = true;
            const transaction = Object.freeze({
                enqueue(input) {
                    if (!active) {
                        throw new Error("A durable job transaction cannot be used after its transaction ends.");
                    }
                    return enqueueInCurrentTransaction(input);
                },
            });
            try {
                return work(transaction);
            }
            finally {
                active = false;
            }
        });
    }
    return Object.freeze({
        leaseDurationMs,
        maxConcurrentJobs,
        enqueue(input) {
            return withJobTransaction((transaction) => transaction.enqueue(input));
        },
        claim(owner) {
            const safeOwner = validateGeneratedIdentifier(owner, "worker owner");
            const timestamp = clock();
            const leaseToken = validateGeneratedIdentifier(createLeaseToken(), "lease token");
            const leaseExpiresAt = safeAdd(timestamp, leaseDurationMs, "Job lease expiry");
            return withImmediateTransaction(database, () => {
                recoverExpiredAt(timestamp);
                const running = database.get(`SELECT COUNT(*) AS count, COALESCE(MAX(barrier), 0) AS has_barrier
           FROM ${DURABLE_JOB_TABLE}
           WHERE status = 'running'`);
                if (!running) {
                    throw new Error("SQLite did not return the running job count.");
                }
                const hasRunningBarrier = integerColumn(running, "has_barrier");
                if (hasRunningBarrier !== 0 && hasRunningBarrier !== 1) {
                    throw new Error("SQLite returned an invalid running barrier state.");
                }
                if (hasRunningBarrier === 1 ||
                    integerColumn(running, "count") >= maxConcurrentJobs) {
                    return null;
                }
                const blocked = database.get(`SELECT *
           FROM ${DURABLE_JOB_TABLE}
           WHERE status = 'blocked'
           ORDER BY available_at, created_at, id
           LIMIT 1`);
                const hasBlockedBarrier = blocked ? 1 : 0;
                const row = database.get(`UPDATE ${DURABLE_JOB_TABLE}
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
               WHERE status = 'blocked' AND available_at <= ?
               UNION ALL
               SELECT id, available_at, created_at, 1 AS priority
               FROM ${DURABLE_JOB_TABLE}
               WHERE status = 'queued' AND available_at <= ?
                 AND attempts < max_attempts
                 AND (? = 0 OR execution_class = 'barrier-recovery')
             )
             ORDER BY priority, available_at, created_at, id
             LIMIT 1
           )
             AND status IN ('blocked', 'queued') AND available_at <= ?
             AND (status = 'blocked' OR attempts < max_attempts)
           RETURNING *`, [
                    safeOwner,
                    leaseToken,
                    leaseExpiresAt,
                    timestamp,
                    timestamp,
                    timestamp,
                    timestamp,
                    hasBlockedBarrier,
                    timestamp,
                ]);
                return row ? parseClaim(row) : null;
            });
        },
        heartbeat(claim) {
            assertClaim(claim);
            const timestamp = clock();
            const requestedLeaseExpiresAt = safeAdd(timestamp, leaseDurationMs, "Job lease expiry");
            const row = database.get(`UPDATE ${DURABLE_JOB_TABLE}
         SET lease_expires_at = MAX(lease_expires_at, ?), updated_at = ?
         WHERE id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ?
           AND lease_expires_at > ?
         RETURNING lease_expires_at`, [
                requestedLeaseExpiresAt,
                timestamp,
                claim.id,
                claim.leaseOwner,
                claim.leaseToken,
                claim.attempts,
                timestamp,
            ]);
            if (!row)
                throw new StaleJobClaimError(claim.id);
            return integerColumn(row, "lease_expires_at");
        },
        complete(claim) {
            assertClaim(claim);
            const timestamp = clock();
            const result = database.run(`UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'succeeded', barrier = 0, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, failure_code = NULL,
             failure_message = NULL, barrier_recovery_reserve = NULL,
             finished_at = ?, updated_at = ?
         WHERE id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ?
           AND lease_expires_at > ?`, [
                timestamp,
                timestamp,
                claim.id,
                claim.leaseOwner,
                claim.leaseToken,
                claim.attempts,
                timestamp,
            ]);
            assertOwnedTransition(result.changes, claim.id);
        },
        delay(claim, delay) {
            assertClaim(claim);
            const safeDelay = validateDelay(delay);
            const timestamp = clock();
            if (safeDelay.availableAt <= timestamp) {
                throw new Error("A durable job delay must become available after the current queue time.");
            }
            const result = database.run(`UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'queued', barrier = 0, attempts = attempts - 1,
             available_at = ?, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, started_at = NULL, finished_at = NULL,
             barrier_recovery_reserve = CASE
               WHEN execution_class = 'barrier-recovery'
                 THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES})
               ELSE NULL
             END,
             failure_code = ?, failure_message = ?, updated_at = ?
         WHERE id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ? AND attempts > 0
           AND lease_expires_at > ?`, [
                safeDelay.availableAt,
                safeDelay.code,
                safeDelay.message,
                timestamp,
                claim.id,
                claim.leaseOwner,
                claim.leaseToken,
                claim.attempts,
                timestamp,
            ]);
            assertOwnedTransition(result.changes, claim.id);
            return Object.freeze({
                availableAt: safeDelay.availableAt,
                status: "queued",
            });
        },
        defer(claim, deferral) {
            assertClaim(claim);
            const safeDeferral = validateDeferral(deferral);
            const timestamp = clock();
            if (safeDeferral.availableAt <= timestamp) {
                throw new Error("A durable job deferral must become available after the current queue time.");
            }
            const result = database.run(`UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'blocked', barrier = 1, attempts = attempts - 1,
             available_at = ?, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, started_at = NULL, finished_at = NULL,
             barrier_recovery_reserve = CASE
               WHEN execution_class = 'barrier-recovery'
                 THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES})
               ELSE NULL
             END,
             failure_code = ?, failure_message = ?, updated_at = ?
         WHERE id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ? AND attempts > 0
           AND lease_expires_at > ?`, [
                safeDeferral.availableAt,
                safeDeferral.code,
                safeDeferral.message,
                timestamp,
                claim.id,
                claim.leaseOwner,
                claim.leaseToken,
                claim.attempts,
                timestamp,
            ]);
            assertOwnedTransition(result.changes, claim.id);
            return Object.freeze({
                availableAt: safeDeferral.availableAt,
                status: "blocked",
            });
        },
        fail(claim, failure) {
            assertClaim(claim);
            const safeFailure = validateFailure(failure);
            const timestamp = clock();
            const retry = safeFailure.retryable && claim.attempts < claim.maxAttempts;
            if (retry) {
                const availableAt = safeAdd(timestamp, boundedExponentialBackoff(claim.attempts, retryInitialDelayMs, retryMaximumDelayMs), "Job retry time");
                const row = database.get(`UPDATE ${DURABLE_JOB_TABLE}
           SET status = CASE WHEN barrier = 1 THEN 'blocked' ELSE 'queued' END,
               available_at = ?, lease_owner = NULL,
               lease_token = NULL, lease_expires_at = NULL, started_at = NULL,
               barrier_recovery_reserve = CASE
                 WHEN execution_class = 'barrier-recovery'
                   THEN zeroblob(${BARRIER_RECOVERY_RESERVE_BYTES})
                 ELSE NULL
               END,
               failure_code = ?, failure_message = ?, updated_at = ?
           WHERE id = ? AND status = 'running' AND lease_owner = ?
             AND lease_token = ? AND attempts = ?
             AND lease_expires_at > ?
           RETURNING status, available_at`, [
                    availableAt,
                    safeFailure.code,
                    safeFailure.message,
                    timestamp,
                    claim.id,
                    claim.leaseOwner,
                    claim.leaseToken,
                    claim.attempts,
                    timestamp,
                ]);
                if (!row)
                    throw new StaleJobClaimError(claim.id);
                const status = statusColumn(row, "status");
                if (status !== "blocked" && status !== "queued") {
                    throw new Error(`SQLite returned invalid retry status ${status} for ${claim.id}.`);
                }
                return Object.freeze({
                    availableAt: integerColumn(row, "available_at"),
                    status,
                });
            }
            const result = database.run(`UPDATE ${DURABLE_JOB_TABLE}
         SET status = 'failed', barrier = 0, lease_owner = NULL, lease_token = NULL,
             lease_expires_at = NULL, failure_code = ?, failure_message = ?,
             barrier_recovery_reserve = NULL, finished_at = ?, updated_at = ?
         WHERE id = ? AND status = 'running' AND lease_owner = ?
           AND lease_token = ? AND attempts = ?
           AND lease_expires_at > ?`, [
                safeFailure.code,
                safeFailure.message,
                timestamp,
                timestamp,
                claim.id,
                claim.leaseOwner,
                claim.leaseToken,
                claim.attempts,
                timestamp,
            ]);
            assertOwnedTransition(result.changes, claim.id);
            return Object.freeze({ availableAt: null, status: "failed" });
        },
        get(id) {
            const safeId = validateGeneratedIdentifier(id, "job ID");
            const row = database.get(`SELECT * FROM ${DURABLE_JOB_TABLE} WHERE id = ?`, [safeId]);
            return row ? parseJob(row) : null;
        },
        recoverExpired() {
            const timestamp = clock();
            return withImmediateTransaction(database, () => recoverExpiredAt(timestamp));
        },
        withTransaction: withJobTransaction,
        pruneTerminal(before, limit) {
            assertNonNegativeSafeInteger(before, "Job-retention cutoff");
            assertBoundedBatchSize(limit, "Job-retention batch size");
            return database.run(`DELETE FROM ${DURABLE_JOB_TABLE}
         WHERE id IN (
           SELECT id
           FROM ${DURABLE_JOB_TABLE}
           WHERE status IN ('succeeded', 'failed') AND finished_at < ?
           ORDER BY finished_at, id
           LIMIT ?
         )`, [before, limit]).changes;
        },
    });
}
export function createDurableWorker({ classifyFailure, createAbortController = () => new AbortController(), handlers, heartbeatIntervalMs, owner, scheduleHeartbeat = defaultScheduleHeartbeat, scheduleTimeout = defaultScheduleTimeout, store, }) {
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
        throw new Error("A durable worker requires at least one function-valued handler.");
    }
    const registeredHandlers = new Map();
    for (const [type, handler] of handlerEntries) {
        if (typeof handler !== "function") {
            throw new Error("A durable worker requires every registered handler to be a function.");
        }
        registeredHandlers.set(validateJobType(type), handler);
    }
    if (typeof scheduleTimeout !== "function") {
        throw new Error("A durable worker requires a timeout scheduler.");
    }
    if (typeof scheduleHeartbeat !== "function") {
        throw new Error("A durable worker requires a heartbeat scheduler.");
    }
    const safeHeartbeatIntervalMs = heartbeatIntervalMs ?? Math.max(1, Math.floor(store.leaseDurationMs / 3));
    assertTimerDelayMilliseconds(safeHeartbeatIntervalMs, "Worker heartbeat interval");
    if (safeHeartbeatIntervalMs >= store.leaseDurationMs) {
        throw new Error("The worker heartbeat interval must be shorter than the job lease duration.");
    }
    let accepting = true;
    let activeRun;
    let activeController;
    async function executeUntilIdle() {
        let processed = 0;
        while (accepting) {
            const claim = store.claim(safeOwner);
            if (!claim)
                break;
            const controller = createAbortController();
            if (!controller ||
                typeof controller.abort !== "function" ||
                !controller.signal) {
                throw new Error("The durable worker abort factory returned an invalid controller.");
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
                }
                else {
                    let heartbeatFailed = false;
                    let heartbeatFailure;
                    const cancelHeartbeat = scheduleHeartbeat(safeHeartbeatIntervalMs, () => {
                        if (heartbeatFailed)
                            return;
                        try {
                            store.heartbeat(claim);
                        }
                        catch (error) {
                            if (!heartbeatFailed) {
                                heartbeatFailed = true;
                                heartbeatFailure = error;
                            }
                            try {
                                controller.abort(error);
                            }
                            catch (abortError) {
                                heartbeatFailure = abortError;
                            }
                        }
                    });
                    if (typeof cancelHeartbeat !== "function") {
                        throw new Error("The durable worker heartbeat scheduler must be cancellable.");
                    }
                    let handlerError;
                    let handlerFailed = false;
                    try {
                        await handler(claim.payload, {
                            attempt: claim.attempts,
                            heartbeat: () => store.heartbeat(claim),
                            idempotencyKey: claim.idempotencyKey,
                            jobId: claim.id,
                            maxAttempts: claim.maxAttempts,
                            signal: controller.signal,
                        });
                    }
                    catch (error) {
                        handlerFailed = true;
                        handlerError = error;
                    }
                    finally {
                        cancelHeartbeat();
                    }
                    if (heartbeatFailed)
                        throw heartbeatFailure;
                    if (!handlerFailed) {
                        store.complete(claim);
                    }
                    else if (handlerError instanceof StaleJobClaimError) {
                        throw handlerError;
                    }
                    else {
                        const disposition = classifyFailure(handlerError, claim);
                        if (isDurableJobDelay(disposition)) {
                            store.delay(claim, disposition);
                        }
                        else if (isDurableJobDeferral(disposition)) {
                            store.defer(claim, disposition);
                        }
                        else {
                            store.fail(claim, disposition);
                        }
                    }
                }
            }
            finally {
                if (activeController === controller)
                    activeController = undefined;
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
        abortActive(reason) {
            accepting = false;
            activeController?.abort(reason);
        },
        async drain(timeoutMs) {
            assertTimerDelayMilliseconds(timeoutMs, "Worker drain timeout");
            accepting = false;
            const run = activeRun;
            if (!run)
                return;
            let cancelTimeout = () => { };
            const timeout = new Promise((_resolve, reject) => {
                const cancel = scheduleTimeout(timeoutMs, () => {
                    reject(new DurableWorkerDrainTimeoutError(timeoutMs));
                });
                if (typeof cancel !== "function") {
                    reject(new Error("The durable worker timeout scheduler must be cancellable."));
                    return;
                }
                cancelTimeout = cancel;
            });
            try {
                await Promise.race([run, timeout]);
            }
            finally {
                cancelTimeout();
            }
        },
        runUntilIdle() {
            if (!accepting)
                return Promise.resolve(0);
            if (activeRun)
                return activeRun;
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
function parseClaim(row) {
    const job = parseJob(row);
    if (job.status !== "running" ||
        job.leaseOwner === null ||
        job.leaseToken === null ||
        job.leaseExpiresAt === null) {
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
function parseJob(row) {
    const status = statusColumn(row, "status");
    return Object.freeze({
        attempts: integerColumn(row, "attempts"),
        availableAt: integerColumn(row, "available_at"),
        createdAt: integerColumn(row, "created_at"),
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
function assertIdempotentInput(row, input) {
    if (textColumn(row, "type") !== input.type ||
        textColumn(row, "idempotency_key") !== input.idempotencyKey ||
        executionClassColumn(row, "execution_class") !== input.executionClass ||
        textColumn(row, "payload_json") !== input.payloadJson ||
        integerColumn(row, "max_attempts") !== input.maxAttempts ||
        integerColumn(row, "scheduled_at") !== input.scheduledAt) {
        throw new JobIdempotencyConflictError(input.type, input.idempotencyKey);
    }
}
function serializePayload(payload, maximum) {
    let validPayload;
    try {
        validPayload = isJsonValue(payload);
    }
    catch (error) {
        throw new Error("Durable job payload validation failed.", { cause: error });
    }
    if (!validPayload) {
        throw new Error("Durable job payloads must contain only JSON values.");
    }
    let serialized;
    try {
        const encoded = JSON.stringify(payload);
        if (encoded === undefined) {
            throw new Error("JSON serialization returned no value.");
        }
        serialized = encoded;
    }
    catch (error) {
        throw new Error("Durable job payload serialization failed.", {
            cause: error,
        });
    }
    if (UTF8_ENCODER.encode(serialized).byteLength > maximum) {
        throw new Error(`Durable job payloads must be JSON no larger than ${maximum} UTF-8 bytes.`);
    }
    parseJsonPayload(serialized);
    return serialized;
}
function parseJsonPayload(source) {
    let value;
    try {
        value = JSON.parse(source);
    }
    catch (error) {
        throw new Error("Durable job payload contains invalid JSON.", {
            cause: error,
        });
    }
    if (!isJsonValue(value)) {
        throw new Error("Durable job payload contains a non-JSON value.");
    }
    return value;
}
function isJsonValue(value, ancestors = new Set()) {
    if (value === null ||
        typeof value === "boolean" ||
        typeof value === "string") {
        return true;
    }
    if (typeof value === "number")
        return Number.isFinite(value);
    if (Array.isArray(value)) {
        if (ancestors.has(value) ||
            Object.getOwnPropertySymbols(value).length > 0) {
            return false;
        }
        const propertyNames = Object.getOwnPropertyNames(value);
        if (propertyNames.length !== value.length + 1)
            return false;
        ancestors.add(value);
        for (let index = 0; index < value.length; index += 1) {
            const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
            if (!descriptor ||
                !descriptor.enumerable ||
                !("value" in descriptor) ||
                !isJsonValue(descriptor.value, ancestors)) {
                ancestors.delete(value);
                return false;
            }
        }
        ancestors.delete(value);
        return true;
    }
    if (!value || typeof value !== "object")
        return false;
    const prototype = Object.getPrototypeOf(value);
    if ((prototype !== Object.prototype && prototype !== null) ||
        ancestors.has(value) ||
        Object.getOwnPropertySymbols(value).length > 0) {
        return false;
    }
    ancestors.add(value);
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
        if (!descriptor.enumerable ||
            !("value" in descriptor) ||
            !isJsonValue(descriptor.value, ancestors)) {
            ancestors.delete(value);
            return false;
        }
    }
    ancestors.delete(value);
    return true;
}
function validateFailure(failure) {
    if (!FAILURE_CODE_PATTERN.test(failure.code)) {
        throw new Error("Durable job failure codes must be lowercase snake case.");
    }
    if (typeof failure.message !== "string" ||
        !failure.message ||
        failure.message !== failure.message.trim() ||
        failure.message.length > MAX_FAILURE_MESSAGE_LENGTH ||
        /[\u0000-\u001f\u007f]/.test(failure.message)) {
        throw new Error(`Durable job failure messages must contain between 1 and ${MAX_FAILURE_MESSAGE_LENGTH} safe characters.`);
    }
    if (typeof failure.retryable !== "boolean") {
        throw new Error("Durable job retryability must be a boolean.");
    }
    return failure;
}
function validateDeferral(deferral) {
    if (deferral.type !== "defer") {
        throw new Error("Durable job deferrals must use the defer disposition.");
    }
    assertNonNegativeSafeInteger(deferral.availableAt, "Job deferral availability time");
    if (!FAILURE_CODE_PATTERN.test(deferral.code)) {
        throw new Error("Durable job deferral codes must be lowercase snake case.");
    }
    if (typeof deferral.message !== "string" ||
        !deferral.message ||
        deferral.message !== deferral.message.trim() ||
        deferral.message.length > MAX_FAILURE_MESSAGE_LENGTH ||
        /[\u0000-\u001f\u007f]/.test(deferral.message)) {
        throw new Error(`Durable job deferral messages must contain between 1 and ${MAX_FAILURE_MESSAGE_LENGTH} safe characters.`);
    }
    return deferral;
}
function validateDelay(delay) {
    if (delay.type !== "delay") {
        throw new Error("Durable job delays must use the delay disposition.");
    }
    assertNonNegativeSafeInteger(delay.availableAt, "Job delay availability time");
    if (!FAILURE_CODE_PATTERN.test(delay.code)) {
        throw new Error("Durable job delay codes must be lowercase snake case.");
    }
    if (typeof delay.message !== "string" ||
        !delay.message ||
        delay.message !== delay.message.trim() ||
        delay.message.length > MAX_FAILURE_MESSAGE_LENGTH ||
        /[\u0000-\u001f\u007f]/.test(delay.message)) {
        throw new Error(`Durable job delay messages must contain between 1 and ${MAX_FAILURE_MESSAGE_LENGTH} safe characters.`);
    }
    return delay;
}
export function isDurableJobDelay(disposition) {
    return (typeof disposition === "object" &&
        disposition !== null &&
        "type" in disposition &&
        disposition.type === "delay");
}
export function isDurableJobDeferral(disposition) {
    return (typeof disposition === "object" &&
        disposition !== null &&
        "type" in disposition &&
        disposition.type === "defer");
}
function validateJobType(value) {
    if (!JOB_TYPE_PATTERN.test(value)) {
        throw new Error("Durable job types must start with a lowercase letter and use lowercase letters, numbers, dots, colons, underscores, or hyphens.");
    }
    return value;
}
function validateIdempotencyKey(value) {
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        value.length > MAX_IDEMPOTENCY_KEY_LENGTH ||
        /[\u0000-\u001f\u007f]/.test(value)) {
        throw new Error(`Durable job idempotency keys must contain between 1 and ${MAX_IDEMPOTENCY_KEY_LENGTH} safe characters.`);
    }
    return value;
}
function validateExecutionClass(value) {
    if (value !== "standard" && value !== "barrier-recovery") {
        throw new Error("Durable job execution class must be standard or barrier-recovery.");
    }
    return value;
}
function validateGeneratedIdentifier(value, label) {
    if (!IDENTIFIER_PATTERN.test(value)) {
        throw new Error(`The durable ${label} must contain 8-128 safe identifier characters.`);
    }
    return value;
}
function assertClaim(claim) {
    validateGeneratedIdentifier(claim.id, "job ID");
    validateGeneratedIdentifier(claim.leaseOwner, "worker owner");
    validateGeneratedIdentifier(claim.leaseToken, "lease token");
    assertPositiveSafeInteger(claim.attempts, "Job claim attempt");
    if (claim.status !== "running") {
        throw new Error("Only a running durable job claim can transition.");
    }
}
function statusColumn(row, name) {
    const value = textColumn(row, name);
    if (!["blocked", "failed", "queued", "running", "succeeded"].includes(value)) {
        throw new Error(`SQLite column ${name} contains an invalid job status.`);
    }
    return value;
}
function executionClassColumn(row, name) {
    return validateExecutionClass(textColumn(row, name));
}
function textColumn(row, name) {
    const value = row[name];
    if (typeof value !== "string") {
        throw new Error(`SQLite column ${name} must be text.`);
    }
    return value;
}
function nullableTextColumn(row, name) {
    const value = row[name];
    if (value === null)
        return null;
    if (typeof value !== "string") {
        throw new Error(`SQLite column ${name} must be text or null.`);
    }
    return value;
}
function integerColumn(row, name) {
    const value = row[name];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
        throw new Error(`SQLite column ${name} must be a non-negative safe integer.`);
    }
    return value;
}
function nullableIntegerColumn(row, name) {
    const value = row[name];
    if (value === null)
        return null;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
        throw new Error(`SQLite column ${name} must be a non-negative safe integer or null.`);
    }
    return value;
}
function assertOwnedTransition(changes, jobId) {
    if (changes !== 1)
        throw new StaleJobClaimError(jobId);
}
function assertSingleTransition(changes, jobId) {
    if (changes !== 1) {
        throw new Error(`Durable job ${jobId} did not make one recovery transition.`);
    }
}
function safeAdd(value, amount, label) {
    const result = value + amount;
    if (!Number.isSafeInteger(result) || result < 0) {
        throw new Error(`${label} exceeds the safe integer range.`);
    }
    return result;
}
function assertPositiveSafeInteger(value, label) {
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`${label} must be a positive safe integer.`);
    }
}
function assertNonNegativeSafeInteger(value, label) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error(`${label} must be a non-negative safe integer.`);
    }
}
function assertBoundedBatchSize(value, label) {
    assertPositiveSafeInteger(value, label);
    if (value > MAX_BATCH_SIZE) {
        throw new Error(`${label} cannot exceed ${MAX_BATCH_SIZE} rows.`);
    }
}
function defaultScheduleTimeout(timeoutMs, onTimeout) {
    const timeout = globalThis.setTimeout(onTimeout, timeoutMs);
    return () => globalThis.clearTimeout(timeout);
}
function defaultScheduleHeartbeat(intervalMs, onHeartbeat) {
    const interval = globalThis.setInterval(onHeartbeat, intervalMs);
    return () => globalThis.clearInterval(interval);
}
