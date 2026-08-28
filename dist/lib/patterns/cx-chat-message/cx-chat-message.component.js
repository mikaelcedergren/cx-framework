import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { CxTagComponent } from '../../primitives/display/cx-tag/index.js';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import { CxChatThreadComponent } from '../cx-chat-thread/cx-chat-thread.component.js';
import * as i0 from "@angular/core";
export class CxChatMessageComponent {
    thread = inject(CxChatThreadComponent, { optional: true, skipSelf: true });
    authorIdState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "authorIdState" }] : /* istanbul ignore next */ []));
    authorState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "authorState" }] : /* istanbul ignore next */ []));
    timestampState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "timestampState" }] : /* istanbul ignore next */ []));
    statusState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "statusState" }] : /* istanbul ignore next */ []));
    set authorId(value) {
        this.authorIdState.set(value ?? '');
    }
    set author(value) {
        this.authorState.set(value ?? '');
    }
    set timestamp(value) {
        this.timestampState.set(value ?? '');
    }
    set status(value) {
        this.statusState.set(value);
    }
    timestamp$ = this.timestampState.asReadonly();
    status$ = this.statusState.asReadonly();
    isSelf$ = computed(() => {
        const viewerId = this.thread?.viewerId$() ?? '';
        const authorId = this.authorIdState();
        return !!viewerId && !!authorId && viewerId === authorId;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isSelf$" }] : /* istanbul ignore next */ []));
    authorLabel$ = computed(() => {
        if (this.isSelf$()) {
            return 'You';
        }
        return this.authorState();
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "authorLabel$" }] : /* istanbul ignore next */ []));
    hasHeader$ = computed(() => Boolean(this.authorLabel$().trim() || this.timestampState().trim() || this.statusState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasHeader$" }] : /* istanbul ignore next */ []));
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxChatMessageComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxChatMessageComponent, isStandalone: true, selector: "cx-chat-message", inputs: { authorId: "authorId", author: "author", timestamp: "timestamp", status: "status" }, host: { attributes: { "role": "listitem" }, properties: { "class.cx-chat-message--self": "isSelf$()", "class.cx-chat-message--other": "!isSelf$()", "attr.title": "null" }, classAttribute: "cx-chat-message" }, ngImport: i0, template: "<div class=\"cx-chat-message__bubble\">\n  @if (hasHeader$()) {\n  <div class=\"cx-chat-message__header\">\n    <div class=\"cx-chat-message__meta\">\n      <div\n        class=\"cx-chat-message__author\"\n        [cxTooltip]=\"authorLabel$()\"\n        [cxTooltipOverflow]=\"true\"\n      >\n        {{ authorLabel$() }}\n      </div>\n      @if (timestamp$().trim()) {\n        <div class=\"cx-chat-message__timestamp\">{{ timestamp$() }}</div>\n      }\n    </div>\n\n    @if (status$(); as status) {\n      <cx-tag\n        [text]=\"status.label\"\n        [color]=\"status.color\"\n        [icon]=\"status.icon\"\n      />\n    }\n  </div>\n  }\n\n  <div class=\"cx-chat-message__body\">\n    <ng-content />\n  </div>\n</div>\n", styles: [":host{display:flex;width:100%;min-width:0}:host(.cx-chat-message--self){justify-content:flex-end}:host(.cx-chat-message--other){justify-content:flex-start}.cx-chat-message__bubble{display:flex;width:fit-content;max-width:min(80%,var(--space-2xl)*8);min-width:0;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);border-radius:var(--radius-md);box-sizing:border-box}:host(.cx-chat-message--other) .cx-chat-message__bubble{background:var(--opacity-mid);color:var(--ink)}:host(.cx-chat-message--self) .cx-chat-message__bubble{background:var(--surface-alt);color:var(--ink)}.cx-chat-message__header{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-chat-message__meta{display:flex;min-width:0;align-items:baseline;gap:var(--space-sm)}.cx-chat-message__author{min-width:0;overflow:hidden;font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-chat-message__timestamp{flex:0 0 auto;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);white-space:nowrap}.cx-chat-message__body{min-width:0;color:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-chat-message__body:empty{display:none}"], dependencies: [{ kind: "component", type: CxTagComponent, selector: "cx-tag", inputs: ["text", "icon", "color", "outline", "dismissible", "interactive", "ariaLabel", "expanded", "controls"], outputs: ["dismiss", "pressed"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxChatMessageComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-chat-message', imports: [CxTagComponent, CxTooltipDirective], host: {
                        class: 'cx-chat-message',
                        role: 'listitem',
                        '[class.cx-chat-message--self]': 'isSelf$()',
                        '[class.cx-chat-message--other]': '!isSelf$()',
                        '[attr.title]': 'null',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-chat-message__bubble\">\n  @if (hasHeader$()) {\n  <div class=\"cx-chat-message__header\">\n    <div class=\"cx-chat-message__meta\">\n      <div\n        class=\"cx-chat-message__author\"\n        [cxTooltip]=\"authorLabel$()\"\n        [cxTooltipOverflow]=\"true\"\n      >\n        {{ authorLabel$() }}\n      </div>\n      @if (timestamp$().trim()) {\n        <div class=\"cx-chat-message__timestamp\">{{ timestamp$() }}</div>\n      }\n    </div>\n\n    @if (status$(); as status) {\n      <cx-tag\n        [text]=\"status.label\"\n        [color]=\"status.color\"\n        [icon]=\"status.icon\"\n      />\n    }\n  </div>\n  }\n\n  <div class=\"cx-chat-message__body\">\n    <ng-content />\n  </div>\n</div>\n", styles: [":host{display:flex;width:100%;min-width:0}:host(.cx-chat-message--self){justify-content:flex-end}:host(.cx-chat-message--other){justify-content:flex-start}.cx-chat-message__bubble{display:flex;width:fit-content;max-width:min(80%,var(--space-2xl)*8);min-width:0;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);border-radius:var(--radius-md);box-sizing:border-box}:host(.cx-chat-message--other) .cx-chat-message__bubble{background:var(--opacity-mid);color:var(--ink)}:host(.cx-chat-message--self) .cx-chat-message__bubble{background:var(--surface-alt);color:var(--ink)}.cx-chat-message__header{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-chat-message__meta{display:flex;min-width:0;align-items:baseline;gap:var(--space-sm)}.cx-chat-message__author{min-width:0;overflow:hidden;font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-chat-message__timestamp{flex:0 0 auto;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);white-space:nowrap}.cx-chat-message__body{min-width:0;color:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-chat-message__body:empty{display:none}"] }]
        }], propDecorators: { authorId: [{
                type: Input
            }], author: [{
                type: Input
            }], timestamp: [{
                type: Input
            }], status: [{
                type: Input
            }] } });
