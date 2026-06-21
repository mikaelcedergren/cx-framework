import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxBadgeMood = 'default' | 'danger';
export type CxBadgePlacement = 'corner' | 'inline';

const CX_BADGE_MAX_COUNT = 99;

@Component({
  selector: 'cx-badge',
  templateUrl: './cx-badge.component.html',
  styleUrl: './cx-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBadgeComponent {
  @Input() visible = true;
  @Input() placement: CxBadgePlacement = 'corner';
  @Input() count: number | undefined;
  @Input() mood: CxBadgeMood = 'default';
  @Input() ariaLabel: string | undefined;

  protected hasCount(): boolean {
    return this.count !== undefined && Number.isFinite(this.count);
  }

  protected displayValue(): string {
    const count = Math.max(0, Math.floor(this.count ?? 0));
    return count > CX_BADGE_MAX_COUNT ? `${CX_BADGE_MAX_COUNT}+` : `${count}`;
  }

  protected cutoutWidth(): string {
    if (!this.hasCount()) {
      return '8px';
    }
    return `max(14px, calc(${this.displayValue().length}ch + (2 * var(--space-2xs))))`;
  }

  protected cutoutHeight(): string {
    return this.hasCount() ? '14px' : '8px';
  }
}
