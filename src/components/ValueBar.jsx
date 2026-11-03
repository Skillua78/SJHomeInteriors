import { Truck, ShieldCheck, Store, PoundSterling } from 'lucide-react';

export default function ValueBar({ siteSettings }) {
    const showAssembly = siteSettings?.showAssemblyHighlight !== false;
    const assemblyTitle = siteSettings?.assemblyTitle || 'Two-Person Room Assembly';
    const assemblySubtitle = siteSettings?.assemblySubtitle || 'Included Free';

    const items = [
        {
            icon: PoundSterling,
            title: 'Affordable Direct Prices',
            sub: 'No High-Street Markups',
        },
        {
            icon: ShieldCheck,
            title: 'Built-to-Last Quality',
            sub: 'Solid Frames & Durable Fabrics',
        },
        {
            icon: Store,
            title: 'Maltby High Street Showroom',
            sub: 'Try Before You Buy',
        },
        ...(showAssembly && assemblyTitle.trim()
            ? [
                {
                    icon: Truck,
                    title: assemblyTitle,
                    sub: assemblySubtitle,
                },
            ]
            : []),
    ];

    return (
        <section className="bg-white border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                        } gap-4`}
                >
                    {items.map((item, idx) => {
                        const IconComponent = item.icon;
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200/60"
                            >
                                <div className="p-2.5 rounded-xl bg-[#1C1B18] text-[#D4B895] shrink-0">
                                    <IconComponent className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-[#1C1B18]">{item.title}</h3>
                                    {item.sub && (
                                        <p className="text-[11px] font-semibold text-[#9A7B56]">{item.sub}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}