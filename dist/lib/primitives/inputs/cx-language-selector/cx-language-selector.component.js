import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewChildren, computed, inject, signal, } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxOptionGroupComponent } from '../../overlay/cx-option-group/index.js';
import { CxPopoverComponent } from '../../overlay/cx-popover/index.js';
import { CxFloatingSurfaceController, } from '../../overlay/floating-surface-controller.js';
import { CxHostVisibilityObserver } from '../../shared/host-visibility.js';
import { CxTextFieldComponent } from '../cx-text-field/index.js';
import * as i0 from "@angular/core";
const CX_LANGUAGE_SELECTOR_SEARCH_THRESHOLD = 8;
const CX_LANGUAGE_SELECTOR_MIN_WIDTH = 240;
const CX_LANGUAGE_SELECTOR_MAX_WIDTH = 360;
const CX_LANGUAGE_SELECTOR_MAX_HEIGHT = 360;
const CX_LANGUAGE_SELECTOR_FRAME_HEIGHT = 8;
const CX_LANGUAGE_SELECTOR_SEARCH_HEIGHT = 60;
const CX_LANGUAGE_SELECTOR_STATE_HEIGHT = 128;
const CX_LANGUAGE_SELECTOR_ROW_HEIGHT = 32;
const CX_LANGUAGE_SELECTOR_DEFAULT_TRANSLATIONS = {
    ariaLabel: 'Language',
    search: 'Search languages',
    recommended: 'Recommended',
    allLanguages: 'All languages',
    noResults: 'No results',
    noResultsDescription: 'No matching languages.',
};
export class CxLanguageSelectorComponent {
    static nextId = 0;
    instanceId = CxLanguageSelectorComponent.nextId++;
    host = inject((ElementRef));
    languagesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "languagesState" }] : /* istanbul ignore next */ []));
    recommendedIdsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "recommendedIdsState" }] : /* istanbul ignore next */ []));
    valueState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    translationsState = signal({}, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "translationsState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    searchState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "searchState" }] : /* istanbul ignore next */ []));
    hostVisibility = new CxHostVisibilityObserver(this.host.nativeElement, (visible) => {
        if (!visible && this.openState())
            this.closePopover();
    });
    openTracking = false;
    focusTimer;
    contractValidationQueued = false;
    reportedInvalidCollection = false;
    reportedInvalidValue = false;
    listboxId = `cx-language-selector-listbox-${this.instanceId}`;
    popoverId = `cx-language-selector-popover-${this.instanceId}`;
    popoverMaxWidth = CX_LANGUAGE_SELECTOR_MAX_WIDTH;
    triggerButtonRef;
    searchInputRef;
    popoverRef;
    optionButtonRefs;
    overlay = new CxFloatingSurfaceController((rect, viewport) => this.measureOverlay(rect, viewport));
    set languages(value) {
        this.languagesState.set(value ?? []);
        this.scheduleContractValidation();
        if (this.openState())
            queueMicrotask(() => this.overlay.sync());
    }
    set recommendedIds(value) {
        this.recommendedIdsState.set(value ?? []);
        this.scheduleContractValidation();
    }
    set value(value) {
        this.valueState.set(value ?? undefined);
        this.scheduleContractValidation();
    }
    set translations(value) {
        this.translationsState.set(value ?? {});
    }
    valueChange = new EventEmitter();
    isOpen$ = this.openState.asReadonly();
    searchQuery$ = this.searchState.asReadonly();
    hasLanguages$ = computed(() => this.languagesState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasLanguages$" }] : /* istanbul ignore next */ []));
    showSearch$ = computed(() => this.languagesState().length > CX_LANGUAGE_SELECTOR_SEARCH_THRESHOLD, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showSearch$" }] : /* istanbul ignore next */ []));
    selectedLanguage$ = computed(() => {
        const languages = this.languagesState();
        const explicit = this.valueState();
        if (explicit) {
            const selected = languages.find((language) => language.id === explicit);
            if (selected)
                return selected;
        }
        return this.resolveAutomaticLanguage(languages);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedLanguage$" }] : /* istanbul ignore next */ []));
    recommendedLanguages$ = computed(() => {
        const byId = new Map(this.languagesState().map((language) => [language.id, language]));
        return this.unique(this.recommendedIdsState())
            .map((id) => byId.get(id))
            .filter((language) => language !== undefined);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "recommendedLanguages$" }] : /* istanbul ignore next */ []));
    filteredLanguages$ = computed(() => {
        const query = this.normalizeSearch(this.searchState());
        if (!query)
            return this.languagesState();
        return this.languagesState().filter((language) => {
            const haystack = [language.label, language.id, ...(language.keywords ?? [])]
                .map((value) => this.normalizeSearch(value))
                .join(' ');
            return haystack.includes(query);
        });
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filteredLanguages$" }] : /* istanbul ignore next */ []));
    hasSearchQuery$ = computed(() => this.searchState().trim().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasSearchQuery$" }] : /* istanbul ignore next */ []));
    showRecommended$ = computed(() => !this.hasSearchQuery$() && this.recommendedLanguages$().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showRecommended$" }] : /* istanbul ignore next */ []));
    triggerAriaLabel$ = computed(() => {
        const selected = this.selectedLanguage$();
        return selected ? `${this.translation('ariaLabel')}: ${selected.label}` : this.translation('ariaLabel');
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "triggerAriaLabel$" }] : /* istanbul ignore next */ []));
    ngAfterViewInit() {
        this.overlay.setTrigger(this.triggerButtonRef?.nativeElement);
    }
    ngOnDestroy() {
        this.stopOpenTracking();
        this.overlay.destroy();
        if (typeof window !== 'undefined' && this.focusTimer !== undefined) {
            window.clearTimeout(this.focusTimer);
        }
    }
    toggleOpen(trigger) {
        if (this.openState()) {
            this.closePopover();
            return;
        }
        this.openPopover(trigger);
    }
    onTriggerKeydown(event, trigger) {
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
            if (this.openState())
                this.focusSearch();
            else
                this.openPopover(trigger, 'search');
        }
    }
    onSearchChange(value) {
        this.searchState.set(value);
        queueMicrotask(() => {
            this.optionButtonRefs?.first?.nativeElement.closest('.cx-language-selector__options')?.scrollTo({ top: 0 });
        });
    }
    onSearchKeydown(event) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusOption('first');
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusOption('last');
        }
        else if (event.key === 'Enter') {
            event.preventDefault();
            this.activateFirstOption();
        }
        else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeAndFocusTrigger();
        }
    }
    onOptionKeydown(event, language) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.selectLanguage(language);
        }
        else if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusRelativeOption(event.currentTarget, 1);
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusRelativeOption(event.currentTarget, -1);
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            this.focusOption('first');
        }
        else if (event.key === 'End') {
            event.preventDefault();
            this.focusOption('last');
        }
        else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.closeAndFocusTrigger();
        }
        else if (event.key === 'Tab') {
            this.closePopover();
        }
        else if (this.showSearch$() && this.isPrintableKey(event)) {
            event.preventDefault();
            this.searchState.update((current) => current + event.key);
            this.focusSearch();
        }
    }
    selectLanguage(language) {
        this.valueState.set(language.id);
        this.valueChange.emit(language.id);
        this.closeAndFocusTrigger();
    }
    closePopover() {
        this.searchState.set('');
        this.setOpen(false);
    }
    translation(key) {
        const value = this.translationsState()[key];
        return typeof value === 'string' && value.trim() ? value.trim() : CX_LANGUAGE_SELECTOR_DEFAULT_TRANSLATIONS[key];
    }
    openPopover(trigger, focusTarget = 'search') {
        this.overlay.setTrigger(trigger ?? this.triggerButtonRef?.nativeElement);
        this.setOpen(true);
        this.scheduleFocus(() => {
            this.overlay.sync();
            if (focusTarget === 'search' && this.showSearch$())
                this.focusSearch();
            else
                this.focusOption(focusTarget === 'last' ? 'last' : 'first');
        });
    }
    setOpen(open) {
        if (this.openState() === open)
            return;
        this.openState.set(open);
        if (open)
            this.startOpenTracking();
        else {
            this.stopOpenTracking();
            this.overlay.endSession();
        }
    }
    closeAndFocusTrigger() {
        this.closePopover();
        queueMicrotask(() => this.triggerButtonRef?.nativeElement.focus());
    }
    focusSearch() {
        this.scheduleFocus(() => this.searchInputRef?.focus());
    }
    focusOption(target) {
        const buttons = this.optionButtons();
        const button = target === 'last' ? buttons[buttons.length - 1] : buttons[0];
        button?.focus();
    }
    focusRelativeOption(currentTarget, direction) {
        const buttons = this.optionButtons();
        const current = currentTarget instanceof HTMLButtonElement ? currentTarget : undefined;
        const currentIndex = current ? buttons.indexOf(current) : -1;
        const nextIndex = currentIndex + direction;
        if (nextIndex < 0) {
            if (this.showSearch$())
                this.focusSearch();
            else
                buttons[buttons.length - 1]?.focus();
            return;
        }
        if (nextIndex >= buttons.length) {
            buttons[0]?.focus();
            return;
        }
        buttons[nextIndex]?.focus();
    }
    activateFirstOption() {
        this.optionButtons()[0]?.click();
    }
    optionButtons() {
        return (this.optionButtonRefs?.toArray() ?? []).map((ref) => ref.nativeElement);
    }
    scheduleFocus(callback) {
        if (typeof window === 'undefined') {
            queueMicrotask(callback);
            return;
        }
        if (this.focusTimer !== undefined)
            window.clearTimeout(this.focusTimer);
        this.focusTimer = window.setTimeout(() => {
            this.focusTimer = undefined;
            callback();
        });
    }
    onCapturedDocumentScroll = (event) => {
        const target = event.target;
        if (target instanceof Node && this.popoverRef?.surfaceElement()?.contains(target))
            return;
        if (this.openState() && this.hostVisibility.check())
            this.overlay.sync();
    };
    onWindowResize = () => {
        if (this.openState() && this.hostVisibility.check())
            this.overlay.sync();
    };
    startOpenTracking() {
        if (this.openTracking)
            return;
        this.openTracking = true;
        this.hostVisibility.start();
        if (typeof document !== 'undefined')
            document.addEventListener('scroll', this.onCapturedDocumentScroll, true);
        if (typeof window !== 'undefined')
            window.addEventListener('resize', this.onWindowResize);
        this.overlay.observeTrigger(this.overlay.trigger, this.onWindowResize);
    }
    stopOpenTracking() {
        this.hostVisibility.stop();
        if (!this.openTracking)
            return;
        this.openTracking = false;
        if (typeof document !== 'undefined')
            document.removeEventListener('scroll', this.onCapturedDocumentScroll, true);
        if (typeof window !== 'undefined')
            window.removeEventListener('resize', this.onWindowResize);
        this.overlay.stopObservingTrigger();
    }
    measureOverlay(rect, viewport) {
        const viewportWidth = Math.max(viewport.width - 16, 0);
        const width = Math.floor(Math.min(Math.max(rect.width, CX_LANGUAGE_SELECTOR_MIN_WIDTH), CX_LANGUAGE_SELECTOR_MAX_WIDTH, viewportWidth));
        const optionCount = this.hasSearchQuery$()
            ? this.filteredLanguages$().length
            : this.languagesState().length + this.recommendedLanguages$().length + (this.showRecommended$() ? 2 : 0);
        const contentHeight = this.filteredLanguages$().length === 0
            ? CX_LANGUAGE_SELECTOR_STATE_HEIGHT
            : Math.max(optionCount, 1) * CX_LANGUAGE_SELECTOR_ROW_HEIGHT;
        const estimatedHeight = Math.min((this.showSearch$() ? CX_LANGUAGE_SELECTOR_SEARCH_HEIGHT : 0) + contentHeight + CX_LANGUAGE_SELECTOR_FRAME_HEIGHT, CX_LANGUAGE_SELECTOR_MAX_HEIGHT);
        return {
            width,
            minWidth: width,
            estimatedHeight,
            align: 'start',
            maxHeightCap: estimatedHeight,
        };
    }
    resolveAutomaticLanguage(languages) {
        if (languages.length === 0)
            return undefined;
        if (typeof navigator === 'undefined')
            return languages[0];
        const languageById = new Map(languages.map((language) => [language.id.toLocaleLowerCase(), language]));
        for (const browserLanguage of navigator.languages ?? [navigator.language]) {
            const normalized = browserLanguage.toLocaleLowerCase();
            const exact = languageById.get(normalized);
            if (exact)
                return exact;
            const base = normalized.split('-')[0];
            const baseMatch = languages.find((language) => language.id.toLocaleLowerCase().split('-')[0] === base);
            if (baseMatch)
                return baseMatch;
        }
        return languages[0];
    }
    normalizeSearch(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase()
            .trim();
    }
    unique(values) {
        return [...new Set(values)];
    }
    isPrintableKey(event) {
        return event.key.length === 1 && event.key.trim().length > 0 && !event.altKey && !event.ctrlKey && !event.metaKey;
    }
    scheduleContractValidation() {
        if (this.contractValidationQueued)
            return;
        this.contractValidationQueued = true;
        queueMicrotask(() => {
            this.contractValidationQueued = false;
            this.validateCollection();
            this.validateValue();
        });
    }
    validateCollection() {
        const languages = this.languagesState();
        const ids = languages.map((language) => language.id);
        const invalid = languages.some((language) => !language.id.trim() || !language.label.trim() || !language.flag.trim()) ||
            new Set(ids).size !== ids.length ||
            this.recommendedIdsState().some((id) => !ids.includes(id));
        if (!invalid) {
            this.reportedInvalidCollection = false;
            return;
        }
        if (this.reportedInvalidCollection)
            return;
        this.reportedInvalidCollection = true;
        console.error('[cx-language-selector] Languages need unique non-empty ids, labels, and flags. Every recommended id must exist in languages.');
    }
    validateValue() {
        const value = this.valueState();
        const invalid = Boolean(value) && !this.languagesState().some((language) => language.id === value);
        if (!invalid) {
            this.reportedInvalidValue = false;
            return;
        }
        if (this.reportedInvalidValue)
            return;
        this.reportedInvalidValue = true;
        console.error('[cx-language-selector] Selected value must exist in languages.');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLanguageSelectorComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxLanguageSelectorComponent, isStandalone: true, selector: "cx-language-selector", inputs: { languages: "languages", recommendedIds: "recommendedIds", value: "value", translations: "translations" }, outputs: { valueChange: "valueChange" }, viewQueries: [{ propertyName: "triggerButtonRef", first: true, predicate: ["triggerButton"], descendants: true, read: ElementRef }, { propertyName: "searchInputRef", first: true, predicate: ["searchInput"], descendants: true }, { propertyName: "popoverRef", first: true, predicate: ["popover"], descendants: true }, { propertyName: "optionButtonRefs", predicate: ["optionButton"], descendants: true, read: ElementRef }], ngImport: i0, template: "@if (hasLanguages$() && selectedLanguage$(); as selected) {\n  <button\n    #triggerButton\n    type=\"button\"\n    class=\"cx-language-selector__trigger\"\n    [class.cx-language-selector__trigger--open]=\"isOpen$()\"\n    [attr.aria-label]=\"triggerAriaLabel$()\"\n    [attr.aria-expanded]=\"isOpen$()\"\n    [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n    aria-haspopup=\"listbox\"\n    (click)=\"toggleOpen(triggerButton)\"\n    (keydown)=\"onTriggerKeydown($event, triggerButton)\"\n  >\n    <span class=\"cx-language-selector__flag\" aria-hidden=\"true\">{{\n      selected.flag\n    }}</span>\n    <span class=\"cx-language-selector__trigger-label\">{{\n      selected.label\n    }}</span>\n    <cx-icon\n      class=\"cx-language-selector__chevron\"\n      icon=\"chevron-down\"\n      size=\"16\"\n    />\n  </button>\n\n  @if (isOpen$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [owner]=\"triggerButton\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxWidth]=\"popoverMaxWidth\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div class=\"cx-language-selector__surface\">\n        @if (showSearch$()) {\n          <div class=\"cx-language-selector__search\">\n            <cx-text-field\n              #searchInput\n              label=\"\"\n              [ariaLabel]=\"translation('search')\"\n              prependIcon=\"search\"\n              [clearable]=\"true\"\n              [value]=\"searchQuery$()\"\n              (valueChange)=\"onSearchChange($event)\"\n              (keydown)=\"onSearchKeydown($event)\"\n            />\n          </div>\n        }\n\n        <div\n          class=\"cx-language-selector__options\"\n          data-cx-popover-scroll-container\n          role=\"listbox\"\n          [id]=\"listboxId\"\n          [attr.aria-label]=\"translation('ariaLabel')\"\n        >\n          @if (filteredLanguages$().length === 0) {\n            <div\n              class=\"cx-language-selector__state\"\n              role=\"status\"\n              aria-live=\"polite\"\n            >\n              <div class=\"cx-language-selector__state-heading\">\n                {{ translation(\"noResults\") }}\n              </div>\n              <div class=\"cx-language-selector__state-text\">\n                {{ translation(\"noResultsDescription\") }}\n              </div>\n            </div>\n          } @else if (hasSearchQuery$()) {\n            @for (language of filteredLanguages$(); track language.id) {\n              <ng-container\n                [ngTemplateOutlet]=\"languageOption\"\n                [ngTemplateOutletContext]=\"{\n                  $implicit: language,\n                  key: 'search:' + language.id,\n                }\"\n              />\n            }\n          } @else {\n            @if (showRecommended$()) {\n              <cx-option-group [label]=\"translation('recommended')\" />\n              @for (language of recommendedLanguages$(); track language.id) {\n                <ng-container\n                  [ngTemplateOutlet]=\"languageOption\"\n                  [ngTemplateOutletContext]=\"{\n                    $implicit: language,\n                    key: 'recommended:' + language.id,\n                  }\"\n                />\n              }\n              <cx-option-group [label]=\"translation('allLanguages')\" />\n            }\n            @for (language of filteredLanguages$(); track language.id) {\n              <ng-container\n                [ngTemplateOutlet]=\"languageOption\"\n                [ngTemplateOutletContext]=\"{\n                  $implicit: language,\n                  key: 'all:' + language.id,\n                }\"\n              />\n            }\n          }\n        </div>\n      </div>\n    </cx-popover>\n  }\n}\n\n<ng-template #languageOption let-language let-key=\"key\">\n  <button\n    #optionButton\n    type=\"button\"\n    class=\"cx-language-selector__option\"\n    [class.cx-language-selector__option--selected]=\"\n      selectedLanguage$()?.id === language.id\n    \"\n    [attr.data-language-option-key]=\"key\"\n    role=\"option\"\n    tabindex=\"-1\"\n    [attr.aria-selected]=\"selectedLanguage$()?.id === language.id\"\n    (click)=\"selectLanguage(language)\"\n    (keydown)=\"onOptionKeydown($event, language)\"\n  >\n    <span class=\"cx-language-selector__flag\" aria-hidden=\"true\">{{\n      language.flag\n    }}</span>\n    <span class=\"cx-language-selector__option-label\">{{ language.label }}</span>\n    @if (selectedLanguage$()?.id === language.id) {\n      <cx-icon\n        class=\"cx-language-selector__selected-icon\"\n        icon=\"check\"\n        mood=\"primary\"\n        size=\"16\"\n      />\n    }\n  </button>\n</ng-template>\n", styles: [":host{display:inline-block;max-width:100%}:host:empty{display:none}.cx-language-selector__trigger{box-sizing:border-box;display:inline-flex;max-width:100%;min-width:160px;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:start;transition:border-color var(--motion-fast) ease}.cx-language-selector__trigger:hover{border-color:var(--opacity-mid);outline:var(--outline-field-interaction)}.cx-language-selector__trigger--open{border-color:var(--border-open);outline:var(--outline-field-interaction)}:host-context([data-cx-keyboard-navigation]) .cx-language-selector__trigger:focus{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-language-selector__trigger-label,.cx-language-selector__option-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-language-selector__trigger-label{flex:1 1 auto;font-size:var(--font-size-body);line-height:var(--line-height-control)}.cx-language-selector__flag{display:inline-flex;width:24px;min-width:24px;align-items:center;justify-content:center;font-family:\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Noto Color Emoji\",sans-serif;font-size:var(--icon-size-sm);font-weight:var(--font-weight-regular);line-height:1}.cx-language-selector__chevron,.cx-language-selector__selected-icon{flex:0 0 auto}.cx-language-selector__chevron{transition:transform var(--motion-fast) ease}.cx-language-selector__trigger--open .cx-language-selector__chevron{transform:rotate(180deg)}.cx-language-selector__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow:hidden}.cx-language-selector__search{box-sizing:border-box;width:100%;min-width:0;padding:var(--space-sm) var(--space-sm) var(--space-xs)}.cx-language-selector__options{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow-y:auto;overscroll-behavior:contain}.cx-language-selector__option{box-sizing:border-box;display:flex;width:100%;min-width:0;min-height:var(--controller-size);flex:0 0 auto;align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:start;transition:background var(--motion-fast) ease}.cx-language-selector__option:hover,.cx-language-selector__option:focus-visible{background:var(--opacity-mid)}.cx-language-selector__option--selected{background:var(--opacity-low)}.cx-language-selector__option:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-language-selector__option-label{flex:1 1 auto;font-size:var(--font-size-body);line-height:var(--line-height-control)}.cx-language-selector__state{box-sizing:border-box;display:flex;min-height:128px;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-xs);padding:var(--space-lg);text-align:center}.cx-language-selector__state-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-language-selector__state-text{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}@media(prefers-reduced-motion: reduce){.cx-language-selector__trigger,.cx-language-selector__chevron,.cx-language-selector__option{transition:none}}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxOptionGroupComponent, selector: "cx-option-group", inputs: ["label", "description", "variant"] }, { kind: "component", type: CxPopoverComponent, selector: "cx-popover", inputs: ["open", "showBackdrop", "owner", "surfaceId", "role", "ariaLabel", "heading", "left", "top", "bottom", "width", "minWidth", "maxWidth", "maxHeight", "placement", "surfaceVariant"], outputs: ["backdropPressed"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "combobox", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLanguageSelectorComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-language-selector', imports: [NgTemplateOutlet, CxIconComponent, CxOptionGroupComponent, CxPopoverComponent, CxTextFieldComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (hasLanguages$() && selectedLanguage$(); as selected) {\n  <button\n    #triggerButton\n    type=\"button\"\n    class=\"cx-language-selector__trigger\"\n    [class.cx-language-selector__trigger--open]=\"isOpen$()\"\n    [attr.aria-label]=\"triggerAriaLabel$()\"\n    [attr.aria-expanded]=\"isOpen$()\"\n    [attr.aria-controls]=\"isOpen$() ? listboxId : null\"\n    aria-haspopup=\"listbox\"\n    (click)=\"toggleOpen(triggerButton)\"\n    (keydown)=\"onTriggerKeydown($event, triggerButton)\"\n  >\n    <span class=\"cx-language-selector__flag\" aria-hidden=\"true\">{{\n      selected.flag\n    }}</span>\n    <span class=\"cx-language-selector__trigger-label\">{{\n      selected.label\n    }}</span>\n    <cx-icon\n      class=\"cx-language-selector__chevron\"\n      icon=\"chevron-down\"\n      size=\"16\"\n    />\n  </button>\n\n  @if (isOpen$()) {\n    <cx-popover\n      #popover\n      [open]=\"true\"\n      [owner]=\"triggerButton\"\n      [showBackdrop]=\"true\"\n      [surfaceId]=\"popoverId\"\n      [width]=\"overlay.width$()\"\n      [minWidth]=\"overlay.minWidth$()\"\n      [maxWidth]=\"popoverMaxWidth\"\n      [maxHeight]=\"overlay.maxHeight$()\"\n      [left]=\"overlay.left$()\"\n      [top]=\"overlay.top$()\"\n      [bottom]=\"overlay.bottom$()\"\n      [placement]=\"overlay.placement$()\"\n      (backdropPressed)=\"closePopover()\"\n    >\n      <div class=\"cx-language-selector__surface\">\n        @if (showSearch$()) {\n          <div class=\"cx-language-selector__search\">\n            <cx-text-field\n              #searchInput\n              label=\"\"\n              [ariaLabel]=\"translation('search')\"\n              prependIcon=\"search\"\n              [clearable]=\"true\"\n              [value]=\"searchQuery$()\"\n              (valueChange)=\"onSearchChange($event)\"\n              (keydown)=\"onSearchKeydown($event)\"\n            />\n          </div>\n        }\n\n        <div\n          class=\"cx-language-selector__options\"\n          data-cx-popover-scroll-container\n          role=\"listbox\"\n          [id]=\"listboxId\"\n          [attr.aria-label]=\"translation('ariaLabel')\"\n        >\n          @if (filteredLanguages$().length === 0) {\n            <div\n              class=\"cx-language-selector__state\"\n              role=\"status\"\n              aria-live=\"polite\"\n            >\n              <div class=\"cx-language-selector__state-heading\">\n                {{ translation(\"noResults\") }}\n              </div>\n              <div class=\"cx-language-selector__state-text\">\n                {{ translation(\"noResultsDescription\") }}\n              </div>\n            </div>\n          } @else if (hasSearchQuery$()) {\n            @for (language of filteredLanguages$(); track language.id) {\n              <ng-container\n                [ngTemplateOutlet]=\"languageOption\"\n                [ngTemplateOutletContext]=\"{\n                  $implicit: language,\n                  key: 'search:' + language.id,\n                }\"\n              />\n            }\n          } @else {\n            @if (showRecommended$()) {\n              <cx-option-group [label]=\"translation('recommended')\" />\n              @for (language of recommendedLanguages$(); track language.id) {\n                <ng-container\n                  [ngTemplateOutlet]=\"languageOption\"\n                  [ngTemplateOutletContext]=\"{\n                    $implicit: language,\n                    key: 'recommended:' + language.id,\n                  }\"\n                />\n              }\n              <cx-option-group [label]=\"translation('allLanguages')\" />\n            }\n            @for (language of filteredLanguages$(); track language.id) {\n              <ng-container\n                [ngTemplateOutlet]=\"languageOption\"\n                [ngTemplateOutletContext]=\"{\n                  $implicit: language,\n                  key: 'all:' + language.id,\n                }\"\n              />\n            }\n          }\n        </div>\n      </div>\n    </cx-popover>\n  }\n}\n\n<ng-template #languageOption let-language let-key=\"key\">\n  <button\n    #optionButton\n    type=\"button\"\n    class=\"cx-language-selector__option\"\n    [class.cx-language-selector__option--selected]=\"\n      selectedLanguage$()?.id === language.id\n    \"\n    [attr.data-language-option-key]=\"key\"\n    role=\"option\"\n    tabindex=\"-1\"\n    [attr.aria-selected]=\"selectedLanguage$()?.id === language.id\"\n    (click)=\"selectLanguage(language)\"\n    (keydown)=\"onOptionKeydown($event, language)\"\n  >\n    <span class=\"cx-language-selector__flag\" aria-hidden=\"true\">{{\n      language.flag\n    }}</span>\n    <span class=\"cx-language-selector__option-label\">{{ language.label }}</span>\n    @if (selectedLanguage$()?.id === language.id) {\n      <cx-icon\n        class=\"cx-language-selector__selected-icon\"\n        icon=\"check\"\n        mood=\"primary\"\n        size=\"16\"\n      />\n    }\n  </button>\n</ng-template>\n", styles: [":host{display:inline-block;max-width:100%}:host:empty{display:none}.cx-language-selector__trigger{box-sizing:border-box;display:inline-flex;max-width:100%;min-width:160px;min-height:var(--controller-size);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border:var(--line);border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:start;transition:border-color var(--motion-fast) ease}.cx-language-selector__trigger:hover{border-color:var(--opacity-mid);outline:var(--outline-field-interaction)}.cx-language-selector__trigger--open{border-color:var(--border-open);outline:var(--outline-field-interaction)}:host-context([data-cx-keyboard-navigation]) .cx-language-selector__trigger:focus{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-language-selector__trigger-label,.cx-language-selector__option-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-language-selector__trigger-label{flex:1 1 auto;font-size:var(--font-size-body);line-height:var(--line-height-control)}.cx-language-selector__flag{display:inline-flex;width:24px;min-width:24px;align-items:center;justify-content:center;font-family:\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Noto Color Emoji\",sans-serif;font-size:var(--icon-size-sm);font-weight:var(--font-weight-regular);line-height:1}.cx-language-selector__chevron,.cx-language-selector__selected-icon{flex:0 0 auto}.cx-language-selector__chevron{transition:transform var(--motion-fast) ease}.cx-language-selector__trigger--open .cx-language-selector__chevron{transform:rotate(180deg)}.cx-language-selector__surface{display:flex;min-width:0;min-height:0;max-height:inherit;flex:1 1 auto;flex-direction:column;overflow:hidden}.cx-language-selector__search{box-sizing:border-box;width:100%;min-width:0;padding:var(--space-sm) var(--space-sm) var(--space-xs)}.cx-language-selector__options{display:flex;min-height:0;flex:1 1 auto;flex-direction:column;overflow-y:auto;overscroll-behavior:contain}.cx-language-selector__option{box-sizing:border-box;display:flex;width:100%;min-width:0;min-height:var(--controller-size);flex:0 0 auto;align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:start;transition:background var(--motion-fast) ease}.cx-language-selector__option:hover,.cx-language-selector__option:focus-visible{background:var(--opacity-mid)}.cx-language-selector__option--selected{background:var(--opacity-low)}.cx-language-selector__option:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-language-selector__option-label{flex:1 1 auto;font-size:var(--font-size-body);line-height:var(--line-height-control)}.cx-language-selector__state{box-sizing:border-box;display:flex;min-height:128px;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-xs);padding:var(--space-lg);text-align:center}.cx-language-selector__state-heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body)}.cx-language-selector__state-text{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}@media(prefers-reduced-motion: reduce){.cx-language-selector__trigger,.cx-language-selector__chevron,.cx-language-selector__option{transition:none}}"] }]
        }], propDecorators: { triggerButtonRef: [{
                type: ViewChild,
                args: ['triggerButton', { read: ElementRef }]
            }], searchInputRef: [{
                type: ViewChild,
                args: ['searchInput']
            }], popoverRef: [{
                type: ViewChild,
                args: ['popover']
            }], optionButtonRefs: [{
                type: ViewChildren,
                args: ['optionButton', { read: ElementRef }]
            }], languages: [{
                type: Input
            }], recommendedIds: [{
                type: Input
            }], value: [{
                type: Input
            }], translations: [{
                type: Input
            }], valueChange: [{
                type: Output
            }] } });
