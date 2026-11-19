import { ChangeDetectionStrategy, Component, Input, booleanAttribute, computed, inject, signal, } from "@angular/core";
import { CxIconComponent } from "../cx-icon/index.js";
import { CxSpinnerComponent } from "../../feedback/cx-spinner/index.js";
import { filePreviewKind, parseDelimitedPreview, readPreviewBytes, } from "../../overlay/cx-lightbox/file-preview.js";
import { CX_THUMBNAIL_PDF_RENDERER, } from "./thumbnail.types.js";
import * as i0 from "@angular/core";
export class CxThumbnailComponent {
    file;
    previewSrc;
    variant = "default";
    fit = "contain";
    borderRadius = "default";
    loading = false;
    renderPdf = inject(CX_THUMBNAIL_PDF_RENDERER, {
        optional: true,
    });
    controller;
    timer;
    objectUrl;
    state = signal("loading", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "state" }] : /* istanbul ignore next */ []));
    imageSource = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "imageSource" }] : /* istanbul ignore next */ []));
    imageVersion = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "imageVersion" }] : /* istanbul ignore next */ []));
    images = computed(() => this.imageSource()
        ? [{ src: this.imageSource(), key: this.imageVersion() }]
        : [], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "images" }] : /* istanbul ignore next */ []));
    text = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "text" }] : /* istanbul ignore next */ []));
    rows = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rows" }] : /* istanbul ignore next */ []));
    get label() {
        const state = this.state();
        return `${state === "ready" ? this.file.alt?.trim() || this.file.name : this.file.name}: ${state === "loading" ? "loading preview" : state === "empty" ? "empty file" : state === "unavailable" ? "preview unavailable" : "preview"}`;
    }
    get fileType() {
        const extension = this.file.name.includes(".")
            ? this.file.name.split(".").at(-1)
            : "File";
        return extension.length <= 10 ? extension.toUpperCase() : "File";
    }
    ngOnChanges() {
        if (!this.file?.src?.trim() || !this.file.name?.trim())
            throw new Error("[cx-thumbnail] file requires non-empty src and name.");
        if (this.fit !== "contain" && this.fit !== "cover")
            throw new Error("[cx-thumbnail] fit must be contain or cover.");
        if (this.variant !== "default" && this.variant !== "page")
            throw new Error("[cx-thumbnail] variant must be default or page.");
        if (this.borderRadius !== "default" && this.borderRadius !== "none")
            throw new Error("[cx-thumbnail] borderRadius must be default or none.");
        this.release();
        // A changed file description or fit may retain the same URL. Remount the
        // image so its already-completed load cannot leave the new state waiting.
        this.imageVersion.update((value) => value + 1);
        this.imageSource.set("");
        this.text.set("");
        this.rows.set([]);
        this.state.set("loading");
        if (this.loading)
            return;
        const controller = new AbortController();
        this.controller = controller;
        this.timer = setTimeout(() => {
            controller.abort();
            this.imageSource.set("");
            this.state.set("unavailable");
        }, 15000);
        const kind = filePreviewKind(this.file);
        if (this.previewSrc?.trim() || kind === "image") {
            this.imageSource.set(this.previewSrc?.trim() || this.file.src);
        }
        else if (["text", "markdown", "table"].includes(kind) ||
            (kind === "pdf" && this.renderPdf)) {
            void this.loadDocument(controller, kind);
        }
        else {
            this.finish("unavailable");
        }
    }
    imageLoaded(key) {
        if (key === this.imageVersion())
            this.finish("ready");
    }
    imageFailed(key) {
        if (key !== this.imageVersion())
            return;
        this.imageSource.set("");
        if (this.objectUrl)
            URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = undefined;
        this.finish("unavailable");
    }
    async loadDocument(controller, kind) {
        try {
            const response = await fetch(this.file.src, {
                signal: controller.signal,
            });
            const bytes = await readPreviewBytes(response, kind === "pdf" ? 25 * 1024 * 1024 : 1024 * 1024);
            if (controller.signal.aborted)
                return;
            if (!bytes.length) {
                this.finish("empty");
                return;
            }
            if (kind === "pdf") {
                if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-")
                    throw new Error("Invalid PDF");
                const blob = await this.renderPdf(bytes, controller.signal);
                if (controller.signal.aborted)
                    return;
                this.objectUrl = URL.createObjectURL(blob);
                this.imageSource.set(this.objectUrl);
                return;
            }
            const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
            if (!text.trim()) {
                this.finish("empty");
                return;
            }
            if (kind === "table") {
                const tab = this.file.mimeType?.split(";")[0] === "text/tab-separated-values" ||
                    this.file.name.toLowerCase().endsWith(".tsv");
                this.rows.set(parseDelimitedPreview(text, tab ? "\t" : ",")
                    .rows.slice(0, 8)
                    .map((row) => row.slice(0, 5).map((cell) => cell.slice(0, 100))));
            }
            else {
                this.text.set(text.split(/\r?\n/).slice(0, 24).join("\n").slice(0, 4000));
            }
            this.finish("ready");
        }
        catch {
            if (!controller.signal.aborted)
                this.finish("unavailable");
        }
    }
    finish(state) {
        clearTimeout(this.timer);
        this.state.set(state);
    }
    release() {
        clearTimeout(this.timer);
        this.controller?.abort();
        if (this.objectUrl)
            URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = undefined;
    }
    ngOnDestroy() {
        this.release();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxThumbnailComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxThumbnailComponent, isStandalone: true, selector: "cx-thumbnail", inputs: { file: "file", previewSrc: "previewSrc", variant: "variant", fit: "fit", borderRadius: "borderRadius", loading: ["loading", "loading", booleanAttribute] }, usesOnChanges: true, ngImport: i0, template: "<div\n  class=\"cx-thumbnail\"\n  [class.cx-thumbnail--square]=\"borderRadius === 'none'\"\n  [class.cx-thumbnail--page]=\"variant === 'page'\"\n  role=\"img\"\n  [attr.aria-label]=\"label\"\n  [attr.aria-busy]=\"state() === 'loading'\"\n  [attr.data-state]=\"state()\"\n>\n  <div class=\"cx-thumbnail__content\" aria-hidden=\"true\">\n    @for (image of images(); track image.key) {\n      <img\n        class=\"cx-thumbnail__image\"\n        [class.cx-thumbnail__image--cover]=\"fit === 'cover'\"\n        [src]=\"image.src\"\n        alt=\"\"\n        draggable=\"false\"\n        (load)=\"imageLoaded(image.key)\"\n        (error)=\"imageFailed(image.key)\"\n      />\n    }\n    @if (state() === \"ready\" && text()) {\n      <pre class=\"cx-thumbnail__text\">{{ text() }}</pre>\n    }\n    @if (state() === \"ready\" && rows().length) {\n      <div class=\"cx-thumbnail__sheet\">\n        <table>\n          <tbody>\n            @for (row of rows(); track $index; let first = $first) {\n              <tr>\n                @for (cell of row; track $index) {\n                  @if (first) {\n                    <th>{{ cell }}</th>\n                  } @else {\n                    <td>{{ cell }}</td>\n                  }\n                }\n              </tr>\n            }\n          </tbody>\n        </table>\n      </div>\n    }\n    @if (state() === \"loading\") {\n      <div class=\"cx-thumbnail__state\">\n        <cx-spinner size=\"small\" /><span>Loading preview</span>\n      </div>\n    } @else if (state() === \"unavailable\" || state() === \"empty\") {\n      <div class=\"cx-thumbnail__state\">\n        @if (state() === \"empty\") {\n          <cx-icon icon=\"document\" size=\"32\" /><span>{{ fileType }}</span>\n        }\n        <span>{{\n          state() === \"empty\" ? \"Empty file\" : \"Preview unavailable\"\n        }}</span>\n      </div>\n    }\n  </div>\n</div>\n", styles: [":host{display:block;min-width:0;width:100%}.cx-thumbnail{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:var(--radius-md);background:var(--opacity-low);color:var(--ink)}.cx-thumbnail__content{position:absolute;inset:0;overflow:hidden}.cx-thumbnail--square{border-radius:var(--radius-none)}.cx-thumbnail__image{position:absolute;top:var(--space-md);left:var(--space-md);width:calc(100% - var(--space-md) - var(--space-md));height:calc(100% - var(--space-md) - var(--space-md));object-fit:contain;object-position:center;box-sizing:border-box}.cx-thumbnail__image--cover{object-fit:cover}.cx-thumbnail__text,.cx-thumbnail__sheet{position:absolute;inset:var(--space-md);margin:0;overflow:hidden;background:var(--surface);color:var(--ink);padding:var(--space-md);font-size:var(--font-size-body-sm);line-height:var(--line-height-relaxed)}.cx-thumbnail__text{font-family:var(--font-family-mono);white-space:pre}.cx-thumbnail__sheet{padding:0}table{width:max-content;min-width:100%;border-collapse:collapse}th,td{padding:var(--space-xs);border:var(--line-discreet);white-space:nowrap;text-align:start}th{font-weight:var(--font-weight-medium);background:var(--opacity-low)}.cx-thumbnail__state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-xs);padding:var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body-sm)}[data-state=loading] .cx-thumbnail__image{visibility:hidden}.cx-thumbnail--page .cx-thumbnail__image{height:calc(100% - var(--space-md));object-fit:cover;object-position:top center}.cx-thumbnail--page .cx-thumbnail__text,.cx-thumbnail--page .cx-thumbnail__sheet{bottom:0}.cx-thumbnail--page .cx-thumbnail__image,.cx-thumbnail--page .cx-thumbnail__text,.cx-thumbnail--page .cx-thumbnail__sheet{border-radius:var(--radius-sm) var(--radius-sm) 0 0}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxThumbnailComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-thumbnail", imports: [CxIconComponent, CxSpinnerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-thumbnail\"\n  [class.cx-thumbnail--square]=\"borderRadius === 'none'\"\n  [class.cx-thumbnail--page]=\"variant === 'page'\"\n  role=\"img\"\n  [attr.aria-label]=\"label\"\n  [attr.aria-busy]=\"state() === 'loading'\"\n  [attr.data-state]=\"state()\"\n>\n  <div class=\"cx-thumbnail__content\" aria-hidden=\"true\">\n    @for (image of images(); track image.key) {\n      <img\n        class=\"cx-thumbnail__image\"\n        [class.cx-thumbnail__image--cover]=\"fit === 'cover'\"\n        [src]=\"image.src\"\n        alt=\"\"\n        draggable=\"false\"\n        (load)=\"imageLoaded(image.key)\"\n        (error)=\"imageFailed(image.key)\"\n      />\n    }\n    @if (state() === \"ready\" && text()) {\n      <pre class=\"cx-thumbnail__text\">{{ text() }}</pre>\n    }\n    @if (state() === \"ready\" && rows().length) {\n      <div class=\"cx-thumbnail__sheet\">\n        <table>\n          <tbody>\n            @for (row of rows(); track $index; let first = $first) {\n              <tr>\n                @for (cell of row; track $index) {\n                  @if (first) {\n                    <th>{{ cell }}</th>\n                  } @else {\n                    <td>{{ cell }}</td>\n                  }\n                }\n              </tr>\n            }\n          </tbody>\n        </table>\n      </div>\n    }\n    @if (state() === \"loading\") {\n      <div class=\"cx-thumbnail__state\">\n        <cx-spinner size=\"small\" /><span>Loading preview</span>\n      </div>\n    } @else if (state() === \"unavailable\" || state() === \"empty\") {\n      <div class=\"cx-thumbnail__state\">\n        @if (state() === \"empty\") {\n          <cx-icon icon=\"document\" size=\"32\" /><span>{{ fileType }}</span>\n        }\n        <span>{{\n          state() === \"empty\" ? \"Empty file\" : \"Preview unavailable\"\n        }}</span>\n      </div>\n    }\n  </div>\n</div>\n", styles: [":host{display:block;min-width:0;width:100%}.cx-thumbnail{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:var(--radius-md);background:var(--opacity-low);color:var(--ink)}.cx-thumbnail__content{position:absolute;inset:0;overflow:hidden}.cx-thumbnail--square{border-radius:var(--radius-none)}.cx-thumbnail__image{position:absolute;top:var(--space-md);left:var(--space-md);width:calc(100% - var(--space-md) - var(--space-md));height:calc(100% - var(--space-md) - var(--space-md));object-fit:contain;object-position:center;box-sizing:border-box}.cx-thumbnail__image--cover{object-fit:cover}.cx-thumbnail__text,.cx-thumbnail__sheet{position:absolute;inset:var(--space-md);margin:0;overflow:hidden;background:var(--surface);color:var(--ink);padding:var(--space-md);font-size:var(--font-size-body-sm);line-height:var(--line-height-relaxed)}.cx-thumbnail__text{font-family:var(--font-family-mono);white-space:pre}.cx-thumbnail__sheet{padding:0}table{width:max-content;min-width:100%;border-collapse:collapse}th,td{padding:var(--space-xs);border:var(--line-discreet);white-space:nowrap;text-align:start}th{font-weight:var(--font-weight-medium);background:var(--opacity-low)}.cx-thumbnail__state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-xs);padding:var(--space-sm);color:var(--opacity-high);font-size:var(--font-size-body-sm)}[data-state=loading] .cx-thumbnail__image{visibility:hidden}.cx-thumbnail--page .cx-thumbnail__image{height:calc(100% - var(--space-md));object-fit:cover;object-position:top center}.cx-thumbnail--page .cx-thumbnail__text,.cx-thumbnail--page .cx-thumbnail__sheet{bottom:0}.cx-thumbnail--page .cx-thumbnail__image,.cx-thumbnail--page .cx-thumbnail__text,.cx-thumbnail--page .cx-thumbnail__sheet{border-radius:var(--radius-sm) var(--radius-sm) 0 0}"] }]
        }], propDecorators: { file: [{
                type: Input,
                args: [{ required: true }]
            }], previewSrc: [{
                type: Input
            }], variant: [{
                type: Input
            }], fit: [{
                type: Input
            }], borderRadius: [{
                type: Input
            }], loading: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }] } });
