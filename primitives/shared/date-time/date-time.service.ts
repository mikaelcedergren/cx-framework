import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import {
  DestroyRef,
  Injectable,
  NgZone,
  PLATFORM_ID,
  inject,
  signal,
} from "@angular/core";
import {
  formatCxDateTime,
  type CxDateTimeOptions,
  type CxDateTimeValue,
} from "./format-date-time";

/** One visibility-aware clock for every date label in an Angular application. */
@Injectable({ providedIn: "root" })
export class CxDateTimeService {
  private readonly currentTime = signal(Date.now());
  readonly now = this.currentTime.asReadonly();

  constructor() {
    const document = inject(DOCUMENT);
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = (): void => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const refresh = (): void => {
      stop();
      if (document.visibilityState === "hidden") return;
      zone.run(() => this.currentTime.set(Date.now()));
      // Align to the wall clock so midnight labels change on the minute boundary.
      zone.runOutsideAngular(() => {
        timer = setTimeout(refresh, 60_000 - (Date.now() % 60_000));
      });
    };
    zone.runOutsideAngular(() =>
      document.addEventListener("visibilitychange", refresh),
    );
    refresh();
    destroyRef.onDestroy(() => {
      stop();
      document.removeEventListener("visibilitychange", refresh);
    });
  }

  format(
    value: CxDateTimeValue,
    options: Omit<CxDateTimeOptions, "now"> = {},
  ): string {
    return formatCxDateTime(value, {
      ...options,
      now: options.mode === "absolute" ? undefined : this.now(),
    });
  }
}
