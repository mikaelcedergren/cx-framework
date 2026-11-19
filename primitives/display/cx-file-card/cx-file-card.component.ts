import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
} from "@angular/core";
import {
  CxThumbnailComponent,
  type CxThumbnailFile,
  type CxThumbnailVariant,
} from "../../media/cx-thumbnail";
import { filePreviewKind } from "../../overlay/cx-lightbox/file-preview";
import { CxIconButtonComponent } from "../../actions/cx-icon-button";
import { CxTooltipDirective } from "../../overlay/cx-tooltip";
import {
  CxMenuComponent,
  CxMenuTriggerDirective,
  type CxMenuItem,
} from "../../overlay/cx-menu";

@Component({
  selector: "cx-file-card",
  imports: [
    CxThumbnailComponent,
    CxIconButtonComponent,
    CxMenuComponent,
    CxMenuTriggerDirective,
    CxTooltipDirective,
  ],
  templateUrl: "./cx-file-card.component.html",
  styleUrl: "./cx-file-card.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxFileCardComponent {
  @Input({ required: true }) file!: CxThumbnailFile;
  @Input() previewSrc: string | undefined;
  @Input() thumbnailVariant: CxThumbnailVariant = "default";
  @Input() metadata: string | undefined;
  @Input({ transform: booleanAttribute }) interactive = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input() menuItems: readonly CxMenuItem[] = [];
  protected get fileFormat(): string {
    const kind = filePreviewKind(this.file);
    if (kind === "image") return "Image";
    if (kind === "pdf") return "PDF";
    if (kind === "markdown") return "Markdown";
    const extension = this.file.name.match(/\.([a-z0-9]{1,10})$/i)?.[1];
    if (extension) return extension.toUpperCase();
    const mime = this.file.mimeType?.split(";")[0]?.trim().toLowerCase();
    if (mime === "text/csv") return "CSV";
    if (mime === "text/tab-separated-values") return "TSV";
    if (mime === "application/json") return "JSON";
    if (kind === "text") return "Text";
    if (kind === "video") return "Video";
    if (kind === "audio") return "Audio";
    return "File";
  }

  @Output() readonly pressed = new EventEmitter<void>();
  @Output() readonly menuItemSelect = new EventEmitter<string>();
}
