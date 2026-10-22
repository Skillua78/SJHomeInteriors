export default function Footer({ onSelectCategory }) {
    return (
        <footer className="bg-[#1C1B18] text-stone-400 py-16 border-t border-white/10 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div>
                    <span className="font-serif text-2xl font-bold text-white tracking-tight">
                        SJ HOME INTERIORS
                    </span>
                    <p className="text-xs text-stone-400 mt-3 leading-relaxed">
                        Premium British Upholstery, U-Shape Corner Sofas, Sofa Beds &
                        Complete Home Living.
                    </p>
                    <p className="text-xs text-[#9A7B56] font-semibold mt-4">
                        www.SJHomeInteriors.co.uk
                    </p>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                        Collections
                    </h4>
                    <ul className="space-y-2 text-xs">
                        <li>
                            <a
                                href="#catalog"
                                onClick={() => onSelectCategory('U-Shape')}
                                className="hover:text-white"
                            >
                                U-Shape Corner Sofas
                            </a>
                        </li>
                        <li>
                            <a
                                href="#catalog"
                                onClick={() => onSelectCategory('Sofa Bed')}
                                className="hover:text-white"
                            >
                                Pull-Out Sofa Beds
                            </a>
                        </li>
                        <li>
                            <a
                                href="#catalog"
                                onClick={() => onSelectCategory('Corner')}
                                className="hover:text-white"
                            >
                                Electric LED Recliners
                            </a>
                        </li>
                        <li>
                            <a
                                href="#catalog"
                                onClick={() => onSelectCategory('3+2 Set')}
                                className="hover:text-white"
                            >
                                3+2 Seater Sofa Suites
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                        Customer Care
                    </h4>
                    <ul className="space-y-2 text-xs">
                        <li>2–10 Day Express Delivery</li>
                        <li>Two-Person Room of Choice Assembly</li>
                        <li>0% APR Representative Finance</li>
                        <li>Measure-Up Guide</li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                        Order & Enquiries
                    </h4>
                    <p className="text-xs mb-2">
                        Order Hotline: <strong className="text-white">01709 460 225</strong>
                    </p>
                    <p className="text-xs mb-4">
                        Mobile / WhatsApp: <strong className="text-white">07765 324283</strong>
                    </p>
                    <span className="inline-block px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[11px]">
                        Open 7 Days a Week
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/10 text-xs flex flex-wrap justify-between">
                <span>&copy; {new Date().getFullYear()} SJ Home Interiors. All rights reserved.</span>
                <span>SJHomeInteriors.co.uk</span>
            </div>
        </footer>
    );
}