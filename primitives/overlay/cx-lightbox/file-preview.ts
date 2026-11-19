/** The original file. Previewing never changes the download source. */
export interface CxLightboxFile {
  src: string;
  name: string;
  mimeType?: string;
  size?: number;
  alt?: string;
  caption?: string;
}

export type FilePreviewKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "markdown"
  | "table"
  | "unsupported";

const extensions: Record<string, FilePreviewKind> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  svg: "image",
  bmp: "image",
  pdf: "pdf",
  mp4: "video",
  webm: "video",
  ogv: "video",
  mov: "video",
  mp3: "audio",
  wav: "audio",
  oga: "audio",
  ogg: "audio",
  m4a: "audio",
  aac: "audio",
  flac: "audio",
  txt: "text",
  log: "text",
  json: "text",
  yaml: "text",
  yml: "text",
  xml: "text",
  html: "text",
  htm: "text",
  md: "markdown",
  markdown: "markdown",
  csv: "table",
  tsv: "table",
};

export function filePreviewKind(file: CxLightboxFile): FilePreviewKind {
  const mime = file.mimeType?.split(";")[0]?.trim().toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/markdown") return "markdown";
  if (mime === "text/csv" || mime === "text/tab-separated-values")
    return "table";
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  if (mime?.startsWith("audio/")) return "audio";
  // A generic text MIME must not hide a useful .md/.csv extension.
  const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
  if (
    !mime ||
    ["application/octet-stream", "binary/octet-stream", "text/plain"].includes(
      mime,
    )
  ) {
    return (
      extensions[extension] ?? (mime === "text/plain" ? "text" : "unsupported")
    );
  }
  if (
    mime.startsWith("text/") ||
    [
      "application/json",
      "application/xml",
      "application/yaml",
      "application/x-yaml",
    ].includes(mime)
  )
    return "text";
  return "unsupported";
}

export class PreviewError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
  ) {
    super(message);
  }
}

/** Cancel the stream at the limit, including when Content-Length is absent or wrong. */
export async function readPreviewBytes(
  response: Response,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new PreviewError(
      response.status === 401 || response.status === 403
        ? "You do not have access to this file."
        : "The file could not be loaded.",
      response.status !== 401 &&
        response.status !== 403 &&
        response.status !== 404,
    );
  }
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new PreviewError(
      "This file is too large to preview. Download it to see the whole file.",
    );
  }
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit)
        throw new PreviewError(
          "This file is too large to preview. Download it to see the whole file.",
        );
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

/** A bounded, read-only RFC 4180-style preview; the first record supplies headings. */
export function parseDelimitedPreview(
  text: string,
  delimiter: "," | "\t",
): { rows: string[][]; limited: boolean } {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;
  let limited = false;
  const pushCell = () => {
    if (row.length < 40) row.push(cell);
    else limited = true;
    cell = "";
    closedQuote = false;
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else cell += char;
    } else if (char === delimiter) {
      pushCell();
    } else if (char === "\r" || char === "\n") {
      pushCell();
      rows.push(row);
      row = [];
      if (char === "\r" && text[index + 1] === "\n") index++;
      if (rows.length === 201 && index < text.length - 1)
        return { rows, limited: true };
    } else if (char === '"' && !cell && !closedQuote) {
      quoted = true;
    } else {
      if (closedQuote || char === '"')
        throw new PreviewError(
          "This table could not be read. Download the original file.",
        );
      cell += char;
    }
  }
  if (quoted)
    throw new PreviewError(
      "This table could not be read. Download the original file.",
    );
  if (cell || row.length || closedQuote) {
    pushCell();
    rows.push(row);
  }
  return { rows, limited };
}
