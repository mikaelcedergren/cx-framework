import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';
import { CxOptionGroupComponent } from '../../overlay/cx-option-group';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
  type CxFloatingSurfaceViewport,
} from '../../overlay/floating-surface-controller';
import { CxHostVisibilityObserver } from '../../shared/host-visibility';
import { CxTextFieldComponent } from '../cx-text-field';

const CX_LANGUAGE_SELECTOR_SEARCH_THRESHOLD = 8;
const CX_LANGUAGE_SELECTOR_MIN_WIDTH = 240;
const CX_LANGUAGE_SELECTOR_MAX_WIDTH = 360;
const CX_LANGUAGE_SELECTOR_MAX_HEIGHT = 360;
const CX_LANGUAGE_SELECTOR_FRAME_HEIGHT = 8;
const CX_LANGUAGE_SELECTOR_SEARCH_HEIGHT = 60;
const CX_LANGUAGE_SELECTOR_STATE_HEIGHT = 128;
const CX_LANGUAGE_SELECTOR_ROW_HEIGHT = 32;

export type CxLanguageOption = {
  id: string;
  label: string;
  flag: string;
  keywords?: readonly string[];
};

export type CxLanguageSelectorTranslations = Partial<{
  ariaLabel: string;
  search: string;
  recommended: string;
  allLanguages: string;
  noResults: string;
  noResultsDescription: string;
}>;

const CX_LANGUAGE_SELECTOR_DEFAULT_TRANSLATIONS = {
  ariaLabel: 'Language',
  search: 'Search languages',
  recommended: 'Recommended',
  allLanguages: 'All languages',
  noResults: 'No results',
  noResultsDescription: 'No matching languages.',
} satisfies Required<CxLanguageSelectorTranslations>;

@Component({
  selector: 'cx-language-selector',
  imports: [NgTemplateOutlet, CxIconComponent, CxOptionGroupComponent, CxPopoverComponent, CxTextFieldComponent],
  templateUrl: './cx-language-selector.component.html',
  styleUrl: './cx-language-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLanguageSelectorComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly instanceId = CxLanguageSelectorComponent.nextId++;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly languagesState = signal<readonly CxLanguageOption[]>([]);
  private readonly recommendedIdsState = signal<readonly string[]>([]);
  private readonly valueState = signal<string | undefined>(undefined);
  private readonly translationsState = signal<CxLanguageSelectorTranslations>({});
  private readonly openState = signal(false);
  private readonly searchState = signal('');
  private readonly hostVisibility = new CxHostVisibilityObserver(this.host.nativeElement, (visible) => {
    if (!visible && this.openState()) this.closePopover();
  });
  private openTracking = false;
  private focusTimer?: number;
  private contractValidationQueued = false;
  private reportedInvalidCollection = false;
  private reportedInvalidValue = false;

  protected readonly listboxId = `cx-language-selector-listbox-${this.instanceId}`;
  protected readonly popoverId = `cx-language-selector-popover-${this.instanceId}`;
  protected readonly popoverMaxWidth = CX_LANGUAGE_SELECTOR_MAX_WIDTH;

  @ViewChild('triggerButton', { read: ElementRef })
  private triggerButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('searchInput')
  private searchInputRef?: CxTextFieldComponent;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;
  @ViewChildren('optionButton', { read: ElementRef })
  private optionButtonRefs?: QueryList<ElementRef<HTMLButtonElement>>;

  protected readonly overlay = new CxFloatingSurfaceController((rect, viewport) => this.measureOverlay(rect, viewport));

  @Input()
  public set languages(value: readonly CxLanguageOption[] | null | undefined) {
    this.languagesState.set(value ?? []);
    this.scheduleContractValidation();
    if (this.openState()) queueMicrotask(() => this.overlay.sync());
  }

  @Input()
  public set recommendedIds(value: readonly string[] | null | undefined) {
    this.recommendedIdsState.set(value ?? []);
    this.scheduleContractValidation();
  }

  @Input()
  public set value(value: string | null | undefined) {
    this.valueState.set(value ?? undefined);
    this.scheduleContractValidation();
  }

  @Input()
  public set translations(value: CxLanguageSelectorTranslations | null | undefined) {
    this.translationsState.set(value ?? {});
  }

  @Output() readonly valueChange = new EventEmitter<string>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly searchQuery$ = this.searchState.asReadonly();
  protected readonly hasLanguages$ = computed(() => this.languagesState().length > 0);
  protected readonly showSearch$ = computed(() => this.languagesState().length > CX_LANGUAGE_SELECTOR_SEARCH_THRESHOLD);
  protected readonly selectedLanguage$ = computed(() => {
    const languages = this.languagesState();
    const explicit = this.valueState();
    if (explicit) {
      const selected = languages.find((language) => language.id === explicit);
      if (selected) return selected;
    }
    return this.resolveAutomaticLanguage(languages);
  });
  protected readonly recommendedLanguages$ = computed(() => {
    const byId = new Map(this.languagesState().map((language) => [language.id, language]));
    return this.unique(this.recommendedIdsState())
      .map((id) => byId.get(id))
      .filter((language): language is CxLanguageOption => language !== undefined);
  });
  protected readonly filteredLanguages$ = computed(() => {
    const query = this.normalizeSearch(this.searchState());
    if (!query) return this.languagesState();
    return this.languagesState().filter((language) => {
      const haystack = [language.label, language.id, ...(language.keywords ?? [])]
        .map((value) => this.normalizeSearch(value))
        .join(' ');
      return haystack.includes(query);
    });
  });
  protected readonly hasSearchQuery$ = computed(() => this.searchState().trim().length > 0);
  protected readonly showRecommended$ = computed(
    () => !this.hasSearchQuery$() && this.recommendedLanguages$().length > 0,
  );
  protected readonly triggerAriaLabel$ = computed(() => {
    const selected = this.selectedLanguage$();
    return selected ? `${this.translation('ariaLabel')}: ${selected.label}` : this.translation('ariaLabel');
  });

  public ngAfterViewInit(): void {
    this.overlay.setTrigger(this.triggerButtonRef?.nativeElement);
  }

  public ngOnDestroy(): void {
    this.stopOpenTracking();
    this.overlay.destroy();
    if (typeof window !== 'undefined' && this.focusTimer !== undefined) {
      window.clearTimeout(this.focusTimer);
    }
  }

  protected toggleOpen(trigger?: HTMLElement): void {
    if (this.openState()) {
      this.closePopover();
      return;
    }
    this.openPopover(trigger);
  }

  protected onTriggerKeydown(event: KeyboardEvent, trigger?: HTMLElement): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.openState()) {
        this.openPopover(trigger, event.key === 'ArrowUp' ? 'last' : this.showSearch$() ? 'search' : 'first');
      }
      return;
    }
    if (event.key === 'Escape' && this.openState()) {
      event.preventDefault();
      event.stopPropagation();
      this.closePopover();
      return;
    }
    if (this.showSearch$() && this.isPrintableKey(event)) {
      event.preventDefault();
      this.searchState.update((current) => current + event.key);
      if (this.openState()) this.focusSearch();
      else this.openPopover(trigger, 'search');
    }
  }

  protected onSearchChange(value: string): void {
    this.searchState.set(value);
    queueMicrotask(() => {
      this.optionButtonRefs?.first?.nativeElement.closest('.cx-language-selector__options')?.scrollTo({ top: 0 });
    });
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusOption('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusOption('last');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.activateFirstOption();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeAndFocusTrigger();
    }
  }

  protected onOptionKeydown(event: KeyboardEvent, language: CxLanguageOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectLanguage(language);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusRelativeOption(event.currentTarget, 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusRelativeOption(event.currentTarget, -1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focusOption('first');
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focusOption('last');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeAndFocusTrigger();
    } else if (event.key === 'Tab') {
      this.closePopover();
    } else if (this.showSearch$() && this.isPrintableKey(event)) {
      event.preventDefault();
      this.searchState.update((current) => current + event.key);
      this.focusSearch();
    }
  }

  protected selectLanguage(language: CxLanguageOption): void {
    this.valueState.set(language.id);
    this.valueChange.emit(language.id);
    this.closeAndFocusTrigger();
  }

  protected closePopover(): void {
    this.searchState.set('');
    this.setOpen(false);
  }

  protected translation(key: keyof CxLanguageSelectorTranslations): string {
    const value = this.translationsState()[key];
    return typeof value === 'string' && value.trim() ? value.trim() : CX_LANGUAGE_SELECTOR_DEFAULT_TRANSLATIONS[key];
  }

  private openPopover(trigger?: HTMLElement, focusTarget: 'search' | 'first' | 'last' = 'search'): void {
    this.overlay.setTrigger(trigger ?? this.triggerButtonRef?.nativeElement);
    this.setOpen(true);
    this.scheduleFocus(() => {
      this.overlay.sync();
      if (focusTarget === 'search' && this.showSearch$()) this.focusSearch();
      else this.focusOption(focusTarget === 'last' ? 'last' : 'first');
    });
  }

  private setOpen(open: boolean): void {
    if (this.openState() === open) return;
    this.openState.set(open);
    if (open) this.startOpenTracking();
    else {
      this.stopOpenTracking();
      this.overlay.endSession();
    }
  }

  private closeAndFocusTrigger(): void {
    this.closePopover();
    queueMicrotask(() => this.triggerButtonRef?.nativeElement.focus());
  }

  private focusSearch(): void {
    this.scheduleFocus(() => this.searchInputRef?.focus());
  }

  private focusOption(target: 'first' | 'last'): void {
    const buttons = this.optionButtons();
    const button = target === 'last' ? buttons[buttons.length - 1] : buttons[0];
    button?.focus();
  }

  private focusRelativeOption(currentTarget: EventTarget | null, direction: 1 | -1): void {
    const buttons = this.optionButtons();
    const current = currentTarget instanceof HTMLButtonElement ? currentTarget : undefined;
    const currentIndex = current ? buttons.indexOf(current) : -1;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0) {
      if (this.showSearch$()) this.focusSearch();
      else buttons[buttons.length - 1]?.focus();
      return;
    }
    if (nextIndex >= buttons.length) {
      buttons[0]?.focus();
      return;
    }
    buttons[nextIndex]?.focus();
  }

  private activateFirstOption(): void {
    this.optionButtons()[0]?.click();
  }

  private optionButtons(): HTMLButtonElement[] {
    return (this.optionButtonRefs?.toArray() ?? []).map((ref) => ref.nativeElement);
  }

  private scheduleFocus(callback: () => void): void {
    if (typeof window === 'undefined') {
      queueMicrotask(callback);
      return;
    }
    if (this.focusTimer !== undefined) window.clearTimeout(this.focusTimer);
    this.focusTimer = window.setTimeout(() => {
      this.focusTimer = undefined;
      callback();
    });
  }

  private readonly onCapturedDocumentScroll = (event: Event): void => {
    const target = event.target;
    if (target instanceof Node && this.popoverRef?.surfaceElement()?.contains(target)) return;
    if (this.openState() && this.hostVisibility.check()) this.overlay.sync();
  };

  private readonly onWindowResize = (): void => {
    if (this.openState() && this.hostVisibility.check()) this.overlay.sync();
  };

  private startOpenTracking(): void {
    if (this.openTracking) return;
    this.openTracking = true;
    this.hostVisibility.start();
    if (typeof document !== 'undefined') document.addEventListener('scroll', this.onCapturedDocumentScroll, true);
    if (typeof window !== 'undefined') window.addEventListener('resize', this.onWindowResize);
    this.overlay.observeTrigger(this.overlay.trigger, this.onWindowResize);
  }

  private stopOpenTracking(): void {
    this.hostVisibility.stop();
    if (!this.openTracking) return;
    this.openTracking = false;
    if (typeof document !== 'undefined') document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.onWindowResize);
    this.overlay.stopObservingTrigger();
  }

  private measureOverlay(rect: DOMRect, viewport: CxFloatingSurfaceViewport): CxFloatingSurfaceRequest {
    const viewportWidth = Math.max(viewport.width - 16, 0);
    const width = Math.floor(
      Math.min(Math.max(rect.width, CX_LANGUAGE_SELECTOR_MIN_WIDTH), CX_LANGUAGE_SELECTOR_MAX_WIDTH, viewportWidth),
    );
    const optionCount = this.hasSearchQuery$()
      ? this.filteredLanguages$().length
      : this.languagesState().length + this.recommendedLanguages$().length + (this.showRecommended$() ? 2 : 0);
    const contentHeight =
      this.filteredLanguages$().length === 0
        ? CX_LANGUAGE_SELECTOR_STATE_HEIGHT
        : Math.max(optionCount, 1) * CX_LANGUAGE_SELECTOR_ROW_HEIGHT;
    const estimatedHeight = Math.min(
      (this.showSearch$() ? CX_LANGUAGE_SELECTOR_SEARCH_HEIGHT : 0) + contentHeight + CX_LANGUAGE_SELECTOR_FRAME_HEIGHT,
      CX_LANGUAGE_SELECTOR_MAX_HEIGHT,
    );
    return {
      width,
      minWidth: width,
      estimatedHeight,
      align: 'start',
      maxHeightCap: estimatedHeight,
    };
  }

  private resolveAutomaticLanguage(languages: readonly CxLanguageOption[]): CxLanguageOption | undefined {
    if (languages.length === 0) return undefined;
    if (typeof navigator === 'undefined') return languages[0];

    const languageById = new Map(languages.map((language) => [language.id.toLocaleLowerCase(), language]));
    for (const browserLanguage of navigator.languages ?? [navigator.language]) {
      const normalized = browserLanguage.toLocaleLowerCase();
      const exact = languageById.get(normalized);
      if (exact) return exact;
      const base = normalized.split('-')[0];
      const baseMatch = languages.find((language) => language.id.toLocaleLowerCase().split('-')[0] === base);
      if (baseMatch) return baseMatch;
    }
    return languages[0];
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim();
  }

  private unique(values: readonly string[]): string[] {
    return [...new Set(values)];
  }

  private isPrintableKey(event: KeyboardEvent): boolean {
    return event.key.length === 1 && event.key.trim().length > 0 && !event.altKey && !event.ctrlKey && !event.metaKey;
  }

  private scheduleContractValidation(): void {
    if (this.contractValidationQueued) return;
    this.contractValidationQueued = true;
    queueMicrotask(() => {
      this.contractValidationQueued = false;
      this.validateCollection();
      this.validateValue();
    });
  }

  private validateCollection(): void {
    const languages = this.languagesState();
    const ids = languages.map((language) => language.id);
    const invalid =
      languages.some((language) => !language.id.trim() || !language.label.trim() || !language.flag.trim()) ||
      new Set(ids).size !== ids.length ||
      this.recommendedIdsState().some((id) => !ids.includes(id));
    if (!invalid) {
      this.reportedInvalidCollection = false;
      return;
    }
    if (this.reportedInvalidCollection) return;
    this.reportedInvalidCollection = true;
    console.error(
      '[cx-language-selector] Languages need unique non-empty ids, labels, and flags. Every recommended id must exist in languages.',
    );
  }

  private validateValue(): void {
    const value = this.valueState();
    const invalid = Boolean(value) && !this.languagesState().some((language) => language.id === value);
    if (!invalid) {
      this.reportedInvalidValue = false;
      return;
    }
    if (this.reportedInvalidValue) return;
    this.reportedInvalidValue = true;
    console.error('[cx-language-selector] Selected value must exist in languages.');
  }
}
