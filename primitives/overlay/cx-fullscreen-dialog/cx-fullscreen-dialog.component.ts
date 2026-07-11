import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

@Component({
  selector: 'cx-fullscreen-dialog',
  imports: [A11yModule, CxIconComponent],
  templateUrl: './cx-fullscreen-dialog.component.html',
  styleUrl: './cx-fullscreen-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFullscreenDialogComponent implements OnDestroy {
  private static readonly motionDurationMs = 480;
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly renderedState = signal(false);
  private readonly closingState = signal(false);
  private readonly closeButtonReadyState = signal(false);
  private requestedOpen = false;
  private entranceComplete = false;
  private closeButtonValue = true;
  private overlayHandle?: CxOverlayStateHandle;
  private entranceFallbackTimer?: number;
  private exitFallbackTimer?: number;
  private overlayReleaseTimer?: number;

  @ViewChild('dialogRoot', { read: ElementRef })
  private dialogRootRef?: ElementRef<HTMLElement>;

  @Input() ariaLabel = 'Fullscreen dialog';

  @Input()
  public set closeButton(value: boolean) {
    this.closeButtonValue = value !== false;
    this.closeButtonReadyState.set(
      this.closeButtonValue && this.entranceComplete && !this.closingState(),
    );
  }
  public get closeButton(): boolean {
    return this.closeButtonValue;
  }

  @Input()
  public set open(value: boolean) {
    this.syncOpen(Boolean(value));
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly dismiss = new EventEmitter<void>();

  protected readonly isRendered$ = this.renderedState.asReadonly();
  protected readonly isClosing$ = this.closingState.asReadonly();
  protected readonly isCloseButtonReady$ = this.closeButtonReadyState.asReadonly();

  ngOnDestroy(): void {
    this.clearMotionTimers();
    this.clearOverlayReleaseTimer();
    this.releaseOverlay();
  }

  protected resolvedAriaLabel(): string {
    return this.ariaLabel.trim() || 'Fullscreen dialog';
  }

  protected onDismiss(): void {
    if (!this.closeButton || this.closingState()) {
      return;
    }
    this.dismiss.emit();
    this.closeFromUser();
  }

  protected onEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.closeButton || this.closingState()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.onDismiss();
  }

  protected onCanvasAnimationEnd(event: AnimationEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.animationName === 'cx-fullscreen-dialog-enter' && this.requestedOpen && !this.closingState()) {
      this.finishEntrance();
      return;
    }
    if (event.animationName === 'cx-fullscreen-dialog-exit' && this.closingState()) {
      this.finishClose();
    }
  }

  protected dialogTabIndex(): number {
    return this.closeButton && this.closeButtonReadyState() ? -1 : 0;
  }

  private closeFromUser(): void {
    this.syncOpen(false);
    this.openChange.emit(false);
  }

  private syncOpen(nextOpen: boolean): void {
    if (this.requestedOpen === nextOpen) {
      return;
    }
    this.requestedOpen = nextOpen;

    if (nextOpen) {
      this.clearMotionTimers();
      this.clearOverlayReleaseTimer();
      if (!this.overlayHandle) {
        this.overlayHandle = this.overlayState.capture();
      }
      this.entranceComplete = this.prefersReducedMotion();
      this.closingState.set(false);
      this.closeButtonReadyState.set(this.closeButton && this.entranceComplete);
      this.renderedState.set(true);
      if (!this.entranceComplete) {
        this.scheduleEntranceFallback();
      }
      return;
    }

    if (!this.renderedState()) {
      this.finishClose();
      return;
    }

    this.entranceComplete = false;
    this.clearEntranceFallback();
    this.dialogRootRef?.nativeElement.focus({ preventScroll: true });
    this.closeButtonReadyState.set(false);
    if (this.prefersReducedMotion()) {
      this.finishClose();
      return;
    }
    this.closingState.set(true);
    this.scheduleExitFallback();
  }

  private finishEntrance(): void {
    if (!this.requestedOpen || this.closingState()) {
      return;
    }
    this.clearEntranceFallback();
    this.entranceComplete = true;
    this.closeButtonReadyState.set(this.closeButton);
  }

  private finishClose(): void {
    if (this.requestedOpen) {
      return;
    }
    this.clearMotionTimers();
    this.renderedState.set(false);
    this.closingState.set(false);
    this.closeButtonReadyState.set(false);
    this.scheduleOverlayRelease();
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private scheduleEntranceFallback(): void {
    this.clearEntranceFallback();
    if (typeof window === 'undefined') {
      this.finishEntrance();
      return;
    }
    this.entranceFallbackTimer = window.setTimeout(
      () => this.finishEntrance(),
      CxFullscreenDialogComponent.motionDurationMs + 20,
    );
  }

  private scheduleExitFallback(): void {
    this.clearExitFallback();
    if (typeof window === 'undefined') {
      this.finishClose();
      return;
    }
    this.exitFallbackTimer = window.setTimeout(
      () => this.finishClose(),
      CxFullscreenDialogComponent.motionDurationMs + 20,
    );
  }

  private clearMotionTimers(): void {
    this.clearEntranceFallback();
    this.clearExitFallback();
  }

  private clearEntranceFallback(): void {
    if (typeof window !== 'undefined' && this.entranceFallbackTimer !== undefined) {
      window.clearTimeout(this.entranceFallbackTimer);
    }
    this.entranceFallbackTimer = undefined;
  }

  private clearExitFallback(): void {
    if (typeof window !== 'undefined' && this.exitFallbackTimer !== undefined) {
      window.clearTimeout(this.exitFallbackTimer);
    }
    this.exitFallbackTimer = undefined;
  }

  private scheduleOverlayRelease(): void {
    this.clearOverlayReleaseTimer();
    if (typeof window === 'undefined') {
      this.releaseOverlay();
      return;
    }
    this.overlayReleaseTimer = window.setTimeout(() => {
      this.overlayReleaseTimer = undefined;
      if (!this.requestedOpen && !this.renderedState()) {
        this.releaseOverlay();
      }
    });
  }

  private clearOverlayReleaseTimer(): void {
    if (typeof window !== 'undefined' && this.overlayReleaseTimer !== undefined) {
      window.clearTimeout(this.overlayReleaseTimer);
    }
    this.overlayReleaseTimer = undefined;
  }

  private releaseOverlay(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }
}
