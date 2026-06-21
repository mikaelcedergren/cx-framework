import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent, type CxButtonMood } from '../../primitives/actions/cx-button';
import { CxSpinnerComponent } from '../../primitives/feedback/cx-spinner';
import { CxIconComponent } from '../../primitives/media/cx-icon';

export type CxEmptyStateType = 'default' | 'pending' | 'success' | 'scheduled' | 'danger';
export type CxEmptyStateVisual = 'icon' | 'none';

export interface CxEmptyStateAction {
  readonly text: string;
  readonly mood?: CxButtonMood;
  readonly icon?: CxIconName;
  readonly appendIcon?: CxIconName;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly ariaLabel?: string;
  readonly transparent?: boolean;
}

const CX_EMPTY_STATE_PRESETS: Record<Exclude<CxEmptyStateType, 'default'>, {
  heading: string;
  text: string;
  icon: CxIconName;
}> = {
  pending: {
    heading: 'Working on it',
    text: "Hold tight while we get this ready. We'll let you know when it's done.",
    icon: 'spinner',
  },
  success: {
    heading: 'All done',
    text: 'Everything went through. You can move on to the next step.',
    icon: 'check',
  },
  scheduled: {
    heading: 'Scheduled',
    text: 'This will run automatically at the scheduled time. You can cancel it if plans change.',
    icon: 'schedule',
  },
  danger: {
    heading: 'Something went wrong',
    text: 'Try again, or reach out to support if it keeps happening.',
    icon: 'error',
  },
};

const CX_EMPTY_STATE_TYPE_ACTIONS: Partial<Record<CxEmptyStateType, CxEmptyStateAction>> = {
  success: { text: 'Continue', transparent: true },
  danger: { text: 'Try again', transparent: true },
};

@Component({
  selector: 'cx-empty-state',
  imports: [CxButtonComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-empty-state.component.html',
  styleUrl: './cx-empty-state.component.scss',
  host: {
    role: 'status',
    '[class.cx-empty-state-host--success]': 'type === "success"',
    '[class.cx-empty-state-host--scheduled]': 'type === "scheduled"',
    '[class.cx-empty-state-host--danger]': 'type === "danger"',
    '[attr.title]': 'null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxEmptyStateComponent {
  private iconInputBound = false;
  private iconValue: CxIconName | undefined;

  @Input() heading = '';
  @Input() text: string | undefined;
  @Input() action: CxEmptyStateAction | undefined;
  @Input() secondaryAction: CxEmptyStateAction | undefined;
  @Input() type: CxEmptyStateType = 'default';
  @Input() visual: CxEmptyStateVisual = 'icon';
  @Input() customContent = false;

  @Input()
  public set icon(icon: CxIconName | undefined) {
    this.iconInputBound = true;
    this.iconValue = icon;
  }

  @Output('action') readonly actionEmitter = new EventEmitter<CxEmptyStateAction>();
  @Output('secondaryAction') readonly secondaryActionEmitter = new EventEmitter<CxEmptyStateAction>();

  protected get resolvedIcon(): CxIconName | undefined {
    if (this.iconInputBound) {
      return this.iconValue;
    }
    const preset = this.resolvedPreset;
    if (preset) {
      return preset.icon;
    }
    return 'placeholder';
  }

  protected get resolvedHeading(): string {
    const heading = this.heading.trim();
    if (heading) {
      return heading;
    }
    const preset = this.resolvedPreset;
    return preset?.heading ?? '';
  }

  protected get resolvedText(): string {
    const text = this.text?.trim();
    if (text) {
      return text;
    }
    const preset = this.resolvedPreset;
    return preset?.text ?? '';
  }

  protected get hasHeading(): boolean {
    return this.resolvedHeading.length > 0;
  }

  protected get hasText(): boolean {
    return this.resolvedText.length > 0;
  }

  protected get showSpinner(): boolean {
    return this.visual === 'icon' && this.type === 'pending';
  }

  protected get showIcon(): boolean {
    return this.visual === 'icon' && !this.showSpinner && this.resolvedIcon !== undefined;
  }

  protected get visibleAction(): CxEmptyStateAction | undefined {
    return this.visibleActionFor(this.action) ?? this.visibleActionFor(CX_EMPTY_STATE_TYPE_ACTIONS[this.type]);
  }

  protected get visibleSecondaryAction(): CxEmptyStateAction | undefined {
    return this.visibleActionFor(this.secondaryAction);
  }

  protected hasActions(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
  }

  private get resolvedPreset(): typeof CX_EMPTY_STATE_PRESETS[keyof typeof CX_EMPTY_STATE_PRESETS] | undefined {
    if (this.type === 'default') {
      return undefined;
    }
    return CX_EMPTY_STATE_PRESETS[this.type];
  }

  private visibleActionFor(action: CxEmptyStateAction | undefined): CxEmptyStateAction | undefined {
    return action?.text.trim() ? action : undefined;
  }

  protected resolveActionMood(action: CxEmptyStateAction): CxButtonMood {
    return action.mood ?? 'default';
  }

  protected isActionTransparent(action: CxEmptyStateAction): boolean {
    return action.transparent ?? true;
  }

  protected onActionPressed(action: CxEmptyStateAction): void {
    this.actionEmitter.emit(action);
  }

  protected onSecondaryActionPressed(action: CxEmptyStateAction): void {
    this.secondaryActionEmitter.emit(action);
  }
}
