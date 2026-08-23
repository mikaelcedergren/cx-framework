import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'cx-labeled-row-group',
  templateUrl: './cx-labeled-row-group.component.html',
  styleUrl: './cx-labeled-row-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The shared label column only reaches direct grid children, and projected
  // rows carry the consumer's encapsulation id rather than this component's.
  // All selectors stay under the cx-labeled-row-group element.
  encapsulation: ViewEncapsulation.None,
})
export class CxLabeledRowGroupComponent {
  @ViewChild('grid', { static: true })
  private gridRef?: ElementRef<HTMLElement>;

  /** True when the element is the grid whose direct rows share this group's label column. */
  isGridElement(element: HTMLElement): boolean {
    return element === this.gridRef?.nativeElement;
  }
}
