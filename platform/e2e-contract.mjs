/**
 * Inclusive listener range reserved for framework-owned, automatically selected E2E ports.
 * Operating-layer registries must keep active and prepared service ports outside this range.
 */
export const E2E_DYNAMIC_PORT_RANGE = Object.freeze({
  first: 49_152,
  last: 65_535,
});
