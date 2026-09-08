import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { type CxLayoutGap } from '../layout.types';

@Component({
  selector: 'cx-masonry',
  host: {
    '[attr.data-columns]': 'normalizedColumns',
    '[attr.data-columns-mobile]': 'normalizedColumnsMobile',
    '[attr.data-gap]': 'gap',
  },
  templateUrl: './cx-masonry.component.html',
  styleUrl: './cx-masonry.component.scss',
  // Masonry items are projected content, so the break/spacing rules that keep
  // each item whole inside its column cannot be reached from emulated
  // encapsulation. All selectors stay under the cx-masonry element.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMasonryComponent {
  @Input() columns = 3;
  @Input() columnsMobile: number | undefined;
  @Input() gap: CxLayoutGap = 'md';

  protected get normalizedColumns(): string {
    return `${this.clampColumns(this.columns, 3)}`;
  }

  protected get normalizedColumnsMobile(): string {
    if (this.columnsMobile == null || !Number.isFinite(this.columnsMobile)) {
      return '1';
    }
    return `${this.clampColumns(this.columnsMobile, 1)}`;
  }

  private clampColumns(value: number, fallback: number): number {
    return Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), 1), 12) : fallback;
  }
}
