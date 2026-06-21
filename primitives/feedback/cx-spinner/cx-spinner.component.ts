import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';

export type CxSpinnerSize = 'small' | 'default' | 'large' | 'xlarge' | 'auto';
type CxSpinnerInputSize = CxSpinnerSize | '16' | '24' | '32' | '64';
export type CxSpinnerMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'cx-spinner',
  host: {
    role: 'status',
    'aria-busy': 'true',
    'aria-label': 'Loading',
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

  @Input()
  public set size(value: CxSpinnerInputSize | undefined) {
    switch (value) {
      case 'small':
      case '16':
        this.size$.set('small');
        return;
      case 'large':
      case '32':
        this.size$.set('large');
        return;
      case 'xlarge':
      case '64':
        this.size$.set('xlarge');
        return;
      case 'auto':
        this.size$.set('auto');
        return;
      case 'default':
      case '24':
      default:
        this.size$.set('default');
        return;
    }
  }

  public get size(): CxSpinnerSize {
    return this.size$();
  }
}
