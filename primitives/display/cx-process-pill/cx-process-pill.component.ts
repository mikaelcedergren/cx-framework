import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export type CxProcessPillMood = 'default' | 'info' | 'success' | 'warning' | 'danger';

/**
 * A single stage in a process. Presentational only — it renders a mood-coloured
 * indicator (icon or dot), a label, and an optional count. The interactive
 * behaviour (selection, keyboard, the move-toward-done logic) lives in
 * `cx-process`, which composes these. Usable standalone as a status legend.
 */
@Component({
  selector: 'cx-process-pill',
  imports: [CxIconComponent],
  templateUrl: './cx-process-pill.component.html',
  styleUrl: './cx-process-pill.component.scss',
  host: {
    class: 'cx-process-pill',
    '[class.cx-process-pill--info]': "mood === 'info'",
    '[class.cx-process-pill--success]': "mood === 'success'",
    '[class.cx-process-pill--warning]': "mood === 'warning'",
    '[class.cx-process-pill--danger]': "mood === 'danger'",
    '[class.cx-process-pill--selected]': 'selected',
    '[class.cx-process-pill--terminal]': 'terminal',
    '[class.cx-process-pill--muted]': 'muted',
    '[class.cx-process-pill--disabled]': 'disabled',
    '[class.cx-process-pill--dense]': 'dense',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxProcessPillComponent {
  /** Stage name. */
  @Input() label = '';
  /** Items currently in this stage. Omitted (undefined) hides the count; `0` is shown — a known empty stage is meaningful. */
  @Input() count: number | undefined;
  /** Semantic colour for the indicator. */
  @Input() mood: CxProcessPillMood = 'default';
  /** Leading icon. When omitted, a mood-coloured dot is shown instead. */
  @Input() icon: CxIconName | undefined;
  /** Active/selected appearance (the rail drives this from the current filter). */
  @Input() selected = false;
  /** Marks a settled, end-of-flow stage (e.g. Fixed, Closed) rather than open work. */
  @Input() terminal = false;
  /** De-emphasised appearance — used by the rail to quiet open stages once nothing is left to handle. */
  @Input() muted = false;
  /** Non-interactive, dimmed appearance. */
  @Input() disabled = false;
  /** Condensed appearance: hides the label, keeping the indicator and count. The rail sets this when the row runs out of room. */
  @Input() dense = false;

  protected hasCount(): boolean {
    return this.count !== undefined && this.count !== null;
  }
}
