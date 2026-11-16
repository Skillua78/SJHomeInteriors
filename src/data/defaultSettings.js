/**
 * Built-in site settings. Used when running without the API, and by the admin
 * "Restore default home page text" button.
 */
export const DEFAULT_HOME_TEXT = {
    announcementText: 'Unbeatable Showroom Value • High-Quality Furniture at Affordable Direct Prices',
    heroBadge: 'Maltby Showroom • Quality Furniture, Affordable Prices',
    heroTitle: 'Quality Sofas, Beds & Dining at Prices You’ll Love',
    heroSubtitle:
        'Why pay inflated high-street retail markups? We supply durable, British-built sofas, ottoman beds, and dining sets at honest, affordable showroom prices—complete with fast local delivery.',
};

export const DEFAULT_SETTINGS = {
    phone: '07830 141250',
    email: 'info@sjhomeinteriors.co.uk',
    address: 'High Street, Maltby, Rotherham, S66 8JE',
    openingHours: 'Mon–Sat: 10:00 AM – 5:00 PM | Sun: 11:00 AM – 4:00 PM',
    facebookUrl: '',
    whatsappNumber: '',
    ...DEFAULT_HOME_TEXT,
    heroImages: [
        '/showroom/20261114_145410.jpg',
        '/showroom/20261114_164355.jpg',
        '/showroom/20261114_145511.jpg',
        '/showroom/20261114_145431.jpg',
        '/showroom/20261114_164343.jpg',
        '/showroom/20261114_145509.jpg',
        '/showroom/20261114_145415.jpg',
        '/showroom/20261114_145143.jpg',
    ],
    catalogSubtitle: 'Showroom & Online Collection',
    catalogTitle: 'Explore Our Furniture',
    showAssemblyHighlight: true,
    assemblyTitle: 'Two-Person Delivery & Assembly',
    assemblySubtitle: 'One charge per order',
    defaultDeliveryFee: 50,
    customCategories: {},
    customColors: {},
    paymentEnabled: true,
    paymentOptions: { card: false, klarna: false, cod: true, showroom: true, bacs: false },
};

const CACHE_KEY = 'sj_settings_v1';

/** Last settings this browser saw (public data), so repeat visits render correctly at once. */
export function readCachedSettings() {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        return cached && typeof cached === 'object' ? cached : null;
    } catch {
        return null;
    }
}

export function cacheSettings(settings) {
    try {
        // Uploaded-but-unsaved images are never in here; saved ones are short URLs.
        localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    } catch {
        // Storage unavailable: the next visit just waits for the network instead.
    }
}
