import { Truck, Percent, Phone } from 'lucide-react';

export default function AnnouncementBar() {
    return (
        <div className="bg-[#1C1B18] text-[#FAF8F5] text-xs py-2.5 px-4 border-b border-white/10">
            <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center space-x-6">
                    <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#9A7B56]" />
                        Delivery in 2–10 Days (Two-Person Team & Room of Choice Assembly)
                    </span>
                    <span className="hidden md:flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-[#9A7B56]" />
                        Flexible 0% APR Finance Options Available
                    </span>
                </div>
                <div className="flex items-center space-x-4 ml-auto">
                    <a
                        href="tel:01709460225"
                        className="hover:text-[#9A7B56] transition flex items-center gap-1"
                    >
                        <Phone className="w-3 h-3" /> Showroom Hotline: 01709 460 225
                    </a>
                </div>
            </div>
        </div>
    );
}