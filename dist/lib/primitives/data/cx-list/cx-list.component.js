import { booleanAttribute, ChangeDetectionStrategy, Component, ContentChildren, EventEmitter, Input, Output, signal, } from '@angular/core';
import { CxListItemComponent } from './cx-list-item.component.js';
import * as i0 from "@angular/core";
export class CxListComponent {
    emptyState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "emptyState" }] : /* istanbul ignore next */ []));
    expandedIdValue;
    densityValue = 'comfortable';
    dividedValue = true;
    itemChangesSubscription;
    itemToggleSubscriptions = [];
    items;
    /** `flat` drops the container's border and radius for an already-framed surface. */
    variant = 'default';
    emptyText = 'Nothing here yet.';
    set density(value) {
        this.densityValue = value;
        this.syncContext();
    }
    get density() {
        return this.densityValue;
    }
    set divided(value) {
        this.dividedValue = value;
        this.syncContext();
    }
    get divided() {
        return this.dividedValue;
    }
    /**
     * The single open row. The list is an accordion by design: opening a row
     * closes the previous one, so multiple standalone panels are the wrong
     * component for that job.
     */
    set expandedId(value) {
        this.expandedIdValue = value;
        this.syncExpanded();
    }
    get expandedId() {
        return this.expandedIdValue;
    }
    expandedIdChange = new EventEmitter();
    empty$ = this.emptyState.asReadonly();
    ngAfterContentInit() {
        this.bindItems();
        this.itemChangesSubscription = this.items?.changes.subscribe(() => this.bindItems());
    }
    ngOnDestroy() {
        this.itemChangesSubscription?.unsubscribe();
        this.unbindItems();
    }
    bindItems() {
        this.unbindItems();
        const items = this.items?.toArray() ?? [];
        this.emptyState.set(items.length === 0);
        this.itemToggleSubscriptions = items.map(item => item.expandToggle.subscribe(key => this.onExpandToggle(key)));
        this.syncContext();
        this.syncExpanded();
    }
    unbindItems() {
        this.itemToggleSubscriptions.forEach(subscription => subscription.unsubscribe());
        this.itemToggleSubscriptions = [];
    }
    onExpandToggle(key) {
        this.expandedIdValue = this.expandedIdValue === key ? undefined : key;
        this.syncExpanded();
        this.expandedIdChange.emit(this.expandedIdValue);
    }
    syncExpanded() {
        for (const item of this.items?.toArray() ?? []) {
            item.setExpanded(item.key === this.expandedIdValue);
        }
    }
    syncContext() {
        for (const item of this.items?.toArray() ?? []) {
            item.setContext({ density: this.densityValue, divided: this.dividedValue, managed: true });
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxListComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxListComponent, isStandalone: true, selector: "cx-list", inputs: { variant: "variant", emptyText: "emptyText", density: "density", divided: ["divided", "divided", booleanAttribute], expandedId: "expandedId" }, outputs: { expandedIdChange: "expandedIdChange" }, queries: [{ propertyName: "items", predicate: CxListItemComponent }], ngImport: i0, template: "<div\n  class=\"cx-list\"\n  [class.cx-list--flat]=\"variant === 'flat'\"\n  role=\"list\"\n>\n  <ng-content />\n\n  @if (empty$()) {\n    <div class=\"cx-list__empty\">{{ emptyText }}</div>\n  }\n</div>\n", styles: [":host{display:block;min-width:0}.cx-list{display:flex;min-width:0;flex-direction:column;border:var(--line);border-radius:var(--radius-md);background:var(--surface);overflow:hidden}.cx-list--flat{border:0;border-radius:var(--radius-none);background:rgba(0,0,0,0)}.cx-list__empty{padding:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxListComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-list', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-list\"\n  [class.cx-list--flat]=\"variant === 'flat'\"\n  role=\"list\"\n>\n  <ng-content />\n\n  @if (empty$()) {\n    <div class=\"cx-list__empty\">{{ emptyText }}</div>\n  }\n</div>\n", styles: [":host{display:block;min-width:0}.cx-list{display:flex;min-width:0;flex-direction:column;border:var(--line);border-radius:var(--radius-md);background:var(--surface);overflow:hidden}.cx-list--flat{border:0;border-radius:var(--radius-none);background:rgba(0,0,0,0)}.cx-list__empty{padding:var(--space-md);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}"] }]
        }], propDecorators: { items: [{
                type: ContentChildren,
                args: [CxListItemComponent]
            }], variant: [{
                type: Input
            }], emptyText: [{
                type: Input
            }], density: [{
                type: Input
            }], divided: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], expandedId: [{
                type: Input
            }], expandedIdChange: [{
                type: Output
            }] } });
