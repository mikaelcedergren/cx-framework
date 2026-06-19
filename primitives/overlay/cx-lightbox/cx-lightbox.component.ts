import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

@Component({
  selector: 'cx-lightbox',
  imports: [CommonModule, CxIconComponent, A11yModule],
  templateUrl: './cx-lightbox.component.html',
  styleUrl: './cx-lightbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class CxLightboxComponent implements OnDestroy {
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private overlayHandle?: CxOverlayStateHandle;

  protected readonly isOpen$ = this.openState.asReadonly();

  @Input() src = '';
  @Input() alt = '';
  @Input() caption: string | undefined;
  @Input() ariaLabel = 'Image lightbox';
  @Input() closeAriaLabel = 'Close lightbox';

  @Input()
  public set open(value: boolean) {
    this.syncOpen(Boolean(value));
  }

  @Output() readonly openChange = new EventEmitter<boolean>();

  public ngOnDestroy(): void {
    this.releaseOverlay();
  }

  protected hasImage(): boolean {
    return this.src.trim().length > 0;
  }

  protected onBackdropClick(): void {
    this.closeFromUser();
  }

  protected onSurfaceClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  protected onCloseClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeFromUser();
  }

  protected onEscapeKey(): void {
    if (!this.openState()) {
      return;
    }
    this.closeFromUser();
  }

  private closeFromUser(): void {
    if (!this.openState()) {
      return;
    }
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
