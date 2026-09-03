import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  afterRenderEffect,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxTagComponent, type CxTagColor } from '../../display/cx-tag';

interface CxTableTagsCellTag {
  label: string;
  color?: CxTagColor;
  outline?: boolean;
}

@Component({
  selector: 'cx-table-tags-cell',
  imports: [CxTagComponent],
  templateUrl: './cx-table-tags-cell.component.html',
  styleUrl: './cx-table-tags-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTableTagsCellComponent {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly tagsState = signal<readonly CxTableTagsCellTag[]>([]);
  private readonly visibleCountState = signal(0);
  private resizeObserver: ResizeObserver | undefined;
  private measurementFrame: number | undefined;

  @Input()
  public set tags(value: readonly CxTableTagsCellTag[] | undefined) {
    this.tagsState.set(value ?? []);
  }

  protected readonly tags$ = this.tagsState.asReadonly();
  protected readonly visibleTags$ = computed(() =>
    this.tagsState().slice(0, this.visibleCountState()),
  );
  protected readonly hiddenTagCount$ = computed(() =>
    Math.max(0, this.tagsState().length - this.visibleCountState()),
  );
  protected readonly hiddenTagCounts$ = computed(() =>
    Array.from({ length: this.tagsState().length }, (_, index) => index + 1),
  );
  protected readonly ariaLabel$ = computed(() =>
    this.tagsState()
      .map(tag => tag.label.trim())
      .filter(Boolean)
      .join(', '),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterRenderEffect(() => {
      this.tagsState();
      this.scheduleMeasurement();
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() =>
        this.scheduleMeasurement(),
      );
      this.resizeObserver.observe(this.host.nativeElement);
    }

    destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      if (this.measurementFrame !== undefined) {
        cancelAnimationFrame(this.measurementFrame);
      }
    });
  }

  private scheduleMeasurement(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }
    if (this.measurementFrame !== undefined) {
      cancelAnimationFrame(this.measurementFrame);
    }
    this.measurementFrame = requestAnimationFrame(() => {
      this.measurementFrame = undefined;
      this.measureVisibleTags();
    });
  }

  private measureVisibleTags(): void {
    const root =
      this.host.nativeElement.querySelector<HTMLElement>('.cx-table-tags');
    const visible = this.host.nativeElement.querySelector<HTMLElement>(
      '.cx-table-tags__visible',
    );
    const measuredTags = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        '.cx-table-tags__measure-tag',
      ),
    );
    const measuredOverflowTags = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        '.cx-table-tags__measure-overflow',
      ),
    );
    const tagCount = this.tagsState().length;

    if (!root || !visible || measuredTags.length !== tagCount) {
      return;
    }
    if (tagCount === 0) {
      this.visibleCountState.set(0);
      return;
    }

    const availableWidth = root.clientWidth;
    if (availableWidth <= 0) {
      this.visibleCountState.set(0);
      return;
    }

    const gap = Number.parseFloat(getComputedStyle(visible).columnGap) || 0;
    const tagWidths = measuredTags.map(tag => tag.getBoundingClientRect().width);
    const completeWidth =
      tagWidths.reduce((sum, width) => sum + width, 0) +
      gap * Math.max(0, tagCount - 1);
    if (completeWidth <= availableWidth + 0.5) {
      this.visibleCountState.set(tagCount);
      return;
    }

    const overflowWidths = new Map(
      measuredOverflowTags.map(tag => [
        Number.parseInt(tag.dataset['hiddenCount'] ?? '', 10),
        tag.getBoundingClientRect().width,
      ]),
    );
    let visibleWidth = 0;
    let nextVisibleCount = 0;
    for (let visibleCount = 0; visibleCount < tagCount; visibleCount += 1) {
      if (visibleCount > 0) {
        visibleWidth += tagWidths[visibleCount - 1] + gap;
      }
      const hiddenCount = tagCount - visibleCount;
      const overflowWidth = overflowWidths.get(hiddenCount);
      if (
        overflowWidth !== undefined &&
        visibleWidth + overflowWidth <= availableWidth + 0.5
      ) {
        nextVisibleCount = visibleCount;
      }
    }
    this.visibleCountState.set(nextVisibleCount);
  }
}
