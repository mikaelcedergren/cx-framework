import { realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

export class ConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConfigurationError";
  }
}

export type Environment = Readonly<Record<string, string | undefined>>;

export type NodeEnvironment = "development" | "test" | "production";

/** Parse NODE_ENV without normalising mistakes into a different runtime policy. */
export function nodeEnvironmentValue(
  environment: Environment,
): NodeEnvironment {
  const value = environment["NODE_ENV"];
  if (value === undefined) return "development";
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }
  throw new ConfigurationError(
    "NODE_ENV must be exactly development, test, or production when it is set.",
  );
}

/** Parse the production-only release-validation switch while proving NODE_ENV exact. */
export function releaseValidationEnvironmentValue(
  environment: Environment,
): boolean {
  const nodeEnvironment = nodeEnvironmentValue(environment);
  const value = environment["CX_RELEASE_VALIDATION"];
  if (value === undefined) return false;
  if (value !== "1") {
    throw new ConfigurationError(
      "CX_RELEASE_VALIDATION must be exactly 1 when it is set.",
    );
  }
  if (nodeEnvironment !== "production") {
    throw new ConfigurationError(
      "CX_RELEASE_VALIDATION=1 requires NODE_ENV=production.",
    );
  }
  return true;
}

/**
 * Resolve the one mutable operational root used by a product process.
 *
 * Ordinary development uses the process working directory. A synthetic release-validation
 * process must declare one canonical absolute CX_RUNTIME_ROOT; ordinary processes may not set the
 * release-only override. The returned path is always the real directory identity so environment
 * files, databases, browser releases, and logs cannot disagree at a symbolic-link boundary.
 */
export function resolveOperationalRoot(
  environment: Environment,
  { cwd = process.cwd() }: { readonly cwd?: string } = {},
): string {
  const releaseValidation = releaseValidationEnvironmentValue(environment);
  const override = environment["CX_RUNTIME_ROOT"];
  if (override !== undefined && !releaseValidation) {
    throw new ConfigurationError(
      "CX_RUNTIME_ROOT is reserved for CX_RELEASE_VALIDATION=1.",
    );
  }
  if (releaseValidation && override === undefined) {
    throw new ConfigurationError(
      "CX_RELEASE_VALIDATION=1 requires an absolute CX_RUNTIME_ROOT.",
    );
  }
  if (
    override !== undefined &&
    (!override ||
      override !== override.trim() ||
      !isAbsolute(override) ||
      resolve(override) !== override ||
      /[\u0000-\u001f\u007f]/.test(override))
  ) {
    throw new ConfigurationError(
      "CX_RUNTIME_ROOT must be one canonical absolute path during release validation.",
    );
  }
  if (
    typeof cwd !== "string" ||
    !cwd ||
    cwd !== cwd.trim() ||
    !isAbsolute(cwd) ||
    /[\u0000-\u001f\u007f]/.test(cwd)
  ) {
    throw new ConfigurationError(
      "The operational working directory must be absolute.",
    );
  }
  const selected = override ?? cwd;
  let canonical: string;
  try {
    canonical = realpathSync.native(selected);
  } catch (error) {
    throw new ConfigurationError(
      `The operational root must be an existing real directory: ${selected}.`,
      { cause: error },
    );
  }
  if (override !== undefined && canonical !== override) {
    throw new ConfigurationError(
      "CX_RUNTIME_ROOT must be one real canonical directory.",
    );
  }
  return canonical;
}

export function requiredEnvironmentValue(
  environment: Environment,
  name: string,
): string {
  const value = environment[name]?.trim();
  if (!value)
    throw new ConfigurationError(
      `Missing required environment value: ${name}.`,
    );
  return value;
}

export function optionalEnvironmentValue(
  environment: Environment,
  name: string,
  fallback?: string,
): string | undefined {
  const value = environment[name]?.trim();
  return value || fallback;
}

export function booleanEnvironmentValue(
  environment: Environment,
  name: string,
  fallback: boolean,
): boolean {
  const value = optionalEnvironmentValue(environment, name);
  if (value === undefined) return fallback;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  throw new ConfigurationError(`${name} must be true, false, 1, or 0.`);
}

export function integerEnvironmentValue(
  environment: Environment,
  name: string,
  {
    fallback,
    minimum,
    maximum,
  }: { fallback?: number; minimum?: number; maximum?: number } = {},
): number {
  const value = optionalEnvironmentValue(environment, name);
  if (value === undefined && fallback === undefined)
    throw new ConfigurationError(
      `Missing required environment value: ${name}.`,
    );
  if (value !== undefined && !/^-?\d+$/.test(value))
    throw new ConfigurationError(`${name} must be a whole number.`);
  const parsed = value === undefined ? fallback : Number(value);
  if (parsed === undefined)
    throw new ConfigurationError(
      `Missing required environment value: ${name}.`,
    );
  if (!Number.isSafeInteger(parsed))
    throw new ConfigurationError(`${name} is outside the safe integer range.`);
  if (minimum !== undefined && parsed < minimum) {
    throw new ConfigurationError(`${name} must be at least ${minimum}.`);
  }
  if (maximum !== undefined && parsed > maximum) {
    throw new ConfigurationError(`${name} must be at most ${maximum}.`);
  }
  return parsed;
}

export function portEnvironmentValue(
  environment: Environment,
  name = "PORT",
  fallback?: number,
): number {
  return integerEnvironmentValue(environment, name, {
    ...(fallback === undefined ? {} : { fallback }),
    minimum: 1,
    maximum: 65535,
  });
}

export function localBindHost(
  environment: Environment,
  {
    name = "HOST",
    fallback = "127.0.0.1",
  }: { name?: string; fallback?: string } = {},
): string {
  const host = optionalEnvironmentValue(environment, name, fallback);
  if (host !== "127.0.0.1" && host !== "::1" && host !== "localhost") {
    throw new ConfigurationError(
      `${name} must bind locally (127.0.0.1, ::1, or localhost); public traffic belongs at nginx.`,
    );
  }
  return host;
}
