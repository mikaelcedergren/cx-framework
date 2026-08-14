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
  // The close button starts its pop-in before the canvas finishes settling so
  // both read as one continuous motion instead of two sequential ones.
  private static readonly closeButtonRevealMs = 180;
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly renderedState = signal(false);
  private readonly closingState = signal(false);
  private readonly closeButtonReadyState = signal(false);
  private requestedOpen = false;
  private closeButtonRevealed = false;
  private closeButtonValue = true;
  private overlayHandle?: CxOverlayStateHandle;
  private closeButtonRevealTimer?: number;
  private exitFallbackTimer?: number;
  private overlayReleaseTimer?: number;

  @ViewChild('dialogRoot', { read: ElementRef })
  private dialogRootRef?: ElementRef<HTMLElement>;

  @Input() ariaLabel = 'Fullscreen dialog';

  @Input()
  public set closeButton(value: boolean) {
    this.closeButtonValue = value !== false;
    this.closeButtonReadyState.set(
      this.closeButtonValue && this.closeButtonRevealed && !this.closingState(),
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
      this.revealCloseButton();
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
      this.closeButtonRevealed = this.prefersReducedMotion();
      this.closingState.set(false);
      this.closeButtonReadyState.set(this.closeButton && this.closeButtonRevealed);
      this.renderedState.set(true);
      if (!this.closeButtonRevealed) {
        this.scheduleCloseButtonReveal();
      }
      return;
    }

    if (!this.renderedState()) {
      this.finishClose();
      return;
    }

    this.closeButtonRevealed = false;
    this.clearCloseButtonReveal();
    this.dialogRootRef?.nativeElement.focus({ preventScroll: true });
    this.closeButtonReadyState.set(false);
    if (this.prefersReducedMotion()) {
      this.finishClose();
      return;
    }
    this.closingState.set(true);
    this.scheduleExitFallback();
  }

  private revealCloseButton(): void {
    if (!this.requestedOpen || this.closingState()) {
      return;
    }
    this.clearCloseButtonReveal();
    this.closeButtonRevealed = true;
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

  private scheduleCloseButtonReveal(): void {
    this.clearCloseButtonReveal();
    if (typeof window === 'undefined') {
      this.revealCloseButton();
      return;
    }
    this.closeButtonRevealTimer = window.setTimeout(
      () => this.revealCloseButton(),
      CxFullscreenDialogComponent.closeButtonRevealMs,
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
    this.clearCloseButtonReveal();
    this.clearExitFallback();
  }

  private clearCloseButtonReveal(): void {
    if (typeof window !== 'undefined' && this.closeButtonRevealTimer !== undefined) {
      window.clearTimeout(this.closeButtonRevealTimer);
    }
    this.closeButtonRevealTimer = undefined;
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
