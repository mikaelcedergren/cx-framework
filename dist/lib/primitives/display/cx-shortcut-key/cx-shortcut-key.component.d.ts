import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export interface CxShortcutKeyItem {
    icon?: CxIconName;
    text?: string;
}
export declare class CxShortcutKeyComponent {
    parts: readonly string[] | undefined;
    protected items(): readonly CxShortcutKeyItem[];
    private normalizeParts;
    private classify;
    private sortByConvention;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxShortcutKeyComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxShortcutKeyComponent, "cx-shortcut-key", never, { "parts": { "alias": "parts"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-shortcut-key.component.d.ts.map