import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';
import { isHostVisible } from '../../shared/host-visibility';

export interface CxStep {
  name: string;
  badge?: string | number;
  status?: CxStepStatus;
  mood?: CxStepMood;
}

export type CxStepStatus = 'pending' | 'success';
export type CxStepMood = 'default' | 'danger';
export type CxStepsDensity = 'default' | 'compact' | 'auto';
export type CxStepsLayout = 'default' | 'fill';

@Component({
  selector: 'cx-steps',
  imports: [CxIconComponent, CxTooltipDirective],
  templateUrl: './cx-steps.component.html',
  styleUrl: './cx-steps.component.scss',
  host: {
    '[class.cx-steps--compact]': 'isCompact()',
    '[class.cx-steps--auto]': 'density === "auto"',
    '[class.cx-steps--fill]': 'layout === "fill"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStepsComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly compactState = signal(false);
  private resizeObserver?: ResizeObserver;
  private frame?: number;
  private viewReady = false;
  private revealCurrent = true;
  private measureElement?: HTMLElement;

  @ViewChild('viewport', { read: ElementRef }) private viewport?: ElementRef<HTMLElement>;
  @ViewChild('measureList', { read: ElementRef })
  private set measureList(ref: ElementRef<HTMLElement> | undefined) {
    if (this.measureElement) this.resizeObserver?.unobserve(this.measureElement);
    this.measureElement = ref?.nativeElement;
    if (this.measureElement) this.resizeObserver?.observe(this.measureElement);
    this.scheduleLayout();
  }

  public ngAfterViewInit(): void {
    this.viewReady = true;
    this.resizeObserver = new ResizeObserver(() => {
      this.revealCurrent = true;
      this.scheduleLayout();
    });
    this.resizeObserver.observe(this.viewport!.nativeElement);
    if (this.measureElement) this.resizeObserver.observe(this.measureElement);
    this.scheduleLayout();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['index'] || changes['steps'] || changes['density'] || changes['layout']) {
      this.revealCurrent = true;
      this.scheduleLayout();
    }
  }

  public ngOnDestroy(): void {
    this.viewReady = false;
    this.resizeObserver?.disconnect();
    if (this.frame !== undefined) this.document.defaultView?.cancelAnimationFrame(this.frame);
  }

  protected isCompact(): boolean {
    return this.density === 'compact' || (this.density === 'auto' && this.compactState());
  }

  private scheduleLayout(): void {
    const window = this.document.defaultView;
    if (!this.viewReady || !window || this.frame !== undefined) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = undefined;
      this.syncLayout();
    });
  }

  private syncLayout(): void {
    const viewport = this.viewport?.nativeElement;
    if (!viewport || viewport.clientWidth <= 0 || !isHostVisible(viewport)) return;
    if (this.density === 'auto' && this.measureElement) {
      // Measure the full presentation independently of the visible density. Compact
      // must never make itself appear to fit and immediately switch back to full.
      const compact = this.measureElement.getBoundingClientRect().width > viewport.clientWidth + 1;
      if (compact !== this.compactState()) {
        this.compactState.set(compact);
        this.revealCurrent = true;
        this.scheduleLayout();
        return;
      }
    }
    if (!this.revealCurrent) return;
    this.revealCurrent = false;
    const current = viewport.querySelector<HTMLElement>('[aria-current="step"]');
    if (!current) return;
    const marker = current.querySelector<HTMLElement>('.cx-step__number')!.getBoundingClientRect();
    const label = current.querySelector<HTMLElement>('.cx-step__name')!.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    const left = Math.min(marker.left, label.left);
    const right = Math.max(marker.right, label.right);
    // Scroll only this row, never the dialog or the page. For an exceptionally
    // long current label, keep its marker and leading edge visible.
    const rtl = this.document.defaultView!.getComputedStyle(viewport).direction === 'rtl';
    const delta = right - left > viewport.clientWidth
      ? (rtl ? marker.right - bounds.right : marker.left - bounds.left)
      : left < bounds.left ? left - bounds.left : right > bounds.right ? right - bounds.right : 0;
    if (delta) viewport.scrollBy({ left: delta, behavior: 'instant' });
  }

  private readonly stepsState = signal<readonly CxStep[]>([]);

  @Input()
  public set steps(value: readonly CxStep[] | undefined) {
    this.stepsState.set(this.normalizeSteps(value));
  }

  public get steps(): readonly CxStep[] {
    return this.stepsState();
  }

  @Input() index = 0;
  @Input() density: CxStepsDensity = 'default';
  @Input() layout: CxStepsLayout = 'default';

  protected readonly steps$ = this.stepsState.asReadonly();

  protected currentIndex(): number {
    if (this.steps.length === 0) {
      return -1;
    }

    const index = Number.isFinite(this.index) ? Math.trunc(this.index) : 0;
    return Math.max(0, Math.min(index, this.steps.length));
  }

  protected isCurrent(index: number): boolean {
    return index === this.currentIndex();
  }

  protected isCompleted(step: CxStep, index: number): boolean {
    return !this.isPending(step) && (step.status === 'success' || index < this.currentIndex());
  }

  protected labelIsVisible(index: number): boolean {
    return !this.isCompact() || this.isCurrent(index);
  }

  protected isDanger(step: CxStep): boolean {
    return step.mood === 'danger';
  }

  protected isPending(step: CxStep): boolean {
    return step.status === 'pending';
  }

  /**
   * The label a step would have shown at default density, for the tooltip that
   * stands in for it while compact. Includes the badge, since the badge is part
   * of the visible label the tooltip is replacing.
   */
  protected stepTooltip(step: CxStep): string {
    const badge = this.badgeText(step);
    return badge ? `${step.name} (${badge})` : step.name;
  }

  protected badgeText(step: CxStep): string {
    if (typeof step.badge === 'number') {
      return Number.isFinite(step.badge) ? String(step.badge) : '';
    }
    return step.badge?.trim() ?? '';
  }

  protected stepStatus(step: CxStep, index: number): string {
    const sequenceStatus = this.isCurrent(index)
      ? 'Current'
      : this.isPending(step)
        ? 'Pending'
        : this.isCompleted(step, index)
          ? 'Completed'
          : 'Upcoming';
    return [
      sequenceStatus,
      this.isCurrent(index) && this.isPending(step) ? 'pending' : '',
      this.isCurrent(index) && step.status === 'success' ? 'completed' : '',
      this.isDanger(step) ? 'needs attention' : '',
    ].filter(Boolean).join(', ');
  }

  private normalizeSteps(value: readonly CxStep[] | undefined): readonly CxStep[] {
    return (value ?? []).map(step => {
      const name = step?.name?.trim() ?? '';
      return { ...step, name };
    });
  }
}
