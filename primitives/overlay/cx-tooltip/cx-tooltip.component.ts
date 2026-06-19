import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import {
  type ConnectedOverlayPositionChange,
  type ConnectedPosition,
  OverlayModule,
} from '@angular/cdk/overlay';

let cxTooltipId = 0;
const CX_TOOLTIP_DEFAULT_DELAY_MS = 500;

export type CxTooltipDelay = 'default' | 'none';
export type CxTooltipPosition = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'cx-tooltip',
  imports: [OverlayModule],
  templateUrl: './cx-tooltip.component.html',
  styleUrl: './cx-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTooltipComponent implements OnDestroy {
  readonly text = input<string | undefined>(undefined);
  readonly delay = input<CxTooltipDelay>('default');
  readonly disabled = input(false);
  readonly position = input<CxTooltipPosition>('top');

  protected readonly isOpen = signal(false);
  protected readonly activePlacement = signal<'top' | 'right' | 'bottom' | 'left'>('top');
  protected readonly tooltipId = `cx-tooltip-${++cxTooltipId}`;
  protected readonly messageText = computed(() => {
    const text = this.text()?.trim();
    return text && text.length > 0 ? text : '';
  });
  protected readonly positions = computed<ConnectedPosition[]>(() => {
    const allPositions: Record<CxTooltipPosition, ConnectedPosition> = {
      top: {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
      },
      bottom: {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 8,
      },
      right: {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
        offsetX: 8,
      },
      left: {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
        offsetX: -8,
      },
    };
    const preferred = this.position();
    if (!preferred) {
      return [allPositions.top, allPositions.bottom, allPositions.right, allPositions.left];
    }
    return [
      allPositions[preferred],
      ...Object.entries(allPositions)
        .filter(([position]) => position !== preferred)
        .map(([, value]) => value),
    ];
  });

  private openTimer: number | undefined;
  private triggerActive = false;

  constructor() {
    effect(() => {
      if (!this.disabled() && this.messageText().length > 0) {
        return;
      }
      this.triggerActive = false;
      this.clearOpenTimer();
      this.isOpen.set(false);
    });
  }

  ngOnDestroy(): void {
    this.clearOpenTimer();
  }

  protected onTriggerMouseEnter(): void {
    if (this.disabled()) {
      return;
    }
    this.triggerActive = true;
    if (this.delay() === 'none') {
      this.openNow();
      return;
    }
    this.scheduleOpen();
  }

  protected onTriggerFocusIn(): void {
    if (this.disabled()) {
      return;
    }
    this.triggerActive = true;
    this.openNow();
  }

  protected onTriggerLeave(): void {
    this.triggerActive = false;
    this.closeIfIdle();
  }

  protected onPositionChange(event: ConnectedOverlayPositionChange): void {
    this.activePlacement.set(this.resolvePlacement(event.connectionPair));
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.isOpen()) {
      return;
    }
    this.triggerActive = false;
    this.clearOpenTimer();
    this.isOpen.set(false);
  }

  private scheduleOpen(): void {
    this.clearOpenTimer();
    this.activePlacement.set(this.position());
    if (this.disabled() || this.messageText().length === 0) {
      this.isOpen.set(false);
      return;
    }
    this.openTimer = window.setTimeout(() => {
      if (!this.triggerActive) {
        return;
      }
      this.openNow();
    }, CX_TOOLTIP_DEFAULT_DELAY_MS);
  }

  private openNow(): void {
    this.clearOpenTimer();
    this.activePlacement.set(this.position());
    if (this.disabled() || this.messageText().length === 0) {
      this.isOpen.set(false);
      return;
    }
    this.isOpen.set(true);
  }

  private closeIfIdle(): void {
    this.clearOpenTimer();
    if (this.triggerActive) {
      return;
    }
    this.isOpen.set(false);
  }

  private clearOpenTimer(): void {
    if (this.openTimer === undefined) {
      return;
    }
    window.clearTimeout(this.openTimer);
    this.openTimer = undefined;
  }

  private resolvePlacement(position: ConnectedPosition): 'top' | 'right' | 'bottom' | 'left' {
    if (position.originY === 'top' && position.overlayY === 'bottom') {
      return 'top';
    }
    if (position.originY === 'bottom' && position.overlayY === 'top') {
      return 'bottom';
    }
    if (position.originX === 'start' && position.overlayX === 'end') {
      return 'left';
    }
    return 'right';
  }
}
