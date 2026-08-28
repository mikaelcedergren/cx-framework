import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { type CxIconMood } from '../../media/cx-icon';
import * as i0 from "@angular/core";
export declare class CxBigRadioComponent {
    private readonly selectedState;
    private choiceContentRef?;
    heading: string;
    description: string;
    icon: CxIconName | undefined;
    iconMood: CxIconMood;
    disabled: boolean;
    set selected(selected: boolean);
    readonly selectedChange: EventEmitter<boolean>;
    readonly focusChange: EventEmitter<boolean>;
    protected readonly selected$: import("@angular/core").Signal<boolean>;
    protected visibleHeading$(): string;
    protected visibleDescription$(): string;
    protected activate(): void;
    protected onFocus(focused: boolean): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxBigRadioComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxBigRadioComponent, "cx-big-radio", never, { "heading": { "alias": "heading"; "required": false; }; "description": { "alias": "description"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "iconMood": { "alias": "iconMood"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; }, { "selectedChange": "selectedChange"; "focusChange": "focusChange"; }, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-big-radio.component.d.ts.map