import { EventEmitter, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export interface CxLightboxImage {
    src: string;
    alt: string;
    caption?: string;
}
export declare class CxLightboxComponent implements OnDestroy {
    private readonly host;
    private readonly overlayState;
    private readonly requestedOpenState;
    private readonly imagesState;
    private readonly indexState;
    private overlayHandle?;
    private ariaLabelState;
    private previousAriaLabelState;
    private nextAriaLabelState;
    protected readonly isOpen$: import("@angular/core").Signal<boolean>;
    protected readonly currentIndex$: import("@angular/core").Signal<number>;
    protected readonly currentImage$: import("@angular/core").Signal<CxLightboxImage>;
    protected readonly hasNavigation$: import("@angular/core").Signal<boolean>;
    protected readonly canGoPrevious$: import("@angular/core").Signal<boolean>;
    protected readonly canGoNext$: import("@angular/core").Signal<boolean>;
    protected readonly positionText$: import("@angular/core").Signal<string>;
    protected readonly positionLabel$: import("@angular/core").Signal<string>;
    set images(value: readonly CxLightboxImage[] | null | undefined);
    get images(): readonly CxLightboxImage[];
    set index(value: number);
    get index(): number;
    set ariaLabel(value: string | null | undefined);
    get ariaLabel(): string;
    set previousAriaLabel(value: string | null | undefined);
    get previousAriaLabel(): string;
    set nextAriaLabel(value: string | null | undefined);
    get nextAriaLabel(): string;
    set open(value: boolean);
    get open(): boolean;
    readonly indexChange: EventEmitter<number>;
    readonly openChange: EventEmitter<boolean>;
    ngOnDestroy(): void;
    protected onBackdropClick(event: MouseEvent): void;
    protected onDialogKeydown(event: KeyboardEvent): void;
    protected showPreviousImage(): void;
    protected showNextImage(): void;
    protected closeFromUser(): void;
    private navigate;
    private reconcileOverlay;
    private releaseOverlay;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxLightboxComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxLightboxComponent, "cx-lightbox", never, { "images": { "alias": "images"; "required": false; }; "index": { "alias": "index"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "previousAriaLabel": { "alias": "previousAriaLabel"; "required": false; }; "nextAriaLabel": { "alias": "nextAriaLabel"; "required": false; }; "open": { "alias": "open"; "required": false; }; }, { "indexChange": "indexChange"; "openChange": "openChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-lightbox.component.d.ts.map