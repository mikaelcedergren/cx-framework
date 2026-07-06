import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * A short text label with a light sweeping across it, used to signal active
 * generation or background work (streaming, "thinking", loading). It rests at a
 * readable strength and sweeps a brighter highlight across; both colors are
 * theme tokens, overridable via `--cx-text-shimmer-base` and
 * `--cx-text-shimmer-highlight`. Honours reduced-motion.
 */
@Component({
  selector: 'cx-text-shimmer',
  templateUrl: './cx-text-shimmer.component.html',
  styleUrl: './cx-text-shimmer.component.scss',
  host: {
    role: 'status',
    '[class.cx-text-shimmer--active]': 'active',
    '[attr.aria-label]': 'text || null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTextShimmerComponent {
  /** The label to shimmer. */
  @Input() text = '';

  /** Whether the sweep animates. When false the text sits still at full strength. */
  @Input() active = true;
}
