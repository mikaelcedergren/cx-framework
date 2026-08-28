import { EventEmitter } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { type CxIconSize } from '../../media/cx-icon';
import * as i0 from "@angular/core";
export type CxReactionSize = 'small' | 'default' | 'large';
/**
 * A compact toggle for reacting with an icon and showing a running count.
 * `selected` reflects whether the current user has reacted; the component is
 * controlled, emitting the intended next value through `selectedChange`.
 */
export declare class CxReactionComponent {
    icon: CxIconName;
    count: number;
    selected: boolean;
    size: CxReactionSize;
    disabled: boolean;
    readonly: boolean;
    ariaLabel: string;
    readonly selectedChange: EventEmitter<boolean>;
    protected get hasCount(): boolean;
    protected get resolvedIconSize(): CxIconSize;
    protected toggle(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxReactionComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxReactionComponent, "cx-reaction", never, { "icon": { "alias": "icon"; "required": false; }; "count": { "alias": "count"; "required": false; }; "selected": { "alias": "selected"; "required": false; }; "size": { "alias": "size"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "readonly": { "alias": "readonly"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, { "selectedChange": "selectedChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-reaction.component.d.ts.map