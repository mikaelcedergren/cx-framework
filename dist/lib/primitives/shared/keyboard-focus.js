import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, provideEnvironmentInitializer } from '@angular/core';
const KEYBOARD_NAVIGATION_ATTRIBUTE = 'data-cx-keyboard-navigation';
const installations = new WeakMap();
function releaseInstallation(document, installation) {
    let released = false;
    return () => {
        if (released)
            return;
        released = true;
        const activeInstallation = installations.get(document);
        if (activeInstallation !== installation)
            return;
        activeInstallation.references -= 1;
        if (activeInstallation.references === 0) {
            activeInstallation.teardown();
            installations.delete(document);
        }
    };
}
/**
 * Tracks Tab navigation separately from native `:focus-visible`, which also
 * matches pointer-focused text controls in browsers. Returns an idempotent
 * release function so multiple framework initializers can safely share it.
 */
export function installCxKeyboardFocus(document) {
    const existingInstallation = installations.get(document);
    if (existingInstallation) {
        existingInstallation.references += 1;
        return releaseInstallation(document, existingInstallation);
    }
    const setKeyboardNavigation = (active) => {
        document.documentElement.toggleAttribute(KEYBOARD_NAVIGATION_ATTRIBUTE, active);
    };
    const onKeydown = (event) => {
        if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
            setKeyboardNavigation(true);
        }
    };
    const onPointerdown = () => setKeyboardNavigation(false);
    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('pointerdown', onPointerdown, true);
    const installation = {
        references: 1,
        teardown: () => {
            document.removeEventListener('keydown', onKeydown, true);
            document.removeEventListener('pointerdown', onPointerdown, true);
            setKeyboardNavigation(false);
        },
    };
    installations.set(document, installation);
    return releaseInstallation(document, installation);
}
/** Installs the framework keyboard-focus tracker for the application lifetime. */
export function provideCxKeyboardFocus() {
    return provideEnvironmentInitializer(() => {
        const teardown = installCxKeyboardFocus(inject(DOCUMENT));
        inject(DestroyRef).onDestroy(teardown);
    });
}
