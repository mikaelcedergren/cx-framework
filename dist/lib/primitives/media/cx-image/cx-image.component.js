import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconComponent } from '../cx-icon/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import * as i0 from "@angular/core";
export class CxImageComponent {
    failedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "failedState" }] : /* istanbul ignore next */ []));
    imageState = signal(normalizeCxImage(undefined), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "imageState" }] : /* istanbul ignore next */ []));
    loadingState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "loadingState" }] : /* istanbul ignore next */ []));
    fallbackTextState = signal('Image unavailable', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fallbackTextState" }] : /* istanbul ignore next */ []));
    image$ = this.imageState.asReadonly();
    loading$ = this.loadingState.asReadonly();
    fallbackText$ = computed(() => this.fallbackTextState().trim(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fallbackText$" }] : /* istanbul ignore next */ []));
    styleVars$ = computed(() => calculateImageStyleVars(this.imageState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "styleVars$" }] : /* istanbul ignore next */ []));
    showImage$ = computed(() => !!this.imageState().src && !this.loadingState() && !this.failedState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showImage$" }] : /* istanbul ignore next */ []));
    showFallback$ = computed(() => !this.showImage$() && !this.loadingState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showFallback$" }] : /* istanbul ignore next */ []));
    set image(value) {
        this.failedState.set(false);
        this.imageState.set(normalizeCxImage(value));
    }
    set loading(value) {
        this.loadingState.set(value === true);
    }
    set fallbackText(value) {
        this.fallbackTextState.set(value ?? '');
    }
    imageClick = new EventEmitter();
    get hostWidth() {
        return this.styleVars$()['--cx-image-width'];
    }
    get hostHeight() {
        return this.styleVars$()['--cx-image-height'];
    }
    get hostMaxWidth() {
        return this.styleVars$()['--cx-image-max-width'];
    }
    get hostMaxHeight() {
        return this.styleVars$()['--cx-image-max-height'];
    }
    get hostObjectFit() {
        return this.styleVars$()['--cx-image-object-fit'];
    }
    get hostBorderRadius() {
        return this.styleVars$()['--cx-image-border-radius'];
    }
    get hostCornerShape() {
        return this.styleVars$()['--cx-image-corner-shape'];
    }
    get hostClickable() {
        return this.imageState().clickBehavior !== 'default';
    }
    onClick() {
        const image = this.imageState();
        if (image.clickBehavior === 'fullScreen' && image.src) {
            window.open(image.src, '_blank', 'noopener,noreferrer');
            return;
        }
        if (image.clickBehavior === 'click') {
            this.imageClick.emit(image);
        }
    }
    onImageLoad() {
        this.failedState.set(false);
    }
    onImageError() {
        this.failedState.set(true);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxImageComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxImageComponent, isStandalone: true, selector: "cx-image", inputs: { image: "image", loading: "loading", fallbackText: "fallbackText" }, outputs: { imageClick: "imageClick" }, host: { properties: { "style.--cx-image-width": "hostWidth", "style.--cx-image-height": "hostHeight", "style.--cx-image-max-width": "hostMaxWidth", "style.--cx-image-max-height": "hostMaxHeight", "style.--cx-image-object-fit": "hostObjectFit", "style.--cx-image-border-radius": "hostBorderRadius", "style.--cx-image-corner-shape": "hostCornerShape", "class.cx-image-host--clickable": "hostClickable" } }, ngImport: i0, template: "@if (loading$()) {\n  <div class=\"cx-image__fallback\" aria-busy=\"true\">\n    <cx-spinner mood=\"default\" size=\"default\" />\n  </div>\n} @else if (showImage$()) {\n  <img\n    class=\"cx-image\"\n    [src]=\"image$().src\"\n    [alt]=\"image$().alt\"\n    (load)=\"onImageLoad()\"\n    (error)=\"onImageError()\"\n    (click)=\"onClick()\"\n  />\n} @else if (showFallback$()) {\n  <div class=\"cx-image__fallback\" role=\"img\" [attr.aria-label]=\"fallbackText$() || null\">\n    <cx-icon icon=\"image\" [size]=\"24\" />\n    @if (fallbackText$()) {\n      <span>{{ fallbackText$() }}</span>\n    }\n  </div>\n}\n", styles: [":host{display:inline-block;width:var(--cx-image-width, auto);height:var(--cx-image-height, auto);max-width:var(--cx-image-max-width, none);max-height:var(--cx-image-max-height, none);overflow:hidden;border-radius:var(--cx-image-border-radius, var(--radius-lg));corner-shape:var(--cx-image-corner-shape, var(--corner-shape, round))}.cx-image{display:block;width:100%;height:100%;object-fit:var(--cx-image-object-fit, cover)}:host(.cx-image-host--clickable) .cx-image{cursor:pointer}.cx-image__fallback{display:flex;width:100%;height:100%;min-width:calc(var(--space-2xl) + var(--space-md));min-height:calc(var(--space-2xl) + var(--space-md));align-items:center;justify-content:center;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);box-sizing:border-box;border:var(--line-discreet);border-radius:inherit;corner-shape:inherit;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-align:center}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxImageComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-image', imports: [CxIconComponent, CxSpinnerComponent], host: {
                        '[style.--cx-image-width]': 'hostWidth',
                        '[style.--cx-image-height]': 'hostHeight',
                        '[style.--cx-image-max-width]': 'hostMaxWidth',
                        '[style.--cx-image-max-height]': 'hostMaxHeight',
                        '[style.--cx-image-object-fit]': 'hostObjectFit',
                        '[style.--cx-image-border-radius]': 'hostBorderRadius',
                        '[style.--cx-image-corner-shape]': 'hostCornerShape',
                        '[class.cx-image-host--clickable]': 'hostClickable',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (loading$()) {\n  <div class=\"cx-image__fallback\" aria-busy=\"true\">\n    <cx-spinner mood=\"default\" size=\"default\" />\n  </div>\n} @else if (showImage$()) {\n  <img\n    class=\"cx-image\"\n    [src]=\"image$().src\"\n    [alt]=\"image$().alt\"\n    (load)=\"onImageLoad()\"\n    (error)=\"onImageError()\"\n    (click)=\"onClick()\"\n  />\n} @else if (showFallback$()) {\n  <div class=\"cx-image__fallback\" role=\"img\" [attr.aria-label]=\"fallbackText$() || null\">\n    <cx-icon icon=\"image\" [size]=\"24\" />\n    @if (fallbackText$()) {\n      <span>{{ fallbackText$() }}</span>\n    }\n  </div>\n}\n", styles: [":host{display:inline-block;width:var(--cx-image-width, auto);height:var(--cx-image-height, auto);max-width:var(--cx-image-max-width, none);max-height:var(--cx-image-max-height, none);overflow:hidden;border-radius:var(--cx-image-border-radius, var(--radius-lg));corner-shape:var(--cx-image-corner-shape, var(--corner-shape, round))}.cx-image{display:block;width:100%;height:100%;object-fit:var(--cx-image-object-fit, cover)}:host(.cx-image-host--clickable) .cx-image{cursor:pointer}.cx-image__fallback{display:flex;width:100%;height:100%;min-width:calc(var(--space-2xl) + var(--space-md));min-height:calc(var(--space-2xl) + var(--space-md));align-items:center;justify-content:center;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);box-sizing:border-box;border:var(--line-discreet);border-radius:inherit;corner-shape:inherit;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-align:center}"] }]
        }], propDecorators: { image: [{
                type: Input
            }], loading: [{
                type: Input
            }], fallbackText: [{
                type: Input
            }], imageClick: [{
                type: Output
            }] } });
function normalizeCxImage(image) {
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
function calculateImageStyleVars(image) {
    return {
        '--cx-image-width': resolveImageSizeValue(image.width),
        '--cx-image-height': resolveImageSizeValue(image.height),
        '--cx-image-max-width': image.maxWidth === 'auto' ? 'none' : resolveImageSizeValue(image.maxWidth),
        '--cx-image-max-height': image.maxHeight === 'auto' ? 'none' : resolveImageSizeValue(image.maxHeight),
        '--cx-image-object-fit': image.objectFit,
        '--cx-image-border-radius': resolveImageRadiusValue(image.borderRadius),
        '--cx-image-corner-shape': image.borderRadius === 'round' ? 'round' : 'var(--corner-shape, round)',
    };
}
function resolveImageSizeValue(size) {
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
function resolveImageRadiusValue(radius) {
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
