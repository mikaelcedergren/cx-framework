import type { CloseableServer, SignalSource } from "./http.js";
import { assertTimerDelayMilliseconds } from "./timer.js";

const MAX_SHUTDOWN_SIGNALS = 16;
const SIGNAL_NAME_PATTERN = /^SIG[A-Z0-9]+$/;

export interface GracefulShutdown {
  readonly closing: boolean;
  close(reason?: string): Promise<void>;
}

export function createGracefulShutdown({
  server,
  timeoutMs = 10_000,
  onTimeout,
}: {
  server: CloseableServer;
  timeoutMs?: number;
  onTimeout?: (reason: string) => void;
}): GracefulShutdown {
  assertTimerDelayMilliseconds(timeoutMs, "Graceful shutdown timeout");
  let closing: Promise<void> | undefined;
  return {
    get closing() {
      return Boolean(closing);
    },
    close(reason = "shutdown") {
      if (closing) return closing;
      closing = new Promise<void>((resolve, reject) => {
        let settled = false;
        const rejectOnce = (error: unknown) => {
          if (settled) return;
          settled = true;
          globalThis.clearTimeout(timeout);
          reject(error);
        };
        const resolveOnce = () => {
          if (settled) return;
          settled = true;
          globalThis.clearTimeout(timeout);
          resolve();
        };
        const timeout = globalThis.setTimeout(() => {
          if (settled) return;
          settled = true;
          const timeoutError = new Error(
            `Graceful shutdown timed out after ${timeoutMs}ms (${reason}).`,
          );
          const failures: unknown[] = [timeoutError];
          try {
            server.closeAllConnections?.();
          } catch (error) {
            failures.push(error);
          }
          try {
            onTimeout?.(reason);
          } catch (error) {
            failures.push(error);
          }
          reject(
            failures.length === 1
              ? timeoutError
              : new AggregateError(
                  failures,
                  "Graceful shutdown timed out and its timeout handling failed.",
                ),
          );
        }, timeoutMs);
        try {
          server.close((error) => {
            if (error) rejectOnce(error);
            else resolveOnce();
          });
        } catch (error) {
          rejectOnce(error);
        }
      });
      return closing;
    },
  };
}

export function bindShutdownSignals({
  signals,
  shutdown,
  names = ["SIGINT", "SIGTERM"],
  onError,
}: {
  signals: SignalSource;
  shutdown: GracefulShutdown;
  names?: readonly string[];
  onError: (error: unknown) => void;
}): () => void {
  if (typeof onError !== "function") {
    throw new Error(
      "bindShutdownSignals requires an error handler so shutdown failures cannot be ignored.",
    );
  }
  if (
    !signals ||
    typeof signals.once !== "function" ||
    typeof signals.off !== "function"
  ) {
    throw new Error("bindShutdownSignals requires a removable signal source.");
  }
  const safeNames = validateShutdownSignalNames(names);
  const listeners: { listener: () => void; name: string }[] = [];
  try {
    for (const name of safeNames) {
      const listener = () => {
        void shutdown.close(name).catch((error) => onError(error));
      };
      listeners.push({ listener, name });
      signals.once(name, listener);
    }
  } catch (registrationError) {
    const failures: unknown[] = [registrationError];
    for (const { listener, name } of listeners.reverse()) {
      try {
        signals.off(name, listener);
      } catch (rollbackError) {
        failures.push(rollbackError);
      }
    }
    if (failures.length > 1) {
      throw new AggregateError(
        failures,
        "Signal registration failed and its listener rollback was incomplete.",
      );
    }
    throw registrationError;
  }
  return () => {
    const failures: unknown[] = [];
    for (const { listener, name } of [...listeners].reverse()) {
      try {
        signals.off(name, listener);
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) {
      throw new AggregateError(
        failures,
        "Removing shutdown signal listeners failed.",
      );
    }
  };
}

export function validateShutdownSignalNames(
  names: readonly string[] = ["SIGINT", "SIGTERM"],
): readonly string[] {
  if (
    !Array.isArray(names) ||
    names.length === 0 ||
    names.length > MAX_SHUTDOWN_SIGNALS
  ) {
    throw new Error(
      `Shutdown signal names must contain between 1 and ${MAX_SHUTDOWN_SIGNALS} entries.`,
    );
  }
  const safeNames = names.map((name) => {
    if (typeof name !== "string" || !SIGNAL_NAME_PATTERN.test(name)) {
      throw new Error(`Invalid shutdown signal name: ${String(name)}`);
    }
    return name;
  });
  if (new Set(safeNames).size !== safeNames.length) {
    throw new Error("Shutdown signal names must be unique.");
  }
  return Object.freeze(safeNames);
}
