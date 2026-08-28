export interface OwnedE2ERuntime {
  readonly baseUrl: string;
  readonly markerPath: string;
  readonly ownerNonce: string;
  readonly ownerPid: number;
  readonly port: number;
  readonly productId: string;
  readonly proxyUrl?: string;
  readonly root: string;
  readonly runtimeTemp: string;
  readonly tempParent: string;
}

export interface ValidatedOwnedE2ERuntime extends OwnedE2ERuntime {
  readonly proxyUrl: string;
}

export interface E2ERunnerContext {
  readonly baseUrl: string;
  readonly networkGuardPath: string;
  readonly nodeExecutable: string;
  readonly pathValue: string;
  readonly playwrightCliPath: string;
  readonly pnpmCliPath: string;
  readonly port: number;
  readonly proxyUrl: string;
  readonly repoRoot: string;
  readonly runtime: ValidatedOwnedE2ERuntime;
}

export interface E2EControllerConfiguration {
  readonly environment: Readonly<Record<string, string>>;
  readonly scriptPath: string;
  readonly startupTimeoutMs?: number;
}

export interface E2EProductConfiguration {
  readonly configPath: string;
  readonly controller: E2EControllerConfiguration;
  readonly playwrightEnvironment?: Readonly<Record<string, string>>;
  readonly testDirectory: string;
}

export const E2E_OWNER_MARKER_NAME: string;
export { E2E_DYNAMIC_PORT_RANGE } from "./e2e-contract.mjs";
export const E2E_CHROMIUM_NETWORK_ARGUMENTS: readonly [
  "--disable-quic",
  "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
];
export const E2E_STANDARD_ENVIRONMENT_KEYS: readonly string[];

export function runHermeticE2E(options: {
  readonly configure: (context: E2ERunnerContext) => E2EProductConfiguration;
  readonly playwrightArgs?: readonly string[];
  readonly productId: string;
  readonly repoRoot: string;
}): Promise<number>;

export function createE2EControllerEnvironment(options: {
  readonly ci?: string;
  readonly extras?: Readonly<Record<string, string>>;
  readonly pathValue: string;
  readonly pnpmCliPath: string;
  readonly proxyUrl: string;
  readonly runtime: OwnedE2ERuntime;
}): Readonly<Record<string, string>>;

export function createHermeticE2EChildEnvironment(
  productEnvironment: Readonly<Record<string, string>>,
  options?: Readonly<{ targetServer?: boolean }>,
): Readonly<Record<string, string>>;

export function createHermeticPlaywrightUse<
  T extends Readonly<Record<string, unknown>>,
>(
  runtime: ValidatedOwnedE2ERuntime,
  options?: T,
): Readonly<
  T & {
    readonly baseURL: string;
    readonly browserName: "chromium";
    readonly launchOptions: Readonly<{
      readonly args: readonly string[];
      readonly proxy: Readonly<{ readonly server: string }>;
    }>;
    readonly proxy: Readonly<{ readonly server: string }>;
    readonly serviceWorkers: "block";
  }
>;

export function createHermeticBrowserContext<
  TBrowser extends { newContext: (...args: any[]) => any },
>(
  browser: TBrowser,
  options?: Parameters<TBrowser["newContext"]>[0],
): ReturnType<TBrowser["newContext"]>;

export function createHermeticAPIRequestContext<
  TRequest extends { newContext: (...args: any[]) => any },
>(
  request: TRequest,
  options?: Parameters<TRequest["newContext"]>[0],
): ReturnType<TRequest["newContext"]>;

export function createExactOriginFetch(
  nativeFetch: typeof globalThis.fetch,
  allowedOrigin: string,
): typeof globalThis.fetch;

export function validateOwnedE2ERuntime(options: {
  readonly environment?: NodeJS.ProcessEnv;
  readonly productId: string;
}): ValidatedOwnedE2ERuntime;
