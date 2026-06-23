import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { type CxLayoutAlign, type CxLayoutGap, type CxLayoutJustify } from '../layout.types';

@Component({
  selector: 'cx-stack',
  host: {
    '[attr.data-gap]': 'gap',
    '[attr.data-gap-mobile]': 'gapMobile',
    '[attr.data-align]': 'align',
    '[attr.data-justify]': 'justify',
  },
  templateUrl: './cx-stack.component.html',
  styleUrl: './cx-stack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStackComponent {
  @Input() gap: CxLayoutGap = 'md';
  @Input() gapMobile: CxLayoutGap | undefined;
  @Input() align: CxLayoutAlign = 'stretch';
  @Input() justify: CxLayoutJustify = 'start';
}
