import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import Logo from './Logo';
import { SHOP_INFO } from '../data/products';

export default function Footer({
    onSelectCategory,
    onNavigate,
    onOpenLegal,
    onOpenStockManager,
    currentUser,
}) {
    const isAdmin = currentUser?.role === 'admin';

    const goCat = (cat) => {
        onNavigate('home');
        onSelectCategory(cat);
        setTimeout(() => {
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    };

    return (
        <footer className="bg-[#1C1B18] text-stone-400 py-16 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div>
                    <Logo variant="light" />
                    <p className="text-xs text-stone-400 mt-4 leading-relaxed">
                        Luxury Sofas, Beds, Dining Tables, Chairs, Wardrobes & Cabinets. Visit our Maltby showroom or order online.
                    </p>
                    <a
                        href={SHOP_INFO.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#9A7B56] font-semibold mt-4 hover:underline"
                    >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {SHOP_INFO.address}{' '}
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                        Departments
                    </h4>
                    <ul className="space-y-2 text-xs">
                        <li><button type="button" onClick={() => goCat('Sofas')} className="hover:text-white cursor-pointer">Sofas & Sofa Beds</button></li>
                        <li><button type="button" onClick={() => goCat('Beds')} className="hover:text-white cursor-pointer">Beds & Mattresses</button></li>
                        <li><button type="button" onClick={() => goCat('Tables')} className="hover:text-white cursor-pointer">Dining & Coffee Tables</button></li>
                        <li><button type="button" onClick={() => goCat('Chairs')} className="hover:text-white cursor-pointer">Dining & Accent Chairs</button></li>
                        <li><button type="button" onClick={() => goCat('Wardrobes')} className="hover:text-white cursor-pointer">Sliding & Hinged Wardrobes</button></li>
                        <li><button type="button" onClick={() => goCat('Cabinets')} className="hover:text-white cursor-pointer">Cabinets, Sideboards & TV Units</button></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                        Customer & Legal Information
                    </h4>
                    <ul className="space-y-2 text-xs">
                        <li><button type="button" onClick={() => onNavigate('contact')} className="hover:text-white cursor-pointer">Maltby Showroom & Map</button></li>
                        <li><button type="button" onClick={() => onNavigate('basket')} className="hover:text-white cursor-pointer">Shopping Basket</button></li>
                        <li><button type="button" onClick={() => onNavigate('auth')} className="hover:text-white cursor-pointer">Account Login / Register</button></li>
                        <li><button type="button" onClick={() => onOpenLegal('terms')} className="hover:text-white cursor-pointer">Terms & Conditions</button></li>
                        <li><button type="button" onClick={() => onOpenLegal('refunds')} className="hover:text-white cursor-pointer">Returns, Refunds & Cancellation</button></li>
                        <li><button type="button" onClick={() => onOpenLegal('privacy')} className="hover:text-white cursor-pointer">Privacy & UK GDPR Policy</button></li>
                        {isAdmin && (
                            <li>
                                <button type="button" onClick={onOpenStockManager} className="text-amber-400 font-semibold hover:underline cursor-pointer">
                                    Open Admin Dashboard
                                </button>
                            </li>
                        )}
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                        Showroom & Direct Orders
                    </h4>
                    <p className="text-xs mb-2 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#9A7B56]" aria-hidden="true" />
                        <a href={SHOP_INFO.phoneHref} className="text-white font-bold hover:text-[#9A7B56]">
                            {SHOP_INFO.phoneDisplay}
                        </a>
                    </p>
                    <p className="text-xs mb-3 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#9A7B56]" aria-hidden="true" />
                        <a href={`mailto:${SHOP_INFO.email}`} className="text-white hover:text-[#9A7B56]">
                            {SHOP_INFO.email}
                        </a>
                    </p>
                    <p className="text-xs text-stone-400 mb-4">{SHOP_INFO.address}</p>
                    <span className="inline-block px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[11px]">
                        Open 7 Days a Week
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/10 text-xs flex flex-wrap justify-between gap-4">
                <span>&copy; {new Date().getFullYear()} SJ Home Interiors. All rights reserved.</span>
                <span>High Street, Maltby &bull; SJHomeInteriors.co.uk</span>
            </div>
        </footer>
    );
}