import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CxButtonComponent, type CxButtonMood, type CxButtonVariant } from '../../actions/cx-button';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export type CxAlertMood = 'default' | 'info' | 'warning' | 'success' | 'danger';
export type CxAlertIcon = CxIconName;

export interface CxAlertAction {
  readonly text: string;
  readonly variant?: CxButtonVariant;
  readonly mood?: CxButtonMood;
  readonly icon?: CxIconName;
  readonly appendIcon?: CxIconName;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly ariaLabel?: string;
}

@Component({
  selector: 'cx-alert',
  imports: [CxButtonComponent, CxIconComponent],
  templateUrl: './cx-alert.component.html',
  styleUrl: './cx-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxAlertComponent {
  private iconInputBound = false;
  private iconValue: CxAlertIcon | undefined;

  @Input() mood: CxAlertMood = 'default';
  @Input() text = 'Something worth knowing happened.';
  @Input() action: CxAlertAction | undefined;
  @Input() secondaryAction: CxAlertAction | undefined;
  @Input() dismissible = false;

  @Input()
  public set icon(icon: CxAlertIcon | undefined) {
    this.iconInputBound = true;
    this.iconValue = icon;
  }

  @Output() readonly dismissed = new EventEmitter<void>();
  @Output('action') readonly actionEmitter = new EventEmitter<CxAlertAction>();
  @Output('secondaryAction') readonly secondaryActionEmitter = new EventEmitter<CxAlertAction>();

  @HostBinding('class')
  protected get hostClass(): string {
    const classes = ['cx-alert', `cx-alert--${this.mood}`];
    if (this.resolvedIcon) classes.push('cx-alert--with-icon');
    if (this.dismissible) classes.push('cx-alert--dismissible');
    if (this.hasActions()) classes.push('cx-alert--with-actions');
    if (!this.hasText()) classes.push('cx-alert--hidden');
    return classes.join(' ');
  }

  @HostBinding('attr.role')
  protected get hostRole(): 'alert' | 'status' {
    return this.mood === 'danger' || this.mood === 'warning' ? 'alert' : 'status';
  }

  protected get resolvedIcon(): CxIconName | null {
    if (this.iconInputBound) {
      return this.iconValue ?? null;
    }
    switch (this.mood) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check';
      case 'info':
        return 'info';
      case 'default':
      default:
        return null;
    }
  }

  protected get visibleAction(): CxAlertAction | undefined {
    return this.visibleActionFor(this.action);
  }

  protected get visibleSecondaryAction(): CxAlertAction | undefined {
    return this.visibleActionFor(this.secondaryAction);
  }

  protected hasText(): boolean {
    return this.text.trim().length > 0;
  }

  protected hasActions(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
  }

  private visibleActionFor(action: CxAlertAction | undefined): CxAlertAction | undefined {
    return action?.text.trim() ? action : undefined;
  }

  protected onAction(action: CxAlertAction): void {
    this.actionEmitter.emit(action);
  }

  protected onSecondaryAction(action: CxAlertAction): void {
    this.secondaryActionEmitter.emit(action);
  }

  protected onDismiss(): void {
    this.dismissed.emit();
  }
}
