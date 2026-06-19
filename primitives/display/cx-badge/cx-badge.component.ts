import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxBadgeMood = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type CxBadgePlacement = 'corner' | 'inline';

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
  @Input() mood: CxBadgeMood = 'primary';
  @Input() maxCount = 99;
  @Input() ariaLabel: string | undefined;

  protected hasCount(): boolean {
    return this.count !== undefined && Number.isFinite(this.count);
  }

  protected displayValue(): string {
    const count = Math.max(0, Math.floor(this.count ?? 0));
    const cap = Number.isFinite(this.maxCount) && this.maxCount > 0 ? Math.floor(this.maxCount) : 99;
    return count > cap ? `${cap}+` : `${count}`;
  }
}
