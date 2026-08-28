import { lstatSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseServerReleaseIdentity, } from "./server-identity.js";
/**
 * Prove that the executing module is the exact web or worker entrypoint sealed into a release.
 * Development processes without a release identity do not call this function; a sealed process
 * must never infer its role from a mutable working directory or an environment label.
 */
export function assertServerProcessRole({ artifactRoot, entrypointUrl, identity, role, }) {
    const pinnedIdentity = parseServerReleaseIdentity(identity);
    const pinnedRole = parseRole(role);
    const root = requireRealDirectory(artifactRoot, "Server artifact root");
    const actualEntrypoint = requireEntrypointFile(entrypointUrl);
    assertContained(root, actualEntrypoint, "Executing server entrypoint");
    const declaration = pinnedRole.kind === "web"
        ? Object.freeze({
            kind: "web",
            entrypoint: pinnedIdentity.entrypoint,
        })
        : workerDeclaration(pinnedIdentity, pinnedRole.key);
    const declaredEntrypoint = requireRealFile(join(root, declaration.entrypoint), `Declared ${declaration.kind} entrypoint`);
    assertContained(root, declaredEntrypoint, "Declared server entrypoint");
    if (actualEntrypoint !== declaredEntrypoint) {
        throw new Error(`The executing module does not match the sealed ${declaration.kind} entrypoint ${declaration.entrypoint}.`);
    }
    return declaration;
}
function parseRole(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Server process role must be an object.");
    }
    if (value.kind === "web") {
        assertExactKeys(value, ["kind"]);
        return Object.freeze({ kind: "web" });
    }
    if (value.kind === "worker") {
        assertExactKeys(value, ["key", "kind"]);
        if (typeof value.key !== "string" ||
            !/^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i.test(value.key)) {
            throw new Error("Server worker role key is invalid.");
        }
        return Object.freeze({ kind: "worker", key: value.key });
    }
    throw new Error("Server process role kind must be web or worker.");
}
function workerDeclaration(identity, key) {
    const worker = identity.workers.find((candidate) => candidate.key === key);
    if (!worker) {
        throw new Error(`Server release identity does not declare worker ${key}.`);
    }
    return Object.freeze({
        kind: "worker",
        key: worker.key,
        entrypoint: worker.entrypoint,
    });
}
function requireEntrypointFile(value) {
    let url;
    try {
        url = value instanceof URL ? value : new URL(value);
    }
    catch (error) {
        throw new Error("Server entrypointUrl must be an absolute file URL.", {
            cause: error,
        });
    }
    if (url.protocol !== "file:") {
        throw new Error("Server entrypointUrl must use the file protocol.");
    }
    return requireRealFile(fileURLToPath(url), "Executing server entrypoint");
}
function requireRealDirectory(value, label) {
    if (!isAbsolute(value)) {
        throw new Error(`${label} must be an absolute path.`);
    }
    const selected = realpathSync(value);
    const entry = statSync(selected);
    if (!entry.isDirectory())
        throw new Error(`${label} must be a directory.`);
    return selected;
}
function requireRealFile(value, label) {
    const selected = realpathSync(value);
    const entry = statSync(selected);
    if (!entry.isFile())
        throw new Error(`${label} must be a regular file.`);
    const direct = lstatSync(value);
    if (!direct.isFile() && !direct.isSymbolicLink()) {
        throw new Error(`${label} must resolve from a file entry.`);
    }
    return selected;
}
function assertContained(root, candidate, label) {
    const relation = relative(root, candidate);
    if (relation === ".." ||
        relation.startsWith(`..${sep}`) ||
        isAbsolute(relation)) {
        throw new Error(`${label} must remain inside the server artifact root.`);
    }
}
function assertExactKeys(value, expectedKeys) {
    const actual = Object.keys(value).sort();
    const expected = [...expectedKeys].sort();
    if (actual.length !== expected.length ||
        actual.some((key, index) => key !== expected[index])) {
        throw new Error("Server process role fields are invalid.");
    }
}
