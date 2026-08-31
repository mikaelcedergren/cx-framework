import * as fs from "node:fs";
import * as path from "node:path";
import { DatabaseSync, constants as sqliteConstants } from "node:sqlite";
const MIGRATION_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
/** Canonical immutable migration history owned by every current product database. */
export const SQLITE_MIGRATION_LEDGER_TABLE = "cx_schema_migrations";
const TRANSACTION_CONTROL_PATTERN = /^\s*(?:;\s*)*(?:BEGIN\b|COMMIT\b|END\b|ROLLBACK\b|SAVEPOINT\b|RELEASE\b)/i;
const MIGRATION_LEDGER_SQL = `
  CREATE TABLE IF NOT EXISTS ${SQLITE_MIGRATION_LEDGER_TABLE} (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    fingerprint TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT
`;
export function createSyncSqliteAdapter(source) {
    for (const method of ["execute", "mutate", "queryOne", "queryAll"]) {
        if (typeof source[method] !== "function") {
            throw new Error(`The synchronous SQLite adapter requires ${method}().`);
        }
    }
    return Object.freeze({
        execute(sql) {
            source.execute(assertSql(sql));
        },
        run(sql, parameters = []) {
            const result = source.mutate(assertSql(sql), validateParameters(parameters));
            return Object.freeze({ changes: normalizeChanges(result.changes) });
        },
        get(sql, parameters = []) {
            const value = source.queryOne(assertSql(sql), validateParameters(parameters));
            return value === undefined ? undefined : normalizeRow(value);
        },
        all(sql, parameters = []) {
            return source
                .queryAll(assertSql(sql), validateParameters(parameters))
                .map((value) => normalizeRow(value));
        },
    });
}
export function createPreparedSyncSqliteAdapter(source) {
    for (const method of ["exec", "prepare"]) {
        if (typeof source[method] !== "function") {
            throw new Error(`The prepared synchronous SQLite source requires ${method}().`);
        }
    }
    function statement(sql, method) {
        const prepared = source.prepare(sql);
        if (!prepared || typeof prepared[method] !== "function") {
            throw new Error(`The prepared synchronous SQLite statement requires ${method}().`);
        }
        const consumedSource = prepared.sourceSQL ?? prepared.source;
        if (typeof consumedSource !== "string" ||
            consumedSource.trim() !== sql.trim()) {
            throw new Error("The prepared synchronous SQLite adapter requires exactly one complete statement.");
        }
        return prepared;
    }
    return createSyncSqliteAdapter({
        execute: (sql) => source.exec(sql),
        mutate: (sql, parameters) => statement(sql, "run").run(...parameters),
        queryAll: (sql, parameters) => statement(sql, "all").all(...parameters),
        queryOne: (sql, parameters) => statement(sql, "get").get(...parameters),
    });
}
export function withImmediateTransaction(database, work) {
    database.execute("BEGIN IMMEDIATE");
    try {
        const result = work();
        if (isPromiseLike(result)) {
            throw new Error("SQLite transaction work must be synchronous; asynchronous work cannot remain inside a synchronous transaction.");
        }
        database.execute("COMMIT");
        return result;
    }
    catch (error) {
        try {
            database.execute("ROLLBACK");
        }
        catch (rollbackError) {
            // SQLite can roll back the whole transaction itself for FULL, IOERR, or NOMEM. Preserve that
            // owning failure when the explicit cleanup merely confirms that no transaction remains;
            // callers must still be able to classify the original capacity or storage fault.
            if (sqliteAutomaticallyRollsBack(error) &&
                isNoActiveTransactionRollback(rollbackError)) {
                throw error;
            }
            throw new AggregateError([error, rollbackError], "SQLite work failed and its transaction could not be rolled back.");
        }
        throw error;
    }
}
function sqliteAutomaticallyRollsBack(error) {
    if (!error || typeof error !== "object" || !("errcode" in error)) {
        return false;
    }
    const code = error.errcode;
    return code === 7 || code === 10 || code === 13;
}
function isNoActiveTransactionRollback(error) {
    return (error instanceof Error &&
        error.message.toLowerCase().includes("no transaction is active"));
}
export function configureSqlite(database, configuration) {
    assertPositiveSafeInteger(configuration.busyTimeoutMs, "SQLite busy timeout");
    if (configuration.journalMode !== "delete" &&
        configuration.journalMode !== "wal") {
        throw new Error("SQLite journal mode must be delete or wal.");
    }
    database.execute("PRAGMA foreign_keys = ON");
    database.execute(`PRAGMA busy_timeout = ${configuration.busyTimeoutMs}`);
    database.execute(`PRAGMA journal_mode = ${configuration.journalMode.toUpperCase()}`);
    const foreignKeys = singlePragmaValue(database, "PRAGMA foreign_keys");
    const busyTimeout = singlePragmaValue(database, "PRAGMA busy_timeout");
    const journalMode = singlePragmaValue(database, "PRAGMA journal_mode");
    if (foreignKeys !== 1 && foreignKeys !== 1n) {
        throw new Error("SQLite foreign-key enforcement could not be enabled.");
    }
    if (busyTimeout !== configuration.busyTimeoutMs &&
        busyTimeout !== BigInt(configuration.busyTimeoutMs)) {
        throw new Error("SQLite did not apply the requested busy timeout.");
    }
    if (journalMode !== configuration.journalMode) {
        throw new Error(`SQLite did not apply journal mode ${configuration.journalMode}.`);
    }
    return Object.freeze({
        busyTimeoutMs: configuration.busyTimeoutMs,
        foreignKeys: true,
        journalMode: configuration.journalMode,
    });
}
/**
 * Open one file-backed SQLite authority while retaining proof of every path SQLite may write.
 *
 * The returned adapter re-proves the pinned storage immediately before and after each statement.
 * SQLite may unlink its reserved rollback journal while entering WAL mode, and may unlink WAL/SHM
 * after the final connection closes. Main, WAL, and SHM replacement is never adopted; only an
 * empty rollback journal that SQLite legitimately recreates may be re-pinned.
 */
export function openOwnedSqliteDatabase(options) {
    if (!options || typeof options !== "object") {
        throw new TypeError("Owned SQLite opening requires an options object.");
    }
    if (!options.configuration || options.configuration.journalMode !== "wal") {
        throw new Error("Owned SQLite databases require WAL journal mode.");
    }
    assertPositiveSafeInteger(options.configuration.busyTimeoutMs, "Owned SQLite busy timeout");
    if (options.onOpenCheckpoint !== undefined &&
        typeof options.onOpenCheckpoint !== "function") {
        throw new TypeError("Owned SQLite open checkpoints must use a function.");
    }
    if (options.requireAbsent !== undefined &&
        options.requireAbsent !== false &&
        options.requireAbsent !== true) {
        throw new TypeError("Owned SQLite requireAbsent must be boolean.");
    }
    if (options.requireAbsent === true && options.requireExisting === true) {
        throw new Error("Owned SQLite cannot require an absent and existing database together.");
    }
    if (options.requireExisting === true &&
        typeof options.beforeWrite !== "function") {
        throw new TypeError("An existing owned SQLite database requires a beforeWrite verifier.");
    }
    if (options.requireExisting !== undefined &&
        options.requireExisting !== false &&
        options.requireExisting !== true) {
        throw new TypeError("Owned SQLite requireExisting must be boolean.");
    }
    if (options.requireExisting !== true &&
        "beforeWrite" in options &&
        options.beforeWrite !== undefined) {
        throw new TypeError("Owned SQLite beforeWrite is valid only with requireExisting: true.");
    }
    const storage = prepareOwnedSqliteStorage({
        ...(options.requireAbsent === true
            ? {
                beforeExclusiveAllocation: () => emitOwnedSqliteOpenCheckpoint(options, "before_exclusive_allocation"),
            }
            : {}),
        databasePath: options.databasePath,
        operationalRoot: options.operationalRoot,
        requireAbsent: options.requireAbsent === true,
        requireExisting: options.requireExisting === true,
    });
    let native;
    try {
        emitOwnedSqliteOpenCheckpoint(options, "storage_prepared");
        storage.assertBeforeWritableOpen();
        emitOwnedSqliteOpenCheckpoint(options, "before_writable_open");
        storage.assertBeforeWritableOpen();
        native = new DatabaseSync(storage.databasePath, {
            allowBareNamedParameters: false,
            allowExtension: false,
            allowUnknownNamedParameters: false,
            defensive: true,
            enableDoubleQuotedStringLiterals: false,
            enableForeignKeyConstraints: false,
            readBigInts: false,
            returnArrays: false,
            timeout: options.configuration.busyTimeoutMs,
        });
        if (native.location("main") !== storage.databasePath) {
            throw new Error("Owned SQLite did not open the exact pinned database filename.");
        }
        storage.assertWhileOpen();
        emitOwnedSqliteOpenCheckpoint(options, "writable_opened");
        storage.assertWhileOpen();
        const guarded = guardOwnedSqliteDatabase(createPreparedSyncSqliteAdapter(native), storage.assertWhileOpen);
        if (options.requireExisting === true) {
            guarded.execute("PRAGMA query_only = ON");
            runOwnedSqliteBeforeWriteVerification({
                beforeWrite: options.beforeWrite,
                database: guarded,
                native,
            });
            storage.assertWhileOpen();
            emitOwnedSqliteOpenCheckpoint(options, "before_write_verified");
            storage.assertWhileOpen();
        }
        configureSqlite(guarded, options.configuration);
        storage.assertWhileOpen();
        emitOwnedSqliteOpenCheckpoint(options, "configured");
        storage.assertWhileOpen();
        let closed = false;
        return Object.freeze({
            get database() {
                if (closed)
                    throw new Error("Owned SQLite database is closed.");
                return guarded;
            },
            databasePath: storage.databasePath,
            get isOpen() {
                return !closed;
            },
            verifyStorage() {
                if (closed)
                    throw new Error("Owned SQLite database is closed.");
                storage.assertWhileOpen();
            },
            close() {
                if (closed)
                    return;
                closed = true;
                const errors = [];
                collectError(errors, storage.assertWhileOpen);
                let sqliteClosed = false;
                try {
                    native?.close();
                    sqliteClosed = true;
                }
                catch (error) {
                    errors.push(error);
                }
                collectError(errors, sqliteClosed
                    ? storage.assertAfterSqliteClose
                    : storage.assertWhileOpen);
                errors.push(...storage.closeProofs());
                throwCollectedErrors(errors, "Owned SQLite close failed.");
            },
        });
    }
    catch (error) {
        const errors = [error];
        if (native)
            collectError(errors, () => native?.close());
        errors.push(...storage.closeProofs());
        throwCollectedErrors(errors, "Owned SQLite opening failed.");
        throw error;
    }
}
const OWNED_SQLITE_READONLY_ACTIONS = new Set([
    sqliteConstants.SQLITE_FUNCTION,
    sqliteConstants.SQLITE_READ,
    sqliteConstants.SQLITE_RECURSIVE,
    sqliteConstants.SQLITE_SELECT,
]);
const OWNED_SQLITE_READONLY_PRAGMAS = new Set([
    "busy_timeout",
    "database_list",
    "foreign_key_check",
    "integrity_check",
    "journal_mode",
    "query_only",
]);
function runOwnedSqliteBeforeWriteVerification({ beforeWrite, database, native, }) {
    const errors = [];
    try {
        native.setAuthorizer((actionCode, argument1, argument2) => {
            if (OWNED_SQLITE_READONLY_ACTIONS.has(actionCode)) {
                return sqliteConstants.SQLITE_OK;
            }
            if (actionCode === sqliteConstants.SQLITE_PRAGMA &&
                argument2 === null &&
                argument1 !== null &&
                OWNED_SQLITE_READONLY_PRAGMAS.has(argument1.toLowerCase())) {
                return sqliteConstants.SQLITE_OK;
            }
            return sqliteConstants.SQLITE_DENY;
        });
    }
    catch (error) {
        errors.push(error);
    }
    if (errors.length === 0) {
        let verificationActive = true;
        const assertVerificationActive = () => {
            if (!verificationActive) {
                throw new Error("Owned SQLite beforeWrite verification scope has ended.");
            }
        };
        const readonlyDatabase = Object.freeze({
            all(sql, parameters = []) {
                assertVerificationActive();
                return database.all(sql, parameters);
            },
            get(sql, parameters = []) {
                assertVerificationActive();
                return database.get(sql, parameters);
            },
        });
        try {
            const result = beforeWrite(readonlyDatabase);
            if (isPromiseLike(result)) {
                throw new Error("Owned SQLite beforeWrite verification must be synchronous.");
            }
            const queryOnlyValue = singleRowValue(database.get("PRAGMA query_only"), "Owned SQLite query-only guard");
            if (queryOnlyValue !== 1 && queryOnlyValue !== 1n) {
                throw new Error("Owned SQLite beforeWrite verification disabled its read-only connection guard.");
            }
        }
        catch (error) {
            errors.push(error);
        }
        finally {
            verificationActive = false;
        }
    }
    // Clearing the native authorizer and restoring the connection are independent cleanup duties.
    // Preserve every failure so a verifier error can never hide a connection that stayed guarded.
    collectError(errors, () => native.setAuthorizer(null));
    collectError(errors, () => database.execute("PRAGMA query_only = OFF"));
    throwCollectedErrors(errors, "Owned SQLite before-write verification or cleanup failed.");
}
export function applySqliteMigrations(database, migrations, options) {
    if (typeof options.fingerprint !== "function") {
        throw new Error("SQLite migrations require a fingerprint function.");
    }
    if (typeof options.now !== "function") {
        throw new Error("SQLite migrations require a clock.");
    }
    const prepared = prepareMigrations(migrations, options.fingerprint);
    withImmediateTransaction(database, () => {
        database.execute(MIGRATION_LEDGER_SQL);
    });
    assertMigrationLedger(database, prepared);
    const appliedVersions = [];
    for (const definition of prepared) {
        const applied = withImmediateTransaction(database, () => {
            const existing = database.get(`SELECT version, name, fingerprint
         FROM ${SQLITE_MIGRATION_LEDGER_TABLE}
         WHERE version = ?`, [definition.migration.version]);
            if (existing) {
                assertLedgerEntry(existing, definition);
                return false;
            }
            for (const statement of definition.migration.statements) {
                database.run(statement);
            }
            insertMigrationLedgerEntry(database, definition, migrationTimestamp(options.now));
            return true;
        });
        if (applied)
            appliedVersions.push(definition.migration.version);
    }
    return Object.freeze({
        appliedVersions: Object.freeze(appliedVersions),
        currentVersion: prepared.at(-1)?.migration.version ?? 0,
    });
}
/**
 * Apply every pending migration as one verified batch.
 *
 * This is the cutover form of the migration runner: caller evidence is captured before the first
 * pending statement, the complete pending suffix is applied, and the caller completes and proves
 * its final state before commit. It is intended for ownership transfers where a copied queue,
 * record set, seal, or other product invariant must be proven before another process can observe
 * the new ledger.
 */
export function applySqliteMigrationsAtomically(database, migrations, options) {
    if (typeof options.fingerprint !== "function") {
        throw new Error("Atomic SQLite migrations require a fingerprint function.");
    }
    if (typeof options.now !== "function") {
        throw new Error("Atomic SQLite migrations require a clock.");
    }
    if (typeof options.captureState !== "function") {
        throw new Error("Atomic SQLite migrations require caller state capture.");
    }
    if (typeof options.verifyFinalState !== "function") {
        throw new Error("Atomic SQLite migrations require final-state verification.");
    }
    const prepared = prepareMigrations(migrations, options.fingerprint);
    return withImmediateTransaction(database, () => {
        database.execute(MIGRATION_LEDGER_SQL);
        assertMigrationLedger(database, prepared);
        const evidence = options.captureState(database);
        if (isPromiseLike(evidence)) {
            throw new Error("Atomic SQLite migration state capture must be synchronous.");
        }
        const appliedVersions = [];
        for (const definition of prepared) {
            const existing = database.get(`SELECT version, name, fingerprint
         FROM ${SQLITE_MIGRATION_LEDGER_TABLE}
         WHERE version = ?`, [definition.migration.version]);
            if (existing) {
                assertLedgerEntry(existing, definition);
                continue;
            }
            for (const statement of definition.migration.statements) {
                database.run(statement);
            }
            insertMigrationLedgerEntry(database, definition, migrationTimestamp(options.now));
            appliedVersions.push(definition.migration.version);
        }
        assertMigrationLedger(database, prepared);
        const result = Object.freeze({
            appliedVersions: Object.freeze(appliedVersions),
            currentVersion: prepared.at(-1)?.migration.version ?? 0,
        });
        const verification = options.verifyFinalState(database, evidence, result);
        if (isPromiseLike(verification)) {
            throw new Error("Atomic SQLite migration final-state verification must be synchronous.");
        }
        return result;
    });
}
export function verifySqliteIntegrity(database) {
    const foreignKeyFailure = database.get("SELECT * FROM pragma_foreign_key_check LIMIT 1");
    if (foreignKeyFailure) {
        throw new Error("SQLite foreign-key validation found a violation.");
    }
    const integrityRows = database.all("PRAGMA integrity_check");
    if (integrityRows.length !== 1 ||
        singleRowValue(integrityRows[0], "SQLite integrity check") !== "ok") {
        throw new Error("SQLite integrity validation did not return ok.");
    }
}
function prepareMigrations(migrations, fingerprint) {
    const names = new Set();
    return migrations.map((migration, index) => {
        const expectedVersion = index + 1;
        if (migration.version !== expectedVersion) {
            throw new Error(`SQLite migration versions must be contiguous from 1; expected ${expectedVersion}, received ${migration.version}.`);
        }
        if (!MIGRATION_NAME_PATTERN.test(migration.name)) {
            throw new Error(`Invalid SQLite migration name: ${migration.name}. Use lowercase snake case.`);
        }
        if (names.has(migration.name)) {
            throw new Error(`Duplicate SQLite migration name: ${migration.name}.`);
        }
        names.add(migration.name);
        if (!Array.isArray(migration.statements) ||
            migration.statements.length < 1) {
            throw new Error(`SQLite migration ${migration.version} must contain at least one statement.`);
        }
        for (const statement of migration.statements) {
            assertSql(statement);
            assertNoTransactionControl(statement, migration.version);
        }
        const calculated = fingerprint(canonicalMigrationSource(migration));
        if (!SHA256_PATTERN.test(calculated)) {
            throw new Error(`SQLite migration ${migration.version} fingerprint must be a lowercase SHA-256 hex digest.`);
        }
        return Object.freeze({ fingerprint: calculated, migration });
    });
}
function canonicalMigrationSource(migration) {
    return JSON.stringify({
        name: migration.name,
        statements: migration.statements,
        version: migration.version,
    });
}
function insertMigrationLedgerEntry(database, definition, appliedAt) {
    const insertion = database.run(`INSERT INTO ${SQLITE_MIGRATION_LEDGER_TABLE}
       (version, name, fingerprint, applied_at)
     VALUES (?, ?, ?, ?)`, [
        definition.migration.version,
        definition.migration.name,
        definition.fingerprint,
        appliedAt,
    ]);
    if (insertion.changes !== 1) {
        throw new Error(`SQLite migration ${definition.migration.version} ledger insertion changed ${insertion.changes} rows instead of one.`);
    }
}
function assertMigrationLedger(database, migrations) {
    const rows = database.all(`SELECT version, name, fingerprint
     FROM ${SQLITE_MIGRATION_LEDGER_TABLE}
     ORDER BY version
     LIMIT ?`, [migrations.length + 1]);
    for (const [index, row] of rows.entries()) {
        const version = safeIntegerColumn(row, "version");
        const expectedVersion = index + 1;
        if (version !== expectedVersion) {
            throw new Error(`Applied SQLite migration versions must be contiguous from 1; expected ${expectedVersion}, received ${version}.`);
        }
        const definition = migrations[version - 1];
        if (!definition) {
            throw new Error(`Database contains unknown applied SQLite migration version ${version}.`);
        }
        assertLedgerEntry(row, definition);
    }
}
function assertLedgerEntry(row, definition) {
    const version = safeIntegerColumn(row, "version");
    const name = stringColumn(row, "name");
    const fingerprint = stringColumn(row, "fingerprint");
    if (version !== definition.migration.version ||
        name !== definition.migration.name ||
        fingerprint !== definition.fingerprint) {
        throw new Error(`Applied SQLite migration ${definition.migration.version} no longer matches its immutable definition.`);
    }
}
function migrationTimestamp(now) {
    return validateMigrationTimestamp(now(), "The migration clock");
}
function validateMigrationTimestamp(value, label) {
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        value.length > 128 ||
        /[\u0000-\u001f\u007f]/.test(value)) {
        throw new Error(`${label} must be a safe timestamp string.`);
    }
    return value;
}
function singlePragmaValue(database, statement) {
    const row = database.get(statement);
    if (!row)
        throw new Error(`SQLite returned no value for ${statement}.`);
    return singleRowValue(row, statement);
}
function singleRowValue(row, label) {
    if (!row)
        throw new Error(`${label} returned no row.`);
    const values = Object.values(row);
    if (values.length !== 1 || values[0] === undefined) {
        throw new Error(`${label} must return exactly one value.`);
    }
    return values[0];
}
function safeIntegerColumn(row, name) {
    const value = row[name];
    if (typeof value !== "number" || !Number.isSafeInteger(value)) {
        throw new Error(`SQLite column ${name} must be a safe integer.`);
    }
    return value;
}
function stringColumn(row, name) {
    const value = row[name];
    if (typeof value !== "string") {
        throw new Error(`SQLite column ${name} must be text.`);
    }
    return value;
}
function assertSql(sql) {
    if (typeof sql !== "string" || !sql.trim()) {
        throw new Error("SQLite statements must contain SQL.");
    }
    return sql;
}
function assertNoTransactionControl(sql, version) {
    const searchable = sqlOutsideQuotedContent(sql);
    if (TRANSACTION_CONTROL_PATTERN.test(searchable)) {
        throw new Error(`SQLite migration ${version} must not control transactions; the migration runner owns commit and rollback.`);
    }
}
function sqlOutsideQuotedContent(sql) {
    let result = "";
    let index = 0;
    while (index < sql.length) {
        const character = sql[index];
        const next = sql[index + 1];
        if (character === "-" && next === "-") {
            result += "  ";
            index += 2;
            while (index < sql.length && sql[index] !== "\n") {
                result += " ";
                index += 1;
            }
            continue;
        }
        if (character === "/" && next === "*") {
            result += "  ";
            index += 2;
            while (index < sql.length &&
                !(sql[index] === "*" && sql[index + 1] === "/")) {
                result += sql[index] === "\n" ? "\n" : " ";
                index += 1;
            }
            if (index < sql.length) {
                result += "  ";
                index += 2;
            }
            continue;
        }
        if (character === "'" ||
            character === '"' ||
            character === "`" ||
            character === "[") {
            const closing = character === "[" ? "]" : character;
            result += " ";
            index += 1;
            while (index < sql.length) {
                if (sql[index] === closing) {
                    if (closing !== "]" && sql[index + 1] === closing) {
                        result += "  ";
                        index += 2;
                        continue;
                    }
                    result += " ";
                    index += 1;
                    break;
                }
                result += sql[index] === "\n" ? "\n" : " ";
                index += 1;
            }
            continue;
        }
        result += character;
        index += 1;
    }
    return result;
}
function validateParameters(parameters) {
    if (!Array.isArray(parameters)) {
        throw new Error("SQLite positional parameters must be an array.");
    }
    for (const value of parameters) {
        if (!isSqliteValue(value)) {
            throw new Error("SQLite received an unsupported positional parameter.");
        }
    }
    return parameters;
}
function normalizeRow(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("SQLite queries must return record-shaped rows.");
    }
    const normalized = {};
    for (const [key, column] of Object.entries(value)) {
        if (!isSqliteValue(column)) {
            throw new Error(`SQLite returned an unsupported value for column ${key}.`);
        }
        normalized[key] = normalizeRowValue(column);
    }
    return Object.freeze(normalized);
}
function normalizeRowValue(value) {
    if (typeof value === "bigint" &&
        value >= BigInt(Number.MIN_SAFE_INTEGER) &&
        value <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(value);
    }
    return value;
}
function normalizeChanges(value) {
    const changes = typeof value === "bigint" ? Number(value) : value;
    if (!Number.isSafeInteger(changes) || changes < 0) {
        throw new Error("SQLite mutation changes must be a non-negative safe integer.");
    }
    return changes;
}
function isSqliteValue(value) {
    return (value === null ||
        typeof value === "string" ||
        typeof value === "bigint" ||
        (typeof value === "number" && Number.isFinite(value)) ||
        value instanceof Uint8Array);
}
function isPromiseLike(value) {
    return (typeof value === "object" &&
        value !== null &&
        "then" in value &&
        typeof value.then === "function");
}
function assertPositiveSafeInteger(value, label) {
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`${label} must be a positive safe integer.`);
    }
}
const OWNED_SQLITE_DIRECTORY_MODE = 0o700;
const OWNED_SQLITE_FILE_MODE = 0o600;
const OWNED_SQLITE_SNAPSHOT_ATTEMPTS = 32;
function prepareOwnedSqliteStorage({ beforeExclusiveAllocation, databasePath, operationalRoot, requireAbsent, requireExisting, }) {
    const root = normalizedAbsoluteSqlitePath(operationalRoot, "operational root");
    const selectedDatabasePath = normalizedAbsoluteSqlitePath(databasePath, "database path");
    const relativeDatabasePath = path.relative(root, selectedDatabasePath);
    if (!relativeDatabasePath || pathEscapesRoot(relativeDatabasePath)) {
        throw new Error("Owned SQLite database path must remain inside its operational root.");
    }
    const databaseDirectory = path.dirname(selectedDatabasePath);
    const relativeDirectory = path.relative(root, databaseDirectory);
    if (pathEscapesRoot(relativeDirectory)) {
        throw new Error("Owned SQLite database directory must remain inside its operational root.");
    }
    const descendantNames = relativeDirectory
        ? relativeDirectory.split(path.sep)
        : [];
    if (descendantNames.some((segment) => !segment || segment === "." || segment === "..")) {
        throw new Error("Owned SQLite database directory path is invalid.");
    }
    const directories = [];
    const artifacts = [];
    try {
        directories.push(pinOwnedDirectory({
            canonicalPath: root,
            directoryPath: root,
            label: "Owned SQLite operational root",
            requirePrivateMode: descendantNames.length === 0,
        }));
        assertOwnedDirectoryProofs(directories);
        let current = root;
        for (const segment of descendantNames) {
            current = path.join(current, segment);
            let created = false;
            if (!requireExisting) {
                try {
                    fs.mkdirSync(current, { mode: OWNED_SQLITE_DIRECTORY_MODE });
                    created = true;
                }
                catch (error) {
                    if (!isNodeFilesystemError(error, "EEXIST")) {
                        throw error;
                    }
                }
            }
            try {
                directories.push(pinOwnedDirectory({
                    canonicalPath: current,
                    created,
                    directoryPath: current,
                    label: "Owned SQLite database directory",
                    requirePrivateMode: true,
                }));
            }
            catch (error) {
                if (requireExisting && isNodeFilesystemError(error, "ENOENT")) {
                    throw new Error("Existing owned SQLite database ancestry must already exist.", { cause: error });
                }
                throw error;
            }
            assertOwnedDirectoryProofs(directories);
        }
        const journalPath = `${selectedDatabasePath}-journal`;
        const writeAheadLogPath = `${selectedDatabasePath}-wal`;
        const sharedMemoryPath = `${selectedDatabasePath}-shm`;
        if (requireAbsent) {
            assertOwnedSqliteFamilyAbsent([
                [selectedDatabasePath, "database"],
                [journalPath, "rollback journal"],
                [writeAheadLogPath, "write-ahead log"],
                [sharedMemoryPath, "shared-memory file"],
            ]);
            beforeExclusiveAllocation?.();
            assertOwnedDirectoryProofs(directories);
        }
        const main = pinOwnedFile({
            createMissing: !requireExisting,
            filePath: selectedDatabasePath,
            label: "Owned SQLite database",
            requireAbsent,
        });
        artifacts.push(main);
        let journal;
        if (ownedSqliteMainUsesWal(main)) {
            try {
                journal = pinOwnedFile({
                    createMissing: false,
                    filePath: journalPath,
                    label: "Owned SQLite rollback journal",
                });
            }
            catch (error) {
                if (!isNodeFilesystemError(error, "ENOENT"))
                    throw error;
            }
        }
        else {
            journal = pinOwnedFile({
                createMissing: true,
                filePath: journalPath,
                label: "Owned SQLite rollback journal",
                requireAbsent,
            });
        }
        if (journal)
            artifacts.push(journal);
        const writeAheadLog = pinOwnedFile({
            createMissing: true,
            filePath: writeAheadLogPath,
            label: "Owned SQLite write-ahead log",
            requireAbsent,
        });
        artifacts.push(writeAheadLog);
        const sharedMemory = pinOwnedFile({
            createMissing: true,
            filePath: sharedMemoryPath,
            label: "Owned SQLite shared-memory file",
            requireAbsent,
        });
        artifacts.push(sharedMemory);
        function assertDirectories() {
            assertOwnedDirectoryProofs(directories);
        }
        function assertBeforeWritableOpen() {
            assertDirectories();
            main.assertLinked();
            if (journal)
                journal.assertLinked();
            else
                assertOwnedSqliteArtifactAbsent(journalPath, "rollback journal");
            writeAheadLog.assertLinked();
            sharedMemory.assertLinked();
            assertDirectories();
        }
        function assertWhileOpen() {
            assertDirectories();
            main.assertLinked();
            // SQLite may unlink the reserved rollback journal during recovery or while entering WAL.
            // The original descriptor must then have zero links and the name must remain absent.
            if (journal)
                journal.assertLinkedOrRemoved(true);
            else
                assertOwnedSqliteArtifactAbsent(journalPath, "rollback journal");
            writeAheadLog.assertLinked();
            sharedMemory.assertLinked();
            assertDirectories();
        }
        function assertAfterSqliteClose() {
            assertDirectories();
            main.assertLinked();
            if (journal)
                journal.assertLinkedOrRemoved(true);
            else
                assertOwnedSqliteArtifactAbsent(journalPath, "rollback journal");
            writeAheadLog.assertLinkedOrRemoved();
            sharedMemory.assertLinkedOrRemoved();
            assertDirectories();
        }
        let proofsClosed = false;
        return Object.freeze({
            assertAfterSqliteClose,
            assertBeforeWritableOpen,
            assertWhileOpen,
            closeProofs() {
                if (proofsClosed)
                    return Object.freeze([]);
                proofsClosed = true;
                return Object.freeze(closeOwnedSqliteProofs(artifacts, directories));
            },
            databasePath: selectedDatabasePath,
        });
    }
    catch (error) {
        const errors = [error];
        errors.push(...closeOwnedSqliteProofs(artifacts, directories));
        throwCollectedErrors(errors, "Owned SQLite storage preparation failed.");
        throw error;
    }
}
function pinOwnedDirectory({ canonicalPath, created = false, directoryPath, label, requirePrivateMode, }) {
    let before = fs.lstatSync(directoryPath, { bigint: true });
    assertOwnedDirectoryStats(before, label, created ? false : requirePrivateMode);
    let allocatedIdentity;
    if (created) {
        allocatedIdentity = ownedDirectoryIdentity(before);
        if (!hasExactOwnedMode(before, OWNED_SQLITE_DIRECTORY_MODE)) {
            fs.chmodSync(directoryPath, OWNED_SQLITE_DIRECTORY_MODE);
        }
        before = fs.lstatSync(directoryPath, { bigint: true });
        assertOwnedDirectoryStats(before, label, true);
        assertSameOwnedDirectoryAllocation(allocatedIdentity, before, label);
    }
    let descriptor;
    try {
        descriptor = fs.openSync(directoryPath, requiredFsConstant("O_RDONLY") |
            requiredFsConstant("O_DIRECTORY") |
            requiredFsConstant("O_NOFOLLOW") |
            requiredFsConstant("O_NONBLOCK"));
        let pinned = fs.fstatSync(descriptor, { bigint: true });
        if (allocatedIdentity) {
            assertSameOwnedDirectoryAllocation(allocatedIdentity, pinned, label);
            // Node's Permission Model disables descriptor chmod categorically. A descriptor that
            // already proves the exact private mode needs no mutation; retain repair only for a mode
            // that was narrowed before the descriptor became pinned.
            if (!hasExactOwnedMode(pinned, OWNED_SQLITE_DIRECTORY_MODE)) {
                fs.fchmodSync(descriptor, OWNED_SQLITE_DIRECTORY_MODE);
                pinned = fs.fstatSync(descriptor, { bigint: true });
                assertSameOwnedDirectoryAllocation(allocatedIdentity, pinned, label);
            }
        }
        assertOwnedDirectoryStats(pinned, label, requirePrivateMode);
        const identity = ownedDirectoryIdentity(pinned);
        let closed = false;
        function assertUnchanged() {
            if (closed || descriptor === undefined) {
                throw new Error(`${label} proof is already closed.`);
            }
            const descriptorStats = fs.fstatSync(descriptor, { bigint: true });
            const pathStats = fs.lstatSync(directoryPath, { bigint: true });
            assertOwnedDirectoryStats(descriptorStats, label, requirePrivateMode);
            assertOwnedDirectoryStats(pathStats, label, requirePrivateMode);
            assertSameOwnedDirectory(identity, descriptorStats, label);
            assertSameOwnedDirectory(identity, pathStats, label);
            if (fs.realpathSync.native(directoryPath) !== canonicalPath) {
                throw new Error(`${label} is no longer canonical.`);
            }
        }
        const proof = Object.freeze({
            assertUnchanged,
            close() {
                if (closed || descriptor === undefined)
                    return;
                closed = true;
                const selectedDescriptor = descriptor;
                descriptor = undefined;
                fs.closeSync(selectedDescriptor);
            },
            lexicalPath: directoryPath,
        });
        proof.assertUnchanged();
        return proof;
    }
    catch (error) {
        if (descriptor !== undefined) {
            try {
                fs.closeSync(descriptor);
            }
            catch (closeError) {
                throw new AggregateError([error, closeError], `${label} could not be pinned or closed.`);
            }
        }
        throw error;
    }
}
function pinOwnedFile({ createMissing, filePath, label, requireAbsent = false, }) {
    for (let attempt = 0; attempt < OWNED_SQLITE_SNAPSHOT_ATTEMPTS; attempt += 1) {
        let descriptor;
        let created = false;
        try {
            if (requireAbsent) {
                try {
                    descriptor = fs.openSync(filePath, requiredFsConstant("O_RDWR") |
                        requiredFsConstant("O_CREAT") |
                        requiredFsConstant("O_EXCL") |
                        requiredFsConstant("O_NOFOLLOW") |
                        requiredFsConstant("O_NONBLOCK"), OWNED_SQLITE_FILE_MODE);
                    created = true;
                }
                catch (allocationError) {
                    if (isNodeFilesystemError(allocationError, "EEXIST")) {
                        throw new Error(`${label} must be absent for exclusive creation.`, {
                            cause: allocationError,
                        });
                    }
                    throw allocationError;
                }
            }
            else {
                try {
                    const before = fs.lstatSync(filePath, { bigint: true });
                    assertOwnedFileStats(before, label, 1n);
                    descriptor = fs.openSync(filePath, requiredFsConstant("O_RDONLY") |
                        requiredFsConstant("O_NOFOLLOW") |
                        requiredFsConstant("O_NONBLOCK"));
                }
                catch (error) {
                    if (!isNodeFilesystemError(error, "ENOENT") || !createMissing) {
                        throw error;
                    }
                    try {
                        descriptor = fs.openSync(filePath, requiredFsConstant("O_RDWR") |
                            requiredFsConstant("O_CREAT") |
                            requiredFsConstant("O_EXCL") |
                            requiredFsConstant("O_NOFOLLOW") |
                            requiredFsConstant("O_NONBLOCK"), OWNED_SQLITE_FILE_MODE);
                        created = true;
                    }
                    catch (allocationError) {
                        if (isNodeFilesystemError(allocationError, "EEXIST"))
                            continue;
                        throw allocationError;
                    }
                }
            }
            if (descriptor === undefined) {
                throw new Error(`${label} descriptor was not opened.`);
            }
            let initialStats = fs.fstatSync(descriptor, { bigint: true });
            // O_EXCL plus the requested mode normally allocates the exact private file even under the
            // Permission Model. Only use descriptor repair when a restrictive umask actually narrowed
            // that mode; environments that prohibit repair then fail closed instead of accepting it.
            if (created && !hasExactOwnedMode(initialStats, OWNED_SQLITE_FILE_MODE)) {
                assertOwnedFileAllocationStats(initialStats, label, 1n);
                fs.fchmodSync(descriptor, OWNED_SQLITE_FILE_MODE);
                initialStats = fs.fstatSync(descriptor, { bigint: true });
            }
            assertOwnedFileStats(initialStats, label, 1n);
            let identity = ownedFileIdentity(initialStats);
            let closed = false;
            function assertLinked() {
                if (closed || descriptor === undefined) {
                    throw new Error(`${label} proof is already closed.`);
                }
                captureStableLinkedOwnedFile({
                    descriptor,
                    expectedIdentity: identity,
                    filePath,
                    label,
                });
            }
            function assertLinkedOrRemoved(allowEmptyReplacement = false) {
                if (closed || descriptor === undefined) {
                    throw new Error(`${label} proof is already closed.`);
                }
                const descriptorStats = fs.fstatSync(descriptor, { bigint: true });
                assertSameOwnedFile(identity, descriptorStats, label);
                if (descriptorStats.nlink === 1n) {
                    assertLinked();
                    return;
                }
                if (descriptorStats.nlink !== 0n) {
                    throw new Error(`${label} gained an unexpected filesystem alias.`);
                }
                let replacementStats;
                try {
                    replacementStats = fs.lstatSync(filePath, { bigint: true });
                }
                catch (error) {
                    if (isNodeFilesystemError(error, "ENOENT")) {
                        const after = fs.fstatSync(descriptor, { bigint: true });
                        assertSameOwnedFile(identity, after, label);
                        if (after.nlink !== 0n) {
                            throw new Error(`${label} changed while its removal was proved.`);
                        }
                        return;
                    }
                    throw error;
                }
                if (allowEmptyReplacement) {
                    assertOwnedFileStats(replacementStats, label, 1n);
                    if (replacementStats.size !== 0n) {
                        throw new Error(`${label} replacement must be empty while SQLite uses WAL.`);
                    }
                    let replacementDescriptor;
                    try {
                        replacementDescriptor = fs.openSync(filePath, requiredFsConstant("O_RDONLY") |
                            requiredFsConstant("O_NOFOLLOW") |
                            requiredFsConstant("O_NONBLOCK"));
                        const replacementIdentity = ownedFileIdentity(fs.fstatSync(replacementDescriptor, { bigint: true }));
                        const replacementSnapshot = captureStableLinkedOwnedFile({
                            descriptor: replacementDescriptor,
                            expectedIdentity: replacementIdentity,
                            filePath,
                            label,
                        });
                        if (replacementSnapshot.size !== 0n) {
                            throw new Error(`${label} replacement must remain empty while SQLite uses WAL.`);
                        }
                        const removedDescriptor = descriptor;
                        fs.closeSync(removedDescriptor);
                        descriptor = replacementDescriptor;
                        replacementDescriptor = undefined;
                        identity = replacementIdentity;
                        return;
                    }
                    finally {
                        if (replacementDescriptor !== undefined) {
                            fs.closeSync(replacementDescriptor);
                        }
                    }
                }
                throw new Error(`${label} path was replaced after SQLite removed it.`);
            }
            const proof = Object.freeze({
                assertLinked,
                assertLinkedOrRemoved,
                close() {
                    if (closed || descriptor === undefined)
                        return;
                    closed = true;
                    const selectedDescriptor = descriptor;
                    descriptor = undefined;
                    fs.closeSync(selectedDescriptor);
                },
                filePath,
                readStablePrefix(maximumBytes) {
                    if (!Number.isSafeInteger(maximumBytes) ||
                        maximumBytes < 0 ||
                        maximumBytes > 4_096) {
                        throw new Error(`${label} stable-prefix length must be between zero and 4096 bytes.`);
                    }
                    if (closed || descriptor === undefined) {
                        throw new Error(`${label} proof is already closed.`);
                    }
                    for (let attempt = 0; attempt < OWNED_SQLITE_SNAPSHOT_ATTEMPTS; attempt += 1) {
                        const before = captureStableLinkedOwnedFile({
                            descriptor,
                            expectedIdentity: identity,
                            filePath,
                            label,
                        });
                        const length = Number(before.size < BigInt(maximumBytes)
                            ? before.size
                            : BigInt(maximumBytes));
                        const bytes = Buffer.alloc(length);
                        const bytesRead = fs.readSync(descriptor, bytes, 0, length, 0);
                        const after = captureStableLinkedOwnedFile({
                            descriptor,
                            expectedIdentity: identity,
                            filePath,
                            label,
                        });
                        if (bytesRead === length && sameOwnedFileSnapshot(before, after)) {
                            return bytes;
                        }
                    }
                    throw new Error(`${label} changed while its stable prefix was read.`);
                },
            });
            proof.assertLinked();
            return proof;
        }
        catch (error) {
            if (descriptor !== undefined) {
                try {
                    fs.closeSync(descriptor);
                }
                catch (closeError) {
                    throw new AggregateError([error, closeError], `${label} could not be pinned or closed.`);
                }
            }
            throw error;
        }
    }
    throw new Error(`${label} could not be pinned after concurrent allocation.`);
}
function ownedSqliteMainUsesWal(main) {
    const header = main.readStablePrefix(100);
    if (header.byteLength < 100)
        return false;
    const signature = "SQLite format 3\u0000";
    for (let index = 0; index < signature.length; index += 1) {
        if (header[index] !== signature.charCodeAt(index))
            return false;
    }
    return header[18] === 2 && header[19] === 2;
}
function assertOwnedSqliteArtifactAbsent(artifactPath, label) {
    try {
        fs.lstatSync(artifactPath);
    }
    catch (error) {
        if (isNodeFilesystemError(error, "ENOENT"))
            return;
        throw error;
    }
    throw new Error(`Owned SQLite ${label} appeared outside its pinned lifecycle.`);
}
function assertOwnedSqliteFamilyAbsent(artifacts) {
    for (const [artifactPath, label] of artifacts) {
        try {
            fs.lstatSync(artifactPath);
        }
        catch (error) {
            if (isNodeFilesystemError(error, "ENOENT"))
                continue;
            throw error;
        }
        throw new Error(`Owned SQLite ${label} must be absent before exclusive family creation.`);
    }
}
function captureStableLinkedOwnedFile({ descriptor, expectedIdentity, filePath, label, }) {
    for (let attempt = 0; attempt < OWNED_SQLITE_SNAPSHOT_ATTEMPTS; attempt += 1) {
        const descriptorBefore = ownedFileSnapshot(fs.fstatSync(descriptor, { bigint: true }), label, 1n);
        const pathSnapshot = ownedFileSnapshot(fs.lstatSync(filePath, { bigint: true }), label, 1n);
        const descriptorAfter = ownedFileSnapshot(fs.fstatSync(descriptor, { bigint: true }), label, 1n);
        assertSameOwnedFile(expectedIdentity, descriptorBefore, label);
        assertSameOwnedFile(expectedIdentity, pathSnapshot, label);
        assertSameOwnedFile(expectedIdentity, descriptorAfter, label);
        if (sameOwnedFileSnapshot(descriptorBefore, pathSnapshot) &&
            sameOwnedFileSnapshot(pathSnapshot, descriptorAfter)) {
            return descriptorAfter;
        }
    }
    throw new Error(`${label} did not provide a stable pinned snapshot.`);
}
function guardOwnedSqliteDatabase(database, assertStorage) {
    return Object.freeze({
        execute(sql) {
            return withOwnedSqliteStorageProof(assertStorage, () => database.execute(sql));
        },
        run(sql, parameters = []) {
            return withOwnedSqliteStorageProof(assertStorage, () => database.run(sql, parameters));
        },
        get(sql, parameters = []) {
            return withOwnedSqliteStorageProof(assertStorage, () => database.get(sql, parameters));
        },
        all(sql, parameters = []) {
            return withOwnedSqliteStorageProof(assertStorage, () => database.all(sql, parameters));
        },
    });
}
function withOwnedSqliteStorageProof(assertStorage, operation) {
    assertStorage();
    let operationError;
    let result;
    try {
        result = operation();
    }
    catch (error) {
        operationError = error;
    }
    let storageError;
    try {
        assertStorage();
    }
    catch (error) {
        storageError = error;
    }
    if (operationError !== undefined && storageError !== undefined) {
        throw new AggregateError([operationError, storageError], "SQLite statement failed and owned storage proof also failed.");
    }
    if (operationError !== undefined)
        throw operationError;
    if (storageError !== undefined)
        throw storageError;
    return result;
}
function emitOwnedSqliteOpenCheckpoint(options, checkpoint) {
    const result = options.onOpenCheckpoint?.(checkpoint);
    if (isPromiseLike(result)) {
        throw new Error("Owned SQLite open checkpoints must be synchronous.");
    }
}
function assertOwnedDirectoryProofs(proofs) {
    for (const proof of proofs)
        proof.assertUnchanged();
}
function closeOwnedSqliteProofs(artifacts, directories) {
    const errors = [];
    for (const proof of [...artifacts].reverse()) {
        collectError(errors, proof.close);
    }
    for (const proof of [...directories].reverse()) {
        collectError(errors, proof.close);
    }
    return errors;
}
function assertOwnedDirectoryStats(stats, label, requirePrivateMode) {
    if (!stats.isDirectory() ||
        stats.isSymbolicLink() ||
        stats.uid !== ownedSqliteUid() ||
        (requirePrivateMode &&
            (stats.mode & 4095n) !== BigInt(OWNED_SQLITE_DIRECTORY_MODE))) {
        throw new Error(requirePrivateMode
            ? `${label} must be a current-user-owned real mode-0700 directory.`
            : `${label} must be a current-user-owned real directory.`);
    }
}
function ownedDirectoryIdentity(stats) {
    return Object.freeze({
        device: stats.dev,
        inode: stats.ino,
        mode: stats.mode,
        owner: stats.uid,
    });
}
function assertSameOwnedDirectoryAllocation(expected, actual, label) {
    if (actual.dev !== expected.device ||
        actual.ino !== expected.inode ||
        actual.uid !== expected.owner) {
        throw new Error(`${label} changed while its private mode was applied.`);
    }
}
function assertSameOwnedDirectory(expected, actual, label) {
    if (actual.dev !== expected.device ||
        actual.ino !== expected.inode ||
        actual.mode !== expected.mode ||
        actual.uid !== expected.owner) {
        throw new Error(`${label} identity changed while SQLite was owned.`);
    }
}
function assertOwnedFileAllocationStats(stats, label, links) {
    if (!stats.isFile() ||
        stats.isSymbolicLink() ||
        stats.nlink !== links ||
        stats.uid !== ownedSqliteUid()) {
        throw new Error(`${label} must be one current-user-owned regular file before its private mode is applied.`);
    }
}
function assertOwnedFileStats(stats, label, links) {
    if (!stats.isFile() ||
        stats.isSymbolicLink() ||
        stats.nlink !== links ||
        stats.uid !== ownedSqliteUid() ||
        (stats.mode & 4095n) !== BigInt(OWNED_SQLITE_FILE_MODE)) {
        throw new Error(`${label} must be one current-user-owned mode-0600 regular file.`);
    }
}
function hasExactOwnedMode(stats, mode) {
    return (stats.mode & 4095n) === BigInt(mode);
}
function ownedFileIdentity(stats) {
    return Object.freeze({
        device: stats.dev,
        inode: stats.ino,
        mode: stats.mode,
        owner: stats.uid,
    });
}
function ownedFileSnapshot(stats, label, links) {
    assertOwnedFileStats(stats, label, links);
    return Object.freeze({
        ...ownedFileIdentity(stats),
        changedAtNs: stats.ctimeNs,
        links: stats.nlink,
        modifiedAtNs: stats.mtimeNs,
        size: stats.size,
    });
}
function assertSameOwnedFile(expected, actual, label) {
    const device = "dev" in actual ? actual.dev : actual.device;
    const inode = "ino" in actual ? actual.ino : actual.inode;
    const mode = actual.mode;
    const owner = "uid" in actual ? actual.uid : actual.owner;
    if (device !== expected.device ||
        inode !== expected.inode ||
        mode !== expected.mode ||
        owner !== expected.owner) {
        throw new Error(`${label} path changed while SQLite was owned.`);
    }
}
function sameOwnedFileSnapshot(left, right) {
    return (left.device === right.device &&
        left.inode === right.inode &&
        left.mode === right.mode &&
        left.owner === right.owner &&
        left.links === right.links &&
        left.changedAtNs === right.changedAtNs &&
        left.modifiedAtNs === right.modifiedAtNs &&
        left.size === right.size);
}
function normalizedAbsoluteSqlitePath(value, label) {
    if (typeof value !== "string" ||
        !value ||
        value.includes("\0") ||
        !path.isAbsolute(value) ||
        path.normalize(value) !== value) {
        throw new Error(`Owned SQLite ${label} must be normalized and absolute.`);
    }
    return value;
}
function pathEscapesRoot(relativePath) {
    return (relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath));
}
function requiredFsConstant(name) {
    const value = fs.constants[name];
    if (typeof value !== "number") {
        throw new Error(`Owned SQLite storage requires POSIX ${name}.`);
    }
    return value;
}
function ownedSqliteUid() {
    if (typeof process.geteuid !== "function") {
        throw new Error("Owned SQLite storage requires POSIX ownership checks.");
    }
    return BigInt(process.geteuid());
}
function isNodeFilesystemError(error, code) {
    return error instanceof Error && "code" in error && error.code === code;
}
function collectError(errors, operation) {
    try {
        operation();
    }
    catch (error) {
        errors.push(error);
    }
}
function throwCollectedErrors(errors, message) {
    if (errors.length === 0)
        return;
    if (errors.length === 1)
        throw errors[0];
    throw new AggregateError(errors, message);
}
