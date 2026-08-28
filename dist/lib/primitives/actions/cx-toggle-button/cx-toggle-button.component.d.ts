import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxToggleButtonSize = 'default' | 'small';
export declare class CxToggleButtonComponent {
    private readonly selectedState;
    text: string;
    icon: CxIconName | undefined;
    iconSelected: CxIconName | undefined;
    size: CxToggleButtonSize;
    ariaLabel: string | undefined;
    disabled: boolean;
    set selected(value: boolean);
    readonly selectedChange: EventEmitter<boolean>;
    protected readonly selected$: import("@angular/core").Signal<boolean>;
    protected get displayIcon(): CxIconName | undefined;
    protected get visibleText(): string;
    protected get hasVisibleContent(): boolean;
    protected get isIconOnly(): boolean;
    protected get resolvedAriaLabel(): string | null;
    protected toggle(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxToggleButtonComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxToggleButtonComponent, "cx-toggle-button", never, { "text": { "alias": "text"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "iconSelected": { "alias": "iconSelected"; "required": false; }; "size": { "alias": "size"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; }, { "selectedChange": "selectedChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-toggle-button.component.d.ts.map