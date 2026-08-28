import { type CxIconName } from '../../icons/manifest';
import { type CxIconMood } from '../../primitives/media/cx-icon';
import { type CxTrendTagFavor, type CxTrendTagUnit } from '../../primitives/display/cx-trend-tag';
import { type CxProgressBarMood } from '../../primitives/feedback/cx-progress-bar';
import * as i0 from "@angular/core";
export type CxKpiMood = CxIconMood;
/**
 * A key-performance-indicator card: a headline metric with an optional trend,
 * status-tinted icon, progress, footer note, and a slot for a sparkline
 * (`[cxKpiChart]`). It composes cx-trend-tag and cx-progress-bar.
 */
export declare class CxKpiComponent {
    heading: string;
    value: string;
    icon: CxIconName | undefined;
    mood: CxKpiMood;
    trendAmount: number | undefined;
    trendFavor: CxTrendTagFavor;
    trendUnit: CxTrendTagUnit;
    progress: number | undefined;
    progressMax: number;
    progressLabel: string;
    footer: string | undefined;
    protected get hasHeading(): boolean;
    protected get visibleValue(): string;
    protected get hasTrend(): boolean;
    protected get hasProgress(): boolean;
    protected get hasFooter(): boolean;
    protected get progressMood(): CxProgressBarMood;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxKpiComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxKpiComponent, "cx-kpi", never, { "heading": { "alias": "heading"; "required": false; }; "value": { "alias": "value"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "mood": { "alias": "mood"; "required": false; }; "trendAmount": { "alias": "trendAmount"; "required": false; }; "trendFavor": { "alias": "trendFavor"; "required": false; }; "trendUnit": { "alias": "trendUnit"; "required": false; }; "progress": { "alias": "progress"; "required": false; }; "progressMax": { "alias": "progressMax"; "required": false; }; "progressLabel": { "alias": "progressLabel"; "required": false; }; "footer": { "alias": "footer"; "required": false; }; }, {}, never, ["[cxKpiChart]"], true, never>;
}
//# sourceMappingURL=cx-kpi.component.d.ts.map