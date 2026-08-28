import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { type CxThemeMode } from '../../theme';
import { type CxMenuItem, type CxMenuPresentation } from '../../primitives/overlay/cx-menu';
import * as i0 from "@angular/core";
export type CxUtilityBarThemeMode = CxThemeMode;
export declare class CxUtilityBarComponent {
    private static instanceCounter;
    protected readonly headingId: string;
    protected readonly themeMenuItems: readonly CxMenuItem[];
    protected readonly themeMenuPresentation: CxMenuPresentation;
    heading: string;
    visible: boolean;
    themeMode: CxUtilityBarThemeMode | undefined;
    readonly themeModeChange: EventEmitter<"light" | "dark" | "night" | "aqua" | "high-contrast" | "wireframe" | "legacy">;
    protected resolvedHeading(): string;
    protected themeIcon(mode: CxUtilityBarThemeMode): CxIconName;
    protected themeTriggerLabel(mode: CxUtilityBarThemeMode): string;
    protected onThemeModeChange(value: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxUtilityBarComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxUtilityBarComponent, "cx-utility-bar", never, { "heading": { "alias": "heading"; "required": false; }; "visible": { "alias": "visible"; "required": false; }; "themeMode": { "alias": "themeMode"; "required": false; }; }, { "themeModeChange": "themeModeChange"; }, never, ["*", "[actions]"], true, never>;
    static ngAcceptInputType_visible: unknown;
}
//# sourceMappingURL=cx-utility-bar.component.d.ts.map