import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent, type CxButtonMood, type CxButtonVariant } from '../../primitives/actions/cx-button';
import { CxBreadcrumbsComponent, type CxBreadcrumbItem } from '../../primitives/navigation/cx-breadcrumbs';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxLoader, CxLoaderComponent } from '../../primitives/feedback/cx-loader';
import { CxMenuComponent, type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxTabsComponent, type CxTabItem } from '../../primitives/navigation/cx-tabs';

export interface CxTopbarAction {
  id: string;
  text?: string;
  icon?: CxIconName;
  variant?: CxButtonVariant;
  mood?: CxButtonMood;
  disabled?: boolean;
  priority?: 'primary' | 'default';
}

@Component({
  selector: 'cx-topbar',
  imports: [CxBreadcrumbsComponent, CxButtonComponent, CxIconButtonComponent, CxLoaderComponent, CxMenuComponent, CxTabsComponent],
  templateUrl: './cx-topbar.component.html',
  styleUrl: './cx-topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTopbarComponent {
  private readonly breadcrumbsState = signal<CxBreadcrumbItem[]>([]);
  private readonly tabsState = signal<CxTabItem[]>([]);
  private readonly selectedTabState = signal<string | undefined>(undefined);
  private readonly actionsState = signal<CxTopbarAction[]>([]);
  private readonly menuOpenState = signal(false);

  @Input() loading = false;
  @Input() navbarVisible = true;
  @Input() embedded = false;

  @Input()
  public set breadcrumbs(value: CxBreadcrumbItem[] | undefined) {
    this.breadcrumbsState.set((value ?? []).filter(item => item?.id && item?.label));
  }

  @Input()
  public set tabs(value: CxTabItem[] | undefined) {
    this.tabsState.set((value ?? []).filter(item => item?.id && item?.label));
  }

  @Input()
  public set selectedTab(value: string | undefined) {
    this.selectedTabState.set(value);
  }

  @Input()
  public set actions(value: CxTopbarAction[] | undefined) {
    this.actionsState.set((value ?? []).filter(action => !!action?.id));
  }

  @Output() readonly breadcrumbSelect = new EventEmitter<string>();
  @Output() readonly tabSelect = new EventEmitter<string>();
  @Output() readonly action = new EventEmitter<string>();
  @Output() readonly navbarShow = new EventEmitter<void>();

  protected readonly breadcrumbLoader = CxLoader.ofBlocks(1, 1, '32').withMargin('0');
  protected readonly actionLoader = CxLoader.ofBlocks(1, 1, '32').withMargin('0');
  protected readonly menuOpen$ = this.menuOpenState.asReadonly();
  protected readonly breadcrumbs$ = computed(() => {
    const items = this.breadcrumbsState();
    return this.embedded && items.length > 1 ? items.slice(1) : items;
  });
  protected readonly tabs$ = this.tabsState.asReadonly();
  protected readonly selectedTab$ = computed(() => {
    const selectedTab = this.selectedTabState();
    if (selectedTab && this.tabsState().some(item => item.id === selectedTab)) {
      return selectedTab;
    }
    return this.tabsState()[0]?.id;
  });
  protected readonly primaryActions$ = computed(() => this.actionsState().filter(item => item.priority === 'primary'));
  protected readonly contextMenuItems$ = computed<CxMenuItem[]>(() =>
    this.actionsState()
      .filter(item => item.priority !== 'primary')
      .map(item => ({
        id: item.id,
        label: item.text ?? item.id,
        prependIcon: item.icon,
        disabled: item.disabled,
        danger: item.mood === 'danger',
      })),
  );
  protected readonly hasContextMenu$ = computed(() => this.contextMenuItems$().length > 0);

  protected onBreadcrumbSelect(itemId: string): void {
    this.breadcrumbSelect.emit(itemId);
  }

  protected onTabSelect(itemId: string): void {
    this.selectedTabState.set(itemId);
    this.tabSelect.emit(itemId);
  }

  protected onNavbarShow(): void {
    this.navbarShow.emit();
  }

  protected onMenuOpenChange(value: boolean): void {
    this.menuOpenState.set(value);
  }

  protected onAction(actionId: string): void {
    this.action.emit(actionId);
  }
}
