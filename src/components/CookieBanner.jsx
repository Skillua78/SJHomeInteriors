import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

export default function CookieBanner({ onOpenLegal }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            if (!localStorage.getItem('sj_cookie_consent')) setVisible(true);
        } catch {
            setVisible(true);
        }
    }, []);

    const accept = (type) => {
        try {
            localStorage.setItem('sj_cookie_consent', type);
        } catch {
            // Storage blocked: hide the banner for this visit anyway.
        }
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="region"
            aria-label="Cookie preferences"
            className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-ink text-white p-5 rounded-3xl shadow-2xl border border-white/15"
        >
            <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-gold/15 text-gold shrink-0">
                    <Cookie className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                    <h2 className="font-serif text-lg font-bold">Cookie preferences</h2>
                    <p className="text-sm text-stone-300 mt-1 leading-relaxed">
                        We use cookies to remember your basket and improve your visit.{' '}
                        <button
                            type="button"
                            onClick={() => onOpenLegal('cookies')}
                            className="underline underline-offset-2 text-gold hover:text-white"
                        >
                            Read our policy
                        </button>
                    </p>
                    <div className="flex flex-wrap gap-2.5 mt-4">
                        <button
                            type="button"
                            onClick={() => accept('all')}
                            className="press min-h-11 px-5 rounded-full bg-gold hover:bg-white text-ink text-sm font-semibold"
                        >
                            Accept all
                        </button>
                        <button
                            type="button"
                            onClick={() => accept('essential')}
                            className="press min-h-11 px-5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold"
                        >
                            Essential only
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
