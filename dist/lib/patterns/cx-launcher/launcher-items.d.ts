import type { CxIconName } from "../../icons/manifest";
export type CxLauncherItem = {
    id: string;
    label: string;
    type: string;
    icon?: CxIconName;
    keywords?: readonly string[];
    disabled?: boolean;
};
export declare function validateLauncherItems(items: readonly CxLauncherItem[]): void;
/** Label relevance wins; equal-ranked matches retain the supplied order. */
export declare function filterLauncherItems(items: readonly CxLauncherItem[], query: string): readonly CxLauncherItem[];
//# sourceMappingURL=launcher-items.d.ts.map