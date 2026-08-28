import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxIconSize = '12' | '14' | '16' | '20' | '24' | '32' | '64' | 'auto';
export type CxIconMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxIconShape = 'none' | 'square-subtle' | 'square-solid' | 'square-outline' | 'circle-subtle' | 'circle-solid' | 'circle-outline';
type CxIconSizeInput = CxIconSize | number | string | undefined;
type CxIconSizeClass = CxIconSize | 'custom';
export declare class CxIconComponent {
    private sizeValue;
    private moodValue;
    private shapeValue;
    protected resolvedSize: string;
    protected resolvedSizeClass: CxIconSizeClass;
    icon: CxIconName | undefined;
    set size(value: CxIconSizeInput);
    get size(): CxIconSizeInput;
    set mood(value: CxIconMood | undefined);
    get mood(): CxIconMood;
    set shape(value: CxIconShape | undefined);
    get shape(): CxIconShape;
    protected get iconDefinition(): import("../../../public-api").CxIconDefinition | null;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxIconComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxIconComponent, "cx-icon", never, { "icon": { "alias": "icon"; "required": false; }; "size": { "alias": "size"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "shape": { "alias": "shape"; "required": false; }; }, {}, never, never, true, never>;
}
export {};
//# sourceMappingURL=cx-icon.component.d.ts.map