export declare const RETAINED_RELEASE_DIRECTORY_MODE = 360;
export declare const RETAINED_RELEASE_EXECUTABLE_FILE_MODE = 360;
export declare const RETAINED_RELEASE_FILE_MODE = 288;
export interface RetainedBrowserReleaseModeOptions {
    readonly maxDepth?: number;
    readonly maxEntries?: number;
}
export interface RetainedBrowserReleaseModeInventory {
    readonly directories: number;
    readonly entries: number;
    readonly files: number;
    readonly root: string;
}
/**
 * Prove the complete portable browser-release tree is owner-non-writable.
 *
 * Browser artifacts never contain links or executable files, so the exact contract is mode 0550
 * for every directory and 0440 for every one-link regular file. The scan is bounded, never follows
 * a link, and rechecks every entry snapshot before it accepts the tree.
 */
export declare function assertRetainedBrowserReleaseModes(root: string, { maxDepth, maxEntries, }?: RetainedBrowserReleaseModeOptions): RetainedBrowserReleaseModeInventory;
//# sourceMappingURL=release-modes.d.ts.map