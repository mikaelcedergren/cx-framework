export function normalizeCxValidation(validation) {
    if (typeof validation === 'string') {
        return normalizeCxValidationMessages([{ type: 'error', message: validation }]).slice(0, 1);
    }
    return normalizeCxValidationMessages(validation ? [validation] : []).slice(0, 1);
}
export function normalizeCxValidationMessages(messages, fallbackErrorMessage) {
    const normalized = [];
    const seen = new Set();
    const fallback = fallbackErrorMessage?.trim();
    if (fallback) {
        normalized.push({
            id: `error:${fallback}`,
            type: 'error',
            message: fallback,
        });
        seen.add(`error:${fallback}`);
    }
    for (const item of messages ?? []) {
        const message = (item.message ?? '').trim();
        if (!message) {
            continue;
        }
        const type = normalizeCxValidationMessageType(item.type);
        const key = `${type}:${message}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        normalized.push({ id: key, type, message });
    }
    return normalized;
}
export function normalizeCxValidationMessageType(type) {
    switch (type) {
        case 'status':
        case 'info':
        case 'success':
        case 'warning':
        case 'error':
            return type;
        default:
            return 'error';
    }
}
