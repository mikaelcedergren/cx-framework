export type SqliteValue = null | string | number | bigint | Uint8Array;
export type SqliteRow = Readonly<Record<string, SqliteValue>>;
export interface SqliteMutationResult {
    readonly changes: number;
}
export interface SyncSqliteDatabase {
    execute(sql: string): void;
    run(sql: string, parameters?: readonly SqliteValue[]): SqliteMutationResult;
    get<Row extends SqliteRow = SqliteRow>(sql: string, parameters?: readonly SqliteValue[]): Row | undefined;
    all<Row extends SqliteRow = SqliteRow>(sql: string, parameters?: readonly SqliteValue[]): readonly Row[];
}
export interface SyncSqliteAdapterSource {
    execute(sql: string): unknown;
    /** This operation must prepare and execute exactly one SQLite statement. */
    mutate(sql: string, parameters: readonly SqliteValue[]): {
        readonly changes: number | bigint;
    };
    queryOne(sql: string, parameters: readonly SqliteValue[]): unknown;
    queryAll(sql: string, parameters: readonly SqliteValue[]): readonly unknown[];
}
/**
 * The common synchronous surface exposed by both `node:sqlite` and `better-sqlite3`.
 * Keeping the structural contract here avoids importing either driver's Node types.
 */
export interface PreparedSyncSqliteSource {
    exec(sql: string): unknown;
    prepare(sql: string): PreparedSyncSqliteStatement;
}
export interface PreparedSyncSqliteStatement {
    /** Original SQL consumed by better-sqlite3's parser. */
    readonly source?: string;
    /** Original SQL consumed by node:sqlite's parser. */
    readonly sourceSQL?: string;
    all(...parameters: readonly SqliteValue[]): readonly unknown[];
    get(...parameters: readonly SqliteValue[]): unknown;
    run(...parameters: readonly SqliteValue[]): {
        readonly changes: number | bigint;
    };
}
export interface SqliteConfiguration {
    readonly busyTimeoutMs: number;
    readonly journalMode: "delete" | "wal";
}
export interface AppliedSqliteConfiguration {
    readonly busyTimeoutMs: number;
    readonly foreignKeys: true;
    readonly journalMode: "delete" | "wal";
}
export interface ReadonlySyncSqliteDatabase {
    get<Row extends SqliteRow = SqliteRow>(sql: string, parameters?: readonly SqliteValue[]): Row | undefined;
    all<Row extends SqliteRow = SqliteRow>(sql: string, parameters?: readonly SqliteValue[]): readonly Row[];
}
export type OwnedSqliteOpenCheckpoint = "before_exclusive_allocation" | "storage_prepared" | "before_writable_open" | "writable_opened" | "before_write_verified" | "configured";
interface OpenOwnedSqliteDatabaseBaseOptions {
    /** A canonical, current-user-owned real directory that contains the database. */
    readonly operationalRoot: string;
    /** A normalized absolute filename contained by `operationalRoot`. */
    readonly databasePath: string;
    /** The owning-open contract uses WAL so auxiliary-file identities remain stable while open. */
    readonly configuration: Readonly<{
        readonly busyTimeoutMs: number;
        readonly journalMode: "wal";
    }>;
    /** Synchronous observability hook. Storage is re-proved after every checkpoint. */
    readonly onOpenCheckpoint?: (checkpoint: OwnedSqliteOpenCheckpoint) => void;
}
export type OpenOwnedSqliteDatabaseOptions = OpenOwnedSqliteDatabaseBaseOptions & ({
    /** Allocate a wholly absent database family exclusively; never adopt raced entries. */
    readonly requireAbsent: true;
    readonly requireExisting?: never;
    readonly beforeWrite?: never;
} | {
    readonly requireAbsent?: false;
    readonly requireExisting?: false;
    readonly beforeWrite?: never;
} | {
    readonly requireAbsent?: never;
    readonly requireExisting: true;
    /**
     * Verify an existing authority through the exact connection that will remain writable.
     * The callback receives a callback-scoped read-only surface that expires on return and
     * runs before framework configuration.
     */
    readonly beforeWrite: (database: ReadonlySyncSqliteDatabase) => void;
});
export interface OwnedSqliteDatabase {
    readonly database: SyncSqliteDatabase;
    readonly databasePath: string;
    readonly isOpen: boolean;
    /** Prove the pinned ancestry, main file, and live WAL sidecars at an explicit checkpoint. */
    verifyStorage(): void;
    /** Close SQLite and every proof descriptor, aggregating all independent close failures. */
    close(): void;
}
export interface SqliteMigration {
    readonly version: number;
    readonly name: string;
    readonly statements: readonly [string, ...string[]];
    /** Rebuild a referenced table inside one transaction, validating every foreign key before commit. */
    readonly rebuildReferencedTables?: true;
}
export interface SqliteMigrationOptions {
    readonly fingerprint: (canonicalSource: string) => string;
    readonly now: () => string;
}
export interface AtomicSqliteMigrationOptions<Evidence> extends SqliteMigrationOptions {
    /**
     * Capture caller-owned evidence after the canonical ledger has been validated and before any
     * pending migration runs. This callback executes synchronously inside the batch's
     * `BEGIN IMMEDIATE` transaction and must not mutate the database.
     */
    readonly captureState: (database: SyncSqliteDatabase) => Evidence;
    /**
     * Complete any caller-owned copy/seal work and prove the migrated state while the same write
     * lock is still held. Unlike `captureState`, this callback may mutate the database; all of its
     * work remains inside the batch transaction. Throwing rolls back that work plus every migration
     * and ledger row applied by this batch.
     */
    readonly verifyFinalState: (database: SyncSqliteDatabase, evidence: Evidence, result: SqliteMigrationResult) => void;
}
export interface SqliteMigrationResult {
    readonly appliedVersions: readonly number[];
    readonly currentVersion: number;
}
/** Canonical immutable migration history owned by every current product database. */
export declare const SQLITE_MIGRATION_LEDGER_TABLE = "cx_schema_migrations";
export declare function createSyncSqliteAdapter(source: SyncSqliteAdapterSource): SyncSqliteDatabase;
export declare function createPreparedSyncSqliteAdapter(source: PreparedSyncSqliteSource): SyncSqliteDatabase;
export declare function withImmediateTransaction<Result>(database: SyncSqliteDatabase, work: () => Result): Result;
export declare function configureSqlite(database: SyncSqliteDatabase, configuration: SqliteConfiguration): AppliedSqliteConfiguration;
/**
 * Open one file-backed SQLite authority while retaining proof of every path SQLite may write.
 *
 * The returned adapter re-proves the pinned storage immediately before and after each statement.
 * SQLite may unlink its reserved rollback journal while entering WAL mode, and may unlink WAL/SHM
 * after the final connection closes. Main, WAL, and SHM replacement is never adopted; only an
 * empty rollback journal that SQLite legitimately recreates may be re-pinned.
 */
export declare function openOwnedSqliteDatabase(options: OpenOwnedSqliteDatabaseOptions): OwnedSqliteDatabase;
export declare function applySqliteMigrations(database: SyncSqliteDatabase, migrations: readonly SqliteMigration[], options: SqliteMigrationOptions): SqliteMigrationResult;
/**
 * Apply every pending migration as one verified batch.
 *
 * This is the cutover form of the migration runner: caller evidence is captured before the first
 * pending statement, the complete pending suffix is applied, and the caller completes and proves
 * its final state before commit. It is intended for ownership transfers where a copied queue,
 * record set, seal, or other product invariant must be proven before another process can observe
 * the new ledger.
 */
export declare function applySqliteMigrationsAtomically<Evidence>(database: SyncSqliteDatabase, migrations: readonly SqliteMigration[], options: AtomicSqliteMigrationOptions<Evidence>): SqliteMigrationResult;
export declare function verifySqliteIntegrity(database: ReadonlySyncSqliteDatabase): void;
export {};
//# sourceMappingURL=sqlite.d.ts.map