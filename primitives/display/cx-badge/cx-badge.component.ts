import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  signal,
  type OnChanges,
  type OnDestroy,
  type SimpleChanges,
} from '@angular/core';

export type CxBadgeMood = 'default' | 'accent' | 'success' | 'warning' | 'danger';
export type CxBadgePlacement = 'corner' | 'inline';

const CX_BADGE_MAX_COUNT = 99;

@Component({
  selector: 'cx-badge',
  templateUrl: './cx-badge.component.html',
  styleUrl: './cx-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBadgeComponent implements OnChanges, OnDestroy {
  @Input() visible = true;
  @Input() placement: CxBadgePlacement = 'corner';
  @Input() count: number | undefined;
  @Input() text: string | undefined;
  @Input() mood: CxBadgeMood = 'default';
  @Input() ariaLabel: string | undefined;

  private readonly measuredIndicatorWidth = signal<number | undefined>(undefined);
  private indicatorResizeObserver: ResizeObserver | undefined;
  private invalidValueCombination = false;
  private warnedInvalidValueCombination = false;

  @ViewChild('indicator', { read: ElementRef })
  private set indicatorRef(ref: ElementRef<HTMLElement> | undefined) {
    this.indicatorResizeObserver?.disconnect();
    this.indicatorResizeObserver = undefined;
    this.measuredIndicatorWidth.set(undefined);

    if (!ref || typeof ResizeObserver === 'undefined') {
      return;
    }

    const element = ref.nativeElement;
    this.indicatorResizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }
      const borderBox = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;
      const width = borderBox?.inlineSize ?? element.getBoundingClientRect().width;
      if (Number.isFinite(width) && width > 0 && this.measuredIndicatorWidth() !== width) {
        this.measuredIndicatorWidth.set(width);
      }
    });
    this.indicatorResizeObserver.observe(element);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.validateValueCombination();
  }

  ngOnDestroy(): void {
    this.indicatorResizeObserver?.disconnect();
  }

  protected hasCount(): boolean {
    return this.count !== undefined && Number.isFinite(this.count);
  }

  protected hasText(): boolean {
    return Boolean(this.displayText());
  }

  protected showsIndicator(): boolean {
    return this.visible && !this.invalidValueCombination;
  }

  protected showsCount(): boolean {
    return this.showsIndicator() && this.hasCount();
  }

  protected showsText(): boolean {
    return this.showsIndicator() && !this.hasCount() && this.hasText();
  }

  protected hasValue(): boolean {
    return this.showsCount() || this.showsText();
  }

  protected displayValue(): string {
    const count = Math.max(0, Math.floor(this.count ?? 0));
    return count > CX_BADGE_MAX_COUNT ? `${CX_BADGE_MAX_COUNT}+` : `${count}`;
  }

  protected displayText(): string {
    return this.text?.trim() ?? '';
  }

  protected indicatorWidth(): string {
    const measuredWidth = this.measuredIndicatorWidth();
    if (measuredWidth !== undefined) {
      return `${measuredWidth}px`;
    }
    if (this.showsCount()) {
      return '16px';
    }
    return this.showsText() ? '24px' : '8px';
  }

  protected indicatorHeight(): string {
    return this.hasValue() ? '16px' : '8px';
  }

  protected get cutoutStyles(): {
    image: string;
    position: string;
    size: string;
  } | null {
    if (this.placement !== 'corner' || !this.showsIndicator()) return null;
    const width = Number.parseFloat(this.indicatorWidth());
    const height = Number.parseFloat(this.indicatorHeight());
    const inset = this.hasValue() ? -2 : 0;
    const centerOffset = width / 4 + inset;
    const centerY = height / 4 + inset;
    const straightWidth = width - height;
    const radius = `calc(${height / 2}px + var(--space-xs))`;
    const left = `calc(100% - ${centerOffset + straightWidth / 2}px)`;
    const right = `calc(100% - ${centerOffset - straightWidth / 2}px)`;
    return {
      image: `linear-gradient(#000 0 0), radial-gradient(circle ${radius} at ${left} ${centerY}px, #000 0 calc(100% - 1px), transparent 100%), linear-gradient(#000 0 0), radial-gradient(circle ${radius} at ${right} ${centerY}px, #000 0 calc(100% - 1px), transparent 100%)`,
      position: `0 0, 0 0, right ${centerOffset - straightWidth / 2}px top calc(${centerY}px - ${radius}), 0 0`,
      size: `100% 100%, 100% 100%, ${Math.max(1, straightWidth)}px calc(2 * ${radius}), 100% 100%`,
    };
  }

  private validateValueCombination(): void {
    this.invalidValueCombination = this.hasCount() && this.hasText();
    if (this.invalidValueCombination) {
      if (!this.warnedInvalidValueCombination) {
        console.error(
          '[cx-badge] count and text cannot be used together. Provide one value or leave both empty for a dot.',
        );
        this.warnedInvalidValueCombination = true;
      }
      return;
    }
    this.warnedInvalidValueCombination = false;
  }
}
