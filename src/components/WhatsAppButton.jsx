import { MessageCircle } from 'lucide-react';
import { whatsAppLink } from '../utils/storefront';

/**
 * Floating "chat on WhatsApp" button. Hidden while a product view, the basket or
 * another panel is open (the product view has its own "Ask about this" button
 * with the product and options pre-filled).
 *
 * @param raised lift it above the compare bar when that is showing
 */
export default function WhatsAppButton({ siteSettings, hidden = false, raised = false }) {
    if (hidden) return null;
    const href = whatsAppLink(siteSettings, 'Hello SJ Home Interiors, I have a question about your furniture.');

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with our Maltby showroom on WhatsApp (opens WhatsApp)"
            className={`group fixed right-4 sm:right-6 z-40 transition-[bottom] duration-300 ${
                raised ? 'bottom-24' : 'bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6'
            }`}
        >
            <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#1F8F4E] hover:bg-[#187A42] text-white shadow-lg shadow-black/25 transition-transform group-hover:scale-105 group-active:scale-95">
                <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#25D366]/50 animate-ping motion-reduce:hidden"
                    style={{ animationDuration: '2.4s' }}
                />
                <MessageCircle className="relative w-7 h-7" aria-hidden="true" />
            </span>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink text-white text-xs font-semibold px-3 py-2 shadow-lg opacity-0 translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 hidden sm:block"
            >
                Chat with our Maltby Showroom
            </span>
        </a>
    );
}
