import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconComponent } from '../cx-icon';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';

export type CxImageSize = 'auto' | '80' | '160' | '320';
export type CxImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
export type CxImageRadius = 'none' | '4' | '8' | '16' | 'round';
export type CxImageClickBehavior = 'default' | 'click' | 'fullScreen';

export interface CxImage {
  src: string;
  alt?: string;
  width?: CxImageSize;
  height?: CxImageSize;
  maxWidth?: CxImageSize;
  maxHeight?: CxImageSize;
  objectFit?: CxImageFit;
  borderRadius?: CxImageRadius;
  clickBehavior?: CxImageClickBehavior;
}

type NormalizedCxImage = Required<CxImage>;

@Component({
  selector: 'cx-image',
  imports: [CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-image.component.html',
  styleUrl: './cx-image.component.scss',
  host: {
    '[style.--cx-image-width]': 'hostWidth',
    '[style.--cx-image-height]': 'hostHeight',
    '[style.--cx-image-max-width]': 'hostMaxWidth',
    '[style.--cx-image-max-height]': 'hostMaxHeight',
    '[style.--cx-image-object-fit]': 'hostObjectFit',
    '[style.--cx-image-border-radius]': 'hostBorderRadius',
    '[class.cx-image-host--clickable]': 'hostClickable',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxImageComponent {
  private readonly failedState = signal(false);
  private readonly imageState = signal<NormalizedCxImage>(normalizeCxImage(undefined));
  private readonly loadingState = signal(false);
  private readonly fallbackTextState = signal('Image unavailable');
  protected readonly image$ = this.imageState.asReadonly();
  protected readonly loading$ = this.loadingState.asReadonly();
  protected readonly fallbackText$ = computed(() => this.fallbackTextState().trim());
  protected readonly styleVars$ = computed(() => calculateImageStyleVars(this.imageState()));
  protected readonly showImage$ = computed(() => !!this.imageState().src && !this.loadingState() && !this.failedState());
  protected readonly showFallback$ = computed(() => !this.showImage$() && !this.loadingState());

  @Input()
  public set image(value: CxImage | undefined) {
    this.failedState.set(false);
    this.imageState.set(normalizeCxImage(value));
  }

  @Input()
  public set loading(value: boolean | undefined) {
    this.loadingState.set(value === true);
  }

  @Input()
  public set fallbackText(value: string | undefined) {
    this.fallbackTextState.set(value ?? '');
  }

  @Output() readonly imageClick = new EventEmitter<CxImage>();

  public get hostWidth(): string {
    return this.styleVars$()['--cx-image-width'];
  }

  public get hostHeight(): string {
    return this.styleVars$()['--cx-image-height'];
  }

  public get hostMaxWidth(): string {
    return this.styleVars$()['--cx-image-max-width'];
  }

  public get hostMaxHeight(): string {
    return this.styleVars$()['--cx-image-max-height'];
  }

  public get hostObjectFit(): string {
    return this.styleVars$()['--cx-image-object-fit'];
  }

  public get hostBorderRadius(): string {
    return this.styleVars$()['--cx-image-border-radius'];
  }

  public get hostClickable(): boolean {
    return this.imageState().clickBehavior !== 'default';
  }

  protected onClick(): void {
    const image = this.imageState();
    if (image.clickBehavior === 'fullScreen' && image.src) {
      window.open(image.src, '_blank', 'noopener,noreferrer');
      return;
    }
    if (image.clickBehavior === 'click') {
      this.imageClick.emit(image);
    }
  }

  protected onImageLoad(): void {
    this.failedState.set(false);
  }

  protected onImageError(): void {
    this.failedState.set(true);
  }
}

function normalizeCxImage(image: CxImage | undefined): NormalizedCxImage {
  return {
    src: image?.src ?? '',
    alt: image?.alt ?? '',
    width: image?.width ?? 'auto',
    height: image?.height ?? 'auto',
    maxWidth: image?.maxWidth ?? 'auto',
    maxHeight: image?.maxHeight ?? 'auto',
    objectFit: image?.objectFit ?? 'cover',
    borderRadius: image?.borderRadius ?? 'none',
    clickBehavior: image?.clickBehavior ?? 'default',
  };
}

function calculateImageStyleVars(image: NormalizedCxImage): Record<string, string> {
  return {
    '--cx-image-width': resolveImageSizeValue(image.width),
    '--cx-image-height': resolveImageSizeValue(image.height),
    '--cx-image-max-width': image.maxWidth === 'auto' ? 'none' : resolveImageSizeValue(image.maxWidth),
    '--cx-image-max-height': image.maxHeight === 'auto' ? 'none' : resolveImageSizeValue(image.maxHeight),
    '--cx-image-object-fit': image.objectFit,
    '--cx-image-border-radius': resolveImageRadiusValue(image.borderRadius),
  };
}

function resolveImageSizeValue(size: CxImageSize): string {
  switch (size) {
    case 'auto':
      return 'auto';
    case '80':
      return 'calc(var(--space-2xl) + var(--space-md))';
    case '160':
      return 'calc((var(--space-2xl) + var(--space-md)) * 2)';
    case '320':
      return 'calc((var(--space-2xl) + var(--space-md)) * 4)';
  }
}

function resolveImageRadiusValue(radius: CxImageRadius): string {
  switch (radius) {
    case 'none':
      return 'var(--radius-none)';
    case '4':
      return 'var(--radius-sm)';
    case '8':
      return 'var(--radius-md)';
    case '16':
      return 'var(--radius-lg)';
    case 'round':
      return 'var(--radius-pill)';
  }
}
