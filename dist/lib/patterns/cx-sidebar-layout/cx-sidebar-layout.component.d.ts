import * as i0 from "@angular/core";
export type CxSidebarLayoutPlacement = "start" | "end";
export type CxSidebarLayoutMobilePlacement = "before" | "after";
export declare class CxSidebarLayoutComponent {
    private placementValue;
    private mobilePlacementValue;
    /** Sidebar position in narrow layouts and the document reading order. */
    set mobilePlacement(value: CxSidebarLayoutMobilePlacement);
    get mobilePlacement(): CxSidebarLayoutMobilePlacement;
    /** Side occupied by the sidebar on wide layouts. */
    set placement(value: CxSidebarLayoutPlacement);
    get placement(): CxSidebarLayoutPlacement;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxSidebarLayoutComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxSidebarLayoutComponent, "cx-sidebar-layout", never, { "mobilePlacement": { "alias": "mobilePlacement"; "required": false; }; "placement": { "alias": "placement"; "required": false; }; }, {}, never, ["[sidebar]", "*"], true, never>;
}
//# sourceMappingURL=cx-sidebar-layout.component.d.ts.map