import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewEncapsulation,
  afterEveryRender,
  inject,
} from "@angular/core";

export type CxHeroVariant = "cover" | "split" | "stacked";
export type CxHeroAlign = "start" | "center";
export type CxHeroMediaPosition = "top" | "center" | "bottom";

const HERO_VARIANTS: readonly CxHeroVariant[] = ["cover", "split", "stacked"];
const HERO_ALIGNMENTS: readonly CxHeroAlign[] = ["start", "center"];
const HERO_MEDIA_POSITIONS: readonly CxHeroMediaPosition[] = [
  "top",
  "center",
  "bottom",
];

/**
 * Page introduction for a public, editorial, or marketing surface.
 *
 * The hero owns one h1, its supporting hierarchy, the placement of optional
 * projected content, and three complete responsive compositions. The parent
 * still owns where the hero sits and whether that region is full bleed.
 */
@Component({
  selector: "cx-hero",
  templateUrl: "./cx-hero.component.html",
  styleUrl: "./cx-hero.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The pattern must size direct projected media. All selectors remain scoped
  // beneath cx-hero and never reach into another component's internals.
  encapsulation: ViewEncapsulation.None,
  host: {
    "[attr.data-variant]": "variant",
    "[attr.data-align]": "align",
    "[attr.data-media-position]": "mediaPosition",
  },
})
export class CxHeroComponent implements AfterContentInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private contentReady = false;

  private variantValue: CxHeroVariant = "cover";
  private alignValue: CxHeroAlign = "start";
  private mediaPositionValue: CxHeroMediaPosition = "center";

  constructor() {
    afterEveryRender(() => {
      if (this.contentReady && this.resolvedHeading()) {
        this.validateComposition();
      }
    });
  }

  /** Required page heading. Empty text removes the whole hero. */
  @Input({ required: true }) heading = "";

  /** Responsive composition. Split and cover require projected media. */
  @Input()
  public set variant(value: CxHeroVariant) {
    this.variantValue = validateOption("variant", value, HERO_VARIANTS);
  }
  public get variant(): CxHeroVariant {
    return this.variantValue;
  }

  /** Copy alignment. Split heroes accept start only. */
  @Input()
  public set align(value: CxHeroAlign) {
    this.alignValue = validateOption("align", value, HERO_ALIGNMENTS);
  }
  public get align(): CxHeroAlign {
    return this.alignValue;
  }

  /** Coarse vertical crop position for cover media. */
  @Input()
  public set mediaPosition(value: CxHeroMediaPosition) {
    this.mediaPositionValue = validateOption(
      "mediaPosition",
      value,
      HERO_MEDIA_POSITIONS,
    );
  }
  public get mediaPosition(): CxHeroMediaPosition {
    return this.mediaPositionValue;
  }

  public ngAfterContentInit(): void {
    this.contentReady = true;
  }

  protected resolvedHeading(): string {
    return this.heading.trim();
  }

  private validateComposition(): void {
    if (this.variantValue === "split" && this.alignValue !== "start") {
      throw new Error('[cx-hero] split variant requires align="start".');
    }

    if (
      (this.variantValue === "split" || this.variantValue === "cover") &&
      !this.hasProjectedMedia()
    ) {
      throw new Error(
        `[cx-hero] ${this.variantValue} variant requires the media slot.`,
      );
    }
  }

  private hasProjectedMedia(): boolean {
    const media = this.host.nativeElement.querySelector<HTMLElement>(
      ":scope > .cx-hero > .cx-hero__media",
    );
    return Boolean(
      media && (media.childElementCount > 0 || media.textContent?.trim()),
    );
  }
}

function validateOption<T extends string>(
  name: string,
  value: T,
  supported: readonly T[],
): T {
  if (!supported.includes(value)) {
    throw new Error(`[cx-hero] ${name} must be ${supported.join(", ")}.`);
  }
  return value;
}
