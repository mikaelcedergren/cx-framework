/** True when the user asks for reduced motion; components skip enter/leave animation. */
export function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && 'matchMedia' in window
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
