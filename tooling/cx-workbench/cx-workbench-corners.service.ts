import { DOCUMENT } from "@angular/common";
import { Injectable, inject, signal } from "@angular/core";

/** Document-wide so portaled menus and dialogs use the same preview profile. */
@Injectable({ providedIn: "root" })
export class CxWorkbenchCornersService {
  private readonly root = inject(DOCUMENT).documentElement;
  private owners = 0;
  private previouslySquare = false;
  readonly square = signal(false);

  retain(): () => void {
    if (this.owners++ === 0) {
      this.previouslySquare = this.root.classList.contains("cx-corners-square");
    }
    return () => {
      if (--this.owners === 0) this.setSquare(false);
    };
  }

  setSquare(square: boolean): void {
    this.square.set(square);
    this.root.classList.toggle(
      "cx-corners-square",
      square || this.previouslySquare,
    );
  }
}
