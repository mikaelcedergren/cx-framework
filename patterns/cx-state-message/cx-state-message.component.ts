import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent, type CxButtonMood } from '../../primitives/actions/cx-button';
import { CxSpinnerComponent } from '../../primitives/feedback/cx-spinner';
import { CxIconComponent } from '../../primitives/media/cx-icon';

export type CxStateMessageState = 'default' | 'pending' | 'success' | 'scheduled' | 'danger';
export type CxStateMessageVisual = 'icon' | 'none';
export type CxStateMessageLayout = 'vertical' | 'horizontal';

export interface CxStateMessageAction {
  readonly text: string;
  readonly mood?: CxButtonMood;
  readonly icon?: CxIconName;
  readonly appendIcon?: CxIconName;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly ariaLabel?: string;
  readonly transparent?: boolean;
}

const CX_STATE_MESSAGE_PRESETS: Record<Exclude<CxStateMessageState, 'default'>, {
  heading: string;
  description: string;
  icon: CxIconName;
}> = {
  pending: {
    heading: 'Working on it',
    description: "Hold tight while we get this ready. We'll let you know when it's done.",
    icon: 'spinner',
  },
  success: {
    heading: 'All done',
    description: 'Everything went through. You can move on to the next step.',
    icon: 'check',
  },
  scheduled: {
    heading: 'Scheduled',
    description: 'This will run automatically at the scheduled time. You can cancel it if plans change.',
    icon: 'schedule',
  },
  danger: {
    heading: 'Something went wrong',
    description: 'Try again, or reach out to support if it keeps happening.',
    icon: 'error',
  },
};

const CX_STATE_MESSAGE_STATE_ACTIONS: Partial<Record<CxStateMessageState, CxStateMessageAction>> = {
  success: { text: 'Continue', transparent: true },
  danger: { text: 'Try again', transparent: true },
};

@Component({
  selector: 'cx-state-message',
  imports: [CxButtonComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-state-message.component.html',
  styleUrl: './cx-state-message.component.scss',
  host: {
    role: 'status',
    '[class.cx-state-message-host--success]': 'state === "success"',
    '[class.cx-state-message-host--scheduled]': 'state === "scheduled"',
    '[class.cx-state-message-host--danger]': 'state === "danger"',
    '[attr.title]': 'null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStateMessageComponent {
  private iconInputBound = false;
  private iconValue: CxIconName | undefined;

  @Input() heading = '';
  @Input() description: string | undefined;
  @Input() action: CxStateMessageAction | undefined;
  @Input() secondaryAction: CxStateMessageAction | undefined;
  @Input() state: CxStateMessageState = 'default';
  @Input() visual: CxStateMessageVisual = 'icon';
  @Input() layout: CxStateMessageLayout = 'vertical';

  @Input()
  public set icon(icon: CxIconName | undefined) {
    this.iconInputBound = true;
    this.iconValue = icon;
  }

  @Output('action') readonly actionEmitter = new EventEmitter<CxStateMessageAction>();
  @Output('secondaryAction') readonly secondaryActionEmitter = new EventEmitter<CxStateMessageAction>();

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

  protected get resolvedDescription(): string {
    const description = this.description?.trim();
    if (description) {
      return description;
    }
    const preset = this.resolvedPreset;
    return preset?.description ?? '';
  }

  protected get hasHeading(): boolean {
    return this.resolvedHeading.length > 0;
  }

  protected get hasDescription(): boolean {
    return this.resolvedDescription.length > 0;
  }

  protected get showSpinner(): boolean {
    return this.visual === 'icon' && this.state === 'pending';
  }

  protected get showIcon(): boolean {
    return this.visual === 'icon' && !this.showSpinner && this.resolvedIcon !== undefined;
  }

  protected get visibleAction(): CxStateMessageAction | undefined {
    return this.visibleActionFor(this.action) ?? this.visibleActionFor(CX_STATE_MESSAGE_STATE_ACTIONS[this.state]);
  }

  protected get visibleSecondaryAction(): CxStateMessageAction | undefined {
    return this.visibleActionFor(this.secondaryAction);
  }

  protected hasActions(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
  }

  private get resolvedPreset(): typeof CX_STATE_MESSAGE_PRESETS[keyof typeof CX_STATE_MESSAGE_PRESETS] | undefined {
    if (this.state === 'default') {
      return undefined;
    }
    return CX_STATE_MESSAGE_PRESETS[this.state];
  }

  private visibleActionFor(action: CxStateMessageAction | undefined): CxStateMessageAction | undefined {
    return action?.text.trim() ? action : undefined;
  }

  protected resolveActionMood(action: CxStateMessageAction): CxButtonMood {
    return action.mood ?? 'default';
  }

  protected isActionTransparent(action: CxStateMessageAction): boolean {
    return action.transparent ?? true;
  }

  protected onActionPressed(action: CxStateMessageAction): void {
    this.actionEmitter.emit(action);
  }

  protected onSecondaryActionPressed(action: CxStateMessageAction): void {
    this.secondaryActionEmitter.emit(action);
  }
}
