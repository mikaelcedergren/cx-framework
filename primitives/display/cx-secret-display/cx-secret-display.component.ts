import { ChangeDetectionStrategy, Component, Input, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'cx-secret-display',
  templateUrl: './cx-secret-display.component.html',
  styleUrl: './cx-secret-display.component.scss',
  host: {
    '[class.cx-secret-display-host--empty]': '!value',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSecretDisplayComponent implements OnDestroy {
  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;
  private valueState = '';
  private maskedState = false;
  private ariaLabelState = 'Secret value';

  protected readonly revealed = signal(false);
  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  @Input()
  public set value(value: string | null | undefined) {
    this.valueState = value ?? '';
  }

  public get value(): string {
    return this.valueState;
  }

  @Input()
  public set masked(value: boolean) {
    this.maskedState = value;
    if (value) {
      this.revealed.set(false);
    }
  }

  public get masked(): boolean {
    return this.maskedState;
  }

  @Input()
  public set ariaLabel(value: string | null | undefined) {
    const label = value?.trim();
    this.ariaLabelState = label || 'Secret value';
  }

  public get ariaLabel(): string {
    return this.ariaLabelState;
  }

  public ngOnDestroy(): void {
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }
  }

  protected displayValue(): string {
    if (this.isHidden()) {
      return '•'.repeat(this.value.length);
    }
    return this.value;
  }

  protected valueAriaLabel(): string {
    return this.isHidden() ? `${this.ariaLabel}, hidden` : this.ariaLabel;
  }

  protected revealLabel(): string {
    return this.isHidden() ? 'Show secret' : 'Hide secret';
  }

  protected copyAriaLabel(): string {
    const state = this.copyState();
    if (state === 'copied') return 'Copied';
    if (state === 'failed') return 'Copy failed';
    return `Copy ${this.ariaLabel}`;
  }

  protected copyLabel(): string {
    const state = this.copyState();
    if (state === 'copied') return 'Copied';
    if (state === 'failed') return 'Copy failed';
    return 'Copy';
  }

  protected isHidden(): boolean {
    return this.masked && !this.revealed();
  }

  protected toggleReveal(): void {
    this.revealed.update(value => !value);
  }

  protected async copy(): Promise<void> {
    if (!this.value) return;
    try {
      await navigator.clipboard.writeText(this.value);
      this.flashCopyState('copied');
    } catch {
      this.flashCopyState('failed');
    }
  }

  private flashCopyState(state: 'copied' | 'failed'): void {
    this.copyState.set(state);
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }
    this.copyResetTimer = setTimeout(() => this.copyState.set('idle'), 1500);
  }
}
