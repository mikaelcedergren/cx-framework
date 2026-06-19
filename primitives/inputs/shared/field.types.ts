export type CxFieldSize = 'small' | 'default' | 'large';

export type CxFieldUpdateOn = 'input' | 'blur' | 'debounced';

export type CxValidationMessageType = 'status' | 'info' | 'success' | 'warning' | 'error';

export type CxValidationMessage = {
  type?: CxValidationMessageType;
  message?: string | null;
  text?: string | null;
};

export type CxRenderedValidationMessage = {
  id: string;
  type: CxValidationMessageType;
  message: string;
};

export function normalizeCxValidationMessages(
  messages: ReadonlyArray<CxValidationMessage> | null | undefined,
  fallbackErrorMessage?: string | null,
): ReadonlyArray<CxRenderedValidationMessage> {
  const normalized: CxRenderedValidationMessage[] = [];
  const seen = new Set<string>();

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
    const message = (item.message ?? item.text ?? '').trim();
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

export function normalizeCxValidationMessageType(
  type: CxValidationMessageType | null | undefined,
): CxValidationMessageType {
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
