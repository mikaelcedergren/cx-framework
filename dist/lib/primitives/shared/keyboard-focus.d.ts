import { EnvironmentProviders } from '@angular/core';
/**
 * Tracks Tab navigation separately from native `:focus-visible`, which also
 * matches pointer-focused text controls in browsers. Returns an idempotent
 * release function so multiple framework initializers can safely share it.
 */
export declare function installCxKeyboardFocus(document: Document): () => void;
/** Installs the framework keyboard-focus tracker for the application lifetime. */
export declare function provideCxKeyboardFocus(): EnvironmentProviders;
//# sourceMappingURL=keyboard-focus.d.ts.map