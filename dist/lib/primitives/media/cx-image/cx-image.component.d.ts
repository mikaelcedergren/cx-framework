import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
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
export declare class CxImageComponent {
    private readonly failedState;
    private readonly imageState;
    private readonly loadingState;
    private readonly fallbackTextState;
    protected readonly image$: import("@angular/core").Signal<Required<CxImage>>;
    protected readonly loading$: import("@angular/core").Signal<boolean>;
    protected readonly fallbackText$: import("@angular/core").Signal<string>;
    protected readonly styleVars$: import("@angular/core").Signal<Record<string, string>>;
    protected readonly showImage$: import("@angular/core").Signal<boolean>;
    protected readonly showFallback$: import("@angular/core").Signal<boolean>;
    set image(value: CxImage | undefined);
    set loading(value: boolean | undefined);
    set fallbackText(value: string | undefined);
    readonly imageClick: EventEmitter<CxImage>;
    get hostWidth(): string;
    get hostHeight(): string;
    get hostMaxWidth(): string;
    get hostMaxHeight(): string;
    get hostObjectFit(): string;
    get hostBorderRadius(): string;
    get hostCornerShape(): string;
    get hostClickable(): boolean;
    protected onClick(): void;
    protected onImageLoad(): void;
    protected onImageError(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxImageComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxImageComponent, "cx-image", never, { "image": { "alias": "image"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "fallbackText": { "alias": "fallbackText"; "required": false; }; }, { "imageClick": "imageClick"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-image.component.d.ts.map