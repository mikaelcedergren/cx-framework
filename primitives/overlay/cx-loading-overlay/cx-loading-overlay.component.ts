import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxTextShimmerComponent } from '../../display/cx-text-shimmer';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

/**
 * Shortest time a status stays on screen before the next one may replace it.
 * Real progress events arrive in bursts — several stages can fire inside a few
 * hundred milliseconds — and without a floor the label flickers through states
 * nobody can read.
 */
const MIN_DWELL_MS = 700;

interface CxLoadingOverlayStatusEntry {
  /** Increments on every displayed change so `@for` replaces the node and replays the enter animation. */
  key: number;
  text: string;
}

/**
 * A modal wait: a scrim, a compact surface, a spinner, and the live status of
 * the work underneath it.
 *
 * `status` is the current stage only — the component never owns a plan, an
 * index, or a timer that advances on its own, so the label can only ever say
 * what the host actually knows.
 *
 * It deliberately cannot be dismissed. There is no close control, Escape is
 * swallowed rather than passed down, and the backdrop ignores clicks — the
 * dialog closes only when the host sets `open` to false, which should be when
 * the work actually finishes.
 */
@Component({
  selector: 'cx-loading-overlay',
  imports: [A11yModule, CxSpinnerComponent, CxTextShimmerComponent],
  templateUrl: './cx-loading-overlay.component.html',
  styleUrl: './cx-loading-overlay.component.scss',
  host: {
    class: 'cx-loading-overlay-host',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLoadingOverlayComponent implements OnDestroy {
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private overlayHandle?: CxOverlayStateHandle;

  private readonly displayedState = signal('');
  private readonly revisionState = signal(0);

  /** The most recent value the host set, which may not be on screen yet. */
  private latest = '';
  /** A status waiting out the current dwell. Only the newest one survives. */
  private queued: string | null = null;
  private dwellTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  private displayedAt = 0;

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly displayed$ = this.displayedState.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearDwellTimer());
  }

  /** Whether the wait is showing. Two-way bindable; the host closes it when the work finishes. */
  @Input()
  public set open(value: boolean) {
    this.syncOpen(Boolean(value));
  }

  public get open(): boolean {
    return this.openState();
  }

  /**
   * What the work is doing right now. Empty shows the spinner alone.
   *
   * Set it again whenever the work moves on; the overlay holds each value on
   * screen long enough to read before accepting the next.
   */
  @Input()
  public set status(value: string | undefined) {
    this.accept(value?.trim() ?? '');
  }

  public get status(): string {
    return this.latest;
  }

  /**
   * Accessible name for the overlay. Kept stable on purpose — naming it from the
   * changing status would rename the overlay on every stage.
   */
  @Input() ariaLabel = 'Working';

  @Output() readonly openChange = new EventEmitter<boolean>();

  public ngOnDestroy(): void {
    this.releaseOverlay();
  }

  protected get resolvedAriaLabel(): string {
    return this.ariaLabel.trim() || 'Working';
  }

  protected readonly hasStatus$ = computed(() => this.displayedState().length > 0);

  protected readonly entries$ = computed<CxLoadingOverlayStatusEntry[]>(() => {
    const text = this.displayedState();
    return text ? [{ key: this.revisionState(), text }] : [];
  });

  /**
   * The wait holds no controls, so there is nowhere for Tab to go. Swallowing it
   * keeps focus on the surface instead of letting it reach the page behind,
   * which the user is not allowed to touch while the work runs.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
    }
  }

  /**
   * Pressing the scrim would otherwise blur the surface onto the document body,
   * which then lets the next Tab walk into the page behind the wait. Cancelling
   * the default on the scrim itself keeps focus where the trap put it, while
   * anything inside the surface still behaves normally.
   */
  protected onBackdropMousedown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  }

  private syncOpen(next: boolean): void {
    if (this.openState() === next) {
      return;
    }
    this.openState.set(next);
    if (next) {
      this.overlayHandle = this.overlayState.capture({
        kind: 'modal',
        isActive: () => this.openState(),
        // Registering a handler that does nothing is what swallows Escape: the
        // overlay service only stops the key for the topmost handle that claims
        // it, and without this the key would fall through and dismiss whatever
        // sits behind the wait.
        onEscape: () => undefined,
      });
      return;
    }
    this.releaseOverlay();
  }

  private releaseOverlay(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }

  private accept(next: string): void {
    if (next === this.latest) {
      return;
    }
    this.latest = next;

    // Clearing is immediate: a lone spinner must never keep narrating work that
    // is no longer happening.
    if (next === '') {
      this.clearDwellTimer();
      this.queued = null;
      this.display('');
      return;
    }

    const elapsed = Date.now() - this.displayedAt;
    if (!this.hasStatus$() || elapsed >= MIN_DWELL_MS) {
      this.clearDwellTimer();
      this.queued = null;
      this.display(next);
      return;
    }

    // Coalesce rather than queue, so the readout is never more than one dwell
    // behind the work. Draining every burst in order would leave the label
    // describing a stage the system had already finished.
    this.queued = next;
    if (this.dwellTimer === undefined) {
      this.dwellTimer = globalThis.setTimeout(() => this.flush(), MIN_DWELL_MS - elapsed);
    }
  }

  private flush(): void {
    this.dwellTimer = undefined;
    const next = this.queued;
    this.queued = null;
    if (next !== null) {
      this.display(next);
    }
  }

  private display(text: string): void {
    this.displayedAt = Date.now();
    this.displayedState.set(text);
    this.revisionState.update(revision => revision + 1);
  }

  private clearDwellTimer(): void {
    if (this.dwellTimer === undefined) {
      return;
    }
    globalThis.clearTimeout(this.dwellTimer);
    this.dwellTimer = undefined;
  }
}
