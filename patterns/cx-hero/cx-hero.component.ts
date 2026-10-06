import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewEncapsulation,
  afterEveryRender,
  booleanAttribute,
  inject,
} from "@angular/core";

export type CxHeroLayout = "cover" | "split" | "stacked";
export type CxHeroVariant = "default" | "flush";
export type CxHeroMediaSide = "start" | "end";
export type CxHeroAlign = "start" | "center";
export type CxHeroMediaPosition = "top" | "center" | "bottom";

const HERO_LAYOUTS: readonly CxHeroLayout[] = ["cover", "split", "stacked"];
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
    "[attr.data-layout]": "layout",
    "[attr.data-variant]": "variant",
    "[attr.data-media-side]": "mediaSide",
    "[attr.data-align]": "align",
    "[attr.data-media-position]": "mediaPosition",
  },
})
export class CxHeroComponent implements AfterContentInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private contentReady = false;

  private layoutValue: CxHeroLayout = "stacked";
  private alignValue: CxHeroAlign = "start";
  private overlayOpacityValue = 0;
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

  /** Utility classes applied directly to the heading; empty keeps the default. */
  @Input() headingClass = "";

  /** Responsive composition. Split and cover require projected media. */
  @Input()
  public set layout(value: CxHeroLayout) {
    this.layoutValue = validateOption("layout", value, HERO_LAYOUTS);
  }
  public get layout(): CxHeroLayout {
    return this.layoutValue;
  }

  private variantValue: CxHeroVariant = "default";
  private mediaSideValue: CxHeroMediaSide = "end";

  /** Framing. Flush fills one half of a split hero to its outer edges. */
  @Input()
  public set variant(value: CxHeroVariant) {
    this.variantValue = validateOption("variant", value, ["default", "flush"]);
  }
  public get variant(): CxHeroVariant {
    return this.variantValue;
  }

  /** Desktop media side for split layouts. Narrow layouts always lead with copy. */
  @Input()
  public set mediaSide(value: CxHeroMediaSide) {
    this.mediaSideValue = validateOption("mediaSide", value, ["start", "end"]);
  }
  public get mediaSide(): CxHeroMediaSide {
    return this.mediaSideValue;
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

  /** Theme-surface overlay percentage. Zero leaves cover media untreated. */
  @Input()
  public set overlayOpacity(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(
        "[cx-hero] overlayOpacity must be a number from 0 to 100.",
      );
    }
    this.overlayOpacityValue = value;
  }
  public get overlayOpacity(): number {
    return this.overlayOpacityValue;
  }

  /** Smoothly blends the lower half of cover media into the default surface. */
  @Input({ transform: booleanAttribute }) fadeBottom = false;

  /** Gently moves cover media while foreground content stays still. */
  @Input({ transform: booleanAttribute }) parallax = false;

  /** Reserves space for an overlapping masthead while media extends behind it. */
  @Input({ transform: booleanAttribute }) underMasthead = false;

  public ngAfterContentInit(): void {
    this.contentReady = true;
  }

  protected resolvedHeading(): string {
    return this.heading.trim();
  }

  private validateComposition(): void {
    if (this.variant === "flush" && this.layout !== "split") {
      throw new Error('[cx-hero] variant="flush" requires layout="split".');
    }
    if (this.mediaSide === "start" && this.layout !== "split") {
      throw new Error('[cx-hero] mediaSide="start" requires layout="split".');
    }
    const caption = this.host.nativeElement.querySelector(".cx-hero__caption");
    if (
      caption &&
      (caption.childElementCount || caption.textContent?.trim()) &&
      (this.layout === "cover" || !this.hasProjectedMedia())
    ) {
      throw new Error(
        "[cx-hero] caption requires meaningful media in a stacked or split layout.",
      );
    }
    if (this.overlayOpacity > 0 && this.layoutValue !== "cover") {
      throw new Error('[cx-hero] overlayOpacity requires layout="cover".');
    }

    if (this.parallax && this.layoutValue !== "cover") {
      throw new Error('[cx-hero] parallax requires layout="cover".');
    }

    if (this.fadeBottom && this.layoutValue !== "cover") {
      throw new Error('[cx-hero] fadeBottom requires layout="cover".');
    }

    if (this.layoutValue === "split" && this.alignValue !== "start") {
      throw new Error('[cx-hero] split layout requires align="start".');
    }

    if (
      (this.layoutValue === "split" || this.layoutValue === "cover") &&
      !this.hasProjectedMedia()
    ) {
      throw new Error(
        `[cx-hero] ${this.layoutValue} layout requires the media slot.`,
      );
    }
  }

  private hasProjectedMedia(): boolean {
    const media = this.host.nativeElement.querySelector<HTMLElement>(
      ":scope > .cx-hero > .cx-hero__media > .cx-hero__visual",
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
