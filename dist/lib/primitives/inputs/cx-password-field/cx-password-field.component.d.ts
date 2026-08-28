import { EventEmitter, OnDestroy } from '@angular/core';
import { type CxFieldValidation, type CxFieldSize } from '../shared/field.types';
import * as i0 from "@angular/core";
export declare class CxPasswordFieldComponent implements OnDestroy {
    private static nextId;
    private readonly valueState;
    private readonly focusedState;
    private readonly revealedState;
    private readonly revealStepState;
    private readonly validationState;
    private revealSecondsValue;
    private firstStepTimer;
    private stepTimer;
    private hideTimer;
    protected readonly labelId: string;
    protected readonly messagesId: string;
    private readonly fieldRef?;
    label: string;
    ariaLabel: string | undefined;
    name: string | undefined;
    autocomplete: string;
    hint: string | undefined;
    optional: boolean;
    disabled: boolean;
    loading: boolean;
    clearable: boolean;
    size: CxFieldSize;
    /**
     * Seconds the password stays revealed before it auto-hides. Defaults to 6.
     */
    set revealSeconds(value: number | undefined);
    get revealSeconds(): number;
    set value(value: string | undefined);
    set validation(value: CxFieldValidation | null | undefined);
    readonly valueChange: EventEmitter<string>;
    readonly focusChange: EventEmitter<boolean>;
    readonly revealedChange: EventEmitter<boolean>;
    protected readonly value$: import("@angular/core").Signal<string>;
    protected readonly isFocused$: import("@angular/core").Signal<boolean>;
    protected readonly revealed$: import("@angular/core").Signal<boolean>;
    protected readonly validationMessages$: () => readonly import("../shared/field.types").CxRenderedValidationMessage[];
    protected readonly hasError$: () => boolean;
    protected readonly showHint$: () => boolean;
    protected readonly hasClear$: () => boolean;
    ngOnDestroy(): void;
    protected get resolvedAriaLabel(): string | undefined;
    protected get resolvedAriaLabelledBy(): string | undefined;
    protected get resolvedAriaDescribedBy(): string | undefined;
    protected get resolvedName(): string | null;
    protected get resolvedAutocomplete(): string | null;
    focus(): void;
    protected onInput(event: Event): void;
    protected onFocus(): void;
    protected onBlur(): void;
    protected onEscapeKey(): void;
    protected onToggle(): void;
    protected onClear(event: MouseEvent): void;
    private reveal;
    private hide;
    private stopCountdown;
    private stopStepTimers;
    private setRevealStep;
    protected revealOffsetStyle(): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxPasswordFieldComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxPasswordFieldComponent, "cx-password-field", never, { "label": { "alias": "label"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "name": { "alias": "name"; "required": false; }; "autocomplete": { "alias": "autocomplete"; "required": false; }; "hint": { "alias": "hint"; "required": false; }; "optional": { "alias": "optional"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "clearable": { "alias": "clearable"; "required": false; }; "size": { "alias": "size"; "required": false; }; "revealSeconds": { "alias": "revealSeconds"; "required": false; }; "value": { "alias": "value"; "required": false; }; "validation": { "alias": "validation"; "required": false; }; }, { "valueChange": "valueChange"; "focusChange": "focusChange"; "revealedChange": "revealedChange"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-password-field.component.d.ts.map