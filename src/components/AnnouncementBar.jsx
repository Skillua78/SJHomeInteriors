import { Phone, Mail, MapPin } from 'lucide-react';

export default function AnnouncementBar({ onNavigate, siteSettings, ready = true }) {
    const phone = siteSettings?.phone || '07830 141250';
    const email = siteSettings?.email || 'info@sjhomeinteriors.co.uk';
    const text =
        siteSettings?.announcementText ||
        'Visit Our Maltby Showroom • Fast Local Delivery Across South Yorkshire';

    return (
        <div className="bg-ink text-stone-300 text-xs px-4 border-b border-white/10">
            <div className={`max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 ${ready ? '' : 'invisible'}`}>
                <p className="hidden sm:block font-medium text-gold truncate py-2">{text}</p>
                <div className="flex items-center gap-1 sm:gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    {phone && (
                        <a
                            href={`tel:${phone.replace(/\s+/g, '')}`}
                            className="min-h-11 sm:min-h-9 hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            <Phone className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                            <span>{phone}</span>
                        </a>
                    )}
                    {email && (
                        <a
                            href={`mailto:${email}`}
                            className="hidden md:flex min-h-9 hover:text-white items-center gap-1.5 transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                            <span>{email}</span>
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => onNavigate('contact')}
                        className="min-h-11 sm:min-h-9 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                        <MapPin className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                        <span>Maltby Showroom</span>
                    </button>
                </div>
            </div>
        </div>
    );
}