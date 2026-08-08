import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CxTooltipPosition } from './cx-tooltip.directive';

@Component({
  selector: 'cx-tooltip-surface',
  templateUrl: './cx-tooltip-surface.component.html',
  styleUrl: './cx-tooltip-surface.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTooltipSurfaceComponent {
  readonly tooltipId = input('');
  readonly text = input('');
  readonly placement = input<CxTooltipPosition>('top');
  readonly hovered = output<boolean>();
}
