import type { CxIconName } from "../../icons/manifest";

export type CxLauncherItem = {
  id: string;
  label: string;
  type: string;
  icon?: CxIconName;
  keywords?: readonly string[];
  disabled?: boolean;
};

export function validateLauncherItems(items: readonly CxLauncherItem[]): void {
  if (!Array.isArray(items))
    throw new Error("[cx-launcher] items must be an array.");
  const ids = new Set<string>();
  for (const item of items) {
    if (
      !item ||
      ["id", "label", "type"].some(
        (key) =>
          typeof item[key as "id" | "label" | "type"] !== "string" ||
          !item[key as "id" | "label" | "type"].trim(),
      )
    )
      throw new Error(
        "[cx-launcher] every item requires a non-empty id, label, and type.",
      );
    if (ids.has(item.id))
      throw new Error(`[cx-launcher] duplicate item id: ${item.id}.`);
    ids.add(item.id);
    if (
      item.keywords !== undefined &&
      (!Array.isArray(item.keywords) ||
        item.keywords.some((word: unknown) => typeof word !== "string"))
    ) {
      throw new Error("[cx-launcher] keywords must be an array of strings.");
    }
    if (item.disabled !== undefined && typeof item.disabled !== "boolean") {
      throw new Error("[cx-launcher] disabled must be a boolean.");
    }
  }
}

const normalize = (text: string): string =>
  text.trim().toLocaleLowerCase().replace(/\s+/g, " ");

/** Label relevance wins; equal-ranked matches retain the supplied order. */
export function filterLauncherItems(
  items: readonly CxLauncherItem[],
  query: string,
): readonly CxLauncherItem[] {
  const value = normalize(query);
  if (!value) return items;
  const words = value.split(" ");
  return items
    .map((item, index) => {
      const label = normalize(item.label);
      const searchable = normalize(
        [item.label, item.type, ...(item.keywords ?? [])].join(" "),
      );
      const rank =
        label === value
          ? 0
          : label.startsWith(value)
            ? 1
            : label.includes(value)
              ? 2
              : 3;
      return {
        item,
        index,
        rank,
        matches: words.every((word) => searchable.includes(word)),
      };
    })
    .filter((result) => result.matches)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((result) => result.item);
}
