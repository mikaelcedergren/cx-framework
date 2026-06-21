import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxSlotMarkerDisplay = 'inline' | 'block';

@Component({
  selector: 'cx-slot-marker',
  templateUrl: './cx-slot-marker.component.html',
  styleUrl: './cx-slot-marker.component.scss',
  host: {
    '[class.cx-slot-marker-host--block]': 'display === "block"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSlotMarkerComponent {
  @Input() label = 'slot';
  @Input() display: CxSlotMarkerDisplay = 'inline';
}
