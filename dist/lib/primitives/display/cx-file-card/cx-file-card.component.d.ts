import { EventEmitter } from "@angular/core";
import { type CxThumbnailFile, type CxThumbnailVariant } from "../../media/cx-thumbnail";
import { type CxMenuItem } from "../../overlay/cx-menu";
import * as i0 from "@angular/core";
export declare class CxFileCardComponent {
    file: CxThumbnailFile;
    previewSrc: string | undefined;
    thumbnailVariant: CxThumbnailVariant;
    metadata: string | undefined;
    interactive: boolean;
    loading: boolean;
    menuItems: readonly CxMenuItem[];
    protected get fileFormat(): string;
    readonly pressed: EventEmitter<void>;
    readonly menuItemSelect: EventEmitter<string>;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxFileCardComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxFileCardComponent, "cx-file-card", never, { "file": { "alias": "file"; "required": true; }; "previewSrc": { "alias": "previewSrc"; "required": false; }; "thumbnailVariant": { "alias": "thumbnailVariant"; "required": false; }; "metadata": { "alias": "metadata"; "required": false; }; "interactive": { "alias": "interactive"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "menuItems": { "alias": "menuItems"; "required": false; }; }, { "pressed": "pressed"; "menuItemSelect": "menuItemSelect"; }, never, ["[slot=meta]"], true, never>;
    static ngAcceptInputType_interactive: unknown;
    static ngAcceptInputType_loading: unknown;
}
//# sourceMappingURL=cx-file-card.component.d.ts.map