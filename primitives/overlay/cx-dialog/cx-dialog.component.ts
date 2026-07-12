import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';
import {
  CxButtonComponent,
  type CxButtonMood,
} from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { eventMatchesShortcut } from '../../actions/shared/shortcuts';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key';
import { CxMenuComponent, type CxMenuItem } from '../cx-menu';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

let cxDialogId = 0;
const CX_DIALOG_PRIMARY_SHORTCUT = ['Mod', 'Enter'] as const;
const CX_DIALOG_SECONDARY_SHORTCUT = ['Esc'] as const;

export type CxDialogVariant = 'confirm' | 'info';
export type CxDialogMood = CxButtonMood;
export type CxDialogSize = 'small' | 'default' | 'large';

@Component({
  selector: 'cx-dialog',
  imports: [
    CommonModule,
    A11yModule,
    CxButtonComponent,
    CxIconButtonComponent,
    CxMenuComponent,
    CxShortcutKeyComponent,
  ],
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
  protected readonly descriptionId = `cx-dialog-description-${cxDialogId}`;
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly primaryShortcutParts = CX_DIALOG_PRIMARY_SHORTCUT;
  protected readonly secondaryShortcutParts = CX_DIALOG_SECONDARY_SHORTCUT;
  protected readonly primaryShortcutAria = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
    ? 'Meta+Enter'
    : 'Control+Enter';

  @Input() variant: CxDialogVariant = 'info';
  @Input() size: CxDialogSize = 'default';
  @Input() dismissible = false;
  @Input() dismissOnClickOutside = false;
  @Input() heading = '';
  @Input() description = '';
  @Input() primaryText = '';
  @Input() primaryDisabled = false;
  @Input() primaryLoading = false;
  @Input() mood: CxDialogMood = 'primary';
  @Input() secondaryText = '';
  @Input() closeOnPrimary = true;
  @Input() closeOnSecondary = true;
  @Input() menu = false;
  @Input() menuItems: readonly CxMenuItem[] | undefined;
  @Input() menuAriaLabel: string | undefined;

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

  protected showPrimaryShortcut(): boolean {
    return !this.primaryDisabled && !this.primaryLoading;
  }

  protected dialogShortcutAria(): string | null {
    const shortcuts: string[] = [];
    if (this.variant === 'confirm' || this.canDismiss()) {
      shortcuts.push('Escape');
    }
    if (this.showPrimaryShortcut()) {
      shortcuts.push(this.primaryShortcutAria);
    }
    return shortcuts.length > 0 ? shortcuts.join(' ') : null;
  }

  protected hasDescription(): boolean {
    return this.description.trim().length > 0;
  }

  protected hasMenuItems(): boolean {
    return this.menu && (this.menuItems?.length ?? 0) > 0;
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
    if (!this.dismissOnClickOutside) {
      return;
    }
    this.dismissFromUser();
  }

  protected onDismiss(): void {
    if (!this.canDismiss()) {
      return;
    }
    this.dismissFromUser();
  }

  private dismissFromUser(): void {
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

  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.isComposing || this.menuOpenState()) {
      return;
    }

    if (
      event.key === 'Escape'
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey
      && !event.shiftKey
    ) {
      if (this.variant === 'confirm') {
        event.preventDefault();
        event.stopPropagation();
        this.onSecondary();
        return;
      }
      if (this.canDismiss()) {
        event.preventDefault();
        event.stopPropagation();
        this.onDismiss();
      }
      return;
    }

    if (eventMatchesShortcut(CX_DIALOG_PRIMARY_SHORTCUT, event)) {
      event.preventDefault();
      event.stopPropagation();
      this.onPrimary();
    }
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
