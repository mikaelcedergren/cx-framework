import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { CxIconComponent } from '../cx-icon';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';

export type CxImageSize = 'auto' | '80' | '160' | '320';
export type CxImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
export type CxImageRadius = 'small' | 'default' | 'large' | 'round';
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
    '[style.width]': 'hostWidth',
    '[style.height]': 'hostHeight',
    '[style.max-width]': 'hostMaxWidth',
    '[style.max-height]': 'hostMaxHeight',
    '[style.border-radius]': 'hostBorderRadius',
    '[style.corner-shape]': 'hostCornerShape',
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
  protected readonly imageStyles$ = computed(() => calculateImageStyles(this.imageState()));
  protected readonly showImage$ = computed(
    () => !!this.imageState().src && !this.loadingState() && !this.failedState(),
  );
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
    return this.imageStyles$()['width'];
  }

  public get hostHeight(): string {
    return this.imageStyles$()['height'];
  }

  public get hostMaxWidth(): string {
    return this.imageStyles$()['max-width'];
  }

  public get hostMaxHeight(): string {
    return this.imageStyles$()['max-height'];
  }

  public get hostObjectFit(): string {
    return this.imageStyles$()['object-fit'];
  }

  public get hostBorderRadius(): string {
    return this.imageStyles$()['border-radius'];
  }

  public get hostCornerShape(): string {
    return this.imageStyles$()['corner-shape'];
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
    borderRadius: image?.borderRadius ?? 'default',
    clickBehavior: image?.clickBehavior ?? 'default',
  };
}

function calculateImageStyles(image: NormalizedCxImage): Record<string, string> {
  return {
    width: resolveImageSizeValue(image.width),
    height: resolveImageSizeValue(image.height),
    'max-width': image.maxWidth === 'auto' ? 'none' : resolveImageSizeValue(image.maxWidth),
    'max-height': image.maxHeight === 'auto' ? 'none' : resolveImageSizeValue(image.maxHeight),
    'object-fit': image.objectFit,
    'border-radius': resolveImageRadiusValue(image.borderRadius),
    'corner-shape': image.borderRadius === 'round' ? 'round' : 'var(--corner-shape, round)',
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
    case 'small':
      return 'var(--radius-sm)';
    case 'default':
      return 'var(--radius-lg)';
    case 'large':
      return 'var(--radius-media-lg)';
    case 'round':
      return 'var(--radius-pill)';
  }
}
