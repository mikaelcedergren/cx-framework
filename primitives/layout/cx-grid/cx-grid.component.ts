import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxLayoutAlign, type CxLayoutGap } from '../layout.types';

@Component({
  selector: 'cx-grid',
  host: {
    '[attr.data-columns]': 'normalizedColumns',
    '[attr.data-columns-mobile]': 'normalizedColumnsMobile',
    '[attr.data-column-gap]': 'resolvedColumnGap',
    '[attr.data-row-gap]': 'resolvedRowGap',
    '[attr.data-gap-mobile]': 'gapMobile',
    '[attr.data-align]': 'align',
  },
  templateUrl: './cx-grid.component.html',
  styleUrl: './cx-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxGridComponent {
  @Input() columns = 3;
  @Input() columnsMobile: number | undefined;
  @Input() gap: CxLayoutGap = 'md';
  @Input() gapMobile: CxLayoutGap | undefined;
  @Input() columnGap: CxLayoutGap | undefined;
  @Input() rowGap: CxLayoutGap | undefined;
  @Input() align: CxLayoutAlign = 'stretch';

  protected get normalizedColumns(): string {
    const normalizedColumns = Number.isFinite(this.columns)
      ? Math.min(Math.max(Math.floor(this.columns), 1), 12)
      : 3;
    return `${normalizedColumns}`;
  }

  protected get normalizedColumnsMobile(): string | null {
    if (this.columnsMobile == null || !Number.isFinite(this.columnsMobile)) {
      return null;
    }
    return `${Math.min(Math.max(Math.floor(this.columnsMobile), 1), 12)}`;
  }

  protected get resolvedColumnGap(): CxLayoutGap {
    return this.columnGap ?? this.gap;
  }

  protected get resolvedRowGap(): CxLayoutGap {
    return this.rowGap ?? this.gap;
  }
}
