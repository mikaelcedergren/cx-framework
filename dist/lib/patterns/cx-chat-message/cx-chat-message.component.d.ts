import { type CxIconName } from '../../icons/manifest';
import { type CxTagColor } from '../../primitives/display/cx-tag';
import * as i0 from "@angular/core";
export interface CxChatMessageStatus {
    readonly label: string;
    readonly color: CxTagColor;
    readonly icon?: CxIconName;
}
export declare class CxChatMessageComponent {
    private readonly thread;
    private readonly authorIdState;
    private readonly authorState;
    private readonly timestampState;
    private readonly statusState;
    set authorId(value: string | undefined);
    set author(value: string | undefined);
    set timestamp(value: string | undefined);
    set status(value: CxChatMessageStatus | undefined);
    protected readonly timestamp$: import("@angular/core").Signal<string>;
    protected readonly status$: import("@angular/core").Signal<CxChatMessageStatus | undefined>;
    protected readonly isSelf$: import("@angular/core").Signal<boolean>;
    protected readonly authorLabel$: import("@angular/core").Signal<string>;
    protected readonly hasHeader$: import("@angular/core").Signal<boolean>;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxChatMessageComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxChatMessageComponent, "cx-chat-message", never, { "authorId": { "alias": "authorId"; "required": false; }; "author": { "alias": "author"; "required": false; }; "timestamp": { "alias": "timestamp"; "required": false; }; "status": { "alias": "status"; "required": false; }; }, {}, never, ["*"], true, never>;
}
//# sourceMappingURL=cx-chat-message.component.d.ts.map