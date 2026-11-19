import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, booleanAttribute, } from "@angular/core";
import { CxThumbnailComponent, } from "../../media/cx-thumbnail/index.js";
import { filePreviewKind } from "../../overlay/cx-lightbox/file-preview.js";
import { CxIconButtonComponent } from "../../actions/cx-icon-button/index.js";
import { CxTooltipDirective } from "../../overlay/cx-tooltip/index.js";
import { CxMenuComponent, CxMenuTriggerDirective, } from "../../overlay/cx-menu/index.js";
import * as i0 from "@angular/core";
export class CxFileCardComponent {
    file;
    previewSrc;
    thumbnailVariant = "default";
    metadata;
    interactive = false;
    loading = false;
    menuItems = [];
    get fileFormat() {
        const kind = filePreviewKind(this.file);
        if (kind === "image")
            return "Image";
        if (kind === "pdf")
            return "PDF";
        if (kind === "markdown")
            return "Markdown";
        const extension = this.file.name.match(/\.([a-z0-9]{1,10})$/i)?.[1];
        if (extension)
            return extension.toUpperCase();
        const mime = this.file.mimeType?.split(";")[0]?.trim().toLowerCase();
        if (mime === "text/csv")
            return "CSV";
        if (mime === "text/tab-separated-values")
            return "TSV";
        if (mime === "application/json")
            return "JSON";
        if (kind === "text")
            return "Text";
        if (kind === "video")
            return "Video";
        if (kind === "audio")
            return "Audio";
        return "File";
    }
    pressed = new EventEmitter();
    menuItemSelect = new EventEmitter();
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxFileCardComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxFileCardComponent, isStandalone: true, selector: "cx-file-card", inputs: { file: "file", previewSrc: "previewSrc", thumbnailVariant: "thumbnailVariant", metadata: "metadata", interactive: ["interactive", "interactive", booleanAttribute], loading: ["loading", "loading", booleanAttribute], menuItems: "menuItems" }, outputs: { pressed: "pressed", menuItemSelect: "menuItemSelect" }, ngImport: i0, template: "<div class=\"cx-file-card\">\n  @if (interactive) {\n    <button\n      type=\"button\"\n      class=\"cx-file-card__activation\"\n      [attr.aria-label]=\"file.name\"\n      [cxTooltip]=\"file.name\"\n      (click)=\"pressed.emit()\"\n    ></button>\n  }\n  <div class=\"cx-file-card__content\">\n    <cx-thumbnail\n      [file]=\"file\"\n      [previewSrc]=\"previewSrc\"\n      [variant]=\"thumbnailVariant\"\n      [loading]=\"loading\"\n      borderRadius=\"none\"\n    />\n    <div class=\"cx-file-card__caption\">\n      <div class=\"cx-file-card__identity\">\n        <div\n          class=\"cx-file-card__name\"\n          [cxTooltip]=\"file.name\"\n          [cxTooltipOverflow]=\"true\"\n        >\n          {{ file.name }}\n        </div>\n        <div class=\"cx-file-card__metadata\">\n          <ng-content select=\"[slot=meta]\">{{\n            metadata?.trim() || fileFormat\n          }}</ng-content>\n        </div>\n      </div>\n      @if (menuItems.length) {\n        <cx-menu\n          class=\"cx-file-card__menu\"\n          [presentation]=\"{ kind: 'trigger' }\"\n          [items]=\"menuItems\"\n          [ariaLabel]=\"file.name + ' actions'\"\n          align=\"end\"\n          (itemSelect)=\"menuItemSelect.emit($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            variant=\"transparent\"\n            [ariaLabel]=\"'Actions for ' + file.name\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-file-card{position:relative;min-width:0;border:var(--line);border-radius:var(--radius-media-lg);background:var(--surface)}.cx-file-card__content{overflow:hidden;border-radius:inherit}.cx-file-card__activation{position:absolute;inset:0;z-index:1;width:100%;border:0;border-radius:inherit;padding:0;background:rgba(0,0,0,0);cursor:pointer;transition:background var(--motion-fast) var(--ease-out);outline:none}.cx-file-card__activation:hover{background:var(--opacity-low)}.cx-file-card__activation:active{background:var(--opacity-darken)}.cx-file-card__activation:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-file-card__caption{border-top:1px solid var(--opacity-low);display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-md)}.cx-file-card__identity{min-width:0;flex:1}.cx-file-card__name{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:var(--line-height-relaxed)}.cx-file-card__metadata{color:var(--opacity-high);font-size:var(--font-size-body-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:var(--line-height-relaxed)}.cx-file-card__menu{position:relative;z-index:2;flex:0 0 auto}@media(prefers-reduced-motion: reduce){.cx-file-card__activation{transition:none}}"], dependencies: [{ kind: "component", type: CxThumbnailComponent, selector: "cx-thumbnail", inputs: ["file", "previewSrc", "variant", "fit", "borderRadius", "loading"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxMenuComponent, selector: "cx-menu", inputs: ["disabled", "presentation", "ariaLabel", "heading", "items", "groups", "currentId", "shortcutsEnabled", "open", "align", "placement", "layout", "width"], outputs: ["openChange", "itemSelect", "currentIdChange"] }, { kind: "directive", type: CxMenuTriggerDirective, selector: "[cxMenuTrigger]" }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxFileCardComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-file-card", imports: [
                        CxThumbnailComponent,
                        CxIconButtonComponent,
                        CxMenuComponent,
                        CxMenuTriggerDirective,
                        CxTooltipDirective,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-file-card\">\n  @if (interactive) {\n    <button\n      type=\"button\"\n      class=\"cx-file-card__activation\"\n      [attr.aria-label]=\"file.name\"\n      [cxTooltip]=\"file.name\"\n      (click)=\"pressed.emit()\"\n    ></button>\n  }\n  <div class=\"cx-file-card__content\">\n    <cx-thumbnail\n      [file]=\"file\"\n      [previewSrc]=\"previewSrc\"\n      [variant]=\"thumbnailVariant\"\n      [loading]=\"loading\"\n      borderRadius=\"none\"\n    />\n    <div class=\"cx-file-card__caption\">\n      <div class=\"cx-file-card__identity\">\n        <div\n          class=\"cx-file-card__name\"\n          [cxTooltip]=\"file.name\"\n          [cxTooltipOverflow]=\"true\"\n        >\n          {{ file.name }}\n        </div>\n        <div class=\"cx-file-card__metadata\">\n          <ng-content select=\"[slot=meta]\">{{\n            metadata?.trim() || fileFormat\n          }}</ng-content>\n        </div>\n      </div>\n      @if (menuItems.length) {\n        <cx-menu\n          class=\"cx-file-card__menu\"\n          [presentation]=\"{ kind: 'trigger' }\"\n          [items]=\"menuItems\"\n          [ariaLabel]=\"file.name + ' actions'\"\n          align=\"end\"\n          (itemSelect)=\"menuItemSelect.emit($event)\"\n        >\n          <cx-icon-button\n            cxMenuTrigger\n            icon=\"menu-vertical\"\n            variant=\"transparent\"\n            [ariaLabel]=\"'Actions for ' + file.name\"\n          />\n        </cx-menu>\n      }\n    </div>\n  </div>\n</div>\n", styles: [":host{display:block;width:100%;min-width:0}.cx-file-card{position:relative;min-width:0;border:var(--line);border-radius:var(--radius-media-lg);background:var(--surface)}.cx-file-card__content{overflow:hidden;border-radius:inherit}.cx-file-card__activation{position:absolute;inset:0;z-index:1;width:100%;border:0;border-radius:inherit;padding:0;background:rgba(0,0,0,0);cursor:pointer;transition:background var(--motion-fast) var(--ease-out);outline:none}.cx-file-card__activation:hover{background:var(--opacity-low)}.cx-file-card__activation:active{background:var(--opacity-darken)}.cx-file-card__activation:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-file-card__caption{border-top:1px solid var(--opacity-low);display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-md)}.cx-file-card__identity{min-width:0;flex:1}.cx-file-card__name{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:var(--line-height-relaxed)}.cx-file-card__metadata{color:var(--opacity-high);font-size:var(--font-size-body-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:var(--line-height-relaxed)}.cx-file-card__menu{position:relative;z-index:2;flex:0 0 auto}@media(prefers-reduced-motion: reduce){.cx-file-card__activation{transition:none}}"] }]
        }], propDecorators: { file: [{
                type: Input,
                args: [{ required: true }]
            }], previewSrc: [{
                type: Input
            }], thumbnailVariant: [{
                type: Input
            }], metadata: [{
                type: Input
            }], interactive: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], loading: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], menuItems: [{
                type: Input
            }], pressed: [{
                type: Output
            }], menuItemSelect: [{
                type: Output
            }] } });
