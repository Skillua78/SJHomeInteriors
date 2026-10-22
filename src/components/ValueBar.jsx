import { CalendarClock, Users, CreditCard, ShieldCheck } from 'lucide-react';

const perks = [
    {
        icon: CalendarClock,
        title: 'Fast 2–14 Day Delivery',
        desc: 'Quick dispatch on all in-stock showroom models.',
    },
    {
        icon: Users,
        title: 'Two-Person White Glove',
        desc: 'Full assembly in any room of your choice included.',
    },
    {
        icon: CreditCard,
        title: 'Flexible Finance Plans',
        desc: 'Spread the cost with easy 0% APR monthly payments.',
    },
    {
        icon: ShieldCheck,
        title: 'Deep Foam-Filled Quality',
        desc: 'Built with high-density cushions & solid frames.',
    },
];

export default function ValueBar() {
    return (
        <section id="delivery" className="bg-[#F0ECE1]/60 border-b border-stone-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {perks.map((perk, idx) => {
                    const Icon = perk.icon;
                    return (
                        <div key={idx} className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-white text-[#9A7B56] shadow-xs">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#1C1B18]">{perk.title}</h3>
                                <p className="text-xs text-stone-600 mt-0.5">{perk.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}