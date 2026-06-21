import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxMenuComponent, type CxMenuItem } from '../../primitives/overlay/cx-menu';
import { CxIconComponent } from '../../primitives/media/cx-icon';
import { CxAvatarComponent } from '../../primitives/display/cx-avatar';

const ACCOUNT_CONTROL_MENU_ITEMS: CxMenuItem[] = [
  {
    id: 'logout',
    label: 'Log out',
    prependIcon: 'log-out',
    danger: true,
  },
];

@Component({
  selector: 'cx-account-control',
  imports: [CxMenuComponent, CxIconComponent, CxAvatarComponent],
  templateUrl: './cx-account-control.component.html',
  styleUrl: './cx-account-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxAccountControlComponent {
  private readonly openState = signal(false);
  private readonly menuItemsState = signal<CxMenuItem[]>([]);

  @Input() username = 'Wolfie';
  @Input() disabled = false;

  @Input()
  public set menuItems(value: CxMenuItem[] | undefined) {
    this.menuItemsState.set(value ?? []);
  }

  @Output() readonly logout = new EventEmitter<void>();
  @Output() readonly itemSelect = new EventEmitter<string>();

  protected readonly open$ = this.openState.asReadonly();
  protected readonly resolvedMenuItems$ = computed(() => {
    const menuItems = this.menuItemsState();
    return menuItems.length > 0 ? menuItems : ACCOUNT_CONTROL_MENU_ITEMS;
  });

  protected onOpenChange(open: boolean): void {
    this.openState.set(open);
  }

  protected onItemSelect(itemId: string): void {
    if (itemId === 'logout') {
      this.logout.emit();
      return;
    }
    this.itemSelect.emit(itemId);
  }
}
