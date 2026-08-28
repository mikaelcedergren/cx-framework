import { type CxIconName } from '../../../icons/manifest';
import * as i0 from "@angular/core";
export type CxStatusTagMood = 'default' | 'info' | 'success' | 'warning' | 'danger';
export declare class CxStatusTagComponent {
    mood: CxStatusTagMood;
    text: string;
    icon: CxIconName | undefined;
    protected iconName(): CxIconName;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxStatusTagComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxStatusTagComponent, "cx-status-tag", never, { "mood": { "alias": "mood"; "required": false; }; "text": { "alias": "text"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-status-tag.component.d.ts.map