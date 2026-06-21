import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

export type CxSsoProvider = 'google' | 'apple' | 'microsoft' | 'sso';
export type CxSsoAction = 'sign-in' | 'sign-up' | 'continue';
export type CxSsoSize = 'small' | 'default' | 'large';
type CxSsoInputSize = CxSsoSize | 'sm' | 'md' | 'lg';

const PROVIDER_NAME: Record<CxSsoProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  microsoft: 'Microsoft',
  sso: 'SSO',
};

const ACTION_VERB: Record<CxSsoAction, string> = {
  'sign-in': 'Sign in with',
  'sign-up': 'Sign up with',
  continue: 'Continue with',
};

@Component({
  selector: 'cx-sso-button',
  templateUrl: './cx-sso-button.component.html',
  styleUrl: './cx-sso-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSsoButtonComponent {
  private readonly loadingState = signal(false);
  private readonly sizeState = signal<CxSsoSize>('default');

  @Input() provider: CxSsoProvider = 'google';
  @Input() action: CxSsoAction = 'continue';
  @Input() disabled = false;

  @Input()
  public set size(value: CxSsoInputSize | undefined) {
    switch (value) {
      case 'small':
      case 'sm':
        this.sizeState.set('small');
        return;
      case 'large':
      case 'lg':
        this.sizeState.set('large');
        return;
      case 'default':
      case 'md':
      default:
        this.sizeState.set('default');
        return;
    }
  }

  @Input()
  public set loading(value: boolean) {
    this.loadingState.set(Boolean(value));
  }

  @Output() readonly pressed = new EventEmitter<MouseEvent>();

  protected readonly loading$ = this.loadingState.asReadonly();
  protected readonly size$ = this.sizeState.asReadonly();
  protected readonly label$ = computed(() => `${ACTION_VERB[this.action]} ${PROVIDER_NAME[this.provider]}`);

  protected onClick(event: MouseEvent): void {
    if (this.disabled || this.loadingState()) {
      return;
    }
    event.stopPropagation();
    this.pressed.emit(event);
  }
}
