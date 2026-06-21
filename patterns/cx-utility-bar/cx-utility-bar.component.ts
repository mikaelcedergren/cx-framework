import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import {
  CxButtonComponent,
  type CxButtonMood,
  type CxButtonSize,
} from '../../primitives/actions/cx-button';

export type CxUtilityBarAlignment = 'start' | 'end' | 'space-between';

export interface CxUtilityBarItem {
  readonly id: string;
  readonly text?: string;
  readonly ariaLabel?: string;
  readonly icon?: CxIconName;
  readonly appendIcon?: CxIconName;
  readonly mood?: CxButtonMood;
  readonly disabled?: boolean;
  readonly transparent?: boolean;
}

@Component({
  selector: 'cx-utility-bar',
  imports: [CxButtonComponent],
  templateUrl: './cx-utility-bar.component.html',
  styleUrl: './cx-utility-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxUtilityBarComponent {
  private readonly itemsState = signal<readonly CxUtilityBarItem[]>([]);
  private readonly labelState = signal<string | undefined>(undefined);
  private readonly alignmentState = signal<CxUtilityBarAlignment>('start');

  @Input()
  public set items(value: readonly CxUtilityBarItem[] | null | undefined) {
    this.itemsState.set(value ?? []);
  }

  @Input()
  public set label(value: string | undefined) {
    const trimmed = value?.trim();
    this.labelState.set(trimmed?.length ? trimmed : undefined);
  }

  @Input()
  public set alignment(value: CxUtilityBarAlignment | undefined) {
    this.alignmentState.set(value ?? 'start');
  }

  @Input() size: CxButtonSize = 'default';
  @Input() wrap = false;
  @Input() disabled = false;

  @Output() readonly action = new EventEmitter<string>();

  protected readonly items$ = this.itemsState.asReadonly();
  protected readonly label$ = this.labelState.asReadonly();
  protected readonly alignment$ = this.alignmentState.asReadonly();

  protected onItemPressed(item: CxUtilityBarItem): void {
    if (this.disabled || item.disabled) {
      return;
    }
    this.action.emit(item.id);
  }
}
