import { type CxIconName } from '../../../icons/manifest';
import { type CxAlertMood } from '../cx-alert';
import { type CxRenderedValidationMessage, type CxValidationMessage, type CxValidationMessageType } from '../../inputs/shared/field.types';
import * as i0 from "@angular/core";
export type CxValidationMessageDisplay = 'inline' | 'global';
export declare class CxValidationMessageComponent {
    private readonly displayState;
    private readonly showAllState;
    private readonly messagesState;
    set type(value: CxValidationMessageDisplay | null | undefined);
    set showAll(value: boolean | null | undefined);
    set messages(value: ReadonlyArray<CxValidationMessage> | null | undefined);
    protected readonly display$: import("@angular/core").Signal<CxValidationMessageDisplay>;
    protected readonly messages$: import("@angular/core").Signal<readonly CxRenderedValidationMessage[]>;
    protected iconFor(type: CxValidationMessageType): CxIconName | null;
    protected roleFor(type: CxValidationMessageType): 'alert' | 'status';
    protected alertMoodFor(type: CxValidationMessageType): CxAlertMood;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxValidationMessageComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxValidationMessageComponent, "cx-validation-message", never, { "type": { "alias": "type"; "required": false; }; "showAll": { "alias": "showAll"; "required": false; }; "messages": { "alias": "messages"; "required": false; }; }, {}, never, never, true, never>;
}
//# sourceMappingURL=cx-validation-message.component.d.ts.map