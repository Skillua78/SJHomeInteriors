import { MapPin, Phone, Mail, ShieldAlert, MessageCircle, Share2 } from 'lucide-react';
import Logo from './Logo';
import PaymentBadges from './ui/PaymentBadges';
import { validateSafeHttpsUrl } from '../utils/security';

export function formatWhatsAppHref(raw) {
    if (!raw) return '';
    const trimmed = String(raw).trim();
    if (/^https?:/i.test(trimmed)) {
        return validateSafeHttpsUrl(trimmed);
    }
    let digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.startsWith('07') && digits.length === 11) {
        digits = '44' + digits.slice(1);
    }
    return digits ? `https://wa.me/${digits}` : '';
}

export default function Footer({
    onSelectCategory,
    onNavigate,
    onOpenLegal,
    onOpenStockManager,
    currentUser,
    siteSettings,
    availableCategories = [],
}) {
    const isAdmin = currentUser?.role === 'admin';
    const phone = siteSettings?.phone || '07830 141250';
    const email = siteSettings?.email || 'info@sjhomeinteriors.co.uk';
    const address = siteSettings?.address || 'High Street, Maltby, Rotherham, S66 8JE';
    const openingHours =
        siteSettings?.openingHours || 'Mon–Sat: 10:00 AM – 5:00 PM | Sun: 11:00 AM – 4:00 PM';
    const facebookUrl = validateSafeHttpsUrl(siteSettings?.facebookUrl);
    const whatsappHref = formatWhatsAppHref(siteSettings?.whatsappNumber);

    const footerCategories =
        Array.isArray(availableCategories) && availableCategories.length > 0
            ? availableCategories
            : ['Sofas', 'Beds', 'Tables', 'Chairs', 'Wardrobes', 'Cabinets'];

    return (
        <footer className="bg-ink text-stone-300 pt-14 pb-10 border-t border-stone-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
                    {/* Column 1: Brand & Social Links */}
                    <div className="space-y-4">
                        <Logo variant="light" wrap />
                        <p className="text-sm text-stone-400 leading-relaxed">
                            Curated luxury sofas, ottoman beds, sintered stone dining tables, and timeless home
                            interiors from our High Street, Maltby showroom.
                        </p>

                        {(facebookUrl || whatsappHref) && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                {facebookUrl && (
                                    <a
                                        href={facebookUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-2 rounded-full bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/30 text-sm font-semibold inline-flex items-center gap-1.5 min-h-11 transition"
                                    >
                                        <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Facebook
                                    </a>
                                )}
                                {whatsappHref && (
                                    <a
                                        href={whatsappHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-2 rounded-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 text-sm font-semibold inline-flex items-center gap-1.5 min-h-11 transition"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> WhatsApp
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Column 2: Active Collections */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">
                            Collections
                        </h3>
                        <ul className="text-sm">
                            {footerCategories.map((cat) => (
                                <li key={cat}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectCategory(cat);
                                            onNavigate('home');
                                            setTimeout(() => {
                                                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 50);
                                        }}
                                        className="min-h-11 lg:min-h-9 min-w-11 flex items-center text-left hover:text-white transition-colors"
                                    >
                                        {cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Customer & Legal Information */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">
                            Customer & Legal Information
                        </h3>
                        <ul className="text-sm">
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('terms')}
                                    className="min-h-11 lg:min-h-9 min-w-11 flex items-center text-left hover:text-white transition-colors"
                                >
                                    Terms & Conditions
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('returns')}
                                    className="min-h-11 lg:min-h-9 min-w-11 flex items-center text-left hover:text-white transition-colors"
                                >
                                    Delivery & 14-Day Returns Policy
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('privacy')}
                                    className="min-h-11 lg:min-h-9 min-w-11 flex items-center text-left hover:text-white transition-colors"
                                >
                                    Privacy & UK GDPR Notice
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('cookies')}
                                    className="min-h-11 lg:min-h-9 min-w-11 flex items-center text-left hover:text-white transition-colors"
                                >
                                    Cookie Policy
                                </button>
                            </li>
                            {isAdmin && (
                                <li className="pt-1">
                                    <button
                                        type="button"
                                        onClick={onOpenStockManager}
                                        className="min-h-11 lg:min-h-9 text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> Open Admin Dashboard
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Column 4: Showroom Contact */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">
                            Showroom & Contact
                        </h3>
                        <ul className="space-y-1 text-sm text-stone-400">
                            <li className="flex items-start gap-2 py-2">
                                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{address}</span>
                            </li>
                            {phone && (
                                <li className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gold shrink-0" aria-hidden="true" />
                                    <a
                                        href={`tel:${phone.replace(/\s+/g, '')}`}
                                        className="min-h-11 lg:min-h-9 flex items-center hover:text-white transition-colors"
                                    >
                                        {phone}
                                    </a>
                                </li>
                            )}
                            {email && (
                                <li className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gold shrink-0" aria-hidden="true" />
                                    <a href={`mailto:${email}`} className="min-h-11 lg:min-h-9 flex items-center hover:text-white transition-colors break-all">
                                        {email}
                                    </a>
                                </li>
                            )}
                            {openingHours && (
                                <li className="text-xs text-stone-400 pt-2 leading-relaxed">
                                    {openingHours}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <PaymentBadges
                    paymentOptions={siteSettings?.paymentOptions}
                    tone="dark"
                    className="pt-6"
                />

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
                    <p>&copy; {new Date().getFullYear()} SJ Home Interiors. All rights reserved.</p>
                    <p>High Street, Maltby • South Yorkshire, UK</p>
                </div>
            </div>
        </footer>
    );
}