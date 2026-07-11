import { DOCUMENT } from '@angular/common';
import { DestroyRef, EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';

const KEYBOARD_NAVIGATION_ATTRIBUTE = 'data-cx-keyboard-navigation';

interface KeyboardFocusInstallation {
  references: number;
  teardown: () => void;
}

const installations = new WeakMap<Document, KeyboardFocusInstallation>();

function releaseInstallation(document: Document, installation: KeyboardFocusInstallation): () => void {
  let released = false;

  return () => {
    if (released) return;
    released = true;

    const activeInstallation = installations.get(document);
    if (activeInstallation !== installation) return;

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
export function installCxKeyboardFocus(document: Document): () => void {
  const existingInstallation = installations.get(document);
  if (existingInstallation) {
    existingInstallation.references += 1;
    return releaseInstallation(document, existingInstallation);
  }

  const setKeyboardNavigation = (active: boolean): void => {
    document.documentElement.toggleAttribute(KEYBOARD_NAVIGATION_ATTRIBUTE, active);
  };
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      setKeyboardNavigation(true);
    }
  };
  const onPointerdown = (): void => setKeyboardNavigation(false);

  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('pointerdown', onPointerdown, true);

  const installation: KeyboardFocusInstallation = {
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
export function provideCxKeyboardFocus(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const teardown = installCxKeyboardFocus(inject(DOCUMENT));
    inject(DestroyRef).onDestroy(teardown);
  });
}
