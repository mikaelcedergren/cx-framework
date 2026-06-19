import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, effect, signal } from '@angular/core';
import { renderCxQrCodeSvg, type QrErrorCorrection } from './cx-qr-code.encoder';

export type CxQrErrorCorrection = QrErrorCorrection;

@Component({
  selector: 'cx-qr-code',
  templateUrl: './cx-qr-code.component.html',
  styleUrl: './cx-qr-code.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxQrCodeComponent {
  protected readonly data$ = signal('');
  protected readonly size$ = signal(192);
  protected readonly errorCorrection$ = signal<CxQrErrorCorrection>('M');
  protected readonly ariaLabel$ = signal<string | undefined>(undefined);
  protected readonly renderError$ = signal<string | undefined>(undefined);

  @ViewChild('svgHost', { static: true })
  private readonly svgHost!: ElementRef<HTMLDivElement>;

  public constructor() {
    effect(() => {
      const data = this.data$();
      const errorCorrection = this.errorCorrection$();
      const size = this.size$();

      if (!data) {
        this.svgHost.nativeElement.innerHTML = '';
        this.renderError$.set(undefined);
        return;
      }

      try {
        this.svgHost.nativeElement.innerHTML = renderCxQrCodeSvg(data, errorCorrection, size).svg;
        this.renderError$.set(undefined);
      } catch (error) {
        this.svgHost.nativeElement.innerHTML = '';
        this.renderError$.set(error instanceof Error ? error.message : 'QR render failed.');
      }
    });
  }

  @Input()
  public set data(value: string | undefined) {
    this.data$.set(value ?? '');
  }

  @Input()
  public set size(value: number) {
    const numericValue = Number.isFinite(value) ? value : 192;
    this.size$.set(Math.max(64, Math.min(1024, Math.floor(numericValue))));
  }

  @Input()
  public set errorCorrection(value: CxQrErrorCorrection) {
    this.errorCorrection$.set(this.isErrorCorrection(value) ? value : 'M');
  }

  @Input()
  public set ariaLabel(value: string | undefined) {
    this.ariaLabel$.set(value?.trim() || undefined);
  }

  private isErrorCorrection(value: string | undefined): value is CxQrErrorCorrection {
    return value === 'L' || value === 'M' || value === 'Q' || value === 'H';
  }
}
