import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import { CxMenuComponent, type CxMenuItem } from '../../primitives/overlay/cx-menu';

@Component({
  selector: 'cx-top-bar',
  imports: [CxIconButtonComponent, CxMenuComponent],
  templateUrl: './cx-top-bar.component.html',
  styleUrl: './cx-top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTopBarComponent {
  @Input() heading: string | undefined = 'Page title';
  @Input() description: string | undefined = '';
  @Input() menuItems: readonly CxMenuItem[] | undefined;
  @Input() menuAriaLabel: string | undefined;
  @Input({ transform: booleanAttribute }) editableDescription = false;

  @Output() readonly descriptionChange = new EventEmitter<string>();
  @Output() readonly menuItemSelect = new EventEmitter<string>();

  protected hasDescription(): boolean {
    return (this.description ?? '').trim().length > 0;
  }

  protected hasMenuItems(): boolean {
    return (this.menuItems?.length ?? 0) > 0;
  }

  protected resolvedMenuAriaLabel(): string {
    const label = this.menuAriaLabel?.trim();
    if (label) return label;

    const heading = this.resolvedHeading();
    return heading ? `${heading} actions` : 'Top bar actions';
  }

  protected resolvedHeading(): string {
    return this.heading?.trim() || 'Page title';
  }

  protected onMenuItemSelect(itemId: string): void {
    this.menuItemSelect.emit(itemId);
  }

  protected commitDescription(next: string): void {
    const trimmed = next.trim();
    if (trimmed !== (this.description ?? '').trim()) {
      this.descriptionChange.emit(trimmed);
    }
  }
}
