import { EventEmitter } from '@angular/core';
import { type CxMenuItem } from '../../primitives/overlay/cx-menu';
import * as i0 from "@angular/core";
export declare class CxAccountControlComponent {
    private readonly openState;
    private readonly menuItemsState;
    username: string;
    disabled: boolean;
    /**
     * Avatar-only presentation: the control owns its compact width and the
     * username moves into an instant tooltip. Also bind this to a navigation
     * rail's collapsed state; the same account menu remains available.
     */
    collapsed: boolean;
    set menuItems(value: CxMenuItem[] | undefined);
    readonly logout: EventEmitter<void>;
    readonly itemSelect: EventEmitter<string>;
    protected readonly open$: import("@angular/core").Signal<boolean>;
    protected readonly resolvedMenuItems$: import("@angular/core").Signal<CxMenuItem[]>;
    protected onOpenChange(open: boolean): void;
    protected onItemSelect(itemId: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxAccountControlComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxAccountControlComponent, "cx-account-control", never, { "username": { "alias": "username"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "collapsed": { "alias": "collapsed"; "required": false; }; "menuItems": { "alias": "menuItems"; "required": false; }; }, { "logout": "logout"; "itemSelect": "itemSelect"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-account-control.component.d.ts.map