import { A11yModule, CdkTrapFocus, InteractivityChecker } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  CxButtonComponent,
  type CxButtonMood,
} from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { eventMatchesShortcut } from '../../actions/shared/shortcuts';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key';
import { isHostVisible } from '../../shared/host-visibility';
import { CxMenuComponent, CxMenuTriggerDirective, type CxMenuItem } from '../cx-menu';
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
    A11yModule,
    CxButtonComponent,
    CxIconButtonComponent,
    CxMenuComponent,
    CxMenuTriggerDirective,
    CxShortcutKeyComponent,
  ],
  templateUrl: './cx-dialog.component.html',
  styleUrl: './cx-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDialogComponent implements OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly interactivityChecker = inject(InteractivityChecker);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly openState = signal(false);
  private readonly menuOpenState = signal(false);
  private openInput = false;
  private overlayHandle?: CxOverlayStateHandle;
  private dialogElement?: HTMLElement;
  private focusMutationObserver?: MutationObserver;
  private focusPortalObserver?: MutationObserver;
  private focusCheckQueued = false;
  private initialFocusPending = false;
  private readonly documentFocusInListener = () => this.queueFocusOwnershipCheck();

  @ViewChild(CdkTrapFocus)
  private focusTrapDirective?: CdkTrapFocus;

  @ViewChild('dialogRoot', { read: ElementRef })
  private set dialogRootRef(value: ElementRef<HTMLElement> | undefined) {
    this.stopFocusOwnership();
    if (!value) {
      return;
    }

    this.dialogElement = value.nativeElement;
    this.startFocusOwnership(value.nativeElement);
  }

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
  @Input() menuItems: readonly CxMenuItem[] | undefined;
  @Input() menuAriaLabel: string | undefined;

  @Input()
  public set open(value: boolean) {
    this.openInput = Boolean(value);
    this.syncOpen(this.openInput);
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly primary = new EventEmitter<void>();
  @Output() readonly secondary = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();
  @Output() readonly menuItemSelect = new EventEmitter<string>();

  public ngOnChanges(): void {
    this.syncOpen(this.openInput);
  }

  ngOnDestroy(): void {
    this.stopFocusOwnership();
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

  protected hasHeading(): boolean {
    return this.heading.trim().length > 0;
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
    if (!this.dismissOnClickOutside) {
      return;
    }
    this.dismissFromUser();
  }

  protected onBackdropMousedown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
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
    if (
      event.key === 'Tab'
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey
      && this.document.activeElement === this.dialogElement
    ) {
      event.preventDefault();
      event.stopPropagation();
      const focusTrap = this.focusTrapDirective?.focusTrap;
      const moved = event.shiftKey
        ? focusTrap?.focusLastTabbableElement({ preventScroll: true })
        : focusTrap?.focusFirstTabbableElement({ preventScroll: true });
      if (!moved) {
        this.focusDialogFallback();
      }
      return;
    }

    if (event.isComposing || this.menuOpenState()) {
      return;
    }

    if (eventMatchesShortcut(CX_DIALOG_PRIMARY_SHORTCUT, event)) {
      event.preventDefault();
      event.stopPropagation();
      this.onPrimary();
    }
  }

  private closeFromUser(): void {
    this.openInput = false;
    this.syncOpen(false);
    this.openChange.emit(false);
  }

  private syncOpen(nextOpen: boolean): void {
    if (this.openState() === nextOpen) {
      return;
    }

    if (nextOpen) {
      this.overlayHandle = this.overlayState.capture({
        surface: () => this.dialogElement?.parentElement ?? undefined,
        isActive: () => this.openState() && isHostVisible(this.dialogElement),
        onEscape: () => this.onEscape(),
      });
    } else {
      this.releaseOverlay();
    }

    this.openState.set(nextOpen);
  }

  private onEscape(): void {
    if (this.menuOpenState()) {
      return;
    }
    if (this.variant === 'confirm') {
      this.onSecondary();
      return;
    }
    if (this.canDismiss()) {
      this.onDismiss();
    }
  }

  private startFocusOwnership(dialogElement: HTMLElement): void {
    this.initialFocusPending = true;
    this.document.addEventListener('focusin', this.documentFocusInListener, true);

    if (typeof MutationObserver !== 'undefined') {
      this.focusMutationObserver = new MutationObserver(() => this.queueFocusOwnershipCheck());
      this.focusMutationObserver.observe(dialogElement, {
        attributes: true,
        attributeFilter: [
          'aria-disabled',
          'aria-expanded',
          'aria-hidden',
          'class',
          'contenteditable',
          'disabled',
          'hidden',
          'href',
          'inert',
          'style',
          'tabindex',
          'type',
        ],
        childList: true,
        subtree: true,
      });

      // Framework popovers are direct body portals. Removing their focused
      // surface does not necessarily emit focusin or mutate the dialog tree.
      this.focusPortalObserver = new MutationObserver(() => this.queueFocusOwnershipCheck());
      this.focusPortalObserver.observe(this.document.body, { childList: true });
    }

    queueMicrotask(() => this.focusInitialTarget(dialogElement));
  }

  private stopFocusOwnership(): void {
    this.focusMutationObserver?.disconnect();
    this.focusMutationObserver = undefined;
    this.focusPortalObserver?.disconnect();
    this.focusPortalObserver = undefined;
    this.document.removeEventListener('focusin', this.documentFocusInListener, true);
    this.dialogElement = undefined;
    this.focusCheckQueued = false;
    this.initialFocusPending = false;
  }

  private focusInitialTarget(dialogElement: HTMLElement): void {
    if (this.dialogElement !== dialogElement) {
      return;
    }

    this.initialFocusPending = false;
    if (!this.canOwnFocus(dialogElement)) {
      return;
    }
    if (!this.hasValidOwnedFocus(dialogElement)) {
      this.rehomeFocus();
    }
  }

  private queueFocusOwnershipCheck(): void {
    if (this.focusCheckQueued) {
      return;
    }
    this.focusCheckQueued = true;
    queueMicrotask(() => {
      this.focusCheckQueued = false;
      if (!this.initialFocusPending) {
        this.ensureFocusOwnership();
      }
    });
  }

  private ensureFocusOwnership(): void {
    const dialogElement = this.dialogElement;
    if (
      !dialogElement
      || !this.canOwnFocus(dialogElement)
      || this.hasValidOwnedFocus(dialogElement)
    ) {
      return;
    }
    this.rehomeFocus();
  }

  private rehomeFocus(): void {
    const dialogElement = this.dialogElement;
    if (!dialogElement || !this.canOwnFocus(dialogElement)) {
      return;
    }

    const focusTrap = this.focusTrapDirective?.focusTrap;
    const moved = focusTrap?.focusInitialElement({ preventScroll: true });
    if (!moved || !this.hasValidOwnedFocus(dialogElement)) {
      this.focusDialogFallback();
    }
  }

  private focusDialogFallback(): void {
    this.dialogElement?.focus({ preventScroll: true });
  }

  private canOwnFocus(dialogElement: HTMLElement): boolean {
    return (
      this.openState()
      && this.overlayState.isTopmost(this.overlayHandle)
      && isHostVisible(dialogElement)
    );
  }

  private hasValidOwnedFocus(dialogElement: HTMLElement): boolean {
    const activeElement = this.document.activeElement;
    if (
      typeof HTMLElement === 'undefined'
      || !(activeElement instanceof HTMLElement)
      || !dialogElement.contains(activeElement)
    ) {
      return false;
    }
    if (
      activeElement.matches(':disabled')
      || activeElement.closest('[aria-disabled="true"], [aria-hidden="true"], [hidden], [inert]')
    ) {
      return false;
    }
    return this.interactivityChecker.isFocusable(activeElement);
  }

  private releaseOverlay(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }
}
