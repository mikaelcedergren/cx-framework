import { InjectionToken } from "@angular/core";

/** A file's identity, shared structurally with Lightbox files. */
export interface CxThumbnailFile {
  src: string;
  name: string;
  mimeType?: string;
  alt?: string;
}

export type CxThumbnailFit = "contain" | "cover";
export type CxThumbnailVariant = "default" | "page";

/** Products supply their PDF renderer; the framework adds no PDF dependency. */
export type CxThumbnailPdfRenderer = (
  bytes: Uint8Array<ArrayBuffer>,
  signal: AbortSignal,
) => Promise<Blob>;

export const CX_THUMBNAIL_PDF_RENDERER =
  new InjectionToken<CxThumbnailPdfRenderer>("CX_THUMBNAIL_PDF_RENDERER");
