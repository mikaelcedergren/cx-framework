export function filterAssistantActions(actions, query) {
    const normalize = (value) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    const term = normalize(query).replace(/^(?:go to|open|navigate to|take me to)\s+/, "");
    if (!term)
        return [];
    return actions
        .map((action, index) => {
        const label = normalize(action.label);
        const text = normalize([action.label, action.description, ...(action.keywords ?? [])].join(" "));
        return {
            action,
            index,
            rank: label === term ? 0 : label.startsWith(term) ? 1 : 2,
            matches: term.split(" ").every((word) => text.includes(word)),
        };
    })
        .filter((item) => item.matches)
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map((item) => item.action);
}
