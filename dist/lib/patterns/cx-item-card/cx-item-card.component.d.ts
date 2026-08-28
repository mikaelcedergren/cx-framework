import { type CxIconName } from '../../icons/manifest';
import * as i0 from "@angular/core";
export type CxItemCardVariant = 'default' | 'outline' | 'transparent';
/**
 * A horizontal item row: a leading icon, a title and description, and a trailing
 * slot for one control (a switch, button, or select). Use it for settings rows,
 * device lists, and similar "label + action" collections. The trailing control
 * is projected and keeps its own behaviour; the card only owns the layout.
 */
export declare class CxItemCardComponent {
    heading: string;
    description: string | undefined;
    icon: CxIconName | undefined;
    variant: CxItemCardVariant;
    protected get hasDescription(): boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxItemCardComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxItemCardComponent, "cx-item-card", never, { "heading": { "alias": "heading"; "required": false; }; "description": { "alias": "description"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "variant": { "alias": "variant"; "required": false; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-item-card.component.d.ts.map