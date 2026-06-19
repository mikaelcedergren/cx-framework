import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxLayoutAlign, type CxLayoutGap, type CxLayoutJustify } from '../layout.types';

@Component({
  selector: 'cx-inline',
  host: {
    '[attr.data-gap]': 'gap',
    '[attr.data-align]': 'align',
    '[attr.data-justify]': 'justify',
    '[attr.data-wrap]': "wrap ? 'wrap' : 'nowrap'",
  },
  templateUrl: './cx-inline.component.html',
  styleUrl: './cx-inline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxInlineComponent {
  @Input() gap: CxLayoutGap = 'sm';
  @Input() align: CxLayoutAlign = 'center';
  @Input() justify: CxLayoutJustify = 'start';
  @Input() wrap = false;
}
