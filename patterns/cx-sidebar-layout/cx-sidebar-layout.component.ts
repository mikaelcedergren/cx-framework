import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxSidebarLayoutPlacement = 'start' | 'end';

@Component({
  selector: 'cx-sidebar-layout',
  host: {
    '[attr.data-placement]': 'placement',
  },
  templateUrl: './cx-sidebar-layout.component.html',
  styleUrl: './cx-sidebar-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSidebarLayoutComponent {
  private placementValue: CxSidebarLayoutPlacement = 'end';

  /** Side occupied by the sidebar on wide layouts. */
  @Input()
  set placement(value: CxSidebarLayoutPlacement) {
    if (value !== 'start' && value !== 'end') {
      throw new Error(
        '[cx-sidebar-layout] placement must be "start" or "end".',
      );
    }
    this.placementValue = value;
  }
  get placement(): CxSidebarLayoutPlacement {
    return this.placementValue;
  }
}
