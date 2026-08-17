import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * A short text label with a light sweeping across it, used to signal active
 * generation or background work (streaming, "thinking", loading). It rests at a
 * readable strength and sweeps a brighter highlight across using the system
 * color tokens. A static base paint always remains underneath the highlight,
 * and reduced-motion removes the highlight entirely.
 */
@Component({
  selector: 'cx-text-shimmer',
  templateUrl: './cx-text-shimmer.component.html',
  styleUrl: './cx-text-shimmer.component.scss',
  host: {
    role: 'status',
    '[class.cx-text-shimmer--active]': 'active',
    '[attr.aria-label]': 'visibleText$() || null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTextShimmerComponent {
  /** The label to shimmer. */
  @Input() text = '';

  /** Whether the highlight sweeps. When false the readable base label remains still. */
  @Input() active = true;

  protected visibleText$(): string {
    return this.text.trim();
  }

}
