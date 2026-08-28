import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxLogStepComponent } from '../cx-log-step/index.js';
import * as i0 from "@angular/core";
/** Immutable complete log model. Entries own their visible detail; the model owns connector positions. */
export class CxLog {
    entries;
    static emptyLog = new CxLog([]);
    constructor(entries) {
        this.entries = entries;
    }
    static empty() {
        return CxLog.emptyLog;
    }
    static of(entries) {
        return new CxLog(entries.map((entry, index) => {
            const position = entries.length === 1 ? 'single' : index === 0 ? 'first' : index === entries.length - 1 ? 'last' : 'middle';
            return { ...entry, step: entry.step.withPosition(position) };
        }));
    }
    withEntries(entries) {
        return CxLog.of(entries);
    }
    withEntry(index, entry) {
        return CxLog.of(this.entries.map((current, currentIndex) => (currentIndex === index ? entry : current)));
    }
}
export class CxLogComponent {
    logState = CxLog.empty();
    set log(log) {
        this.logState = log ?? CxLog.empty();
    }
    get log() {
        return this.logState;
    }
    renderedEntries() {
        return this.log.entries.map(entry => ({
            step: entry.step,
            datestamp: entry.datestamp ?? '',
            description: entry.description ?? '',
            author: entry.author ?? '',
        }));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLogComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxLogComponent, isStandalone: true, selector: "cx-log", inputs: { log: "log" }, ngImport: i0, template: "@for (entry of renderedEntries(); track index; let index = $index) {\n  <cx-log-step\n    [step]=\"entry.step\"\n    [datestamp]=\"entry.datestamp\"\n    [description]=\"entry.description\"\n    [author]=\"entry.author\"\n  />\n}\n", styles: [":host{display:flex;flex-direction:column}"], dependencies: [{ kind: "component", type: CxLogStepComponent, selector: "cx-log-step", inputs: ["step", "datestamp", "description", "author"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLogComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-log', imports: [CxLogStepComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@for (entry of renderedEntries(); track index; let index = $index) {\n  <cx-log-step\n    [step]=\"entry.step\"\n    [datestamp]=\"entry.datestamp\"\n    [description]=\"entry.description\"\n    [author]=\"entry.author\"\n  />\n}\n", styles: [":host{display:flex;flex-direction:column}"] }]
        }], propDecorators: { log: [{
                type: Input
            }] } });
