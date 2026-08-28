import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
export type CxQueryElementKind = 'insert' | 'field' | 'operator' | 'boolean' | 'parenthesis' | 'values';
export interface CxQueryElementData {
    id?: string;
    kind: CxQueryElementKind;
    label?: string;
    values?: readonly string[];
    valuesPrefix?: string;
    valuesDivider?: string;
    valuesSuffix?: string;
    focused?: boolean;
    disabled?: boolean;
    grouped?: boolean;
    tabIndex?: number;
    ariaLabel?: string;
}
export declare class CxQueryElementComponent {
    protected kind: CxQueryElementKind;
    protected label: string;
    protected values: readonly string[];
    protected valuesPrefix: string;
    protected valuesDivider: string;
    protected valuesSuffix: string;
    protected focused: boolean;
    protected disabled: boolean;
    protected grouped: boolean;
    protected tabIndex: number;
    protected ariaLabel: string | undefined;
    set data(value: CxQueryElementData | null | undefined);
    readonly pressed: EventEmitter<void>;
    protected isValues(): boolean;
    protected resolvedLabel(): string;
    protected resolvedText(): string;
    protected onPressed(event: MouseEvent): void;
    private defaultLabelFor;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxQueryElementComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxQueryElementComponent, "cx-query-element", never, { "data": { "alias": "data"; "required": false; }; }, { "pressed": "pressed"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-query-element.component.d.ts.map