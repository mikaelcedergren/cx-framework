import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  afterEveryRender,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CxTextFieldComponent } from "../../primitives/inputs/cx-text-field";
import { CxOptionComponent } from "../../primitives/overlay/cx-option";
import { CxShortcutKeyComponent } from "../../primitives/display/cx-shortcut-key";
import {
  CxOverlayStateService,
  type CxOverlayStateHandle,
} from "../../primitives/overlay/overlay-state";
import { isHostVisible } from "../../primitives/shared/host-visibility";
import {
  filterLauncherItems,
  validateLauncherItems,
  type CxLauncherItem,
} from "./launcher-items";

let nextLauncherId = 0;

@Component({
  selector: "cx-launcher",
  imports: [
    A11yModule,
    CxTextFieldComponent,
    CxOptionComponent,
    CxShortcutKeyComponent,
  ],
  templateUrl: "./cx-launcher.component.html",
  styleUrl: "./cx-launcher.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLauncherComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly itemsState = signal<readonly CxLauncherItem[]>([]);
  private readonly openState = signal(false);
  private readonly queryState = signal("");
  private readonly activeIdState = signal<string | undefined>(undefined);
  private overlayHandle?: CxOverlayStateHandle;
  private focusPending = false;
  private scrollPending = false;
  private pointerPosition?: string;
  private readonly focusListener = () => this.keepFocusInside();

  @ViewChild("root", { read: ElementRef })
  private root?: ElementRef<HTMLElement>;
  @ViewChild("results", { read: ElementRef })
  private results?: ElementRef<HTMLElement>;
  @ViewChild(CxTextFieldComponent) private search?: CxTextFieldComponent;

  protected readonly listId = `cx-launcher-${++nextLauncherId}-items`;
  protected readonly open$ = this.openState.asReadonly();
  protected readonly query$ = this.queryState.asReadonly();
  protected readonly results$ = computed(() =>
    filterLauncherItems(this.itemsState(), this.queryState()),
  );
  protected readonly activeItem$ = computed(() => {
    const items = this.results$();
    return (
      items.find(
        (item) => item.id === this.activeIdState() && !item.disabled,
      ) ?? items.find((item) => !item.disabled)
    );
  });
  protected readonly activeControlId$ = computed(() => {
    const item = this.activeItem$();
    return item ? this.optionId(this.results$().indexOf(item)) : undefined;
  });
  protected readonly empty$ = computed(() => this.itemsState().length === 0);
  protected readonly trapsFocus = signal(false);

  constructor() {
    afterEveryRender(() => {
      const ownsFocus =
        this.openState() && this.overlayState.isTopmost(this.overlayHandle);
      this.trapsFocus.set(ownsFocus);
      if (!ownsFocus) return;
      if (this.focusPending) {
        this.focusPending = false;
        this.search?.focus();
      }
      if (this.scrollPending) {
        this.scrollPending = false;
        const activeId = this.activeControlId$();
        const active = activeId ? this.document.getElementById(activeId) : null;
        const list = this.results?.nativeElement;
        if (active && list) {
          const itemRect = active.getBoundingClientRect();
          const listRect = list.getBoundingClientRect();
          const style = this.document.defaultView?.getComputedStyle(list);
          const top =
            listRect.top + Number.parseFloat(style?.paddingTop ?? "0");
          const bottom =
            listRect.bottom - Number.parseFloat(style?.paddingBottom ?? "0");
          if (itemRect.top < top) list.scrollTop -= top - itemRect.top;
          else if (itemRect.bottom > bottom)
            list.scrollTop += itemRect.bottom - bottom;
        }
      }
    });
  }

  @Input()
  set items(value: readonly CxLauncherItem[]) {
    validateLauncherItems(value);
    this.itemsState.set(value);
    this.scrollPending = true;
  }

  @Input()
  set open(value: boolean) {
    if (this.openState() === value) return;
    if (value) {
      this.queryState.set("");
      this.activeIdState.set(undefined);
      this.pointerPosition = undefined;
      this.focusPending = true;
      this.scrollPending = true;
      this.openState.set(true);
      this.overlayHandle = this.overlayState.capture({
        surface: () => this.root?.nativeElement,
        isActive: () =>
          this.openState() && isHostVisible(this.root?.nativeElement),
        onEscape: () => this.dismiss(),
      });
      this.document.addEventListener("focusin", this.focusListener);
    } else {
      this.document.removeEventListener("focusin", this.focusListener);
      this.overlayState.release(this.overlayHandle);
      this.overlayHandle = undefined;
      this.openState.set(false);
    }
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly select = new EventEmitter<string>();

  ngOnDestroy(): void {
    this.document.removeEventListener("focusin", this.focusListener);
    this.overlayState.release(this.overlayHandle);
  }

  protected optionId(index: number): string {
    return `${this.listId}-${index}`;
  }

  protected onQuery(value: string): void {
    this.queryState.set(value);
    this.activeIdState.set(undefined);
    this.scrollPending = true;
    if (this.results) this.results.nativeElement.scrollTop = 0;
  }

  protected onPointer(event: PointerEvent, item: CxLauncherItem): void {
    // A keyboard scroll under a stationary pointer must not change the active row.
    const position = `${event.clientX}:${event.clientY}`;
    if (position === this.pointerPosition) return;
    this.pointerPosition = position;
    if (!item.disabled) this.activeIdState.set(item.id);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !this.overlayState.isTopmost(this.overlayHandle)
    )
      return;
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      const item = this.activeItem$();
      if (item) this.activate(item);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    event.stopPropagation();
    const items = this.results$().filter((item) => !item.disabled);
    if (!items.length) return;
    const current = items.findIndex(
      (item) => item.id === this.activeItem$()?.id,
    );
    const step = event.key === "ArrowDown" ? 1 : -1;
    this.activeIdState.set(
      items[(current + step + items.length) % items.length].id,
    );
    this.scrollPending = true;
  }

  protected activate(item: CxLauncherItem): void {
    if (
      item.disabled ||
      !this.openState() ||
      !this.overlayState.isTopmost(this.overlayHandle)
    )
      return;
    this.dismiss();
    this.select.emit(item.id);
  }

  protected dismiss(): void {
    this.open = false;
    this.openChange.emit(false);
  }

  protected onBackdrop(event: MouseEvent): void {
    if (
      event.target === event.currentTarget &&
      this.overlayState.isTopmost(this.overlayHandle)
    )
      this.dismiss();
  }

  private keepFocusInside(): void {
    if (
      this.openState() &&
      this.overlayState.isTopmost(this.overlayHandle) &&
      !this.root?.nativeElement.contains(this.document.activeElement)
    )
      this.search?.focus();
  }
}
