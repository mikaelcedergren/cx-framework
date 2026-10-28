import { ChangeDetectionStrategy, Component } from "@angular/core";

/** Visual destination only; the collection owns drag behavior and placement. */
@Component({
  selector: "cx-drop-indicator",
  templateUrl: "./cx-drop-indicator.component.html",
  styleUrl: "./cx-drop-indicator.component.scss",
  host: { "aria-hidden": "true", inert: "" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDropIndicatorComponent {}
