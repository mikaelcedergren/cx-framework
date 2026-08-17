import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxLayoutAlign, type CxLayoutGap } from '../layout.types';

@Component({
  selector: 'cx-split',
  host: {
    '[attr.data-gap]': 'gap',
    '[attr.data-gap-mobile]': 'gapMobile',
    '[attr.data-align]': 'align',
    '[attr.data-start-width]': 'startWidth',
    '[attr.data-wrap]': "wrap ? 'wrap' : 'nowrap'",
  },
  templateUrl: './cx-split.component.html',
  styleUrl: './cx-split.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSplitComponent {
  @Input() gap: CxLayoutGap = 'md';
  @Input() gapMobile: CxLayoutGap | undefined;
  @Input() align: CxLayoutAlign = 'center';
  @Input() startWidth: 'auto' | 'sm' | 'md' | 'lg' = 'auto';
  /**
   * Let the end group drop to its own line when it no longer fits beside the
   * start group.
   *
   * Off by default, because a split's whole point is two ends of one line. Turn
   * it on for a header whose end group is controls rather than a button or two:
   * squeezing a search field and a dropdown into the space left over is worse
   * than giving them a row of their own on a narrow screen.
   */
  @Input() wrap = false;
}
