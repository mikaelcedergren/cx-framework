import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxSsoProvider = 'google' | 'apple' | 'microsoft' | 'sso';
export type CxSsoAction = 'sign-in' | 'sign-up' | 'continue';
export type CxSsoSize = 'small' | 'default' | 'large';
export declare class CxSsoButtonComponent {
    private readonly loadingState;
    private readonly sizeState;
    provider: CxSsoProvider;
    action: CxSsoAction;
    disabled: boolean;
    set size(value: CxSsoSize | undefined);
    set loading(value: boolean);
    readonly pressed: EventEmitter<MouseEvent>;
    protected readonly loading$: import("@angular/core").Signal<boolean>;
    protected readonly size$: import("@angular/core").Signal<CxSsoSize>;
    protected readonly label$: import("@angular/core").Signal<string>;
    protected onClick(event: MouseEvent): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSsoButtonComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSsoButtonComponent, "cx-sso-button", never, { "provider": { "alias": "provider"; "required": false; }; "action": { "alias": "action"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "size": { "alias": "size"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; }, { "pressed": "pressed"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-sso-button.component.d.ts.map