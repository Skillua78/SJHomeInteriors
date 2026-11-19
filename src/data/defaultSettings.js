/**
 * Built-in site settings. Used when running without the API, and by the admin
 * "Restore default home page text" button.
 */
export const DEFAULT_HOME_TEXT = {
    announcementText: 'Sofas, beds, dining and more · Visit our Maltby showroom 7 days a week',
    heroBadge: 'Furniture showroom in Maltby · Open 7 days',
    heroTitle: 'Great furniture for every room, at prices that make sense',
    heroSubtitle:
        'Sofas, beds, mattresses, dining sets and wardrobes, all under one roof. We choose pieces that are well made and comfortable to live with, and keep the prices fair. Pop in and try them, or order online for local delivery.',
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
    showHomeReviews: true,
    assemblyTitle: 'Two-Person Delivery & Assembly',
    assemblySubtitle: 'Free local delivery · assembly available',
    defaultDeliveryFee: 50,
    freeDeliveryMiles: 10,
    storePostcode: 'S66 8JE',
    assemblyFee: 50,
    customCategories: {},
    customColors: {},
    promoEnabled: false,
    promoText: 'Black Friday Showroom Event',
    promoEndDate: '',
    promoDiscountPercent: 0,
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
