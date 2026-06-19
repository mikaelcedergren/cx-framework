import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxLayoutAlign, type CxLayoutGap } from '../layout.types';

@Component({
  selector: 'cx-grid',
  host: {
    '[attr.data-columns]': 'normalizedColumns',
    '[attr.data-column-gap]': 'resolvedColumnGap',
    '[attr.data-row-gap]': 'resolvedRowGap',
    '[attr.data-align]': 'align',
  },
  templateUrl: './cx-grid.component.html',
  styleUrl: './cx-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxGridComponent {
  @Input() columns = 3;
  @Input() gap: CxLayoutGap = 'md';
  @Input() columnGap: CxLayoutGap | undefined;
  @Input() rowGap: CxLayoutGap | undefined;
  @Input() align: CxLayoutAlign = 'stretch';

  protected get normalizedColumns(): string {
    const normalizedColumns = Number.isFinite(this.columns)
      ? Math.min(Math.max(Math.floor(this.columns), 1), 12)
      : 3;
    return `${normalizedColumns}`;
  }

  protected get resolvedColumnGap(): CxLayoutGap {
    return this.columnGap ?? this.gap;
  }

  protected get resolvedRowGap(): CxLayoutGap {
    return this.rowGap ?? this.gap;
  }
}
