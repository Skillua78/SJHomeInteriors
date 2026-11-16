/**
 * OWASP Input Validation, Sanitization & Cryptographic Helpers
 */

// Strip ASCII control characters, enforce max length, and normalize whitespace
export function sanitizeText(input, maxLength = 500) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, maxLength);
}

// Prevent XSS via javascript:, vbscript:, or malicious data: URIs in image/link attributes
export function validateSafeImageUrl(url) {
    if (typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:image/') ||
        trimmed.startsWith('/')
    ) {
        return trimmed;
    }
    return '';
}

// Validate uploaded image files (MIME allowlist + size cap)
export function validateImageFile(file, maxBytes = 2 * 1024 * 1024) {
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!file) return { valid: false, error: 'No file provided.' };
    if (!ALLOWED_MIMES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type (${file.type || 'unknown'}). Only JPG, PNG, and WebP images are permitted.`,
        };
    }
    if (file.size > maxBytes) {
        return {
            valid: false,
            error: `File "${file.name}" exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB maximum size limit.`,
        };
    }
    return { valid: true, error: null };
}

// Only https links may be used as hrefs for admin-configured URLs
export function validateSafeHttpsUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return '';
    try {
        const parsed = new URL(url.trim());
        return parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch {
        return '';
    }
}
