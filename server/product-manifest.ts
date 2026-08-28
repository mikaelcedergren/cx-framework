import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
  type BigIntStats,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { TextDecoder } from "node:util";

export const PRODUCT_MANIFEST_FILENAME = "cx-product.json";
export const MAX_PRODUCT_MANIFEST_BYTES = 64 * 1024;

export const PRODUCT_PROFILES = Object.freeze([
  "static-site",
  "hybrid-site",
  "web-app",
] as const);
export const PRODUCT_DEPLOYMENTS = Object.freeze([
  "mac-mini",
  "work-mac",
] as const);
export const PRODUCT_RENDERING_MODES = Object.freeze(["ssg", "csr"] as const);
export const PRODUCT_DESIGN_SYSTEMS = Object.freeze([
  "cx-framework",
  "cx-framework-source",
] as const);
export const PRODUCT_VISUAL_SYSTEMS = Object.freeze([
  "framework",
  "product-skin",
] as const);
export const PRODUCT_AUTHENTICATION_MODES = Object.freeze([
  "none",
  "gate",
  "owner",
  "accounts",
] as const);
export const PRODUCT_PERSISTENCE_MODES = Object.freeze([
  "none",
  "structured-records",
  "human-files",
  "human-files-with-index",
] as const);
export const PRODUCT_BACKGROUND_WORK_MODES = Object.freeze([
  "none",
  "build-time",
  "durable",
] as const);
export const PRODUCT_EXTERNAL_EFFECTS = Object.freeze([
  "ai",
  "email",
  "network-fetch",
  "notifications",
  "payments",
] as const);

export type ProductProfile = (typeof PRODUCT_PROFILES)[number];
export type ProductDeployment = (typeof PRODUCT_DEPLOYMENTS)[number];
export type ProductRenderingMode = (typeof PRODUCT_RENDERING_MODES)[number];
export type ProductDesignSystem = (typeof PRODUCT_DESIGN_SYSTEMS)[number];
export type ProductVisualSystem = (typeof PRODUCT_VISUAL_SYSTEMS)[number];
export type ProductAuthenticationMode =
  (typeof PRODUCT_AUTHENTICATION_MODES)[number];
export type ProductPersistenceMode = (typeof PRODUCT_PERSISTENCE_MODES)[number];
export type ProductBackgroundWorkMode =
  (typeof PRODUCT_BACKGROUND_WORK_MODES)[number];
export type ProductExternalEffect = (typeof PRODUCT_EXTERNAL_EFFECTS)[number];

export interface ProductFrontendManifest {
  readonly framework: "angular";
  readonly rendering: ProductRenderingMode;
  readonly designSystem: ProductDesignSystem;
  readonly visualSystem: ProductVisualSystem;
}

export interface ProductCapabilityManifest {
  readonly authentication: ProductAuthenticationMode;
  readonly persistentData: ProductPersistenceMode;
  readonly backgroundWork: ProductBackgroundWorkMode;
  readonly externalEffects: readonly ProductExternalEffect[];
}

export interface ProductManifest {
  readonly $schema: string;
  readonly schemaVersion: 1;
  readonly id: string;
  readonly family: "web";
  readonly profile: ProductProfile;
  readonly deployment: ProductDeployment;
  readonly frontend: ProductFrontendManifest;
  readonly capabilities: ProductCapabilityManifest;
}

export interface LoadedProductManifest {
  readonly manifest: ProductManifest;
  readonly manifestFile: string;
}

const ROOT_KEYS = [
  "$schema",
  "schemaVersion",
  "id",
  "family",
  "profile",
  "deployment",
  "frontend",
  "capabilities",
] as const;
const FRONTEND_KEYS = [
  "framework",
  "rendering",
  "designSystem",
  "visualSystem",
] as const;
const CAPABILITY_KEYS = [
  "authentication",
  "persistentData",
  "backgroundWork",
  "externalEffects",
] as const;
const STATIC_BACKGROUND_WORK: readonly ProductBackgroundWorkMode[] =
  Object.freeze(["none", "build-time"]);
const SAFE_PATH_CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

export function loadProductManifest(manifestFile: string): ProductManifest {
  return loadProductManifestFile(manifestFile).manifest;
}

export function loadProductManifestFile(
  manifestFile: string,
): LoadedProductManifest {
  const file = readProductManifestFile(manifestFile);
  let parsed: unknown;
  try {
    assertNoDuplicateJsonFields(file.source);
    parsed = JSON.parse(file.source) as unknown;
  } catch (error) {
    if (error instanceof DuplicateJsonFieldError) {
      throw new Error(
        `${PRODUCT_MANIFEST_FILENAME} contains a duplicate field at ${error.location}.`,
        { cause: error },
      );
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

function validateProductManifest(value: unknown): ProductManifest {
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
  const deployment = enumValue(
    manifest["deployment"],
    PRODUCT_DEPLOYMENTS,
    "$.deployment",
  );

  const frontendValue = exactObject(
    manifest["frontend"],
    "$.frontend",
    FRONTEND_KEYS,
  );
  if (frontendValue["framework"] !== "angular") {
    throw new Error('$.frontend.framework must equal "angular".');
  }
  const frontend = Object.freeze({
    framework: "angular" as const,
    rendering: enumValue(
      frontendValue["rendering"],
      PRODUCT_RENDERING_MODES,
      "$.frontend.rendering",
    ),
    designSystem: enumValue(
      frontendValue["designSystem"],
      PRODUCT_DESIGN_SYSTEMS,
      "$.frontend.designSystem",
    ),
    visualSystem: enumValue(
      frontendValue["visualSystem"],
      PRODUCT_VISUAL_SYSTEMS,
      "$.frontend.visualSystem",
    ),
  });

  const capabilityValue = exactObject(
    manifest["capabilities"],
    "$.capabilities",
    CAPABILITY_KEYS,
  );
  const externalEffectValues = capabilityValue["externalEffects"];
  if (!Array.isArray(externalEffectValues)) {
    throw new Error("$.capabilities.externalEffects must be an array.");
  }
  const externalEffects = externalEffectValues.map((effect, index) =>
    enumValue(
      effect,
      PRODUCT_EXTERNAL_EFFECTS,
      `$.capabilities.externalEffects[${index}]`,
    ),
  );
  if (new Set(externalEffects).size !== externalEffects.length) {
    throw new Error(
      "$.capabilities.externalEffects must not contain duplicate values.",
    );
  }
  const capabilities = Object.freeze({
    authentication: enumValue(
      capabilityValue["authentication"],
      PRODUCT_AUTHENTICATION_MODES,
      "$.capabilities.authentication",
    ),
    persistentData: enumValue(
      capabilityValue["persistentData"],
      PRODUCT_PERSISTENCE_MODES,
      "$.capabilities.persistentData",
    ),
    backgroundWork: enumValue(
      capabilityValue["backgroundWork"],
      PRODUCT_BACKGROUND_WORK_MODES,
      "$.capabilities.backgroundWork",
    ),
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

function validateManifestCompatibility({
  capabilities,
  deployment,
  frontend,
  id,
  profile,
}: Pick<
  ProductManifest,
  "capabilities" | "deployment" | "frontend" | "id" | "profile"
>): void {
  if (profile === "static-site") {
    if (frontend.rendering !== "ssg") {
      throw new Error(
        "$.frontend.rendering must be ssg for a static-site profile.",
      );
    }
    if (
      capabilities.authentication !== "none" ||
      capabilities.persistentData !== "none" ||
      !STATIC_BACKGROUND_WORK.includes(capabilities.backgroundWork)
    ) {
      throw new Error(
        `${PRODUCT_MANIFEST_FILENAME} static sites cannot own runtime authentication, data, or background work.`,
      );
    }
  }
  if (frontend.designSystem === "cx-framework-source" && id !== "cortex") {
    throw new Error(
      "Only Cortex may declare cx-framework-source as its design system.",
    );
  }
  if (frontend.visualSystem === "product-skin" && id !== "faunapoolen") {
    throw new Error(
      "Only Faunapoolen has an approved product-skin visual exception.",
    );
  }
  if (deployment === "work-mac" && id !== "foundry") {
    throw new Error(
      "Only Foundry currently has an approved work-mac deployment boundary.",
    );
  }
}

function exactObject<const Keys extends readonly string[]>(
  value: unknown,
  location: string,
  expectedKeys: Keys,
): Readonly<Record<Keys[number], unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${location} must be an object.`);
  }
  const record = value as Readonly<Record<string, unknown>>;
  const allowed = new Set<string>(expectedKeys);
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
  return record as Readonly<Record<Keys[number], unknown>>;
}

function stringValue(value: unknown, location: string): string {
  if (typeof value !== "string") {
    throw new Error(`${location} must be a string.`);
  }
  return value;
}

function enumValue<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
  location: string,
): Values[number] {
  if (typeof value !== "string" || !values.includes(value)) {
    throw new Error(`${location} must be one of: ${values.join(", ")}.`);
  }
  return value as Values[number];
}

function readProductManifestFile(manifestFile: string): {
  readonly manifestFile: string;
  readonly source: string;
} {
  const resolved = validateManifestPath(manifestFile);
  const expected = statManifestPath(resolved);
  const canonicalManifest = canonicalManifestPath(resolved);
  if (!sameFileIdentity(expected, statManifestPath(canonicalManifest))) {
    throw new Error(
      `${PRODUCT_MANIFEST_FILENAME} changed while its path was being resolved.`,
    );
  }
  let descriptor: number;
  try {
    descriptor = openSync(
      resolved,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
  } catch (error) {
    throw new Error(
      `${PRODUCT_MANIFEST_FILENAME} is missing or unsafe: ${resolved}`,
      { cause: error },
    );
  }

  try {
    const opened = fstatSync(descriptor, { bigint: true });
    assertRegularManifest(opened, resolved);
    if (!sameFileIdentity(expected, opened)) {
      throw new Error(
        `${PRODUCT_MANIFEST_FILENAME} changed while it was being opened.`,
      );
    }
    assertManifestSize(opened.size);

    const content = Buffer.allocUnsafe(MAX_PRODUCT_MANIFEST_BYTES + 1);
    let offset = 0;
    while (offset <= MAX_PRODUCT_MANIFEST_BYTES) {
      const bytesRead = readSync(
        descriptor,
        content,
        offset,
        MAX_PRODUCT_MANIFEST_BYTES + 1 - offset,
        null,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > MAX_PRODUCT_MANIFEST_BYTES) {
      throw new Error(
        `${PRODUCT_MANIFEST_FILENAME} exceeds the ${MAX_PRODUCT_MANIFEST_BYTES}-byte limit.`,
      );
    }

    const afterRead = fstatSync(descriptor, { bigint: true });
    if (
      !sameFileSnapshot(opened, afterRead) ||
      BigInt(offset) !== opened.size
    ) {
      throw new Error(
        `${PRODUCT_MANIFEST_FILENAME} changed while it was being read.`,
      );
    }
    const afterPath = statManifestPath(resolved);
    if (
      !sameFileSnapshot(afterRead, afterPath) ||
      canonicalManifestPath(resolved) !== canonicalManifest
    ) {
      throw new Error(
        `${PRODUCT_MANIFEST_FILENAME} changed while it was being read.`,
      );
    }

    let source: string;
    try {
      source = UTF8_DECODER.decode(content.subarray(0, offset));
    } catch (error) {
      throw new Error(`${PRODUCT_MANIFEST_FILENAME} is not valid UTF-8.`, {
        cause: error,
      });
    }
    return Object.freeze({
      manifestFile: canonicalManifest,
      source,
    });
  } finally {
    closeSync(descriptor);
  }
}

function validateManifestPath(manifestFile: string): string {
  if (
    typeof manifestFile !== "string" ||
    !manifestFile ||
    manifestFile !== manifestFile.trim() ||
    SAFE_PATH_CONTROL_CHARACTERS.test(manifestFile) ||
    !isAbsolute(manifestFile)
  ) {
    throw new Error(
      `Product manifestFile must be a safe absolute path to ${PRODUCT_MANIFEST_FILENAME}.`,
    );
  }
  return resolve(manifestFile);
}

function statManifestPath(filePath: string): BigIntStats {
  let entry: BigIntStats;
  try {
    entry = lstatSync(filePath, { bigint: true });
  } catch (error) {
    throw new Error(
      `${PRODUCT_MANIFEST_FILENAME} is missing or unsafe: ${filePath}`,
      { cause: error },
    );
  }
  assertRegularManifest(entry, filePath);
  assertManifestSize(entry.size);
  return entry;
}

function canonicalManifestPath(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch (error) {
    throw new Error(
      `${PRODUCT_MANIFEST_FILENAME} is missing or unsafe: ${filePath}`,
      { cause: error },
    );
  }
}

function assertRegularManifest(entry: BigIntStats, filePath: string): void {
  if (!entry.isFile() || entry.isSymbolicLink()) {
    throw new Error(
      `Product manifestFile must select a safe regular non-symlink ${PRODUCT_MANIFEST_FILENAME}: ${filePath}`,
    );
  }
}

function assertManifestSize(size: bigint): void {
  if (size > BigInt(MAX_PRODUCT_MANIFEST_BYTES)) {
    throw new Error(
      `${PRODUCT_MANIFEST_FILENAME} exceeds the ${MAX_PRODUCT_MANIFEST_BYTES}-byte limit.`,
    );
  }
}

function sameFileIdentity(left: BigIntStats, right: BigIntStats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameFileSnapshot(left: BigIntStats, right: BigIntStats): boolean {
  return (
    sameFileIdentity(left, right) &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

class DuplicateJsonFieldError extends Error {
  constructor(readonly location: string) {
    super(`Duplicate JSON field at ${location}.`);
  }
}

function assertNoDuplicateJsonFields(source: string): void {
  new JsonStructureReader(source).read();
}

class JsonStructureReader {
  private offset = 0;

  constructor(private readonly source: string) {}

  read(): void {
    this.skipWhitespace();
    this.readValue("$");
    this.skipWhitespace();
    if (this.offset !== this.source.length) this.invalid();
  }

  private readValue(location: string): void {
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

  private readObject(location: string): void {
    this.offset += 1;
    this.skipWhitespace();
    if (this.take("}")) return;
    const fields = new Set<string>();
    while (true) {
      if (this.source[this.offset] !== '"') this.invalid();
      const field = this.readString();
      const fieldLocation = jsonFieldLocation(location, field);
      if (fields.has(field)) throw new DuplicateJsonFieldError(fieldLocation);
      fields.add(field);
      this.skipWhitespace();
      if (!this.take(":")) this.invalid();
      this.skipWhitespace();
      this.readValue(fieldLocation);
      this.skipWhitespace();
      if (this.take("}")) return;
      if (!this.take(",")) this.invalid();
      this.skipWhitespace();
    }
  }

  private readArray(location: string): void {
    this.offset += 1;
    this.skipWhitespace();
    if (this.take("]")) return;
    let index = 0;
    while (true) {
      this.readValue(`${location}[${index}]`);
      index += 1;
      this.skipWhitespace();
      if (this.take("]")) return;
      if (!this.take(",")) this.invalid();
      this.skipWhitespace();
    }
  }

  private readString(): string {
    const start = this.offset;
    this.offset += 1;
    while (this.offset < this.source.length) {
      const character = this.source[this.offset];
      if (character === '"') {
        this.offset += 1;
        return JSON.parse(this.source.slice(start, this.offset)) as string;
      }
      if (character === "\\") {
        this.offset += 1;
        const escape = this.source[this.offset];
        if (escape === "u") {
          const code = this.source.slice(this.offset + 1, this.offset + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(code)) this.invalid();
          this.offset += 5;
          continue;
        }
        if (!escape || !'"\\/bfnrt'.includes(escape)) this.invalid();
        this.offset += 1;
        continue;
      }
      if (!character || character.charCodeAt(0) <= 0x1f) this.invalid();
      this.offset += 1;
    }
    this.invalid();
  }

  private readNumber(): void {
    const match = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      this.source.slice(this.offset),
    );
    if (!match || match.index !== 0) this.invalid();
    this.offset += match[0].length;
  }

  private readLiteral(literal: string): void {
    if (!this.source.startsWith(literal, this.offset)) this.invalid();
    this.offset += literal.length;
  }

  private skipWhitespace(): void {
    while (
      this.source[this.offset] === " " ||
      this.source[this.offset] === "\n" ||
      this.source[this.offset] === "\r" ||
      this.source[this.offset] === "\t"
    ) {
      this.offset += 1;
    }
  }

  private take(character: string): boolean {
    if (this.source[this.offset] !== character) return false;
    this.offset += 1;
    return true;
  }

  private invalid(): never {
    throw new SyntaxError(`Invalid JSON at character ${this.offset}.`);
  }
}

function jsonFieldLocation(location: string, field: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(field)
    ? `${location}.${field}`
    : `${location}[${JSON.stringify(field)}]`;
}
