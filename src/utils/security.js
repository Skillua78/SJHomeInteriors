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
    if (typeof url !== 'string' || !url.trim()) return '';
    const trimmed = url.trim();

    // Allow safe base64 image data URLs
    if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch {
        return '';
    }
    return '';
}

// Validate uploaded image files (MIME allowlist + 2MB size cap to prevent Storage DoS)
export function validateImageFile(file) {
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

    if (!file) return { valid: false, error: 'No file provided.' };
    if (!ALLOWED_MIMES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type (${file.type || 'unknown'}). Only JPG, PNG, and WebP images are permitted.`,
        };
    }
    if (file.size > MAX_BYTES) {
        return {
            valid: false,
            error: `File "${file.name}" exceeds the 2MB maximum size limit.`,
        };
    }
    return { valid: true, error: null };
}

// Compute SHA-256 hex digest using browser native Web Crypto API
export async function sha256Hex(plainText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Enforce strong password complexity
export function validatePasswordStrength(password) {
    if (typeof password !== 'string' || password.length < 10) {
        return 'Password must be at least 10 characters long.';
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Password must include uppercase, lowercase, and numeric characters.';
    }
    return null;
}