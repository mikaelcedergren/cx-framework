import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
/** Credit for the picture on display, shown quietly on the pane. */
export interface CxMuralAttribution {
    /** Who made the picture, e.g. the photographer. */
    name: string;
    /** Where the name links, e.g. the author's profile. */
    href?: string;
    /** Where the picture comes from, e.g. the provider. */
    source?: string;
    /** Where the source name links. */
    sourceHref?: string;
}
/** One picture the mural can show. */
export interface CxMuralImage {
    id: string;
    label: string;
    src: string;
    /** Smaller preview for the picker thumbnail; `src` paints when absent. */
    thumb?: string;
    /** Credit rendered on the pane while this picture is on display. */
    attribution?: CxMuralAttribution;
}
/**
 * A decorative image pane that fills its container and lets the user swap the
 * picture in place: hovering reveals a settings control, which turns the pane
 * into a picker. The picker browses the offered `images` and always carries a
 * search field: the query streams out through `search`, and the consumer
 * answers with `results` (plus `searchLoading`/`searchError` while it works).
 * Apply commits the choice through `valueChange`; Cancel or Escape leaves it
 * untouched.
 *
 * The mural is ornament, not content: the picture renders with an empty alt
 * and the container owns the pane's width, height, and placement. `value` is
 * the whole picture, so a committed choice paints without living in `images`
 * or `results`; while it is null the pane stays an empty frame with the
 * settings control held visible, so a first pick is always reachable. A
 * picture that carries `attribution` credits it on the pane, revealed with the
 * settings control. When the displayed picture fails to load the pane returns
 * to the empty frame and emits `imageError`, so the consumer can swap in a
 * fallback.
 */
export declare class CxMuralComponent {
    private readonly host;
    private readonly injector;
    /** The offered catalog, browsed while the search field is empty. */
    images: readonly CxMuralImage[];
    /** Pictures answering the current `search` query. */
    results: readonly CxMuralImage[];
    /** True while the consumer is answering the current query. */
    searchLoading: boolean;
    /** Why the current query cannot be answered; '' while search works. */
    searchError: string;
    private valueState;
    /** The picture on display; null keeps the pane an empty frame. */
    set value(value: CxMuralImage | null);
    get value(): CxMuralImage | null;
    /** Emits the picked picture when the user applies a different choice. */
    readonly valueChange: EventEmitter<CxMuralImage>;
    /** Emits the picker's debounced search query, including '' when cleared. */
    readonly search: EventEmitter<string>;
    /** Emits when the displayed picture fails to load; the pane falls back to the empty frame. */
    readonly imageError: EventEmitter<void>;
    protected readonly pickerOpen: import("@angular/core").WritableSignal<boolean>;
    protected readonly pending: import("@angular/core").WritableSignal<CxMuralImage | null>;
    protected readonly query: import("@angular/core").WritableSignal<string>;
    private readonly displayFailed;
    protected get displayImage(): CxMuralImage | null;
    protected onOpenPicker(): void;
    protected onQueryChange(query: string): void;
    protected onPick(option: CxMuralImage): void;
    protected onApply(): void;
    protected onCancel(): void;
    protected onEscape(event: Event): void;
    protected onImageError(): void;
    private closePicker;
    private afterRender;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxMuralComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxMuralComponent, "cx-mural", never, { "images": { "alias": "images"; "required": false; }; "results": { "alias": "results"; "required": false; }; "searchLoading": { "alias": "searchLoading"; "required": false; }; "searchError": { "alias": "searchError"; "required": false; }; "value": { "alias": "value"; "required": false; }; }, { "valueChange": "valueChange"; "search": "search"; "imageError": "imageError"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-mural.component.d.ts.map