import { X } from 'lucide-react';
import { SHOP_INFO } from '../data/products';

export default function LegalModals({ activeDoc, onClose }) {
    if (!activeDoc) return null;

    const content = {
        terms: {
            title: 'Terms & Conditions of Sale',
            body: [
                `1. Seller Identity: This website is operated by ${SHOP_INFO.name}, located at ${SHOP_INFO.address} (Email: ${SHOP_INFO.email}, Tel: ${SHOP_INFO.phoneDisplay}).`,
                '2. Contract Formation & Pricing: All prices are displayed in GBP (£) inclusive of applicable UK VAT unless stated otherwise. Submitting an online reservation or demo checkout does not form a binding contract until confirmed in writing by our showroom.',
                '3. Product Measurements & Access: Customers are responsible for measuring doorways, hallways, stairs, and room dimensions prior to ordering.',
                '4. UK Fire Safety Compliance: All upholstered domestic furniture supplied by SJ Home Interiors complies with the UK Furniture and Furnishings (Fire) (Safety) Regulations 1988 (as amended). Permanent fire safety labels attached to items must not be removed if you wish to exercise a return.',
            ],
        },
        refunds: {
            title: 'Returns, Refunds & Cancellation Policy (UK Consumer Rights)',
            body: [
                '1. 14-Day Cooling-Off Period (Distance Sales): Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, customers ordering online or by phone (without visiting the showroom to conclude the contract) have 14 calendar days after the day of delivery to notify us in writing of their wish to cancel.',
                '2. Bespoke & Made-to-Order Exemptions: Items manufactured or upholstered to a customer’s bespoke specification (custom fabric, non-standard dimensions) are exempt from the 14-day change-of-mind cancellation right unless faulty.',
                '3. Hygiene & Mattresses: Unsealed mattresses, toppers, and bedding cannot be returned for hygiene reasons once unsealed, unless faulty in accordance with the Consumer Rights Act 2015.',
                '4. Statutory Rights (Faulty Goods): Nothing in these terms affects your statutory rights under the UK Consumer Rights Act 2015 (short-term 30-day right to reject faulty goods and right to repair or replacement).',
            ],
        },
        privacy: {
            title: 'Privacy & Cookie Notice (UK GDPR & Data Protection Act 2018)',
            body: [
                `1. Data Controller: ${SHOP_INFO.name} (${SHOP_INFO.address}) is the Data Controller for personal data collected via SJHomeInteriors.co.uk.`,
                '2. Lawful Basis for Processing (Art. 6 UK GDPR): We process order and delivery details under Article 6(1)(b) (performance of a contract), customer reviews under Article 6(1)(a) (explicit consent), and security logs under Article 6(1)(f) (legitimate interests).',
                '3. Data Retention: Order records are retained for 6 years to comply with HMRC tax obligations. Unverified review submissions or account profiles are deleted upon request.',
                `4. Your UK GDPR Rights: You have the right to access, rectify, erase, restrict, or port your personal data, and to lodge a complaint with the UK Information Commissioner's Office (ICO - ico.org.uk). Contact ${SHOP_INFO.email} for Subject Access Requests.`,
            ],
        },
    };

    const doc = content[activeDoc] || content.terms;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                    <h3 id="legal-modal-title" className="font-serif text-2xl font-bold">
                        {doc.title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close legal document"
                        className="p-1.5 rounded-full hover:bg-stone-100 cursor-pointer"
                    >
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
                        type="button"
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