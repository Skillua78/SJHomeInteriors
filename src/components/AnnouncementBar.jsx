import { Phone, Mail, MapPin } from 'lucide-react';

export default function AnnouncementBar({ onNavigate, siteSettings, ready = true }) {
    const phone = siteSettings?.phone || '07830 141250';
    const email = siteSettings?.email || 'info@sjhomeinteriors.co.uk';
    const text =
        siteSettings?.announcementText ||
        'Visit Our Maltby Showroom • Fast Local Delivery Across South Yorkshire';

    return (
        <div className="bg-[#1C1B18] text-stone-300 text-[11px] py-2 px-4 border-b border-stone-800">
            <div className={`max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 ${ready ? '' : 'invisible'}`}>
                <p className="font-medium text-amber-200/90 truncate">{text}</p>
                <div className="flex items-center space-x-4 shrink-0">
                    {phone && (
                        <a
                            href={`tel:${phone.replace(/\s+/g, '')}`}
                            className="hover:text-white flex items-center gap-1 transition"
                        >
                            <Phone className="w-3 h-3 text-[#9A7B56]" />
                            <span>{phone}</span>
                        </a>
                    )}
                    {email && (
                        <a
                            href={`mailto:${email}`}
                            className="hidden sm:flex hover:text-white items-center gap-1 transition"
                        >
                            <Mail className="w-3 h-3 text-[#9A7B56]" />
                            <span>{email}</span>
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => onNavigate('contact')}
                        className="hover:text-white flex items-center gap-1 cursor-pointer transition"
                    >
                        <MapPin className="w-3 h-3 text-[#9A7B56]" />
                        <span>Maltby Showroom</span>
                    </button>
                </div>
            </div>
        </div>
    );
}