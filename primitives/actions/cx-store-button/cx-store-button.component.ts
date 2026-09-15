import { DOCUMENT } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  LOCALE_ID,
  OnChanges,
  inject,
} from "@angular/core";
import { STORE_BUTTON_ARTWORK } from "./store-button-artwork";

export type CxStoreButtonStore = "app-store" | "google-play";
export type CxStoreButtonSize = "default" | "large";
export type CxStoreButtonLanguage = "en" | "sv";

/** Validates the destination without requesting the listing or changing the supplied URL. */
export function isCxStoreButtonHref(
  href: string,
  store: CxStoreButtonStore,
): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    return false;
  if (store === "app-store") {
    return (
      url.hostname === "apps.apple.com" &&
      /^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id\d+\/?$/.test(url.pathname)
    );
  }
  return (
    store === "google-play" &&
    url.hostname === "play.google.com" &&
    url.pathname === "/store/apps/details" &&
    !!url.searchParams.get("id")?.trim()
  );
}

const LABELS = {
  en: {
    "app-store": "Download on the App Store",
    "google-play": "Get it on Google Play",
  },
  sv: {
    "app-store": "Hämta i App Store",
    "google-play": "Ladda ned på Google Play",
  },
} as const;

@Component({
  selector: "cx-store-button",
  templateUrl: "./cx-store-button.component.html",
  styleUrl: "./cx-store-button.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStoreButtonComponent implements OnChanges {
  private readonly document = inject(DOCUMENT);
  private readonly locale = inject(LOCALE_ID);

  @Input({ required: true }) href = "";
  @Input() store: CxStoreButtonStore = "app-store";
  @Input() size: CxStoreButtonSize = "default";
  @Input() language: CxStoreButtonLanguage | undefined = undefined;
  @Input() appName = "";

  ngOnChanges(): void {
    if (!isCxStoreButtonHref(this.href, this.store)) {
      throw new Error(
        "cx-store-button: href must be an HTTPS app listing URL for the selected store.",
      );
    }
    if (this.size !== "default" && this.size !== "large") {
      throw new Error("cx-store-button: size must be default or large.");
    }
    if (
      this.language !== undefined &&
      this.language !== "en" &&
      this.language !== "sv"
    ) {
      throw new Error(
        "cx-store-button: language must be en, sv, or omitted for the page language.",
      );
    }
  }

  protected get resolvedLanguage(): CxStoreButtonLanguage {
    const language =
      this.language ?? (this.document.documentElement.lang || this.locale);
    return language.toLowerCase().split("-")[0] === "sv" ? "sv" : "en";
  }

  protected get artwork() {
    return STORE_BUTTON_ARTWORK[this.store][this.resolvedLanguage];
  }

  protected get accessibleName(): string {
    const label = LABELS[this.resolvedLanguage][this.store];
    return this.appName.trim() ? `${label} — ${this.appName.trim()}` : label;
  }
}
