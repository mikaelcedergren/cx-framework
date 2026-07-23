import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { isHostVisible } from '../../shared/host-visibility';
import { CxOverlayStateService, type CxOverlayStateHandle } from '../overlay-state';

export interface CxLightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

@Component({
  selector: 'cx-lightbox',
  imports: [A11yModule, CxIconButtonComponent],
  templateUrl: './cx-lightbox.component.html',
  styleUrl: './cx-lightbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLightboxComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly requestedOpenState = signal(false);
  private readonly imagesState = signal<readonly CxLightboxImage[]>([]);
  private readonly indexState = signal(0);
  private overlayHandle?: CxOverlayStateHandle;
  private ariaLabelState = 'Image lightbox';
  private previousAriaLabelState = 'Previous image';
  private nextAriaLabelState = 'Next image';

  protected readonly isOpen$ = computed(() => this.requestedOpenState() && this.imagesState().length > 0);
  protected readonly currentIndex$ = computed(() => {
    const lastIndex = this.imagesState().length - 1;
    return lastIndex < 0 ? 0 : Math.min(this.indexState(), lastIndex);
  });
  protected readonly currentImage$ = computed(() => this.imagesState()[this.currentIndex$()]);
  protected readonly hasNavigation$ = computed(() => this.imagesState().length > 1);
  protected readonly canGoPrevious$ = computed(() => this.currentIndex$() > 0);
  protected readonly canGoNext$ = computed(() => this.currentIndex$() < this.imagesState().length - 1);
  protected readonly positionText$ = computed(() => `${this.currentIndex$() + 1} / ${this.imagesState().length}`);
  protected readonly positionLabel$ = computed(
    () => `Image ${this.currentIndex$() + 1} of ${this.imagesState().length}`,
  );

  @Input()
  public set images(value: readonly CxLightboxImage[] | null | undefined) {
    const images = Array.isArray(value)
      ? value.flatMap(image => {
          const src = typeof image?.src === 'string' ? image.src.trim() : '';
          if (!src) {
            return [];
          }

          const caption = typeof image.caption === 'string' ? image.caption.trim() : '';
          return [{
            src,
            alt: typeof image.alt === 'string' ? image.alt : '',
            ...(caption ? { caption } : {}),
          }];
        })
      : [];

    this.imagesState.set(images);
    this.reconcileOverlay();
  }

  public get images(): readonly CxLightboxImage[] {
    return this.imagesState();
  }

  @Input()
  public set index(value: number) {
    this.indexState.set(Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);
  }

  public get index(): number {
    return this.currentIndex$();
  }

  @Input()
  public set ariaLabel(value: string | null | undefined) {
    this.ariaLabelState = value?.trim() || 'Image lightbox';
  }

  public get ariaLabel(): string {
    return this.ariaLabelState;
  }

  @Input()
  public set previousAriaLabel(value: string | null | undefined) {
    this.previousAriaLabelState = value?.trim() || 'Previous image';
  }

  public get previousAriaLabel(): string {
    return this.previousAriaLabelState;
  }

  @Input()
  public set nextAriaLabel(value: string | null | undefined) {
    this.nextAriaLabelState = value?.trim() || 'Next image';
  }

  public get nextAriaLabel(): string {
    return this.nextAriaLabelState;
  }

  @Input()
  public set open(value: boolean) {
    this.requestedOpenState.set(Boolean(value));
    this.reconcileOverlay();
  }

  public get open(): boolean {
    return this.requestedOpenState();
  }

  @Output() readonly indexChange = new EventEmitter<number>();
  @Output() readonly openChange = new EventEmitter<boolean>();

  public ngOnDestroy(): void {
    this.releaseOverlay();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget || !this.overlayState.isTopmost(this.overlayHandle)) {
      return;
    }
    this.closeFromUser();
  }

  @HostListener('document:keydown', ['$event'])
  protected onDialogKeydown(event: KeyboardEvent): void {
    if (
      event.defaultPrevented
      || event.isComposing
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
      || !this.overlayState.isTopmost(this.overlayHandle)
    ) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      this.showPreviousImage();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      this.showNextImage();
    }
  }

  protected showPreviousImage(): void {
    this.navigate(-1);
  }

  protected showNextImage(): void {
    this.navigate(1);
  }

  protected closeFromUser(): void {
    if (!this.requestedOpenState()) {
      return;
    }

    this.requestedOpenState.set(false);
    this.reconcileOverlay();
    this.openChange.emit(false);
  }

  private navigate(direction: -1 | 1): void {
    if (!this.hasNavigation$() || !this.overlayState.isTopmost(this.overlayHandle)) {
      return;
    }

    const nextIndex = Math.max(
      0,
      Math.min(this.currentIndex$() + direction, this.imagesState().length - 1),
    );
    if (nextIndex === this.currentIndex$()) {
      return;
    }

    this.indexState.set(nextIndex);
    this.indexChange.emit(nextIndex);
  }

  private reconcileOverlay(): void {
    if (this.isOpen$()) {
      if (!this.overlayHandle) {
        this.overlayHandle = this.overlayState.capture({
          isActive: () => isHostVisible(
            this.host.nativeElement.querySelector('.cx-lightbox'),
          ),
          onEscape: () => this.closeFromUser(),
        });
      }
      return;
    }

    this.releaseOverlay();
  }

  private releaseOverlay(): void {
    this.overlayState.release(this.overlayHandle);
    this.overlayHandle = undefined;
  }
}
