import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import {
  CX_THEMES,
  CX_THEME_ICONS,
  CX_THEME_LABELS,
  cxThemeStartsGroup,
  isCxThemeMode,
  type CxThemeMode,
} from '../../theme';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import {
  CxMenuComponent,
  CxMenuTriggerDirective,
  type CxMenuItem,
  type CxMenuPresentation,
} from '../../primitives/overlay/cx-menu';

export type CxUtilityBarThemeMode = CxThemeMode;

const THEME_MENU_ITEMS: readonly CxMenuItem[] = CX_THEMES.map((theme, index) => ({
  id: theme.id,
  label: theme.label,
  prependIcon: theme.icon,
  type: 'choice',
  dividerBefore: cxThemeStartsGroup(index),
}));

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
    return CX_THEME_ICONS[mode];
  }

  protected themeTriggerLabel(mode: CxUtilityBarThemeMode): string {
    return `Choose theme. Current theme: ${CX_THEME_LABELS[mode]}.`;
  }

  protected onThemeModeChange(value: string): void {
    if (isCxThemeMode(value)) {
      this.themeModeChange.emit(value);
    }
  }
}
