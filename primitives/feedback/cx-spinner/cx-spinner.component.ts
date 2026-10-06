import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';

export type CxSpinnerSize = 'small' | 'default' | 'large' | 'xlarge' | 'auto';
export type CxSpinnerMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'cx-spinner',
  host: {
    '[attr.role]': "'status'",
    '[attr.aria-busy]': "'true'",
    '[attr.aria-label]': 'resolvedAriaLabel$()',
    '[class.cx-spinner-host--small]': 'size$() === "small"',
    '[class.cx-spinner-host--default]': 'size$() === "default"',
    '[class.cx-spinner-host--large]': 'size$() === "large"',
    '[class.cx-spinner-host--xlarge]': 'size$() === "xlarge"',
    '[class.cx-spinner-host--auto]': 'size$() === "auto"',
    '[class.cx-spinner-host--mood-primary]': 'mood === "primary"',
    '[class.cx-spinner-host--mood-accent]': 'mood === "accent"',
    '[class.cx-spinner-host--mood-info]': 'mood === "info"',
    '[class.cx-spinner-host--mood-success]': 'mood === "success"',
    '[class.cx-spinner-host--mood-warning]': 'mood === "warning"',
    '[class.cx-spinner-host--mood-danger]': 'mood === "danger"',
  },
  templateUrl: './cx-spinner.component.html',
  styleUrl: './cx-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSpinnerComponent {
  protected readonly size$ = signal<CxSpinnerSize>('default');

  @Input() mood: CxSpinnerMood = 'default';

  /** Accessible label. Defaults to "Loading" for the indeterminate spinner. */
  @Input() ariaLabel: string | undefined;

  @Input()
  public set size(value: CxSpinnerSize | undefined) {
    switch (value) {
      case 'small':
        this.size$.set('small');
        return;
      case 'large':
        this.size$.set('large');
        return;
      case 'xlarge':
        this.size$.set('xlarge');
        return;
      case 'auto':
        this.size$.set('auto');
        return;
      case 'default':
      default:
        this.size$.set('default');
        return;
    }
  }

  public get size(): CxSpinnerSize {
    return this.size$();
  }

  protected resolvedAriaLabel$(): string {
    return this.ariaLabel?.trim() || 'Loading';
  }
}
