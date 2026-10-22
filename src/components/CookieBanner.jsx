import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

export default function CookieBanner({ onOpenLegal }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('sj_cookie_consent');
        if (!consent) setVisible(true);
    }, []);

    const accept = (type) => {
        localStorage.setItem('sj_cookie_consent', type);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#1C1B18] text-white p-5 rounded-3xl shadow-2xl border border-white/15">
            <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#9A7B56]/20 text-[#9A7B56] shrink-0">
                    <Cookie className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-serif text-lg font-bold">Cookie Preferences</h4>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                        We use cookies to remember your shopping basket, stock availability, and improve your experience on SJHomeInteriors.co.uk.{' '}
                        <button
                            onClick={() => onOpenLegal('privacy')}
                            className="underline text-[#9A7B56] cursor-pointer"
                        >
                            Read Policy
                        </button>
                    </p>
                    <div className="flex gap-2.5 mt-4">
                        <button
                            onClick={() => accept('all')}
                            className="px-4 py-2 rounded-full bg-[#9A7B56] hover:bg-[#7D6242] text-white text-xs font-semibold cursor-pointer"
                        >
                            Accept All Cookies
                        </button>
                        <button
                            onClick={() => accept('essential')}
                            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-semibold cursor-pointer"
                        >
                            Essential Only
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}