import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import { CxMenuComponent, type CxMenuItem } from '../../overlay/cx-menu';
import { type CxButtonMood, type CxButtonSize, type CxButtonType } from '../cx-button';
import { createDelayedLoadingState } from '../shared/delayed-loading-state';

@Component({
  selector: 'cx-split-button',
  imports: [CxIconComponent, CxMenuComponent, CxSpinnerComponent],
  templateUrl: './cx-split-button.component.html',
  styleUrl: './cx-split-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSplitButtonComponent implements OnDestroy {
  private readonly delayedLoading = createDelayedLoadingState(0);
  private readonly openState = signal(false);
  private readonly itemsState = signal<readonly CxMenuItem[]>([]);

  @Input() text = '';
  @Input() icon: CxIconName | undefined;
  @Input() ariaLabel: string | undefined;
  @Input() type: CxButtonType = 'button';

  @Input()
  public set items(value: readonly CxMenuItem[] | undefined) {
    this.itemsState.set(value ?? []);
  }

  @Input() menuAriaLabel: string | undefined;
  @Input() mood: CxButtonMood = 'default';
  @Input() size: CxButtonSize = 'default';
  @Input() transparent = false;
  @Input() rounded = false;
  @Input() disabled = false;

  @Input()
  public set loading(value: boolean) {
    this.delayedLoading.sync(Boolean(value));
  }

  @Input()
  public set open(value: boolean) {
    this.openState.set(Boolean(value));
  }

  @Output() readonly pressed = new EventEmitter<void>();
  @Output() readonly itemSelect = new EventEmitter<string>();
  @Output() readonly openChange = new EventEmitter<boolean>();

  protected readonly loading$ = this.delayedLoading.loading$;
  protected readonly showSpinner$ = this.delayedLoading.showSpinner$;
  protected readonly open$ = this.openState.asReadonly();
  protected readonly items$ = this.itemsState.asReadonly();

  protected get visibleText(): string {
    return this.text?.trim() ?? '';
  }

  protected get nativeType(): CxButtonType {
    return this.type === 'submit' || this.type === 'reset' ? this.type : 'button';
  }

  protected get mainAriaLabel(): string | null {
    const label = this.ariaLabel?.trim();
    if (label) {
      return label;
    }
    return this.visibleText ? null : 'Button';
  }

  protected get resolvedMenuAriaLabel(): string {
    const label = this.menuAriaLabel?.trim();
    if (label) {
      return label;
    }
    return this.visibleText ? `More actions for ${this.visibleText}` : 'More actions';
  }

  protected get isDisabled(): boolean {
    return this.disabled || this.loading$();
  }

  protected get iconSize(): 12 | 16 | 18 {
    if (this.size === 'small') {
      return 12;
    }
    if (this.size === 'large') {
      return 18;
    }
    return 16;
  }

  protected onMainPressed(): void {
    if (this.isDisabled) {
      return;
    }
    this.pressed.emit();
  }

  protected onOpenChange(open: boolean): void {
    this.openState.set(open);
    this.openChange.emit(open);
  }

  protected onItemSelect(itemId: string): void {
    this.itemSelect.emit(itemId);
  }

  public ngOnDestroy(): void {
    this.delayedLoading.destroy();
  }
}
