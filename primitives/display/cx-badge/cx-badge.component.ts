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
      const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
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

  private validateValueCombination(): void {
    this.invalidValueCombination = this.hasCount() && this.hasText();
    if (this.invalidValueCombination) {
      if (!this.warnedInvalidValueCombination) {
        console.error('[cx-badge] count and text cannot be used together. Provide one value or leave both empty for a dot.');
        this.warnedInvalidValueCombination = true;
      }
      return;
    }
    this.warnedInvalidValueCombination = false;
  }
}
