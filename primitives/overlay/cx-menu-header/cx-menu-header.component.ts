import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'cx-menu-header',
  templateUrl: './cx-menu-header.component.html',
  styleUrl: './cx-menu-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxMenuHeaderComponent {
  readonly heading = input<string | undefined>('Menu');

  protected readonly headingText = computed(() => this.heading()?.trim() ?? '');
}
