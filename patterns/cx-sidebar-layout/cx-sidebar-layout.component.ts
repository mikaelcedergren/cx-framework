import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";

export type CxSidebarLayoutPlacement = "start" | "end";
export type CxSidebarLayoutMobilePlacement = "before" | "after";

@Component({
  selector: "cx-sidebar-layout",
  imports: [NgTemplateOutlet],
  host: {
    "[attr.data-placement]": "placement",
    "[attr.data-mobile-placement]": "mobilePlacement",
  },
  templateUrl: "./cx-sidebar-layout.component.html",
  styleUrl: "./cx-sidebar-layout.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSidebarLayoutComponent {
  private placementValue: CxSidebarLayoutPlacement = "end";
  private mobilePlacementValue: CxSidebarLayoutMobilePlacement = "before";

  /** Sidebar position in narrow layouts and the document reading order. */
  @Input()
  set mobilePlacement(value: CxSidebarLayoutMobilePlacement) {
    if (value !== "before" && value !== "after") {
      throw new Error(
        '[cx-sidebar-layout] mobilePlacement must be "before" or "after".',
      );
    }
    this.mobilePlacementValue = value;
  }
  get mobilePlacement(): CxSidebarLayoutMobilePlacement {
    return this.mobilePlacementValue;
  }

  /** Side occupied by the sidebar on wide layouts. */
  @Input()
  set placement(value: CxSidebarLayoutPlacement) {
    if (value !== "start" && value !== "end") {
      throw new Error(
        '[cx-sidebar-layout] placement must be "start" or "end".',
      );
    }
    this.placementValue = value;
  }
  get placement(): CxSidebarLayoutPlacement {
    return this.placementValue;
  }
}
