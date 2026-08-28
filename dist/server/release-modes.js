import { lstatSync, opendirSync } from "node:fs";
import { join, resolve } from "node:path";
export const RETAINED_RELEASE_DIRECTORY_MODE = 0o550;
export const RETAINED_RELEASE_EXECUTABLE_FILE_MODE = 0o550;
export const RETAINED_RELEASE_FILE_MODE = 0o440;
const DEFAULT_MAX_ENTRIES = 20_003;
const DEFAULT_MAX_DEPTH = 65;
/**
 * Prove the complete portable browser-release tree is owner-non-writable.
 *
 * Browser artifacts never contain links or executable files, so the exact contract is mode 0550
 * for every directory and 0440 for every one-link regular file. The scan is bounded, never follows
 * a link, and rechecks every entry snapshot before it accepts the tree.
 */
export function assertRetainedBrowserReleaseModes(root, { maxDepth = DEFAULT_MAX_DEPTH, maxEntries = DEFAULT_MAX_ENTRIES, } = {}) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) {
        throw new Error("Retained browser release maxEntries must be a positive safe integer.");
    }
    if (!Number.isSafeInteger(maxDepth) || maxDepth < 0) {
        throw new Error("Retained browser release maxDepth must be a non-negative safe integer.");
    }
    const resolvedRoot = resolve(requireSafePath(root));
    const rootSnapshot = lstatSync(resolvedRoot, { bigint: true });
    if (!rootSnapshot.isDirectory() || rootSnapshot.isSymbolicLink()) {
        throw new Error(`Retained browser release root must be a real directory: ${resolvedRoot}`);
    }
    const records = [];
    const pending = [
        { absolutePath: resolvedRoot, depth: 0, snapshot: rootSnapshot },
    ];
    let directories = 0;
    let files = 0;
    while (pending.length > 0) {
        const current = pending.pop();
        if (!current)
            break;
        if (current.depth > maxDepth) {
            throw new Error(`Retained browser release exceeds the ${maxDepth}-level depth ceiling: ${resolvedRoot}`);
        }
        assertMode(current.snapshot.mode, RETAINED_RELEASE_DIRECTORY_MODE, "directory", current.absolutePath);
        directories += 1;
        records.push({
            absolutePath: current.absolutePath,
            snapshot: current.snapshot,
        });
        assertEntryCeiling(records.length, maxEntries, resolvedRoot);
        const directory = opendirSync(current.absolutePath);
        try {
            for (let entry = directory.readSync(); entry; entry = directory.readSync()) {
                const absolutePath = join(current.absolutePath, entry.name);
                const snapshot = lstatSync(absolutePath, { bigint: true });
                if (snapshot.isSymbolicLink()) {
                    throw new Error(`Retained browser release must not contain symbolic links: ${absolutePath}`);
                }
                if (snapshot.isDirectory()) {
                    pending.push({
                        absolutePath,
                        depth: current.depth + 1,
                        snapshot,
                    });
                    continue;
                }
                if (!snapshot.isFile() || snapshot.nlink !== 1n) {
                    throw new Error(`Retained browser release contains a linked or unsupported entry: ${absolutePath}`);
                }
                assertMode(snapshot.mode, RETAINED_RELEASE_FILE_MODE, "file", absolutePath);
                files += 1;
                records.push({ absolutePath, snapshot });
                assertEntryCeiling(records.length, maxEntries, resolvedRoot);
            }
        }
        finally {
            directory.closeSync();
        }
        assertSnapshot(current.absolutePath, current.snapshot);
    }
    for (const record of records)
        assertSnapshot(record.absolutePath, record.snapshot);
    return Object.freeze({
        directories,
        entries: records.length,
        files,
        root: resolvedRoot,
    });
}
function assertMode(actual, expected, type, absolutePath) {
    if (Number(actual & 4095n) !== expected) {
        throw new Error(`Retained browser release ${type} must have mode ${expected.toString(8).padStart(4, "0")}: ${absolutePath}`);
    }
}
function assertEntryCeiling(entries, maximum, root) {
    if (entries > maximum) {
        throw new Error(`Retained browser release exceeds the ${maximum}-entry ceiling: ${root}`);
    }
}
function assertSnapshot(absolutePath, expected) {
    const current = lstatSync(absolutePath, { bigint: true });
    if (current.dev !== expected.dev ||
        current.ino !== expected.ino ||
        current.mode !== expected.mode ||
        current.nlink !== expected.nlink ||
        current.size !== expected.size ||
        current.mtimeNs !== expected.mtimeNs ||
        current.ctimeNs !== expected.ctimeNs) {
        throw new Error(`Retained browser release entry changed during mode validation: ${absolutePath}`);
    }
}
function requireSafePath(value) {
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        /[\u0000-\u001f\u007f]/.test(value)) {
        throw new Error("Retained browser release root must be a safe non-empty path.");
    }
    return value;
}
