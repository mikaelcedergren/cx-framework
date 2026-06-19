import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxSpinnerSize = '16' | '24' | '32' | '64' | 'auto';
export type CxSpinnerMood = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'cx-spinner',
  host: {
    role: 'status',
    'aria-busy': 'true',
    'aria-label': 'Loading',
    '[class.cx-spinner-host--size-16]': 'size === "16"',
    '[class.cx-spinner-host--size-24]': 'size === "24"',
    '[class.cx-spinner-host--size-32]': 'size === "32"',
    '[class.cx-spinner-host--size-64]': 'size === "64"',
    '[class.cx-spinner-host--size-auto]': 'size === "auto"',
    '[class.cx-spinner-host--mood-primary]': 'mood === "primary"',
    '[class.cx-spinner-host--mood-accent]': 'mood === "accent"',
    '[class.cx-spinner-host--mood-success]': 'mood === "success"',
    '[class.cx-spinner-host--mood-warning]': 'mood === "warning"',
    '[class.cx-spinner-host--mood-danger]': 'mood === "danger"',
  },
  templateUrl: './cx-spinner.component.html',
  styleUrl: './cx-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSpinnerComponent {
  @Input() size: CxSpinnerSize = '24';
  @Input() mood: CxSpinnerMood = 'default';
}
