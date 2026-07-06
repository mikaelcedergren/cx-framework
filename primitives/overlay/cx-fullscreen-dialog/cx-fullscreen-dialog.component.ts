import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

@Component({
  selector: 'cx-fullscreen-dialog',
  imports: [A11yModule, CxIconButtonComponent],
  templateUrl: './cx-fullscreen-dialog.component.html',
  styleUrl: './cx-fullscreen-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFullscreenDialogComponent implements OnDestroy {
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private overlayHandle?: CxOverlayStateHandle;

  @Input() ariaLabel = 'Fullscreen dialog';
  @Input() closeButton = true;

  @Input()
  public set open(value: boolean) {
    this.syncOpen(Boolean(value));
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly dismiss = new EventEmitter<void>();

  protected readonly isOpen$ = this.openState.asReadonly();

  ngOnDestroy(): void {
    this.releaseOverlay();
  }

  protected resolvedAriaLabel(): string {
    return this.ariaLabel.trim() || 'Fullscreen dialog';
  }

  protected onDismiss(): void {
    if (!this.closeButton) {
      return;
    }
    this.dismiss.emit();
    this.closeFromUser();
  }

  protected onEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.closeButton) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.onDismiss();
  }

  private closeFromUser(): void {
    this.syncOpen(false);
    this.openChange.emit(false);
  }

  private syncOpen(nextOpen: boolean): void {
    if (this.openState() === nextOpen) {
      return;
    }
    if (nextOpen) {
      this.overlayHandle = this.overlayState.capture();
    } else {
      this.releaseOverlay();
    }
    this.openState.set(nextOpen);
  }

  private releaseOverlay(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }
}
