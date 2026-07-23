import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cx-detail-panel-section',
  template: '<ng-content />',
  styleUrl: './cx-detail-panel-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDetailPanelSectionComponent {}
