import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import {
  CxButtonComponent,
  type CxButtonMood,
} from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxMenuComponent, type CxMenuItem } from '../cx-menu';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

let cxDialogId = 0;

export type CxDialogVariant = 'confirm' | 'info';
export type CxDialogMood = CxButtonMood;
export type CxDialogSize = 'small' | 'default' | 'large';

@Component({
  selector: 'cx-dialog',
  imports: [CommonModule, A11yModule, CxButtonComponent, CxIconButtonComponent, CxMenuComponent],
  templateUrl: './cx-dialog.component.html',
  styleUrl: './cx-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDialogComponent implements OnDestroy {
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private readonly menuOpenState = signal(false);
  private overlayHandle?: CxOverlayStateHandle;

  protected readonly titleId = `cx-dialog-title-${++cxDialogId}`;
  protected readonly textId = `cx-dialog-text-${cxDialogId}`;
  protected readonly isOpen$ = this.openState.asReadonly();

  @Input() variant: CxDialogVariant = 'info';
  @Input() size: CxDialogSize = 'default';
  @Input() dismissible = false;
  @Input() heading = '';
  @Input() text = '';
  @Input() primaryText = 'Close';
  @Input() primaryDisabled = false;
  @Input() primaryLoading = false;
  @Input() mood: CxDialogMood = 'primary';
  @Input() secondaryText = '';
  @Input() closeOnPrimary = true;
  @Input() closeOnSecondary = true;
  @Input() menuItems: readonly CxMenuItem[] | undefined;
  @Input() menuAriaLabel: string | undefined;

  @Input()
  public set loading(value: boolean) {
    this.primaryLoading = value;
  }

  @Input()
  public set open(value: boolean) {
    this.syncOpen(Boolean(value));
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly primary = new EventEmitter<void>();
  @Output() readonly secondary = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();
  @Output() readonly menuItemSelect = new EventEmitter<string>();

  ngOnDestroy(): void {
    this.releaseOverlay();
  }

  protected isModal(): boolean {
    return this.variant === 'confirm';
  }

  protected dialogRole(): 'dialog' | 'alertdialog' {
    return this.isModal() ? 'alertdialog' : 'dialog';
  }

  protected resolvedPrimaryText(): string {
    const trimmedLabel = this.primaryText.trim();
    if (trimmedLabel.length > 0) {
      return trimmedLabel;
    }
    return this.variant === 'info' ? 'Close' : 'Confirm';
  }

  protected resolvedSecondaryText(): string | undefined {
    if (this.variant !== 'confirm') {
      return undefined;
    }
    const trimmedLabel = this.secondaryText.trim();
    return trimmedLabel.length > 0 ? trimmedLabel : 'Cancel';
  }

  protected hasText(): boolean {
    return this.text.trim().length > 0;
  }

  protected hasMenuItems(): boolean {
    return (this.menuItems?.length ?? 0) > 0;
  }

  protected canDismiss(): boolean {
    return this.dismissible;
  }

  protected hasHeaderActions(): boolean {
    return this.hasMenuItems() || this.canDismiss();
  }

  protected resolvedMenuAriaLabel(): string {
    const label = this.menuAriaLabel?.trim();
    if (label) {
      return label;
    }
    const heading = this.heading.trim();
    return heading ? `${heading} actions` : 'Dialog actions';
  }

  protected onBackdropClick(): void {
    if (!this.canDismiss()) {
      return;
    }
    this.onDismiss();
  }

  protected onDismiss(): void {
    if (!this.canDismiss()) {
      return;
    }
    this.dismiss.emit();
    this.closeFromUser();
  }

  protected onPrimary(): void {
    if (this.primaryDisabled || this.primaryLoading) {
      return;
    }
    this.primary.emit();
    if (this.closeOnPrimary) {
      this.closeFromUser();
    }
  }

  protected onSecondary(): void {
    this.secondary.emit();
    if (this.closeOnSecondary) {
      this.closeFromUser();
    }
  }

  protected onMenuOpenChange(open: boolean): void {
    this.menuOpenState.set(open);
  }

  protected onMenuItemSelect(itemId: string): void {
    this.menuItemSelect.emit(itemId);
  }

  protected onEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || this.menuOpenState() || !this.canDismiss()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.onDismiss();
  }

  protected onEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) {
      return;
    }
    const target = event.target;
    if (this.isEnterOwnedByControl(target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.onPrimary();
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

  private isEnterOwnedByControl(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    return !!target.closest(
      [
        'button',
        'a[href]',
        'select',
        'textarea',
        '[role="button"]',
        '[role="menuitem"]',
        '[role="option"]',
        '[contenteditable]:not([contenteditable="false"])',
      ].join(', '),
    );
  }
}
