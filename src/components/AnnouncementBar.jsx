import { Truck, Phone, Mail, MapPin } from 'lucide-react';
import { SHOP_INFO } from '../data/products';

export default function AnnouncementBar({ onNavigate }) {
    return (
        <div className="bg-[#1C1B18] text-[#FAF8F5] text-xs py-2.5 px-4 border-b border-white/10">
            <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center flex-wrap gap-4 sm:gap-6">
                    <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#9A7B56]" />
                        Express 2–10 Day Delivery & Room of Choice Assembly
                    </span>

                    <a
                        href={SHOP_INFO.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex items-center gap-1.5 hover:text-[#9A7B56] transition"
                    >
                        <MapPin className="w-3.5 h-3.5 text-[#9A7B56]" />
                        Showroom: {SHOP_INFO.address}
                    </a>

                    {/* FINANCE OPTION COMMENTED OUT FOR NOW
          <span className="hidden md:flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-[#9A7B56]" />
            Flexible 0% APR Finance Options Available
          </span>
          */}
                </div>

                <div className="flex items-center space-x-4 ml-auto">
                    <a
                        href={`mailto:${SHOP_INFO.email}`}
                        className="hidden sm:flex hover:text-[#9A7B56] transition items-center gap-1"
                    >
                        <Mail className="w-3 h-3 text-[#9A7B56]" /> {SHOP_INFO.email}
                    </a>
                    <a
                        href={SHOP_INFO.phoneHref}
                        className="hover:text-[#9A7B56] transition flex items-center gap-1 font-semibold"
                    >
                        <Phone className="w-3 h-3 text-[#9A7B56]" /> {SHOP_INFO.phoneDisplay}
                    </a>
                </div>
            </div>
        </div>
    );
}