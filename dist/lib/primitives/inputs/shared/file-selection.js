const ACCEPT_LABELS = {
    'application/json': 'JSON',
    'application/msword': 'DOC',
    'application/pdf': 'PDF',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/xml': 'XML',
    'application/zip': 'ZIP',
    'audio/*': 'Audio',
    'image/*': 'Images',
    'text/csv': 'CSV',
    'text/plain': 'TXT',
    'text/*': 'Text',
    'video/*': 'Videos',
};
export function normalizeCxFileValue(value) {
    const nativeFile = typeof File !== 'undefined' && value instanceof File;
    const fileValue = value;
    return {
        name: value.name.trim(),
        size: value.size,
        type: value.type,
        lastModified: value.lastModified,
        file: nativeFile ? value : fileValue.file,
    };
}
export function selectCxFiles(values, options) {
    const accepted = [];
    let rejectedType = false;
    let rejectedSize = false;
    const candidates = options.multiple ? values : values.slice(0, 1);
    for (const value of candidates) {
        const file = normalizeCxFileValue(value);
        if (!matchesAccept(file, options.accept)) {
            rejectedType = true;
            continue;
        }
        if (exceedsMaxSize(file, options.maxSize)) {
            rejectedSize = true;
            continue;
        }
        accepted.push(file);
    }
    const issue = rejectedType
        ? 'unsupported-type'
        : rejectedSize
            ? 'too-large'
            : !options.multiple && values.length > 1
                ? 'single-file'
                : undefined;
    return {
        accepted: options.multiple ? accepted : accepted.slice(0, 1),
        issue,
    };
}
export function cxFileSelectionMessage(issue, options = {}) {
    if (!issue) {
        return undefined;
    }
    switch (issue) {
        case 'unsupported-type': {
            const acceptedTypes = formatCxAcceptedFileTypes(options.accept);
            return {
                type: 'error',
                message: acceptedTypes.length
                    ? `File type isn't supported. Choose a supported file. Accepted: ${formatHumanList(acceptedTypes)}.`
                    : "File type isn't supported. Choose a supported file type.",
            };
        }
        case 'too-large': {
            const limit = formatCxFileSize(options.maxSize);
            return {
                type: 'error',
                message: limit
                    ? `File is too large. Choose a file up to ${limit}.`
                    : 'File is too large. Choose a smaller file.',
            };
        }
        case 'single-file':
            return {
                type: 'warning',
                message: 'Only one file can be added. Keeping the first.',
            };
    }
}
export function formatCxFileSize(size) {
    if (size === undefined || size === null || !Number.isFinite(size) || size < 0) {
        return '';
    }
    if (size < 1024) {
        return `${Math.round(size)} B`;
    }
    if (size < 1024 * 1024) {
        return `${Math.round(size / 1024)} KB`;
    }
    const megabytes = size / (1024 * 1024);
    return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}
export function formatCxAcceptedFileTypes(accept) {
    const tokens = parseAcceptTokens(accept);
    const labels = tokens.map(token => {
        if (token.startsWith('.')) {
            return token.slice(1).toUpperCase();
        }
        return ACCEPT_LABELS[token] ?? formatMimeLabel(token);
    });
    return [...new Set(labels.filter(Boolean))];
}
export function formatCxFileConstraints(accept, maxSize) {
    const acceptedTypes = formatCxAcceptedFileTypes(accept);
    const limit = formatCxFileSize(maxSize);
    const typeText = acceptedTypes.join(', ');
    const sizeText = limit ? `up to ${limit}` : '';
    return [typeText, sizeText].filter(Boolean).join(' · ');
}
function matchesAccept(file, accept) {
    const tokens = parseAcceptTokens(accept);
    if (tokens.length === 0) {
        return true;
    }
    const name = file.name.toLowerCase();
    const type = (file.type ?? '').toLowerCase();
    return tokens.some(token => {
        if (token.startsWith('.')) {
            return name.endsWith(token);
        }
        if (!type) {
            return false;
        }
        if (token.endsWith('/*')) {
            return type.startsWith(token.slice(0, -1));
        }
        return type === token;
    });
}
function exceedsMaxSize(file, maxSize) {
    return maxSize !== undefined && file.size !== undefined && file.size > maxSize;
}
function parseAcceptTokens(accept) {
    return (accept ?? '')
        .split(',')
        .map(token => token.trim().toLowerCase())
        .filter(Boolean);
}
function formatMimeLabel(token) {
    const subtype = token.split('/')[1];
    if (!subtype) {
        return token.toUpperCase();
    }
    if (subtype === '*') {
        return token.split('/')[0]?.replace(/^./, letter => letter.toUpperCase()) ?? '';
    }
    return subtype
        .replace(/^x-/, '')
        .split(/[.+-]/)
        .filter(part => part && part !== 'vnd')
        .at(-1)
        ?.toUpperCase() ?? token.toUpperCase();
}
function formatHumanList(values) {
    if (values.length <= 1) {
        return values[0] ?? '';
    }
    if (values.length === 2) {
        return `${values[0]} or ${values[1]}`;
    }
    return `${values.slice(0, -1).join(', ')}, or ${values.at(-1)}`;
}
