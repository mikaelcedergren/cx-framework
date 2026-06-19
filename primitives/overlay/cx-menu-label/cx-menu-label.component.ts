import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'cx-menu-label',
  templateUrl: './cx-menu-label.component.html',
  styleUrl: './cx-menu-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMenuLabelComponent {
  readonly heading = input<string | undefined>('Section');

  protected readonly headingText = computed(() => this.heading()?.trim() ?? '');
}
