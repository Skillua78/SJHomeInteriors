import { MapPin, Phone, Mail, ShieldAlert, MessageCircle, Share2 } from 'lucide-react';
import Logo from './Logo';

export function formatWhatsAppHref(raw) {
    if (!raw) return '';
    const trimmed = String(raw).trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
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
    const facebookUrl = siteSettings?.facebookUrl?.trim() || '';
    const whatsappHref = formatWhatsAppHref(siteSettings?.whatsappNumber);

    const footerCategories =
        Array.isArray(availableCategories) && availableCategories.length > 0
            ? availableCategories
            : ['Sofas', 'Beds', 'Tables', 'Chairs', 'Wardrobes', 'Cabinets'];

    return (
        <footer className="bg-[#1C1B18] text-stone-300 pt-14 pb-10 border-t border-stone-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
                    {/* Column 1: Brand & Social Links */}
                    <div className="space-y-4">
                        <Logo variant="light" />
                        <p className="text-xs text-stone-400 leading-relaxed">
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
                                        className="px-3.5 py-2 rounded-full bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                                    >
                                        <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Facebook
                                    </a>
                                )}
                                {whatsappHref && (
                                    <a
                                        href={whatsappHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-2 rounded-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> WhatsApp
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Column 2: Active Collections */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4B895] mb-4">
                            Collections
                        </h3>
                        <ul className="space-y-2.5 text-xs">
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
                                        className="hover:text-white transition cursor-pointer"
                                    >
                                        {cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Customer & Legal Information */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4B895] mb-4">
                            Customer & Legal Information
                        </h3>
                        <ul className="space-y-2.5 text-xs">
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('terms')}
                                    className="hover:text-white transition cursor-pointer"
                                >
                                    Terms & Conditions
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('returns')}
                                    className="hover:text-white transition cursor-pointer"
                                >
                                    Delivery & 14-Day Returns Policy
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('privacy')}
                                    className="hover:text-white transition cursor-pointer"
                                >
                                    Privacy & UK GDPR Notice
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('cookies')}
                                    className="hover:text-white transition cursor-pointer"
                                >
                                    Cookie Policy
                                </button>
                            </li>
                            {isAdmin && (
                                <li className="pt-2">
                                    <button
                                        type="button"
                                        onClick={onOpenStockManager}
                                        className="text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                    >
                                        <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> Open Admin Dashboard
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Column 4: Showroom Contact */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4B895] mb-4">
                            Showroom & Contact
                        </h3>
                        <ul className="space-y-3 text-xs text-stone-400">
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-[#9A7B56] shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{address}</span>
                            </li>
                            {phone && (
                                <li className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#9A7B56] shrink-0" aria-hidden="true" />
                                    <a
                                        href={`tel:${phone.replace(/\s+/g, '')}`}
                                        className="hover:text-white transition"
                                    >
                                        {phone}
                                    </a>
                                </li>
                            )}
                            {email && (
                                <li className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#9A7B56] shrink-0" aria-hidden="true" />
                                    <a href={`mailto:${email}`} className="hover:text-white transition break-all">
                                        {email}
                                    </a>
                                </li>
                            )}
                            {openingHours && (
                                <li className="text-[11px] text-stone-500 pt-1 leading-relaxed">
                                    {openingHours}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
                    <p>&copy; {new Date().getFullYear()} SJ Home Interiors. All rights reserved.</p>
                    <p>High Street, Maltby • South Yorkshire, UK</p>
                </div>
            </div>
        </footer>
    );
}