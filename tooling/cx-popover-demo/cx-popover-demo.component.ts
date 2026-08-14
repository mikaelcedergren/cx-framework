import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch';
import { CxOptionComponent } from '../../primitives/overlay/cx-option';
import { CxOptionGroupComponent } from '../../primitives/overlay/cx-option-group';
import { CxPopoverComponent } from '../../primitives/overlay/cx-popover';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
  type CxFloatingSurfaceViewport,
} from '../../primitives/overlay/floating-surface-controller';
import { type CxFloatingSurfaceAlign } from '../../primitives/overlay/floating-surface';
import { type CxIconName } from '../../icons/manifest';
import { CX_THEMES } from '../../theme';

export type CxPopoverDemoOption = {
  id: string;
  label: string;
  description?: string;
  prependIcon?: CxIconName;
};

export type CxPopoverDemoScenario = 'options' | 'workspace-menu';
type CxPopoverDemoSubmenuId = 'theme';

type CxPopoverDemoSubmenuItem = {
  id: string;
  label: string;
  prependIcon?: CxIconName;
};

type CxPopoverDemoSubmenuSurface = {
  id: CxPopoverDemoSubmenuId;
  left: number;
  top: number;
  maxHeight: number;
};

const CX_POPOVER_DEMO_ROW_HEIGHT = 32;
const CX_POPOVER_DEMO_FRAME_HEIGHT = 8;
const CX_POPOVER_DEMO_MENU_WIDTH = 320;
const CX_POPOVER_DEMO_MENU_HEIGHT = 356;
const CX_POPOVER_DEMO_SUBMENU_WIDTH = 264;
const CX_POPOVER_DEMO_SUBMENU_GAP = 8;
const CX_POPOVER_DEMO_VIEWPORT_PADDING = 8;
const CX_POPOVER_DEMO_SUBMENU_LABELS: Record<CxPopoverDemoSubmenuId, string> = {
  theme: 'Theme',
};
const CX_POPOVER_DEMO_SUBMENU_ITEMS: Record<CxPopoverDemoSubmenuId, readonly CxPopoverDemoSubmenuItem[]> = {
  theme: CX_THEMES.map(theme => ({
    id: theme.id,
    label: theme.label,
    prependIcon: theme.icon,
  })),
};

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function measureSubmenu(anchorRect: DOMRect, itemCount: number): Omit<CxPopoverDemoSubmenuSurface, 'id'> {
  const viewportWidth = typeof window === 'undefined' ? CX_POPOVER_DEMO_SUBMENU_WIDTH : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 480 : window.innerHeight;
  const width = Math.min(CX_POPOVER_DEMO_SUBMENU_WIDTH, Math.max(viewportWidth - CX_POPOVER_DEMO_VIEWPORT_PADDING * 2, 0));
  const estimatedHeight = Math.min(Math.max(itemCount, 1) * 40 + 8, 320);
  const spaceRight = viewportWidth - anchorRect.right - CX_POPOVER_DEMO_VIEWPORT_PADDING - CX_POPOVER_DEMO_SUBMENU_GAP;
  const spaceLeft = anchorRect.left - CX_POPOVER_DEMO_VIEWPORT_PADDING - CX_POPOVER_DEMO_SUBMENU_GAP;
  const openToRight = spaceRight >= width || spaceRight >= spaceLeft;
  const leftBase = openToRight
    ? anchorRect.right + CX_POPOVER_DEMO_SUBMENU_GAP
    : anchorRect.left - width - CX_POPOVER_DEMO_SUBMENU_GAP;
  const left = Math.floor(clamp(leftBase, CX_POPOVER_DEMO_VIEWPORT_PADDING, viewportWidth - width - CX_POPOVER_DEMO_VIEWPORT_PADDING));
  const maxTop = Math.max(
    viewportHeight - Math.min(estimatedHeight, viewportHeight - CX_POPOVER_DEMO_VIEWPORT_PADDING * 2) - CX_POPOVER_DEMO_VIEWPORT_PADDING,
    CX_POPOVER_DEMO_VIEWPORT_PADDING,
  );
  const top = Math.floor(clamp(anchorRect.top, CX_POPOVER_DEMO_VIEWPORT_PADDING, maxTop));

  return {
    left,
    top,
    maxHeight: Math.max(viewportHeight - top - CX_POPOVER_DEMO_VIEWPORT_PADDING, 0),
  };
}

/**
 * Workbench-only host that anchors a real cx-popover to a real trigger, so
 * variants exercise the production sizing and positioning contract instead of
 * a styled stand-in. Not a product component.
 */
@Component({
  selector: 'cx-popover-demo',
  imports: [CxButtonComponent, CxOptionComponent, CxOptionGroupComponent, CxPopoverComponent, CxSwitchComponent],
  templateUrl: './cx-popover-demo.component.html',
  styleUrl: './cx-popover-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxPopoverDemoComponent implements OnDestroy {
  @Input() triggerText = 'Open popover';
  /** Stages narrow or wide triggers to stress the width contract. */
  @Input() triggerWidth: number | undefined;
  @Input() scenario: CxPopoverDemoScenario = 'options';
  @Input() heading: string | undefined;
  /** Rendered into the popover's heading-row slot as a link, not as an input. */
  @Input() description: string | undefined;
  @Input() text: string | undefined;
  @Input() showCheckboxes = false;
  @Input() maxWidth: number | undefined;
  @Input() align: CxFloatingSurfaceAlign = 'start';

  // Normalized: variant hosts (ngComponentOutlet) reset absent inputs to
  // undefined when the selected variant changes.
  private optionsValue: CxPopoverDemoOption[] = [];

  @Input()
  set options(value: CxPopoverDemoOption[] | null | undefined) {
    this.optionsValue = value ?? [];
  }
  get options(): CxPopoverDemoOption[] {
    return this.optionsValue;
  }

  @ViewChild('trigger', { read: ElementRef })
  private triggerRef?: ElementRef<HTMLElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;

  private readonly openState = signal(false);
  private readonly selectedIdsState = signal<ReadonlySet<string>>(new Set());
  private readonly activeSubmenuState = signal<CxPopoverDemoSubmenuSurface | undefined>(undefined);
  private readonly themeSelectionState = signal('night');
  private submenuFocusFrame: number | undefined;
  protected readonly digestEnabled$ = signal(true);
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly activeSubmenu$ = this.activeSubmenuState.asReadonly();
  protected readonly submenuWidth = CX_POPOVER_DEMO_SUBMENU_WIDTH;
  protected readonly overlay = new CxFloatingSurfaceController(
    (rect, viewport) => this.measureOverlay(rect, viewport),
    () => this.popoverRef?.surfaceElement(),
  );

  ngOnDestroy(): void {
    this.overlay.destroy();
    this.cancelSubmenuFocus();
  }

  protected toggleOpen(): void {
    if (this.openState()) {
      this.close();
      return;
    }
    this.closeSubmenu();
    this.openState.set(true);
    queueMicrotask(() => {
      this.overlay.sync(this.triggerRef?.nativeElement);
    });
  }

  protected close(): void {
    this.openState.set(false);
    this.closeSubmenu();
    this.overlay.resetMeasurement();
  }

  protected onOptionClick(option: CxPopoverDemoOption): void {
    if (!this.showCheckboxes) {
      this.close();
      return;
    }
    const next = new Set(this.selectedIdsState());
    if (next.has(option.id)) {
      next.delete(option.id);
    } else {
      next.add(option.id);
    }
    this.selectedIdsState.set(next);
  }

  protected isSelected(optionId: string): boolean {
    return this.selectedIdsState().has(optionId);
  }

  protected submenuState(submenuId: CxPopoverDemoSubmenuId): 'open' | 'closed' {
    return this.activeSubmenuState()?.id === submenuId ? 'open' : 'closed';
  }

  protected openSubmenu(submenuId: CxPopoverDemoSubmenuId, anchor: HTMLElement): void {
    if (!this.openState() || this.scenario !== 'workspace-menu') {
      return;
    }
    this.activeSubmenuState.set({
      id: submenuId,
      ...measureSubmenu(anchor.getBoundingClientRect(), CX_POPOVER_DEMO_SUBMENU_ITEMS[submenuId].length),
    });
  }

  protected openSubmenuFromClick(submenuId: CxPopoverDemoSubmenuId, anchor: HTMLElement, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.openSubmenu(submenuId, anchor);
  }

  protected openSubmenuFromKeyboard(submenuId: CxPopoverDemoSubmenuId, anchor: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.openSubmenu(submenuId, anchor);
    this.focusFirstSubmenuItem(submenuId);
  }

  protected closeSubmenu(): void {
    this.cancelSubmenuFocus();
    this.activeSubmenuState.set(undefined);
  }

  protected submenuItems(submenuId: CxPopoverDemoSubmenuId): readonly CxPopoverDemoSubmenuItem[] {
    return CX_POPOVER_DEMO_SUBMENU_ITEMS[submenuId];
  }

  protected submenuAriaLabel(submenuId: CxPopoverDemoSubmenuId): string {
    return `${CX_POPOVER_DEMO_SUBMENU_LABELS[submenuId]} submenu`;
  }

  protected submenuSurfaceId(submenuId: CxPopoverDemoSubmenuId): string {
    return `cx-popover-demo-${submenuId}-submenu`;
  }

  protected isSubmenuItemSelected(submenuId: CxPopoverDemoSubmenuId, itemId: string): boolean {
    return this.themeSelectionState() === itemId;
  }

  protected selectSubmenuItem(submenuId: CxPopoverDemoSubmenuId, itemId: string): void {
    this.themeSelectionState.set(itemId);
    this.close();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.openState()) {
      this.overlay.sync();
      this.closeSubmenu();
    }
  }

  private focusFirstSubmenuItem(submenuId: CxPopoverDemoSubmenuId): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.cancelSubmenuFocus();
    this.submenuFocusFrame = window.requestAnimationFrame(() => {
      this.submenuFocusFrame = undefined;
      const surface = document.getElementById(this.submenuSurfaceId(submenuId));
      surface?.querySelector<HTMLElement>('.cx-option:not(:disabled)')?.focus();
    });
  }

  private cancelSubmenuFocus(): void {
    if (typeof window !== 'undefined' && this.submenuFocusFrame !== undefined) {
      window.cancelAnimationFrame(this.submenuFocusFrame);
    }
    this.submenuFocusFrame = undefined;
  }

  private measureOverlay(rect: DOMRect, viewport: CxFloatingSurfaceViewport): CxFloatingSurfaceRequest {
    if (this.scenario === 'workspace-menu') {
      const viewportWidth = Math.max(viewport.width - 16, rect.width);
      const menuWidth = Math.min(CX_POPOVER_DEMO_MENU_WIDTH, viewportWidth);

      const estimatedHeight = CX_POPOVER_DEMO_MENU_HEIGHT + CX_POPOVER_DEMO_FRAME_HEIGHT;

      return {
        width: menuWidth,
        minWidth: menuWidth,
        estimatedHeight,
        align: this.align,
        maxHeightCap: estimatedHeight,
      };
    }

    // The heading row exists only when there is a heading; the slot rides in it.
    const headerHeight = this.heading ? CX_POPOVER_DEMO_ROW_HEIGHT : 0;
    const textHeight = this.text ? 96 : 0;
    const estimatedContentHeight = Math.min(
      headerHeight + textHeight + this.options.length * CX_POPOVER_DEMO_ROW_HEIGHT,
      360,
    );
    const estimatedHeight = estimatedContentHeight + CX_POPOVER_DEMO_FRAME_HEIGHT;
    return {
      width: rect.width,
      minWidth: rect.width,
      estimatedHeight: Math.max(estimatedHeight, CX_POPOVER_DEMO_ROW_HEIGHT + CX_POPOVER_DEMO_FRAME_HEIGHT),
      align: this.align,
      maxHeightCap: Math.max(estimatedHeight, CX_POPOVER_DEMO_ROW_HEIGHT + CX_POPOVER_DEMO_FRAME_HEIGHT),
    };
  }
}
