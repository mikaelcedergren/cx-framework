import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';
import { type CxFeedbackAction } from '../cx-feedback-action';

export type CxAlertMood = 'default' | 'info' | 'warning' | 'success' | 'danger';
export type CxAlertIcon = 'auto' | 'none' | CxIconName;
export type CxAlertAction = CxFeedbackAction;

@Component({
  selector: 'cx-alert',
  imports: [CxIconComponent],
  templateUrl: './cx-alert.component.html',
  styleUrl: './cx-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxAlertComponent {
  @Input() mood: CxAlertMood = 'default';
  @Input() text = '';
  @Input() icon: CxAlertIcon = 'auto';
  @Input() action: CxAlertAction | undefined;
  @Input() secondaryAction: CxAlertAction | undefined;
  @Input() dismissible = false;

  @Output() readonly dismiss = new EventEmitter<void>();
  @Output() readonly actionSelect = new EventEmitter<CxAlertAction>();
  @Output() readonly secondaryActionSelect = new EventEmitter<CxAlertAction>();

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
    if (this.icon === 'none') {
      return null;
    }
    if (this.icon !== 'auto') {
      return this.icon;
    }
    return this.defaultIconForMood();
  }

  private defaultIconForMood(): CxIconName | null {
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

  protected onActionSelect(action: CxAlertAction): void {
    this.actionSelect.emit(action);
  }

  protected onSecondaryActionSelect(action: CxAlertAction): void {
    this.secondaryActionSelect.emit(action);
  }

  protected onDismiss(): void {
    this.dismiss.emit();
  }
}
