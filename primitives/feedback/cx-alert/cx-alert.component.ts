import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxButtonComponent, type CxButtonMood } from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';
import { CxSpinnerComponent } from '../cx-spinner';

export type CxAlertMood = 'default' | 'info' | 'warning' | 'success' | 'danger';

export interface CxAlertAction {
  readonly text: string;
  readonly href?: string;
}

@Component({
  selector: 'cx-alert',
  imports: [CxButtonComponent, CxIconButtonComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-alert.component.html',
  styleUrl: './cx-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxAlertComponent {
  @Input() heading = '';
  @Input() mood: CxAlertMood = 'default';
  @Input() loading = false;
  @Input() action: CxAlertAction | undefined;
  @Input() dismissible = false;

  @Output() readonly actionSelect = new EventEmitter<CxAlertAction>();
  @Output() readonly dismiss = new EventEmitter<void>();

  @HostBinding('class')
  protected get hostClass(): string {
    const classes = ['cx-alert', `cx-alert--${this.mood}`];
    if (!this.hasHeading()) classes.push('cx-alert--hidden');
    return classes.join(' ');
  }

  @HostBinding('attr.role')
  protected get hostRole(): 'alert' | 'status' {
    return this.mood === 'danger' || this.mood === 'warning' ? 'alert' : 'status';
  }

  @HostBinding('attr.aria-busy')
  protected get hostBusy(): 'true' | null {
    return this.loading ? 'true' : null;
  }

  protected get resolvedHeading(): string {
    return this.heading.trim();
  }

  protected hasHeading(): boolean {
    return this.resolvedHeading.length > 0;
  }

  protected get resolvedIcon(): CxIconName {
    switch (this.mood) {
      case 'success':
        return 'check';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'info':
      case 'default':
      default:
        return 'info';
    }
  }

  protected get visibleAction(): CxAlertAction | undefined {
    return this.action?.text.trim() ? this.action : undefined;
  }

  protected get actionMood(): CxButtonMood {
    return this.mood;
  }

  protected actionHref(action: CxAlertAction): string | undefined {
    return action.href?.trim() || undefined;
  }

  protected get dismissAriaLabel(): string {
    return `Dismiss ${this.resolvedHeading}`;
  }

  protected onActionSelect(action: CxAlertAction): void {
    if (!this.actionHref(action)) {
      this.actionSelect.emit(action);
    }
  }

  protected onDismiss(): void {
    this.dismiss.emit();
  }
}
