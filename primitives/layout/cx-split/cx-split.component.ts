import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxLayoutAlign, type CxLayoutGap } from '../layout.types';

@Component({
  selector: 'cx-split',
  host: {
    '[attr.data-gap]': 'gap',
    '[attr.data-gap-mobile]': 'gapMobile',
    '[attr.data-align]': 'align',
    '[attr.data-start-width]': 'startWidth',
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
}
