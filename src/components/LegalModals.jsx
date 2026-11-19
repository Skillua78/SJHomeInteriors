import { useState } from 'react';
import { X } from 'lucide-react';
import { SHOP_INFO } from '../data/products';
import { useDialog, useTransitionState } from '../hooks/useDialog';

// Links around the site use these names; they open the matching document.
const ALIASES = { returns: 'refunds', delivery: 'refunds', cookies: 'privacy' };

export default function LegalModals({ activeDoc, onClose }) {
    const isOpen = Boolean(activeDoc);
    const { mounted, state } = useTransitionState(isOpen, 300);
    const panelRef = useDialog(isOpen, onClose);
    const [lastDoc, setLastDoc] = useState(activeDoc);
    if (activeDoc && activeDoc !== lastDoc) setLastDoc(activeDoc);

    if (!mounted) return null;
    const docKey = ALIASES[activeDoc || lastDoc] || activeDoc || lastDoc;

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

    const doc = content[docKey] || content.terms;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                data-state={state}
                onClick={onClose}
                aria-hidden="true"
                className="overlay-fade absolute inset-0 bg-ink/60 backdrop-blur-xs"
            />
            <div
                ref={panelRef}
                data-dialog-panel
                data-state={state}
                role="dialog"
                aria-modal="true"
                aria-labelledby="legal-modal-title"
                tabIndex={-1}
                className="dialog-pop relative bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full px-5 sm:px-8 pt-4 sm:pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl border border-stone-200 outline-none"
            >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200">
                    <h3 id="legal-modal-title" className="font-serif text-2xl font-semibold leading-tight pt-2">
                        {doc.title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-11 h-11 shrink-0 rounded-full hover:bg-stone-100 flex items-center justify-center transition"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="py-5 space-y-3 text-sm text-stone-700 leading-relaxed max-h-[60vh] overflow-y-auto overscroll-contain">
                    {doc.body.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
                <div className="pt-4 border-t border-stone-200 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="press min-h-11 px-7 rounded-full bg-ink hover:bg-bronze-strong text-white text-sm font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}