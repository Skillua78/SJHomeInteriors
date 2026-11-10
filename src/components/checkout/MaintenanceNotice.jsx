import { Wrench, Phone, Mail, MessageCircle } from 'lucide-react';
import { formatWhatsAppHref } from '../Footer';

/** Shown instead of the checkout form when the admin has paused ordering. */
export default function MaintenanceNotice({ siteSettings, onNavigate }) {
    const message =
        siteSettings?.paymentMaintenanceMessage ||
        'Online ordering is paused for maintenance. Please contact us to place your order.';
    const phone = siteSettings?.phone || '';
    const email = siteSettings?.email || '';
    const whatsappHref = formatWhatsAppHref(siteSettings?.whatsappNumber);

    return (
        <div
            role="region"
            aria-label="Ordering paused"
            className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-4"
        >
            <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-200/70 text-amber-900 shrink-0">
                    <Wrench className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                    <h2 className="font-sans font-bold text-sm">Online ordering is paused</h2>
                    <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">{message}</p>
                </div>
            </div>

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={() => onNavigate?.('contact')}
                    className="w-full py-3 px-4 rounded-xl bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-sm font-semibold transition cursor-pointer"
                >
                    Contact the showroom
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {phone && (
                        <a
                            href={`tel:${phone.replace(/\s+/g, '')}`}
                            className="py-2.5 px-3 rounded-xl bg-white border border-amber-300 text-sm font-semibold text-[#1C1B18] flex items-center justify-center gap-1.5 hover:border-[#9A7B56]"
                        >
                            <Phone className="w-4 h-4 text-[#9A7B56]" aria-hidden="true" /> {phone}
                        </a>
                    )}
                    {email && (
                        <a
                            href={`mailto:${email}`}
                            className="py-2.5 px-3 rounded-xl bg-white border border-amber-300 text-sm font-semibold text-[#1C1B18] flex items-center justify-center gap-1.5 hover:border-[#9A7B56]"
                        >
                            <Mail className="w-4 h-4 text-[#9A7B56]" aria-hidden="true" /> Email us
                        </a>
                    )}
                </div>
                {whatsappHref && (
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" /> Order via WhatsApp
                    </a>
                )}
            </div>
        </div>
    );
}
