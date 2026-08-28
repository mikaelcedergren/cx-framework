import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxExpansionPanelVariant = 'default' | 'flat';
export declare class CxExpansionPanelComponent {
    private readonly expandedState;
    /**
     * The words on the toggle, and the panel's whole name.
     *
     * The default says what the component is, the way `cx-toast` defaults to
     * "Notification" and `cx-drop-zone` to "Add a file". It used to say "Severity",
     * which is a field in a security product rather than anything a disclosure is —
     * a domain name that had leaked into a primitive and read as a mistake on every
     * other surface.
     *
     * Do not "tidy" this to `''`. The heading is the trigger button's only content,
     * so an empty one leaves that button with no accessible name at all, and the
     * expand control announcing "Expand " into silence. A generic word is worth
     * less than the real one and far more than nothing.
     */
    heading: string;
    variant: CxExpansionPanelVariant;
    set expanded(value: boolean | undefined);
    readonly expandedChange: EventEmitter<boolean>;
    protected readonly contentId: string;
    protected readonly expanded$: import("@angular/core").Signal<boolean>;
    protected toggle(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxExpansionPanelComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxExpansionPanelComponent, "cx-expansion-panel", never, { "heading": { "alias": "heading"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "expanded": { "alias": "expanded"; "required": false; }; }, { "expandedChange": "expandedChange"; }, never, ["[actions]", "*"], true, never>;
}
//# sourceMappingURL=cx-expansion-panel.component.d.ts.map