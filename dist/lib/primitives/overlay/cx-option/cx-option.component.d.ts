import { type OnChanges, type SimpleChanges } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxOptionMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxOptionSubmenu = 'none' | 'open' | 'closed';
export declare class CxOptionComponent implements OnChanges {
    label: string;
    description?: string;
    prependIcon?: CxIconName;
    appendIcon?: CxIconName;
    shortcutParts: readonly string[] | undefined;
    submenu: CxOptionSubmenu;
    mood: CxOptionMood;
    active: boolean;
    selected: boolean;
    selectedHighlight: boolean;
    showCheckbox: boolean;
    clickable: boolean;
    disabled: boolean;
    /**
     * ARIA role for the underlying control. Left undefined by default so shared
     * consumers (cx-dropdown, cx-table, cx-tag-field) keep the native button role.
     * cx-menu passes "menuitem".
     */
    role?: string;
    /** Position within a partially rendered set (1-based); virtualized listboxes pass this. */
    ariaPosInSet?: number;
    /** Total size of a partially rendered set; virtualized listboxes pass this. */
    ariaSetSize?: number;
    private controlRef?;
    private labelContentRef?;
    private appendSlotRef?;
    private controlSlotRef?;
    ngOnChanges(_changes: SimpleChanges): void;
    /** Move keyboard focus to the option's control. */
    focus(options?: FocusOptions): void;
    protected hasAppendOnlyLayout(): boolean;
    protected hasShortcut(): boolean;
    protected appendIconName(): CxIconName | undefined;
    protected showPrependIcon(): CxIconName | undefined;
    protected ariaSelectedValue(): string | null;
    protected ariaCheckedValue(): string | null;
    protected stopControlEvent(event: Event): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxOptionComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxOptionComponent, "cx-option", never, { "label": { "alias": "label"; "required": false; }; "description": { "alias": "description"; "required": false; }; "prependIcon": { "alias": "prependIcon"; "required": false; }; "appendIcon": { "alias": "appendIcon"; "required": false; }; "shortcutParts": { "alias": "shortcutParts"; "required": false; }; "submenu": { "alias": "submenu"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "active": { "alias": "active"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; "selectedHighlight": { "alias": "selectedHighlight"; "required": false; }; "showCheckbox": { "alias": "showCheckbox"; "required": false; }; "clickable": { "alias": "clickable"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "role": { "alias": "role"; "required": false; }; "ariaPosInSet": { "alias": "ariaPosInSet"; "required": false; }; "ariaSetSize": { "alias": "ariaSetSize"; "required": false; }; }, {}, never, ["[append]", "[control]"], true, never>;
}
//# sourceMappingURL=cx-option.component.d.ts.map