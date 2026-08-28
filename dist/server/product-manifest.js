import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync, } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { TextDecoder } from "node:util";
export const PRODUCT_MANIFEST_FILENAME = "cx-product.json";
export const MAX_PRODUCT_MANIFEST_BYTES = 64 * 1024;
export const PRODUCT_PROFILES = Object.freeze([
    "static-site",
    "hybrid-site",
    "web-app",
]);
export const PRODUCT_DEPLOYMENTS = Object.freeze([
    "mac-mini",
    "work-mac",
]);
export const PRODUCT_RENDERING_MODES = Object.freeze(["ssg", "csr"]);
export const PRODUCT_DESIGN_SYSTEMS = Object.freeze([
    "cx-framework",
    "cx-framework-source",
]);
export const PRODUCT_VISUAL_SYSTEMS = Object.freeze([
    "framework",
    "product-skin",
]);
export const PRODUCT_AUTHENTICATION_MODES = Object.freeze([
    "none",
    "gate",
    "owner",
    "accounts",
]);
export const PRODUCT_PERSISTENCE_MODES = Object.freeze([
    "none",
    "structured-records",
    "human-files",
    "human-files-with-index",
]);
export const PRODUCT_BACKGROUND_WORK_MODES = Object.freeze([
    "none",
    "build-time",
    "durable",
]);
export const PRODUCT_EXTERNAL_EFFECTS = Object.freeze([
    "ai",
    "email",
    "network-fetch",
    "notifications",
    "payments",
]);
const ROOT_KEYS = [
    "$schema",
    "schemaVersion",
    "id",
    "family",
    "profile",
    "deployment",
    "frontend",
    "capabilities",
];
const FRONTEND_KEYS = [
    "framework",
    "rendering",
    "designSystem",
    "visualSystem",
];
const CAPABILITY_KEYS = [
    "authentication",
    "persistentData",
    "backgroundWork",
    "externalEffects",
];
const STATIC_BACKGROUND_WORK = Object.freeze(["none", "build-time"]);
const SAFE_PATH_CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
export function loadProductManifest(manifestFile) {
    return loadProductManifestFile(manifestFile).manifest;
}
export function loadProductManifestFile(manifestFile) {
    const file = readProductManifestFile(manifestFile);
    let parsed;
    try {
        assertNoDuplicateJsonFields(file.source);
        parsed = JSON.parse(file.source);
    }
    catch (error) {
        if (error instanceof DuplicateJsonFieldError) {
            throw new Error(`${PRODUCT_MANIFEST_FILENAME} contains a duplicate field at ${error.location}.`, { cause: error });
        }
        throw new Error(`${PRODUCT_MANIFEST_FILENAME} is not valid JSON.`, {
            cause: error,
        });
    }
    return Object.freeze({
        manifest: validateProductManifest(parsed),
        manifestFile: file.manifestFile,
    });
}
function validateProductManifest(value) {
    const manifest = exactObject(value, "$", ROOT_KEYS);
    const schemaReference = stringValue(manifest["$schema"], "$.$schema");
    if (schemaReference.length === 0) {
        throw new Error("$.$schema must contain at least one character.");
    }
    if (manifest["schemaVersion"] !== 1) {
        throw new Error("$.schemaVersion must equal 1.");
    }
    const id = stringValue(manifest["id"], "$.id");
    if (!/^[a-z][a-z0-9-]*$/.test(id)) {
        throw new Error("$.id must match ^[a-z][a-z0-9-]*$.");
    }
    if (manifest["family"] !== "web") {
        throw new Error('$.family must equal "web".');
    }
    const profile = enumValue(manifest["profile"], PRODUCT_PROFILES, "$.profile");
    const deployment = enumValue(manifest["deployment"], PRODUCT_DEPLOYMENTS, "$.deployment");
    const frontendValue = exactObject(manifest["frontend"], "$.frontend", FRONTEND_KEYS);
    if (frontendValue["framework"] !== "angular") {
        throw new Error('$.frontend.framework must equal "angular".');
    }
    const frontend = Object.freeze({
        framework: "angular",
        rendering: enumValue(frontendValue["rendering"], PRODUCT_RENDERING_MODES, "$.frontend.rendering"),
        designSystem: enumValue(frontendValue["designSystem"], PRODUCT_DESIGN_SYSTEMS, "$.frontend.designSystem"),
        visualSystem: enumValue(frontendValue["visualSystem"], PRODUCT_VISUAL_SYSTEMS, "$.frontend.visualSystem"),
    });
    const capabilityValue = exactObject(manifest["capabilities"], "$.capabilities", CAPABILITY_KEYS);
    const externalEffectValues = capabilityValue["externalEffects"];
    if (!Array.isArray(externalEffectValues)) {
        throw new Error("$.capabilities.externalEffects must be an array.");
    }
    const externalEffects = externalEffectValues.map((effect, index) => enumValue(effect, PRODUCT_EXTERNAL_EFFECTS, `$.capabilities.externalEffects[${index}]`));
    if (new Set(externalEffects).size !== externalEffects.length) {
        throw new Error("$.capabilities.externalEffects must not contain duplicate values.");
    }
    const capabilities = Object.freeze({
        authentication: enumValue(capabilityValue["authentication"], PRODUCT_AUTHENTICATION_MODES, "$.capabilities.authentication"),
        persistentData: enumValue(capabilityValue["persistentData"], PRODUCT_PERSISTENCE_MODES, "$.capabilities.persistentData"),
        backgroundWork: enumValue(capabilityValue["backgroundWork"], PRODUCT_BACKGROUND_WORK_MODES, "$.capabilities.backgroundWork"),
        externalEffects: Object.freeze(externalEffects),
    });
    validateManifestCompatibility({
        deployment,
        frontend,
        id,
        profile,
        capabilities,
    });
    return Object.freeze({
        $schema: schemaReference,
        schemaVersion: 1,
        id,
        family: "web",
        profile,
        deployment,
        frontend,
        capabilities,
    });
}
function validateManifestCompatibility({ capabilities, deployment, frontend, id, profile, }) {
    if (profile === "static-site") {
        if (frontend.rendering !== "ssg") {
            throw new Error("$.frontend.rendering must be ssg for a static-site profile.");
        }
        if (capabilities.authentication !== "none" ||
            capabilities.persistentData !== "none" ||
            !STATIC_BACKGROUND_WORK.includes(capabilities.backgroundWork)) {
            throw new Error(`${PRODUCT_MANIFEST_FILENAME} static sites cannot own runtime authentication, data, or background work.`);
        }
    }
    if (frontend.designSystem === "cx-framework-source" && id !== "cortex") {
        throw new Error("Only Cortex may declare cx-framework-source as its design system.");
    }
    if (frontend.visualSystem === "product-skin" && id !== "faunapoolen") {
        throw new Error("Only Faunapoolen has an approved product-skin visual exception.");
    }
    if (deployment === "work-mac" && id !== "foundry") {
        throw new Error("Only Foundry currently has an approved work-mac deployment boundary.");
    }
}
function exactObject(value, location, expectedKeys) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${location} must be an object.`);
    }
    const record = value;
    const allowed = new Set(expectedKeys);
    for (const key of expectedKeys) {
        if (!Object.hasOwn(record, key)) {
            throw new Error(`${location}.${key} is required.`);
        }
    }
    for (const key of Object.keys(record)) {
        if (!allowed.has(key)) {
            throw new Error(`${jsonFieldLocation(location, key)} is not allowed.`);
        }
    }
    return record;
}
function stringValue(value, location) {
    if (typeof value !== "string") {
        throw new Error(`${location} must be a string.`);
    }
    return value;
}
function enumValue(value, values, location) {
    if (typeof value !== "string" || !values.includes(value)) {
        throw new Error(`${location} must be one of: ${values.join(", ")}.`);
    }
    return value;
}
function readProductManifestFile(manifestFile) {
    const resolved = validateManifestPath(manifestFile);
    const expected = statManifestPath(resolved);
    const canonicalManifest = canonicalManifestPath(resolved);
    if (!sameFileIdentity(expected, statManifestPath(canonicalManifest))) {
        throw new Error(`${PRODUCT_MANIFEST_FILENAME} changed while its path was being resolved.`);
    }
    let descriptor;
    try {
        descriptor = openSync(resolved, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    }
    catch (error) {
        throw new Error(`${PRODUCT_MANIFEST_FILENAME} is missing or unsafe: ${resolved}`, { cause: error });
    }
    try {
        const opened = fstatSync(descriptor, { bigint: true });
        assertRegularManifest(opened, resolved);
        if (!sameFileIdentity(expected, opened)) {
            throw new Error(`${PRODUCT_MANIFEST_FILENAME} changed while it was being opened.`);
        }
        assertManifestSize(opened.size);
        const content = Buffer.allocUnsafe(MAX_PRODUCT_MANIFEST_BYTES + 1);
        let offset = 0;
        while (offset <= MAX_PRODUCT_MANIFEST_BYTES) {
            const bytesRead = readSync(descriptor, content, offset, MAX_PRODUCT_MANIFEST_BYTES + 1 - offset, null);
            if (bytesRead === 0)
                break;
            offset += bytesRead;
        }
        if (offset > MAX_PRODUCT_MANIFEST_BYTES) {
            throw new Error(`${PRODUCT_MANIFEST_FILENAME} exceeds the ${MAX_PRODUCT_MANIFEST_BYTES}-byte limit.`);
        }
        const afterRead = fstatSync(descriptor, { bigint: true });
        if (!sameFileSnapshot(opened, afterRead) ||
            BigInt(offset) !== opened.size) {
            throw new Error(`${PRODUCT_MANIFEST_FILENAME} changed while it was being read.`);
        }
        const afterPath = statManifestPath(resolved);
        if (!sameFileSnapshot(afterRead, afterPath) ||
            canonicalManifestPath(resolved) !== canonicalManifest) {
            throw new Error(`${PRODUCT_MANIFEST_FILENAME} changed while it was being read.`);
        }
        let source;
        try {
            source = UTF8_DECODER.decode(content.subarray(0, offset));
        }
        catch (error) {
            throw new Error(`${PRODUCT_MANIFEST_FILENAME} is not valid UTF-8.`, {
                cause: error,
            });
        }
        return Object.freeze({
            manifestFile: canonicalManifest,
            source,
        });
    }
    finally {
        closeSync(descriptor);
    }
}
function validateManifestPath(manifestFile) {
    if (typeof manifestFile !== "string" ||
        !manifestFile ||
        manifestFile !== manifestFile.trim() ||
        SAFE_PATH_CONTROL_CHARACTERS.test(manifestFile) ||
        !isAbsolute(manifestFile)) {
        throw new Error(`Product manifestFile must be a safe absolute path to ${PRODUCT_MANIFEST_FILENAME}.`);
    }
    return resolve(manifestFile);
}
function statManifestPath(filePath) {
    let entry;
    try {
        entry = lstatSync(filePath, { bigint: true });
    }
    catch (error) {
        throw new Error(`${PRODUCT_MANIFEST_FILENAME} is missing or unsafe: ${filePath}`, { cause: error });
    }
    assertRegularManifest(entry, filePath);
    assertManifestSize(entry.size);
    return entry;
}
function canonicalManifestPath(filePath) {
    try {
        return realpathSync(filePath);
    }
    catch (error) {
        throw new Error(`${PRODUCT_MANIFEST_FILENAME} is missing or unsafe: ${filePath}`, { cause: error });
    }
}
function assertRegularManifest(entry, filePath) {
    if (!entry.isFile() || entry.isSymbolicLink()) {
        throw new Error(`Product manifestFile must select a safe regular non-symlink ${PRODUCT_MANIFEST_FILENAME}: ${filePath}`);
    }
}
function assertManifestSize(size) {
    if (size > BigInt(MAX_PRODUCT_MANIFEST_BYTES)) {
        throw new Error(`${PRODUCT_MANIFEST_FILENAME} exceeds the ${MAX_PRODUCT_MANIFEST_BYTES}-byte limit.`);
    }
}
function sameFileIdentity(left, right) {
    return left.dev === right.dev && left.ino === right.ino;
}
function sameFileSnapshot(left, right) {
    return (sameFileIdentity(left, right) &&
        left.mode === right.mode &&
        left.nlink === right.nlink &&
        left.size === right.size &&
        left.mtimeNs === right.mtimeNs &&
        left.ctimeNs === right.ctimeNs);
}
class DuplicateJsonFieldError extends Error {
    location;
    constructor(location) {
        super(`Duplicate JSON field at ${location}.`);
        this.location = location;
    }
}
function assertNoDuplicateJsonFields(source) {
    new JsonStructureReader(source).read();
}
class JsonStructureReader {
    source;
    offset = 0;
    constructor(source) {
        this.source = source;
    }
    read() {
        this.skipWhitespace();
        this.readValue("$");
        this.skipWhitespace();
        if (this.offset !== this.source.length)
            this.invalid();
    }
    readValue(location) {
        const character = this.source[this.offset];
        if (character === "{") {
            this.readObject(location);
            return;
        }
        if (character === "[") {
            this.readArray(location);
            return;
        }
        if (character === '"') {
            this.readString();
            return;
        }
        if (character === "t") {
            this.readLiteral("true");
            return;
        }
        if (character === "f") {
            this.readLiteral("false");
            return;
        }
        if (character === "n") {
            this.readLiteral("null");
            return;
        }
        this.readNumber();
    }
    readObject(location) {
        this.offset += 1;
        this.skipWhitespace();
        if (this.take("}"))
            return;
        const fields = new Set();
        while (true) {
            if (this.source[this.offset] !== '"')
                this.invalid();
            const field = this.readString();
            const fieldLocation = jsonFieldLocation(location, field);
            if (fields.has(field))
                throw new DuplicateJsonFieldError(fieldLocation);
            fields.add(field);
            this.skipWhitespace();
            if (!this.take(":"))
                this.invalid();
            this.skipWhitespace();
            this.readValue(fieldLocation);
            this.skipWhitespace();
            if (this.take("}"))
                return;
            if (!this.take(","))
                this.invalid();
            this.skipWhitespace();
        }
    }
    readArray(location) {
        this.offset += 1;
        this.skipWhitespace();
        if (this.take("]"))
            return;
        let index = 0;
        while (true) {
            this.readValue(`${location}[${index}]`);
            index += 1;
            this.skipWhitespace();
            if (this.take("]"))
                return;
            if (!this.take(","))
                this.invalid();
            this.skipWhitespace();
        }
    }
    readString() {
        const start = this.offset;
        this.offset += 1;
        while (this.offset < this.source.length) {
            const character = this.source[this.offset];
            if (character === '"') {
                this.offset += 1;
                return JSON.parse(this.source.slice(start, this.offset));
            }
            if (character === "\\") {
                this.offset += 1;
                const escape = this.source[this.offset];
                if (escape === "u") {
                    const code = this.source.slice(this.offset + 1, this.offset + 5);
                    if (!/^[0-9a-fA-F]{4}$/.test(code))
                        this.invalid();
                    this.offset += 5;
                    continue;
                }
                if (!escape || !'"\\/bfnrt'.includes(escape))
                    this.invalid();
                this.offset += 1;
                continue;
            }
            if (!character || character.charCodeAt(0) <= 0x1f)
                this.invalid();
            this.offset += 1;
        }
        this.invalid();
    }
    readNumber() {
        const match = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.source.slice(this.offset));
        if (!match || match.index !== 0)
            this.invalid();
        this.offset += match[0].length;
    }
    readLiteral(literal) {
        if (!this.source.startsWith(literal, this.offset))
            this.invalid();
        this.offset += literal.length;
    }
    skipWhitespace() {
        while (this.source[this.offset] === " " ||
            this.source[this.offset] === "\n" ||
            this.source[this.offset] === "\r" ||
            this.source[this.offset] === "\t") {
            this.offset += 1;
        }
    }
    take(character) {
        if (this.source[this.offset] !== character)
            return false;
        this.offset += 1;
        return true;
    }
    invalid() {
        throw new SyntaxError(`Invalid JSON at character ${this.offset}.`);
    }
}
function jsonFieldLocation(location, field) {
    return /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(field)
        ? `${location}.${field}`
        : `${location}[${JSON.stringify(field)}]`;
}
