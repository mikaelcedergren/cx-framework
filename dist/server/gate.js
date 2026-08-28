import { createHash, timingSafeEqual } from "node:crypto";
import { readCookie, serializeCookie, validateCookieName } from "./cookies.js";
import { errorEnvelope, HttpError } from "./errors.js";
import { createBoundedRateLimiter } from "./rate-limit.js";
import { hasNoStoreCacheDirective, isAssetRequestPath } from "./security.js";
import { createHmacTokenCodec, randomBase64UrlIdentifier, sha256Hex, } from "./signing.js";
export const DEFAULT_SITE_GATE_PUBLIC_PATHS = Object.freeze([
    "/healthz",
    "/cx-build.json",
    "/cx-server.json",
    "/robots.txt",
    "/favicon.ico",
    "/favicon.svg",
]);
const siteGatePresentationBrand = Symbol("cx-framework.site-gate-presentation");
const DEFAULT_COOKIE_NAME = "site_gate";
const DEFAULT_GATE_PATH = "/gate";
const DEFAULT_MAX_AGE_SECONDS = 12 * 60 * 60;
export const SITE_GATE_FORM_SLOT = "<!-- cx-site-gate-form -->";
const MAX_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const MIN_PASSWORD_CHARACTERS = 12;
// Leaves enough room for worst-case URL encoding plus the field name inside the 4 KiB form bound.
const MAX_PASSWORD_BYTES = 1_024;
const MIN_SECRET_CHARACTERS = 32;
const MAX_FORM_BYTES = 4_096;
const MAX_SITE_NAME_CHARACTERS = 200;
const ATTEMPT_LIMIT = 20;
const ATTEMPT_WINDOW_MS = 15 * 60_000;
const MAX_TRACKED_CLIENTS = 10_000;
const TOKEN_NONCE_BYTES = 16;
const TOKEN_NONCE_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const TOKEN_MAX_PAYLOAD_BYTES = 256;
const GATE_TOKEN_KEY_ID = "current";
const MAX_PRESENTATION_TEMPLATE_BYTES = 128 * 1_024;
const MAX_PRESENTATION_PAGE_BYTES = 160 * 1_024;
const MAX_PRESENTATION_NESTING_DEPTH = 128;
const MAX_PRESENTATION_TEXT_CHARACTERS = 1_000;
const MAX_PRESENTATION_CLASS_BYTES = 512;
export const SITE_GATE_CONTENT_SECURITY_POLICIES = Object.freeze({
    default: "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    presented: "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
});
export const SITE_GATE_SECURITY_HEADERS = Object.freeze({
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-robots-tag": "noindex, nofollow",
});
const PRESENTATION_VOID_ELEMENTS = new Set([
    "br",
    "hr",
    "img",
    "link",
    "meta",
    "wbr",
]);
const PRESENTATION_HEAD_ELEMENTS = new Set(["link", "meta", "title"]);
const PRESENTATION_HEADING_ELEMENTS = new Set([
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
]);
const PRESENTATION_BODY_ELEMENTS = new Set([
    "a",
    "abbr",
    "address",
    "article",
    "aside",
    "b",
    "blockquote",
    "br",
    "code",
    "dd",
    "del",
    "div",
    "dl",
    "dt",
    "em",
    "figcaption",
    "figure",
    "footer",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "i",
    "img",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
    "wbr",
]);
const PRESENTATION_PHRASING_ELEMENTS = new Set([
    "a",
    "abbr",
    "b",
    "br",
    "code",
    "del",
    "em",
    "i",
    "img",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "u",
    "wbr",
]);
const PRESENTATION_SAFE_SLOT_ANCESTORS = new Set([
    "article",
    "aside",
    "body",
    "div",
    "footer",
    "header",
    "main",
    "nav",
    "section",
]);
const PRESENTATION_GLOBAL_ATTRIBUTES = new Set([
    "class",
    "dir",
    "id",
    "lang",
    "role",
    "title",
]);
const PRESENTATION_ELEMENT_ATTRIBUTES = new Map([
    ["a", new Set(["href", "rel", "target"])],
    ["blockquote", new Set(["cite"])],
    [
        "img",
        new Set([
            "alt",
            "decoding",
            "fetchpriority",
            "height",
            "loading",
            "src",
            "width",
        ]),
    ],
    ["li", new Set(["value"])],
    ["link", new Set(["as", "href", "media", "rel", "sizes", "type"])],
    ["meta", new Set(["charset", "content", "name"])],
    ["ol", new Set(["start", "type"])],
]);
const PRESENTATION_FORBIDDEN_ATTRIBUTES = new Set([
    "action",
    "aria-disabled",
    "aria-hidden",
    "contenteditable",
    "disabled",
    "form",
    "formaction",
    "formenctype",
    "formmethod",
    "formnovalidate",
    "formtarget",
    "hidden",
    "http-equiv",
    "imagesrcset",
    "inert",
    "manifest",
    "ping",
    "popover",
    "popovertarget",
    "popovertargetaction",
    "readonly",
    "srcdoc",
    "srcset",
    "style",
]);
const PRESENTATION_URL_ATTRIBUTES = new Set(["cite", "href", "poster", "src"]);
const PRESENTATION_RESERVED_IDS = new Set(["cx-site-gate-password"]);
const PRESENTATION_CHARACTER_REFERENCES = new Map([
    ["amp", "&"],
    ["apos", "'"],
    ["gt", ">"],
    ["lt", "<"],
    ["quot", '"'],
]);
const PRESENTATION_FORM_OPTION_KEYS = Object.freeze([
    "errorClassName",
    "errorMessage",
    "formClassName",
    "inputClassName",
    "labelClassName",
    "passwordLabel",
    "submitClassName",
    "submitLabel",
]);
const presentationRegistry = new WeakSet();
/**
 * Validate and freeze one branded page shell before it can be supplied to `createSiteGate()`.
 *
 * The shell is static product presentation, not a request renderer. It may reference exact
 * same-origin assets, but it cannot contain executable content, inline styles, embedded documents,
 * or form controls. Cortex inserts the sole form at `SITE_GATE_FORM_SLOT`.
 */
export function createSiteGatePresentation(options) {
    const source = presentationOptionsRecord(options);
    assertExactPresentationKeys(source, ["form", "template"], "presentation");
    const template = presentationRequiredString(source, "template", "Site gate presentation template");
    validatePresentationTemplate(template);
    const formSource = presentationOptionalRecord(source, "form", "Site gate presentation form");
    assertExactPresentationKeys(formSource, PRESENTATION_FORM_OPTION_KEYS, "presentation form");
    const form = Object.freeze({
        errorClassName: presentationClassName(formSource, "errorClassName", "Site gate error class name"),
        errorMessage: presentationText(formSource, "errorMessage", "That password did not match.", "Site gate error message"),
        formClassName: presentationClassName(formSource, "formClassName", "Site gate form class name"),
        inputClassName: presentationClassName(formSource, "inputClassName", "Site gate input class name"),
        labelClassName: presentationClassName(formSource, "labelClassName", "Site gate label class name"),
        passwordLabel: presentationText(formSource, "passwordLabel", "Password", "Site gate password label"),
        submitClassName: presentationClassName(formSource, "submitClassName", "Site gate submit class name"),
        submitLabel: presentationText(formSource, "submitLabel", "Unlock", "Site gate submit label"),
    });
    const presentation = Object.freeze({
        [siteGatePresentationBrand]: true,
        form,
        template,
    });
    presentationRegistry.add(presentation);
    return presentation;
}
export function createSiteGatePolicy({ apiPathPrefixes = ["/api"], gatePath = DEFAULT_GATE_PATH, publicPaths = [], } = {}) {
    if (!Array.isArray(publicPaths)) {
        throw new Error("Public gate paths must be an array.");
    }
    const normalizedGatePath = normalizeConfiguredPath(gatePath, "Site gate path");
    const normalizedPublicPaths = normalizeConfiguredPaths([...DEFAULT_SITE_GATE_PUBLIC_PATHS, ...publicPaths], "Public gate path");
    const normalizedApiPrefixes = normalizeConfiguredPaths(apiPathPrefixes, "API gate prefix");
    if (normalizedPublicPaths.includes(normalizedGatePath)) {
        throw new Error("The site gate path cannot also be a public bypass path.");
    }
    return Object.freeze({
        apiPathPrefixes: Object.freeze(normalizedApiPrefixes),
        gatePath: normalizedGatePath,
        publicPaths: Object.freeze(normalizedPublicPaths),
    });
}
export function classifySiteGateRequest(policy, requestPath) {
    const candidate = requestPathname(requestPath);
    if (!candidate)
        return "protected-page";
    if (candidate === policy.gatePath ||
        stripTrailingSlash(candidate) === policy.gatePath) {
        return "gate";
    }
    if (policy.publicPaths.includes(candidate))
        return "public";
    if (matchesPrefix(candidate, policy.apiPathPrefixes))
        return "api";
    return "protected-page";
}
/**
 * Build a dependency-free pre-launch gate for an Express-compatible Node server.
 *
 * Empty passwords deliberately make the middleware inert for local development, but every path,
 * cookie, lifetime, label, and clock option is still validated before that decision. Products
 * whose launch policy requires a gate must enforce the non-empty password in product-owned startup
 * configuration. When enabled, unlock state is a bounded, purpose-bound signed cookie; it contains
 * no password or product data.
 */
export function createSiteGate({ apiPathPrefixes = ["/api"], cookieName = DEFAULT_COOKIE_NAME, gatePath = DEFAULT_GATE_PATH, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS, now = Date.now, password = "", presentation, publicPaths = [], secret = "", siteName = "This site", } = {}) {
    const policy = createSiteGatePolicy({
        apiPathPrefixes,
        gatePath,
        publicPaths,
    });
    const safeCookieName = validateCookieName(cookieName);
    const safeMaxAgeSeconds = validateMaxAgeSeconds(maxAgeSeconds);
    const safeSiteName = validateSiteName(siteName);
    const pages = createSiteGatePages({
        gatePath: policy.gatePath,
        presentation,
        siteName: safeSiteName,
    });
    if (typeof now !== "function") {
        throw new Error("A site gate clock must be a function.");
    }
    if (typeof password !== "string") {
        throw new Error("A site gate password must be a string.");
    }
    if (password === "") {
        const passThrough = (_request, _response, next) => next();
        return Object.freeze({
            enabled: false,
            gatePath: policy.gatePath,
            isUnlocked: () => true,
            middleware: () => passThrough,
        });
    }
    validatePassword(password);
    validateSecret(secret);
    const maxAgeMilliseconds = safeMaxAgeSeconds * 1_000;
    const tokenCodec = createHmacTokenCodec({
        activeKeyId: GATE_TOKEN_KEY_ID,
        keys: [{ id: GATE_TOKEN_KEY_ID, secret }],
        maxPayloadBytes: TOKEN_MAX_PAYLOAD_BYTES,
        purpose: `site-gate:v1:${sha256Hex(JSON.stringify([safeSiteName, safeCookieName, policy.gatePath]))}`,
    });
    const attempts = createBoundedRateLimiter({
        limit: ATTEMPT_LIMIT,
        maxKeys: MAX_TRACKED_CLIENTS,
        now,
        windowMs: ATTEMPT_WINDOW_MS,
    });
    function clock() {
        const timestamp = now();
        if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
            throw new Error("The site gate clock must return non-negative epoch milliseconds.");
        }
        return timestamp;
    }
    function isUnlocked(request) {
        const token = readCookie(requestHeader(request, "cookie"), safeCookieName);
        if (!token)
            return false;
        const verified = tokenCodec.verifyUtf8(token);
        if (!verified)
            return false;
        const payload = parseTokenPayload(verified.payload, maxAgeMilliseconds);
        if (!payload)
            return false;
        const timestamp = clock();
        return timestamp >= payload.issuedAt && timestamp < payload.expiresAt;
    }
    function issueToken() {
        const issuedAt = clock();
        const expiresAt = issuedAt + maxAgeMilliseconds;
        if (!Number.isSafeInteger(expiresAt)) {
            throw new Error("The site gate cookie expiry exceeds the safe range.");
        }
        return tokenCodec.signUtf8(JSON.stringify({
            expiresAt,
            issuedAt,
            nonce: randomBase64UrlIdentifier(TOKEN_NONCE_BYTES),
        }));
    }
    async function handleUnlock(request, response) {
        const clientKey = clientKeyOf(request);
        const decision = attempts.consume(clientKey);
        if (!decision.allowed) {
            response.setHeader("Retry-After", Math.max(1, Math.ceil((decision.resetAt - clock()) / 1_000)));
            sendGateError(response, new HttpError({
                code: "gate_rate_limited",
                message: "Too many attempts. Try again in a few minutes.",
                status: 429,
            }));
            return;
        }
        let submitted;
        try {
            submitted = await readSubmittedPassword(request);
        }
        catch (error) {
            sendGateError(response, normalizeGateSubmissionError(error));
            return;
        }
        if (!constantTimeEqual(submitted, password)) {
            sendRedirect(response, `${policy.gatePath}?error=1`);
            return;
        }
        attempts.clear(clientKey);
        response.setHeader("Set-Cookie", serializeCookie(safeCookieName, issueToken(), {
            maxAgeSeconds: safeMaxAgeSeconds,
            secure: requestIsSecure(request),
        }));
        sendRedirect(response, "/");
    }
    async function handleGateRequest(request, response) {
        const method = String(request.method ?? "").toUpperCase();
        if (!["GET", "HEAD", "POST"].includes(method)) {
            response.setHeader("Allow", "GET, HEAD, POST");
            sendGateError(response, new HttpError({
                code: "method_not_allowed",
                message: "Method not allowed.",
                status: 405,
            }), method === "HEAD");
            return;
        }
        if (method === "POST") {
            await handleUnlock(request, response);
            return;
        }
        if (isUnlocked(request)) {
            sendRedirect(response, "/", method === "HEAD");
            return;
        }
        const body = gateRequestFailed(request) ? pages.failed : pages.initial;
        applyGatePageHeaders(response, pages.contentSecurityPolicy);
        response.status(200).type("text/html; charset=utf-8");
        if (method === "HEAD") {
            response.setHeader("Content-Length", Buffer.byteLength(body));
            response.send();
            return;
        }
        response.send(body);
    }
    const gateMiddleware = async (request, response, next) => {
        const requestClass = classifySiteGateRequest(policy, request.path ?? request.url ?? request.originalUrl ?? "/");
        if (requestClass === "public") {
            next();
            return;
        }
        response.setHeader("X-Robots-Tag", SITE_GATE_SECURITY_HEADERS["x-robots-tag"]);
        if (requestClass === "gate") {
            noStore(response);
            await handleGateRequest(request, response);
            return;
        }
        if (isUnlocked(request)) {
            if (requestClass === "protected-page" &&
                !isAssetRequestPath(request.path ?? request.url ?? request.originalUrl ?? "/")) {
                noStore(response);
            }
            next();
            return;
        }
        noStore(response);
        if (requestClass === "api") {
            sendApiError(request, response, new HttpError({
                code: "gate_locked",
                message: `${safeSiteName} is not open yet.`,
                status: 401,
            }));
            return;
        }
        sendRedirect(response, policy.gatePath);
    };
    return Object.freeze({
        enabled: true,
        gatePath: policy.gatePath,
        isUnlocked,
        middleware: () => gateMiddleware,
    });
}
function createSiteGatePages({ gatePath, presentation, siteName, }) {
    if (presentation === undefined) {
        return Object.freeze({
            contentSecurityPolicy: SITE_GATE_CONTENT_SECURITY_POLICIES.default,
            failed: renderGatePage({ failed: true, gatePath, siteName }),
            initial: renderGatePage({ failed: false, gatePath, siteName }),
        });
    }
    if (!presentationRegistry.has(presentation)) {
        throw new Error("A site gate presentation must be created by createSiteGatePresentation().");
    }
    return Object.freeze({
        contentSecurityPolicy: SITE_GATE_CONTENT_SECURITY_POLICIES.presented,
        failed: renderPresentedGatePage(presentation, gatePath, true),
        initial: renderPresentedGatePage(presentation, gatePath, false),
    });
}
function renderPresentedGatePage(presentation, gatePath, failed) {
    const form = renderPresentedGateForm(presentation.form, gatePath, failed);
    const body = presentation.template.replace(SITE_GATE_FORM_SLOT, () => form);
    if (Buffer.byteLength(body, "utf8") > MAX_PRESENTATION_PAGE_BYTES) {
        throw new Error(`A rendered site gate presentation must not exceed ${MAX_PRESENTATION_PAGE_BYTES} UTF-8 bytes.`);
    }
    return body;
}
function renderPresentedGateForm(form, gatePath, failed) {
    const error = failed
        ? `\n  <p${classAttribute(form.errorClassName)} role="alert">${escapeHtml(form.errorMessage)}</p>`
        : "";
    return `<form${classAttribute(form.formClassName)} method="post" action="${escapeHtml(gatePath)}">
  <label${classAttribute(form.labelClassName)} for="cx-site-gate-password">${escapeHtml(form.passwordLabel)}</label>
  <input${classAttribute(form.inputClassName)} id="cx-site-gate-password" name="password" type="password" autocomplete="current-password" required autofocus>${error}
  <button${classAttribute(form.submitClassName)} type="submit">${escapeHtml(form.submitLabel)}</button>
</form>`;
}
function classAttribute(value) {
    return value ? ` class="${escapeHtml(value)}"` : "";
}
function presentationOptionsRecord(value) {
    return validatePresentationRecord(value, "Site gate presentation");
}
function presentationOptionalRecord(source, key, label) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor ||
        ("value" in descriptor && descriptor.value === undefined)) {
        return {};
    }
    if (!("value" in descriptor)) {
        throw new Error(`${label} must be a plain data object.`);
    }
    return validatePresentationRecord(descriptor.value, label);
}
function validatePresentationRecord(value, label) {
    if (!isPlainRecord(value)) {
        throw new Error(`${label} must be a plain data object.`);
    }
    for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") {
            throw new Error(`${label} must use string data properties only.`);
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !("value" in descriptor)) {
            throw new Error(`${label} must use plain data properties only.`);
        }
    }
    return value;
}
function assertExactPresentationKeys(source, allowedKeys, label) {
    const allowed = new Set(allowedKeys);
    const unknown = Reflect.ownKeys(source).filter((key) => typeof key === "string" && !allowed.has(key));
    if (unknown.length > 0) {
        throw new Error(`Unknown site gate ${label} option: ${unknown.sort().join(", ")}.`);
    }
}
function presentationRequiredString(source, key, label) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor ||
        !("value" in descriptor) ||
        typeof descriptor.value !== "string") {
        throw new Error(`${label} must be a string.`);
    }
    return descriptor.value;
}
function presentationText(source, key, fallback, label) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    const value = !descriptor || ("value" in descriptor && descriptor.value === undefined)
        ? fallback
        : "value" in descriptor
            ? descriptor.value
            : undefined;
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        [...value].length > MAX_PRESENTATION_TEXT_CHARACTERS ||
        !isWellFormedUtf16(value) ||
        /[\u0000-\u001f\u007f-\u009f]/.test(value)) {
        throw new Error(`${label} must contain between 1 and ${MAX_PRESENTATION_TEXT_CHARACTERS} safe characters.`);
    }
    return value;
}
function presentationClassName(source, key, label) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    const value = !descriptor || ("value" in descriptor && descriptor.value === undefined)
        ? ""
        : "value" in descriptor
            ? descriptor.value
            : undefined;
    if (typeof value !== "string") {
        throw new Error(`${label} must be a string.`);
    }
    if (value === "")
        return value;
    if (value !== value.trim() ||
        value.split(/\s+/u).join(" ") !== value ||
        Buffer.byteLength(value, "utf8") > MAX_PRESENTATION_CLASS_BYTES ||
        !isWellFormedUtf16(value) ||
        /[&<>"'\u0000-\u001f\u007f-\u009f]/.test(value)) {
        throw new Error(`${label} must be a single-space-separated class list no larger than ${MAX_PRESENTATION_CLASS_BYTES} UTF-8 bytes.`);
    }
    return value;
}
function validatePresentationTemplate(template) {
    if (!template ||
        !isWellFormedUtf16(template) ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(template)) {
        throw new Error("A site gate presentation template must be non-empty, well-formed UTF-16 HTML without unsafe control characters.");
    }
    if (Buffer.byteLength(template, "utf8") > MAX_PRESENTATION_TEMPLATE_BYTES) {
        throw new Error(`A site gate presentation template must not exceed ${MAX_PRESENTATION_TEMPLATE_BYTES} UTF-8 bytes.`);
    }
    if (template.slice(0, 15).toLowerCase() !== "<!doctype html>") {
        throw new Error("A site gate presentation template must start with <!doctype html>.");
    }
    const state = {
        bodyClosed: false,
        bodySeen: false,
        doctypeSeen: true,
        headClosed: false,
        headSeen: false,
        htmlClosed: false,
        htmlSeen: false,
        ids: new Set(),
        slotSeen: false,
        stack: [],
    };
    let offset = 15;
    while (offset < template.length) {
        if (template.startsWith(SITE_GATE_FORM_SLOT, offset)) {
            placePresentationSlot(state);
            offset += SITE_GATE_FORM_SLOT.length;
            continue;
        }
        if (template[offset] !== "<") {
            const nextMarkup = template.indexOf("<", offset);
            const end = nextMarkup < 0 ? template.length : nextMarkup;
            assertPresentationText(template.slice(offset, end), state);
            offset = end;
            continue;
        }
        if (template.startsWith("<!--", offset)) {
            throw presentationTemplateError("comments are forbidden except for the exact framework form slot");
        }
        if (template.startsWith("</", offset)) {
            const token = readPresentationEndTag(template, offset);
            closePresentationElement(token, state);
            offset = token.end;
            continue;
        }
        if (template.startsWith("<!", offset) ||
            template.startsWith("<?", offset)) {
            throw presentationTemplateError("ambiguous markup is forbidden");
        }
        const token = readPresentationStartTag(template, offset);
        openPresentationElement(token, state);
        offset = token.end;
    }
    if (state.stack.length !== 0 ||
        !state.doctypeSeen ||
        !state.htmlSeen ||
        !state.htmlClosed ||
        !state.headSeen ||
        !state.headClosed ||
        !state.bodySeen ||
        !state.bodyClosed ||
        !state.slotSeen) {
        throw new Error("A site gate presentation template must contain one complete, strictly nested html/head/body document and one safe body-level framework form slot.");
    }
}
function readPresentationStartTag(template, offset) {
    let cursor = offset + 1;
    const nameStart = cursor;
    if (!isPresentationNameStart(template[cursor])) {
        throw presentationTemplateError("a start tag has an invalid name");
    }
    cursor += 1;
    while (isPresentationNameCharacter(template[cursor]))
        cursor += 1;
    const name = template.slice(nameStart, cursor).toLowerCase();
    const attributes = new Map();
    while (cursor < template.length) {
        const separatorStart = cursor;
        while (isPresentationWhitespace(template[cursor]))
            cursor += 1;
        if (template[cursor] === ">") {
            return {
                attributes,
                end: cursor + 1,
                name,
                selfClosing: false,
            };
        }
        if (template[cursor] === "/" && template[cursor + 1] === ">") {
            return {
                attributes,
                end: cursor + 2,
                name,
                selfClosing: true,
            };
        }
        if (cursor === separatorStart) {
            throw presentationTemplateError(`the <${name}> tag has an ambiguous attribute boundary`);
        }
        const attributeStart = cursor;
        if (!isPresentationNameStart(template[cursor])) {
            throw presentationTemplateError("an attribute has an invalid name");
        }
        cursor += 1;
        while (isPresentationAttributeNameCharacter(template[cursor]))
            cursor += 1;
        const attribute = template.slice(attributeStart, cursor).toLowerCase();
        if (attributes.has(attribute)) {
            throw presentationTemplateError(`the <${name}> tag contains a duplicate ${attribute} attribute`);
        }
        while (isPresentationWhitespace(template[cursor]))
            cursor += 1;
        if (template[cursor] !== "=") {
            throw presentationTemplateError(`the ${attribute} attribute on <${name}> must have a quoted value`);
        }
        cursor += 1;
        while (isPresentationWhitespace(template[cursor]))
            cursor += 1;
        const quote = template[cursor];
        if (quote !== '"' && quote !== "'") {
            throw presentationTemplateError(`the ${attribute} attribute on <${name}> must have a quoted value`);
        }
        cursor += 1;
        const valueStart = cursor;
        while (cursor < template.length && template[cursor] !== quote) {
            const character = template[cursor];
            if (character === "<" ||
                /[\u0000-\u001f\u007f-\u009f]/u.test(character)) {
                throw presentationTemplateError(`the ${attribute} attribute on <${name}> contains ambiguous markup`);
            }
            cursor += 1;
        }
        if (template[cursor] !== quote) {
            throw presentationTemplateError(`the ${attribute} attribute on <${name}> is unterminated`);
        }
        const rawValue = template.slice(valueStart, cursor);
        if (rawValue.includes("-->")) {
            throw presentationTemplateError("comment-like markup is forbidden");
        }
        attributes.set(attribute, {
            rawValue,
            value: decodePresentationAttributeValue(rawValue, attribute),
        });
        cursor += 1;
    }
    throw presentationTemplateError(`the <${name}> tag is unterminated`);
}
function readPresentationEndTag(template, offset) {
    let cursor = offset + 2;
    const nameStart = cursor;
    if (!isPresentationNameStart(template[cursor])) {
        throw presentationTemplateError("an end tag has an invalid name");
    }
    cursor += 1;
    while (isPresentationNameCharacter(template[cursor]))
        cursor += 1;
    const name = template.slice(nameStart, cursor).toLowerCase();
    while (isPresentationWhitespace(template[cursor]))
        cursor += 1;
    if (template[cursor] !== ">") {
        throw presentationTemplateError(`the </${name}> tag is ambiguous`);
    }
    return { end: cursor + 1, name };
}
function openPresentationElement(token, state) {
    const { attributes, name, selfClosing } = token;
    const parent = state.stack.at(-1);
    if (state.stack.length >= MAX_PRESENTATION_NESTING_DEPTH) {
        throw presentationTemplateError(`markup nesting exceeds ${MAX_PRESENTATION_NESTING_DEPTH} elements`);
    }
    if (name === "html") {
        if (!state.doctypeSeen ||
            state.htmlSeen ||
            state.htmlClosed ||
            parent !== undefined ||
            selfClosing) {
            throw presentationTemplateError("the html root is invalid");
        }
        state.htmlSeen = true;
    }
    else if (name === "head") {
        if (parent !== "html" || state.headSeen || state.bodySeen || selfClosing) {
            throw presentationTemplateError("the head section is invalid");
        }
        state.headSeen = true;
    }
    else if (name === "body") {
        if (parent !== "html" ||
            !state.headClosed ||
            state.bodySeen ||
            selfClosing) {
            throw presentationTemplateError("the body section is invalid");
        }
        state.bodySeen = true;
    }
    else if (state.stack.includes("head")) {
        if (!PRESENTATION_HEAD_ELEMENTS.has(name) || parent !== "head") {
            throw presentationTemplateError(`unsupported or misplaced <${name}> markup is forbidden in the head`);
        }
    }
    else if (state.stack.includes("body")) {
        if (!PRESENTATION_BODY_ELEMENTS.has(name)) {
            throw presentationTemplateError(`executable, embedded, form-owned, or unsupported <${name}> markup is forbidden`);
        }
    }
    else {
        throw presentationTemplateError(`<${name}> markup appears outside the head or body`);
    }
    if (state.stack.some((ancestor) => ancestor === "p" || ancestor === "pre") &&
        !PRESENTATION_PHRASING_ELEMENTS.has(name)) {
        throw presentationTemplateError(`<${name}> markup would be reparsed outside an open paragraph or preformatted element`);
    }
    if (name === "a" && state.stack.includes("a")) {
        throw presentationTemplateError("nested anchor markup is ambiguous");
    }
    if (name === "li" &&
        state.stack.lastIndexOf("li") >
            Math.max(state.stack.lastIndexOf("ul"), state.stack.lastIndexOf("ol"))) {
        throw presentationTemplateError("an open list item must close before another list item begins");
    }
    if ((name === "dt" || name === "dd") &&
        Math.max(state.stack.lastIndexOf("dt"), state.stack.lastIndexOf("dd")) >
            state.stack.lastIndexOf("dl")) {
        throw presentationTemplateError("an open definition item must close before another definition item begins");
    }
    if (PRESENTATION_HEADING_ELEMENTS.has(name) &&
        parent !== undefined &&
        PRESENTATION_HEADING_ELEMENTS.has(parent)) {
        throw presentationTemplateError("an open heading must close before another heading begins");
    }
    assertPresentationAttributes(name, attributes, state);
    const isVoid = PRESENTATION_VOID_ELEMENTS.has(name);
    if (selfClosing && !isVoid) {
        throw presentationTemplateError(`non-void <${name}> markup cannot be self-closing`);
    }
    if (!isVoid)
        state.stack.push(name);
}
function closePresentationElement(token, state) {
    if (PRESENTATION_VOID_ELEMENTS.has(token.name)) {
        throw presentationTemplateError(`void <${token.name}> markup cannot have an end tag`);
    }
    const current = state.stack.at(-1);
    if (current !== token.name) {
        throw presentationTemplateError(`markup is not strictly nested at </${token.name}>`);
    }
    state.stack.pop();
    if (token.name === "head")
        state.headClosed = true;
    if (token.name === "body")
        state.bodyClosed = true;
    if (token.name === "html")
        state.htmlClosed = true;
}
function placePresentationSlot(state) {
    const bodyIndex = state.stack.indexOf("body");
    if (state.slotSeen ||
        bodyIndex < 0 ||
        state.bodyClosed ||
        !state.stack
            .slice(bodyIndex)
            .every((ancestor) => PRESENTATION_SAFE_SLOT_ANCESTORS.has(ancestor))) {
        throw new Error("A site gate presentation template must place its one framework form slot inside safe body flow containers.");
    }
    state.slotSeen = true;
}
function assertPresentationText(value, state) {
    if (value.includes("-->")) {
        throw presentationTemplateError("comment-like markup is forbidden");
    }
    const current = state.stack.at(-1);
    if ((state.stack.length === 0 || current === "html" || current === "head") &&
        !isPresentationWhitespaceOnly(value)) {
        throw presentationTemplateError("text appears outside a content element");
    }
}
function assertPresentationAttributes(element, attributes, state) {
    const elementAttributes = PRESENTATION_ELEMENT_ATTRIBUTES.get(element);
    for (const [attribute, { rawValue, value }] of attributes) {
        if (attribute.startsWith("on") ||
            PRESENTATION_FORBIDDEN_ATTRIBUTES.has(attribute)) {
            throw presentationTemplateError(`executable, hidden, or form-owned ${attribute} behavior is forbidden`);
        }
        const isAriaAttribute = /^aria-[a-z0-9-]+$/u.test(attribute);
        const isDataAttribute = /^data-[a-z0-9._-]+$/u.test(attribute);
        if (!PRESENTATION_GLOBAL_ATTRIBUTES.has(attribute) &&
            !elementAttributes?.has(attribute) &&
            !isAriaAttribute &&
            !isDataAttribute) {
            throw presentationTemplateError(`the ${attribute} attribute is unsupported on <${element}>`);
        }
        if (attribute === "id") {
            if (rawValue.includes("&") ||
                !value ||
                /[\s&<>"'\u0000-\u001f\u007f-\u009f]/u.test(value)) {
                throw presentationTemplateError("an id attribute is ambiguous");
            }
            if (PRESENTATION_RESERVED_IDS.has(value)) {
                throw presentationTemplateError(`the reserved ${value} id belongs to the framework form`);
            }
            if (state.ids.has(value)) {
                throw presentationTemplateError(`the ${value} id is duplicated`);
            }
            state.ids.add(value);
        }
        if (PRESENTATION_URL_ATTRIBUTES.has(attribute)) {
            if (rawValue.includes("&") ||
                (!value.startsWith("#") &&
                    (!value.startsWith("/") || value.startsWith("//"))) ||
                /[\\\u0000-\u0020\u007f<>]/u.test(value)) {
                throw new Error("Site gate presentation URL attributes must use quoted same-origin absolute paths or fragments without character references.");
            }
        }
    }
    if (element === "meta" &&
        presentationAsciiTrim(attributes.get("name")?.value ?? "").toLowerCase() ===
            "referrer") {
        throw presentationTemplateError("a meta referrer directive cannot override framework response policy");
    }
}
function decodePresentationAttributeValue(rawValue, attribute) {
    let decoded = "";
    for (let offset = 0; offset < rawValue.length;) {
        if (rawValue[offset] !== "&") {
            decoded += rawValue[offset];
            offset += 1;
            continue;
        }
        const semicolon = rawValue.indexOf(";", offset + 1);
        if (semicolon < 0 || semicolon - offset > 32) {
            throw presentationTemplateError(`the ${attribute} attribute contains an ambiguous character reference`);
        }
        const reference = rawValue.slice(offset + 1, semicolon);
        let character;
        if (/^#[0-9]+$/u.test(reference)) {
            character = presentationCodePoint(Number.parseInt(reference.slice(1), 10), attribute);
        }
        else if (/^#x[0-9a-f]+$/iu.test(reference)) {
            character = presentationCodePoint(Number.parseInt(reference.slice(2), 16), attribute);
        }
        else {
            character = PRESENTATION_CHARACTER_REFERENCES.get(reference);
        }
        if (character === undefined) {
            throw presentationTemplateError(`the ${attribute} attribute contains an unsupported character reference`);
        }
        decoded += character;
        offset = semicolon + 1;
    }
    if (/\u0000|[\u0001-\u001f\u007f-\u009f]/u.test(decoded)) {
        throw presentationTemplateError(`the ${attribute} attribute contains unsafe characters`);
    }
    return decoded;
}
function presentationCodePoint(value, attribute) {
    if (!Number.isSafeInteger(value) ||
        value <= 0 ||
        value > 0x10ffff ||
        (value >= 0xd800 && value <= 0xdfff)) {
        throw presentationTemplateError(`the ${attribute} attribute contains an invalid character reference`);
    }
    return String.fromCodePoint(value);
}
function isPresentationNameStart(value) {
    if (!value)
        return false;
    const code = value.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
function isPresentationNameCharacter(value) {
    if (!value)
        return false;
    const code = value.charCodeAt(0);
    return (isPresentationNameStart(value) ||
        (code >= 48 && code <= 57) ||
        value === "-");
}
function isPresentationAttributeNameCharacter(value) {
    return isPresentationNameCharacter(value) || value === "." || value === "_";
}
function isPresentationWhitespace(value) {
    return (value === "\t" ||
        value === "\n" ||
        value === "\f" ||
        value === "\r" ||
        value === " ");
}
function isPresentationWhitespaceOnly(value) {
    for (const character of value) {
        if (!isPresentationWhitespace(character))
            return false;
    }
    return true;
}
function presentationAsciiTrim(value) {
    let start = 0;
    let end = value.length;
    while (start < end && isPresentationWhitespace(value[start]))
        start += 1;
    while (end > start && isPresentationWhitespace(value[end - 1]))
        end -= 1;
    return value.slice(start, end);
}
function presentationTemplateError(detail) {
    return new Error(`A site gate presentation template is invalid: ${detail}.`);
}
function normalizeConfiguredPaths(paths, label) {
    if (!Array.isArray(paths))
        throw new Error(`${label}s must be an array.`);
    const normalized = paths.map((path) => normalizeConfiguredPath(path, label));
    if (new Set(normalized).size !== normalized.length) {
        throw new Error(`${label}s must not contain duplicates.`);
    }
    return normalized;
}
function normalizeConfiguredPath(value, label) {
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        /[\u0000-\u0020\u007f\\?#]/.test(value)) {
        throw new Error(`${label} must be a safe same-origin absolute path: ${String(value)}`);
    }
    const normalized = stripTrailingSlash(value).toLowerCase();
    if (normalized === "/") {
        throw new Error(`${label} cannot expose the entire site.`);
    }
    return normalized;
}
function requestPathname(value) {
    if (typeof value !== "string")
        return null;
    const pathname = value.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";
    if (!pathname.startsWith("/") ||
        pathname.startsWith("//") ||
        /[\u0000-\u0020\u007f\\]/.test(pathname)) {
        return null;
    }
    return pathname;
}
function matchesPrefix(candidate, prefixes) {
    return prefixes.some((prefix) => candidate === prefix || candidate.startsWith(`${prefix}/`));
}
function stripTrailingSlash(value) {
    return value.length > 1 ? value.replace(/\/+$/, "") || "/" : value;
}
function validatePassword(value) {
    const byteLength = Buffer.byteLength(value, "utf8");
    const characterCount = [...value].length;
    if (characterCount < MIN_PASSWORD_CHARACTERS ||
        byteLength > MAX_PASSWORD_BYTES ||
        !isWellFormedUtf16(value)) {
        throw new Error(`A site gate password must contain at least ${MIN_PASSWORD_CHARACTERS} characters and at most ${MAX_PASSWORD_BYTES} UTF-8 bytes.`);
    }
}
function validateSecret(value) {
    if (typeof value !== "string" || value.length < MIN_SECRET_CHARACTERS) {
        throw new Error(`A site gate secret must contain at least ${MIN_SECRET_CHARACTERS} characters.`);
    }
}
function validateMaxAgeSeconds(value) {
    if (!Number.isSafeInteger(value) ||
        value < 1 ||
        value > MAX_MAX_AGE_SECONDS) {
        throw new Error(`A site gate cookie lifetime must be between 1 and ${MAX_MAX_AGE_SECONDS} whole seconds.`);
    }
    return value;
}
function validateSiteName(value) {
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        value.length > MAX_SITE_NAME_CHARACTERS ||
        !isWellFormedUtf16(value) ||
        /[\u0000-\u001f\u007f]/.test(value)) {
        throw new Error(`A site gate name must contain between 1 and ${MAX_SITE_NAME_CHARACTERS} safe characters.`);
    }
    return value;
}
function isWellFormedUtf16(value) {
    for (let index = 0; index < value.length; index += 1) {
        const codeUnit = value.charCodeAt(index);
        if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
            const nextCodeUnit = value.charCodeAt(index + 1);
            if (index + 1 >= value.length ||
                nextCodeUnit < 0xdc00 ||
                nextCodeUnit > 0xdfff) {
                return false;
            }
            index += 1;
            continue;
        }
        if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff)
            return false;
    }
    return true;
}
function parseTokenPayload(source, maxAgeMilliseconds) {
    let parsed;
    try {
        parsed = JSON.parse(source);
    }
    catch {
        return null;
    }
    if (!isPlainRecord(parsed))
        return null;
    const keys = Object.keys(parsed).sort();
    if (keys.join(",") !== "expiresAt,issuedAt,nonce")
        return null;
    const expiresAt = parsed["expiresAt"];
    const issuedAt = parsed["issuedAt"];
    const nonce = parsed["nonce"];
    if (!Number.isSafeInteger(expiresAt) ||
        !Number.isSafeInteger(issuedAt) ||
        typeof expiresAt !== "number" ||
        typeof issuedAt !== "number" ||
        issuedAt < 0 ||
        expiresAt - issuedAt !== maxAgeMilliseconds ||
        typeof nonce !== "string" ||
        !TOKEN_NONCE_PATTERN.test(nonce)) {
        return null;
    }
    return { expiresAt, issuedAt, nonce };
}
async function readSubmittedPassword(request) {
    const details = request;
    if (details.body !== undefined) {
        return passwordFromParsedBody(details.body);
    }
    const mediaType = singleHeaderValue(request, "content-type")
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase();
    if (mediaType !== "application/json" &&
        mediaType !== "application/x-www-form-urlencoded") {
        throw new HttpError({
            code: "unsupported_media_type",
            message: "Use the gate form to submit the password.",
            status: 415,
        });
    }
    const raw = await readBoundedBody(details);
    if (mediaType === "application/json") {
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (error) {
            throw new HttpError({
                cause: error,
                code: "invalid_gate_request",
                message: "The unlock request is not valid JSON.",
                status: 400,
            });
        }
        return passwordFromParsedBody(parsed);
    }
    const fields = [...new URLSearchParams(raw)];
    const field = fields[0];
    if (fields.length !== 1 ||
        !field ||
        field[0] !== "password" ||
        field[1].length > MAX_FORM_BYTES) {
        throw invalidGateRequest();
    }
    return field[1];
}
function passwordFromParsedBody(body) {
    if (!isPlainRecord(body))
        throw invalidGateRequest();
    const ownKeys = Reflect.ownKeys(body);
    if (ownKeys.length !== 1 || ownKeys[0] !== "password") {
        throw invalidGateRequest();
    }
    const descriptor = Object.getOwnPropertyDescriptor(body, "password");
    if (!descriptor ||
        !("value" in descriptor) ||
        typeof descriptor.value !== "string") {
        throw invalidGateRequest();
    }
    if (Buffer.byteLength(descriptor.value, "utf8") > MAX_FORM_BYTES) {
        throw requestTooLarge();
    }
    return descriptor.value;
}
function readBoundedBody(request) {
    if (typeof request.on !== "function") {
        return Promise.reject(invalidGateRequest());
    }
    return new Promise((resolve, reject) => {
        let settled = false;
        let size = 0;
        const chunks = [];
        function fail(error) {
            if (settled)
                return;
            settled = true;
            chunks.length = 0;
            reject(error);
        }
        request.on?.("data", (chunk) => {
            if (settled)
                return;
            let bytes;
            if (typeof chunk === "string") {
                bytes = Buffer.from(chunk);
            }
            else if (chunk instanceof Uint8Array) {
                bytes = Buffer.from(chunk);
            }
            else {
                fail(invalidGateRequest());
                return;
            }
            size += bytes.length;
            if (size > MAX_FORM_BYTES) {
                fail(requestTooLarge());
                return;
            }
            chunks.push(bytes);
        });
        request.on?.("end", () => {
            if (settled)
                return;
            settled = true;
            resolve(Buffer.concat(chunks, size).toString("utf8"));
        });
        request.on?.("error", (error) => {
            fail(new HttpError({
                cause: error,
                code: "invalid_gate_request",
                message: "The unlock request could not be read.",
                status: 400,
            }));
        });
        request.on?.("aborted", () => {
            fail(invalidGateRequest());
        });
    });
}
function normalizeGateSubmissionError(error) {
    return error instanceof HttpError ? error : invalidGateRequest(error);
}
function invalidGateRequest(cause) {
    return new HttpError({
        cause,
        code: "invalid_gate_request",
        message: "The unlock request could not be read.",
        status: 400,
    });
}
function requestTooLarge() {
    return new HttpError({
        code: "request_too_large",
        message: "The unlock request body is too large.",
        status: 413,
    });
}
function isPlainRecord(value) {
    if (!value || typeof value !== "object")
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function constantTimeEqual(left, right) {
    const leftHash = createHash("sha256").update(left, "utf8").digest();
    const rightHash = createHash("sha256").update(right, "utf8").digest();
    return timingSafeEqual(leftHash, rightHash);
}
function clientKeyOf(request) {
    const details = request;
    for (const candidate of [details.ip, details.socket?.remoteAddress]) {
        if (typeof candidate === "string" &&
            candidate.length >= 1 &&
            candidate.length <= 512) {
            return candidate;
        }
    }
    return "unknown";
}
function requestIsSecure(request) {
    const details = request;
    return (details.secure === true ||
        singleHeaderValue(request, "x-forwarded-proto")?.toLowerCase() === "https");
}
function requestHeader(request, name) {
    const matches = [];
    for (const [candidateName, candidateValue] of Object.entries(request.headers ?? {})) {
        if (candidateName.toLowerCase() !== name)
            continue;
        if (typeof candidateValue === "string")
            matches.push(candidateValue);
        else if (Array.isArray(candidateValue)) {
            for (const value of candidateValue) {
                if (typeof value === "string")
                    matches.push(value);
            }
        }
    }
    if (matches.length === 0)
        return undefined;
    return matches.length === 1 ? matches[0] : matches;
}
function singleHeaderValue(request, name) {
    const value = requestHeader(request, name);
    return typeof value === "string" ? value : undefined;
}
function gateRequestFailed(request) {
    const source = request.originalUrl ?? request.url ?? "";
    const separator = source.indexOf("?");
    if (separator < 0)
        return false;
    return new URLSearchParams(source.slice(separator + 1)).get("error") === "1";
}
function sendApiError(request, response, error) {
    const result = errorEnvelope(error, request.requestId);
    response.status(result.status).type("application/json").json(result.body);
}
function sendGateError(response, error, head = false) {
    response.status(error.status).type("text/plain; charset=utf-8");
    response.send(head ? undefined : error.message);
}
function sendRedirect(response, location, head = false) {
    response.setHeader("Location", location);
    response.status(302).type("text/plain; charset=utf-8");
    response.send(head ? undefined : "Found.");
}
function noStore(response) {
    if (hasNoStoreCacheDirective(response.getHeader?.("Cache-Control")))
        return;
    response.setHeader("Cache-Control", "no-store");
}
function applyGatePageHeaders(response, contentSecurityPolicy) {
    response.setHeader("Content-Security-Policy", contentSecurityPolicy);
    response.setHeader("X-Content-Type-Options", SITE_GATE_SECURITY_HEADERS["x-content-type-options"]);
    response.setHeader("X-Frame-Options", SITE_GATE_SECURITY_HEADERS["x-frame-options"]);
    response.setHeader("Referrer-Policy", SITE_GATE_SECURITY_HEADERS["referrer-policy"]);
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
        '"': "&quot;",
        "&": "&amp;",
        "'": "&#39;",
        "<": "&lt;",
        ">": "&gt;",
    })[character] ?? "");
}
function renderGatePage({ failed, gatePath, siteName, }) {
    const name = escapeHtml(siteName);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${name}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
    background: #0b0c0e; color: #e9eaec;
    font: 16px/1.55 ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  main { width: 100%; max-width: 22rem; }
  h1 { margin: 0 0 8px; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.01em; }
  p { margin: 0 0 24px; color: #9aa0a6; font-size: 0.9375rem; }
  label { display: block; margin-bottom: 8px; font-size: 0.8125rem; color: #9aa0a6; }
  input, button { width: 100%; font: inherit; border-radius: 8px; }
  input {
    padding: 10px 12px; color: #e9eaec; background: #141619;
    border: 1px solid #2a2d33;
  }
  input:focus-visible { outline: 2px solid #5b8def; outline-offset: 1px; border-color: transparent; }
  button {
    margin-top: 16px; padding: 10px 12px; font-weight: 550; cursor: pointer;
    color: #0b0c0e; background: #e9eaec; border: 1px solid transparent;
  }
  button:hover { background: #ffffff; }
  .error { margin: 0 0 16px; color: #f2857f; font-size: 0.875rem; }
</style>
</head>
<body>
<main>
  <h1>${name} is not open yet</h1>
  <p>This site is closed while it is being finished. Enter the access password to continue.</p>
  ${failed ? '<p class="error">That password did not match.</p>' : ""}
  <form method="post" action="${escapeHtml(gatePath)}">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
    <button type="submit">Unlock</button>
  </form>
</main>
</body>
</html>
`;
}
