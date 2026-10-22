import { X } from 'lucide-react';
import { SHOP_INFO } from '../data/products';

export default function LegalModals({ activeDoc, onClose }) {
    if (!activeDoc) return null;

    const content = {
        terms: {
            title: 'Terms & Conditions',
            body: [
                `1. Showroom & Online Orders: All orders placed through SJHomeInteriors.co.uk or at our ${SHOP_INFO.address} showroom are subject to availability and confirmation of the order price.`,
                '2. White-Glove Delivery & Access: Our two-person delivery team will assemble items in your room of choice within 2–14 days for in-stock items. Please ensure doorways, hallways, and staircases have sufficient clearance prior to ordering.',
                '3. Cancellations & Returns: Under UK Consumer Contracts Regulations, online customers have 14 calendar days from the day after delivery to request a return on standard non-bespoke items in original condition.',
                `4. Contact & Support: For any order queries, reach us at ${SHOP_INFO.email} or ${SHOP_INFO.phoneDisplay}.`,
            ],
        },
        privacy: {
            title: 'Privacy & Cookie Policy (UK GDPR)',
            body: [
                '1. Data Collection: SJ Home Interiors collects only the contact and delivery information required to fulfil your furniture order and schedule our two-person delivery team.',
                '2. Cookies & Local Storage: We use essential browser storage to save your basket items and preferences.',
                `3. Your Rights: You may request access to or deletion of your personal data at any time by emailing ${SHOP_INFO.email}.`,
            ],
        },
    };

    const doc = content[activeDoc] || content.terms;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                    <h3 className="font-serif text-2xl font-bold">{doc.title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="py-5 space-y-3 text-xs text-stone-600 leading-relaxed max-h-[65vh] overflow-y-auto">
                    {doc.body.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
                <div className="pt-4 border-t border-stone-200 text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}