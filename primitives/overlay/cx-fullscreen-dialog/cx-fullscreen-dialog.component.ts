import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { CxButtonComponent } from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

export type CxFullscreenDialogMood = 'primary' | 'danger' | 'success' | 'warning';

@Component({
  selector: 'cx-fullscreen-dialog',
  imports: [A11yModule, CxButtonComponent, CxIconButtonComponent],
  templateUrl: './cx-fullscreen-dialog.component.html',
  styleUrl: './cx-fullscreen-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFullscreenDialogComponent implements OnDestroy {
  private static nextId = 0;
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private overlayHandle?: CxOverlayStateHandle;

  @Input() heading = 'Fullscreen dialog';
  @Input() description = '';
  @Input() primaryActionText = 'Continue';
  @Input() secondaryActionText = 'Cancel';
  @Input() primaryActionMood: CxFullscreenDialogMood = 'primary';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() dismissible = true;

  @Input()
  public set open(value: boolean) {
    this.syncOpen(Boolean(value));
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly primaryAction = new EventEmitter<void>();
  @Output() readonly secondaryAction = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly dialogId = `cx-fullscreen-dialog-${++CxFullscreenDialogComponent.nextId}`;

  ngOnDestroy(): void {
    this.releaseOverlay();
  }

  protected hasDescription(): boolean {
    return this.description.trim().length > 0;
  }

  protected hasPrimaryAction(): boolean {
    return this.primaryActionText.trim().length > 0;
  }

  protected hasSecondaryAction(): boolean {
    return this.secondaryActionText.trim().length > 0;
  }

  protected onPrimary(): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.primaryAction.emit();
  }

  protected onSecondary(): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.secondaryAction.emit();
    this.closeFromUser();
  }

  protected onDismiss(): void {
    if (!this.dismissible) {
      return;
    }
    this.dismiss.emit();
    this.closeFromUser();
  }

  protected onEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.dismissible) {
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
