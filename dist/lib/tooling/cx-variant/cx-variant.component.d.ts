import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export interface CxVariantOption {
    id: string;
    label: string;
}
export declare class CxVariantComponent {
    private readonly tabButtons;
    protected readonly panelId: string;
    private readonly variantsState;
    private readonly selectedVariantState;
    set variants(value: readonly CxVariantOption[] | null | undefined);
    set selectedVariant(value: string | undefined);
    readonly selectedVariantChange: EventEmitter<string>;
    protected readonly variants$: import("@angular/core").Signal<readonly CxVariantOption[]>;
    protected readonly selectedVariant$: import("@angular/core").Signal<string>;
    protected readonly selectedVariantIndex$: import("@angular/core").Signal<number>;
    protected readonly selectedTabId$: import("@angular/core").Signal<string | null>;
    protected selectVariant(variantId: string): void;
    protected tabId(index: number): string;
    protected onTabKeydown(event: KeyboardEvent, index: number): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxVariantComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxVariantComponent, "cx-variant", never, { "variants": { "alias": "variants"; "required": false; }; "selectedVariant": { "alias": "selectedVariant"; "required": false; }; }, { "selectedVariantChange": "selectedVariantChange"; }, never, ["[cxVariantPreview]"], true, never>;
}
//# sourceMappingURL=cx-variant.component.d.ts.map