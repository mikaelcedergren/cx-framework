/** The original file. Previewing never changes the download source. */
export interface CxLightboxFile {
    src: string;
    name: string;
    mimeType?: string;
    size?: number;
    alt?: string;
    caption?: string;
}
export type FilePreviewKind = "image" | "pdf" | "video" | "audio" | "text" | "markdown" | "table" | "unsupported";
export declare function filePreviewKind(file: CxLightboxFile): FilePreviewKind;
export declare class PreviewError extends Error {
    readonly retryable: boolean;
    constructor(message: string, retryable?: boolean);
}
/** Cancel the stream at the limit, including when Content-Length is absent or wrong. */
export declare function readPreviewBytes(response: Response, limit: number): Promise<Uint8Array<ArrayBuffer>>;
/** A bounded, read-only RFC 4180-style preview; the first record supplies headings. */
export declare function parseDelimitedPreview(text: string, delimiter: "," | "\t"): {
    rows: string[][];
    limited: boolean;
};
//# sourceMappingURL=file-preview.d.ts.map