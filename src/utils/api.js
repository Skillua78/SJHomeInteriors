/**
 * Browser client for the Cloudflare Pages Functions API.
 *
 * Authentication is an HttpOnly session cookie set by the server, so there is
 * nothing secret to store or attach here. Every call either resolves with the
 * parsed JSON body or throws an ApiError carrying the server's message.
 */

export class ApiError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.status = status;
        this.data = data;
        this.code = data.code;
    }
}

const CLOUDFLARE_ERRORS = {
    1015: 'too many requests in a short time (Cloudflare rate limit)',
    1020: 'a Cloudflare firewall rule blocked the request',
    1101: 'the server code crashed while handling it',
    1102: 'the server ran out of processing time (Cloudflare plan limit)',
};

/**
 * Plain-English reason for an error page from Cloudflare instead of a JSON answer,
 * e.g. "error code: 1102" or an HTML "Error 1020 ... Access denied" page.
 */
export function describeNonJsonError(status, text = '') {
    const code = Number((/error(?:\s+code)?[:\s]+(1\d{3})\b/i.exec(text) || [])[1]) || null;
    let reason = code && CLOUDFLARE_ERRORS[code];
    if (!reason) {
        if (status === 413) reason = 'the request was too large';
        else if (status === 429) reason = CLOUDFLARE_ERRORS[1015];
        else if (status === 403 || /cf-challenge|challenge-platform|Just a moment/i.test(text))
            reason = 'Cloudflare security blocked or challenged the request';
        else if (status === 401) reason = 'you are not signed in';
        else if (status >= 500) reason = 'Cloudflare could not get an answer from the shop server';
        else reason = 'the server sent back an unexpected page';
    }
    const ref = code ? `HTTP ${status}, Cloudflare error ${code}` : `HTTP ${status}`;
    return `The server did not answer properly: ${reason} (${ref}).`;
}

/** Seconds from a Retry-After header (number or HTTP date), or null. */
function retryAfterSeconds(res) {
    const raw = res.headers.get('Retry-After');
    if (!raw) return null;
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) return Math.max(0, seconds);
    const at = Date.parse(raw);
    return Number.isFinite(at) ? Math.max(0, Math.round((at - Date.now()) / 1000)) : null;
}

/** True when the API itself is unreachable (e.g. `vite dev` without Functions). */
export function isApiUnavailable(err) {
    return err instanceof ApiError && err.status === 0;
}

async function request(path, { method = 'GET', body, fresh = false } = {}) {
    let res;
    try {
        res = await fetch(path, {
            method,
            credentials: 'same-origin',
            cache: fresh ? 'reload' : 'default',
            headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError('Could not reach the server. Please check your connection.', 0);
    }

    const isJson = (res.headers.get('Content-Type') || '').includes('application/json');
    if (!isJson) {
        // A static host answers /api/* with the SPA shell; treat that as "no API".
        if (res.ok) throw new ApiError('The shop API is not available.', 0);
        // Otherwise Cloudflare answered with its own error page before our code could reply.
        const text = await res.text().catch(() => '');
        throw new ApiError(describeNonJsonError(res.status, text), res.status, {
            cloudflare: true,
            retryAfter: retryAfterSeconds(res),
        });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, {
            ...data,
            retryAfter: retryAfterSeconds(res),
        });
    }
    return data;
}

function query(params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params || {})) {
        if (value !== undefined && value !== null && value !== '' && value !== 'All') {
            search.set(key, String(value));
        }
    }
    const text = search.toString();
    return text ? `?${text}` : '';
}

export const api = {
    // Session
    me: () => request('/api/auth'),
    register: (name, email, phone, password) =>
        request('/api/auth?action=register', { method: 'POST', body: { name, email, phone, password } }),
    login: (email, password) =>
        request('/api/auth?action=login', { method: 'POST', body: { email, password } }),
    googleAuth: (credential) =>
        request('/api/auth?action=google', { method: 'POST', body: { credential } }),
    logout: () => request('/api/auth?action=logout', { method: 'POST', body: {} }),

    // Settings
    getSettings: () => request('/api/settings'),
    updateSettings: (settings) => request('/api/settings', { method: 'PUT', body: settings }),

    // Catalogue
    listProducts: (params, { fresh } = {}) => request(`/api/products${query(params)}`, { fresh }),
    getProduct: (id, { fresh } = {}) => request(`/api/products/${encodeURIComponent(id)}`, { fresh }),
    getFacets: ({ fresh } = {}) => request('/api/catalog', { fresh }),

    // Catalogue administration
    addProduct: (product) => request('/api/products', { method: 'POST', body: product }),
    updateProduct: (product) => request('/api/products', { method: 'PUT', body: product }),
    updateStock: (id, stock) =>
        request('/api/products', { method: 'PUT', body: { id, stockOnly: true, stock } }),
    deleteProduct: (id) => request(`/api/products${query({ id })}`, { method: 'DELETE' }),
    restoreProduct: (id) =>
        request(`/api/products${query({ action: 'restore', id })}`, { method: 'POST', body: {} }),

    // Reviews
    getReviews: () => request('/api/reviews', { fresh: true }),
    getProductReviews: (productId) => request(`/api/reviews${query({ productId, limit: 50 })}`),
    submitReview: (review) => request('/api/reviews', { method: 'POST', body: review }),
    setReviewVerified: (id, verified) =>
        request('/api/reviews', { method: 'PUT', body: { id, action: 'toggle-verify', verified } }),
    respondToReview: (id, adminResponse) =>
        request('/api/reviews', { method: 'PUT', body: { id, action: 'respond', adminResponse } }),
    deleteReview: (id) => request(`/api/reviews${query({ id })}`, { method: 'DELETE' }),

    // Checkout & orders
    checkout: (order) => request('/api/checkout', { method: 'POST', body: order }),
    quoteBasket: (basket) => request('/api/checkout?action=quote', { method: 'POST', body: basket }),
    getCheckoutStatus: (sessionId) =>
        request(`/api/checkout${query({ session_id: sessionId })}`, { fresh: true }),
    listOrders: (params) => request(`/api/orders${query(params)}`, { fresh: true }),
    updateOrderStatus: (id, status) => request('/api/orders', { method: 'PUT', body: { id, status } }),
    markOrdersSeen: () => request('/api/orders', { method: 'PUT', body: { action: 'mark-seen' } }),
    getSalesSummary: (days) => request(`/api/orders${query({ summary: 1, days: String(days) })}`, { fresh: true }),
    deleteOrder: (id, restock) =>
        request(`/api/orders${query({ id, restock: restock ? 1 : undefined })}`, { method: 'DELETE' }),
    exportProducts: () => request('/api/products?export=1', { fresh: true }),
    setProductHidden: (id, hidden) =>
        request('/api/products', { method: 'PUT', body: { id, hiddenOnly: true, hidden } }),

    // Messages & admin notifications
    sendMessage: (message) => request('/api/messages', { method: 'POST', body: message }),
    listMessages: (params) => request(`/api/messages${query(params)}`, { fresh: true }),
    setMessageRead: (id, read) => request('/api/messages', { method: 'PUT', body: { id, read } }),
    markAllMessagesRead: () =>
        request('/api/messages', { method: 'PUT', body: { action: 'mark-all-read' } }),
    deleteMessage: (id) => request(`/api/messages${query({ id })}`, { method: 'DELETE' }),
    getNotifications: () => request('/api/notifications', { fresh: true }),
};
