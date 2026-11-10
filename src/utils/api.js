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
        throw new ApiError('The shop API is not available.', res.ok ? 0 : res.status);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data);
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
    submitReview: (review) => request('/api/reviews', { method: 'POST', body: review }),
    setReviewVerified: (id, verified) =>
        request('/api/reviews', { method: 'PUT', body: { id, action: 'toggle-verify', verified } }),
    respondToReview: (id, adminResponse) =>
        request('/api/reviews', { method: 'PUT', body: { id, action: 'respond', adminResponse } }),
    deleteReview: (id) => request(`/api/reviews${query({ id })}`, { method: 'DELETE' }),

    // Checkout & orders
    checkout: (order) => request('/api/checkout', { method: 'POST', body: order }),
    getCheckoutStatus: (sessionId) =>
        request(`/api/checkout${query({ session_id: sessionId })}`, { fresh: true }),
    listOrders: (params) => request(`/api/orders${query(params)}`, { fresh: true }),
    updateOrderStatus: (id, status) => request('/api/orders', { method: 'PUT', body: { id, status } }),
};
