/**
 * Frontend client adapter for Cloudflare Pages Functions / D1 API
 */

function getAdminHeaders() {
    const secret = localStorage.getItem('sj_admin_api_key') || '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
    };
}

export const api = {
    // PRODUCTS
    async getProducts() {
        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn('API unavailable, falling back to cached/default catalog:', err);
            return null;
        }
    },

    async addProduct(product) {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify(product),
        });
        return res.json();
    },

    async updateProduct(product) {
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify(product),
        });
        return res.json();
    },

    async updateStock(id, newStock) {
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify({ id, stockOnly: true, stock: newStock }),
        });
        return res.json();
    },

    async deleteProduct(id) {
        const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: getAdminHeaders(),
        });
        return res.json();
    },

    // REVIEWS
    async getReviews() {
        try {
            const res = await fetch('/api/reviews', { headers: getAdminHeaders() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch {
            return null;
        }
    },

    async submitReview(review) {
        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review),
        });
        return res.json();
    },

    async toggleVerifyReview(id, currentVerified) {
        const res = await fetch('/api/reviews', {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify({ id, action: 'toggle-verify', verified: !currentVerified }),
        });
        return res.json();
    },

    async respondToReview(id, adminResponse) {
        const res = await fetch('/api/reviews', {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify({ id, action: 'respond', adminResponse }),
        });
        return res.json();
    },

    async deleteReview(id) {
        const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: getAdminHeaders(),
        });
        return res.json();
    },

    // ORDERS
    async submitOrder(orderSnapshot) {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderSnapshot),
        });
        return res.json();
    },
};