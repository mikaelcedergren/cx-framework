import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CxIconComponent } from "../cx-icon";
import { CxSpinnerComponent } from "../../feedback/cx-spinner";
import {
  filePreviewKind,
  parseDelimitedPreview,
  readPreviewBytes,
} from "../../overlay/cx-lightbox/file-preview";
import {
  CX_THUMBNAIL_PDF_RENDERER,
  type CxThumbnailFile,
  type CxThumbnailFit,
  type CxThumbnailVariant,
} from "./thumbnail.types";

@Component({
  selector: "cx-thumbnail",
  imports: [CxIconComponent, CxSpinnerComponent],
  templateUrl: "./cx-thumbnail.component.html",
  styleUrl: "./cx-thumbnail.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxThumbnailComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) file!: CxThumbnailFile;
  @Input() previewSrc: string | undefined;
  @Input() variant: CxThumbnailVariant = "default";
  @Input() fit: CxThumbnailFit = "contain";
  @Input() borderRadius: "default" | "none" = "default";
  @Input({ transform: booleanAttribute }) loading = false;

  private readonly renderPdf = inject(CX_THUMBNAIL_PDF_RENDERER, {
    optional: true,
  });
  private controller?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private objectUrl?: string;
  protected readonly state = signal<
    "loading" | "ready" | "unavailable" | "empty"
  >("loading");
  protected readonly imageSource = signal("");
  private readonly imageVersion = signal(0);
  protected readonly images = computed(() =>
    this.imageSource()
      ? [{ src: this.imageSource(), key: this.imageVersion() }]
      : [],
  );
  protected readonly text = signal("");
  protected readonly rows = signal<string[][]>([]);
  protected get label(): string {
    const state = this.state();
    return `${state === "ready" ? this.file.alt?.trim() || this.file.name : this.file.name}: ${state === "loading" ? "loading preview" : state === "empty" ? "empty file" : state === "unavailable" ? "preview unavailable" : "preview"}`;
  }
  protected get fileType(): string {
    const extension = this.file.name.includes(".")
      ? this.file.name.split(".").at(-1)!
      : "File";
    return extension.length <= 10 ? extension.toUpperCase() : "File";
  }

  ngOnChanges(): void {
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
    if (this.loading) return;
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
    } else if (
      ["text", "markdown", "table"].includes(kind) ||
      (kind === "pdf" && this.renderPdf)
    ) {
      void this.loadDocument(controller, kind);
    } else {
      this.finish("unavailable");
    }
  }

  protected imageLoaded(key: number): void {
    if (key === this.imageVersion()) this.finish("ready");
  }
  protected imageFailed(key: number): void {
    if (key !== this.imageVersion()) return;
    this.imageSource.set("");
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
    this.finish("unavailable");
  }
  private async loadDocument(
    controller: AbortController,
    kind: string,
  ): Promise<void> {
    try {
      const response = await fetch(this.file.src, {
        signal: controller.signal,
      });
      const bytes = await readPreviewBytes(
        response,
        kind === "pdf" ? 25 * 1024 * 1024 : 1024 * 1024,
      );
      if (controller.signal.aborted) return;
      if (!bytes.length) {
        this.finish("empty");
        return;
      }
      if (kind === "pdf") {
        if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-")
          throw new Error("Invalid PDF");
        const blob = await this.renderPdf!(bytes, controller.signal);
        if (controller.signal.aborted) return;
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
        const tab =
          this.file.mimeType?.split(";")[0] === "text/tab-separated-values" ||
          this.file.name.toLowerCase().endsWith(".tsv");
        this.rows.set(
          parseDelimitedPreview(text, tab ? "\t" : ",")
            .rows.slice(0, 8)
            .map((row) => row.slice(0, 5).map((cell) => cell.slice(0, 100))),
        );
      } else {
        this.text.set(
          text.split(/\r?\n/).slice(0, 24).join("\n").slice(0, 4000),
        );
      }
      this.finish("ready");
    } catch {
      if (!controller.signal.aborted) this.finish("unavailable");
    }
  }
  private finish(state: "ready" | "unavailable" | "empty"): void {
    clearTimeout(this.timer);
    this.state.set(state);
  }
  private release(): void {
    clearTimeout(this.timer);
    this.controller?.abort();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
  }
  ngOnDestroy(): void {
    this.release();
  }
}
