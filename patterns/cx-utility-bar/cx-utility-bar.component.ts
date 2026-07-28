import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import {
  CxMenuComponent,
  CxMenuTriggerDirective,
  type CxMenuItem,
  type CxMenuPresentation,
} from '../../primitives/overlay/cx-menu';

export type CxUtilityBarThemeMode = 'light' | 'dark' | 'night' | 'high-contrast' | 'wireframe';

const THEME_MENU_ITEMS: readonly CxMenuItem[] = [
  { id: 'light', label: 'Light', prependIcon: 'light-mode', type: 'choice' },
  { id: 'dark', label: 'Dark', prependIcon: 'dark-mode', type: 'choice' },
  { id: 'night', label: 'Night', prependIcon: 'night-mode', type: 'choice' },
  { id: 'high-contrast', label: 'High contrast', prependIcon: 'high-contrast-mode', type: 'choice' },
  { id: 'wireframe', label: 'Wireframe', prependIcon: 'browser-window', type: 'choice' },
];

const THEME_LABELS: Record<CxUtilityBarThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  night: 'Night',
  'high-contrast': 'High contrast',
  wireframe: 'Wireframe',
};

const THEME_ICONS: Record<CxUtilityBarThemeMode, CxIconName> = {
  light: 'light-mode',
  dark: 'dark-mode',
  night: 'night-mode',
  'high-contrast': 'high-contrast-mode',
  wireframe: 'browser-window',
};

function isThemeMode(value: string): value is CxUtilityBarThemeMode {
  return value === 'light'
    || value === 'dark'
    || value === 'night'
    || value === 'high-contrast'
    || value === 'wireframe';
}

@Component({
  selector: 'cx-utility-bar',
  imports: [CxIconButtonComponent, CxMenuComponent, CxMenuTriggerDirective],
  templateUrl: './cx-utility-bar.component.html',
  styleUrl: './cx-utility-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxUtilityBarComponent {
  private static instanceCounter = 0;

  protected readonly headingId = `cx-utility-bar-heading-${++CxUtilityBarComponent.instanceCounter}`;
  protected readonly themeMenuItems = THEME_MENU_ITEMS;
  protected readonly themeMenuPresentation: CxMenuPresentation = { kind: 'trigger' };

  @Input() heading = '';
  @Input({ transform: booleanAttribute }) visible = false;
  @Input() themeMode: CxUtilityBarThemeMode | undefined;

  @Output() readonly themeModeChange = new EventEmitter<CxUtilityBarThemeMode>();

  protected resolvedHeading(): string {
    return this.heading.trim();
  }

  protected themeIcon(mode: CxUtilityBarThemeMode): CxIconName {
    return THEME_ICONS[mode];
  }

  protected themeTriggerLabel(mode: CxUtilityBarThemeMode): string {
    return `Choose theme. Current theme: ${THEME_LABELS[mode]}.`;
  }

  protected onThemeModeChange(value: string): void {
    if (isThemeMode(value)) {
      this.themeModeChange.emit(value);
    }
  }
}
