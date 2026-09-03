import { EventEmitter, OnDestroy } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { type CxButtonMood, type CxButtonSize } from '../cx-button';
import * as i0 from "@angular/core";
export type CxIconButtonVariant = 'default' | 'transparent';
export declare class CxIconButtonComponent implements OnDestroy {
    icon: CxIconName;
    ariaLabel: string;
    /** Optional semantic role when the button participates in a composite widget such as a menu. */
    role?: string;
    ariaHasPopup?: string;
    ariaExpanded?: boolean;
    ariaControls?: string;
    mood: CxButtonMood;
    variant: CxIconButtonVariant;
    size: CxButtonSize;
    selected: boolean;
    ariaPressed: boolean | undefined;
    rounded: boolean;
    disabled: boolean;
    badgeValue: string | undefined;
    /** Stretch to the full width of the host's container (e.g. a full-row add button). */
    block: boolean;
    get blockClass(): boolean;
    readonly pressed: EventEmitter<void>;
    readonly countdownChange: EventEmitter<boolean>;
    private readonly delayedLoading;
    private readonly countdownState;
    set loading(value: boolean);
    set countdown(value: boolean);
    protected readonly loading$: import("@angular/core").Signal<boolean>;
    protected readonly showSpinner$: import("@angular/core").Signal<boolean>;
    protected readonly countdownActive$: import("@angular/core").Signal<boolean>;
    protected hasBadge(): boolean;
    protected hasBadgeCount(): boolean;
    protected badgeCount(): number | undefined;
    ngOnDestroy(): void;
    protected onClick(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxIconButtonComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxIconButtonComponent, "cx-icon-button", never, { "icon": { "alias": "icon"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "role": { "alias": "role"; "required": false; }; "ariaHasPopup": { "alias": "ariaHasPopup"; "required": false; }; "ariaExpanded": { "alias": "ariaExpanded"; "required": false; }; "ariaControls": { "alias": "ariaControls"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; "size": { "alias": "size"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; "ariaPressed": { "alias": "ariaPressed"; "required": false; }; "rounded": { "alias": "rounded"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "badgeValue": { "alias": "badgeValue"; "required": false; }; "block": { "alias": "block"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "countdown": { "alias": "countdown"; "required": false; }; }, { "pressed": "pressed"; "countdownChange": "countdownChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-icon-button.component.d.ts.map