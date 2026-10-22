import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { SHOP_INFO } from '../data/products';

export default function ContactPage() {
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-2xl mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                    Get in Touch &bull; Visit Our Showroom
                </span>
                <h1 className="font-serif text-4xl sm:text-5xl font-bold mt-1">
                    Contact SJ Home Interiors
                </h1>
                <p className="text-sm text-stone-600 mt-3 leading-relaxed">
                    Visit our showroom on <strong>High Street, Maltby</strong> to view our sofas, beds, and dining collections in person, or speak directly with our team for fast delivery quotes.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Info Cards + Embedded Google Map */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#9A7B56]">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-bold">Maltby Showroom Address</h3>
                                <p className="text-xs text-stone-600 mt-1">{SHOP_INFO.address}</p>
                                <a
                                    href={SHOP_INFO.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A7B56] hover:underline mt-2"
                                >
                                    Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#9A7B56]">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-bold">Phone & WhatsApp</h3>
                                <p className="text-xs text-stone-600 mt-1">
                                    Call or message us directly for stock checks & delivery bookings:
                                </p>
                                <a
                                    href={SHOP_INFO.phoneHref}
                                    className="text-base font-bold text-[#1C1B18] hover:text-[#9A7B56] block mt-1"
                                >
                                    {SHOP_INFO.phoneDisplay}
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#9A7B56]">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-bold">Email Enquiries</h3>
                                <a
                                    href={`mailto:${SHOP_INFO.email}`}
                                    className="text-sm font-semibold text-[#9A7B56] hover:underline block mt-1"
                                >
                                    {SHOP_INFO.email}
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-[#FAF8F5] text-[#9A7B56]">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-bold">Showroom Opening Hours</h3>
                                <p className="text-xs text-stone-600 mt-1">{SHOP_INFO.hours}</p>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Google Maps Embed for High Street, Maltby */}
                    <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-sm h-72 bg-stone-100">
                        <iframe
                            title="SJ Home Interiors High Street Maltby Map"
                            src={SHOP_INFO.mapsEmbedUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>

                {/* Right Contact Form */}
                <div className="lg:col-span-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200">
                        <h2 className="font-serif text-2xl font-bold mb-2">Send Us a Message</h2>
                        <p className="text-xs text-stone-500 mb-6">
                            Have a question about dimensions, custom fabrics, or delivery? Fill in the form below.
                        </p>

                        {sent ? (
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                                <h3 className="font-serif text-xl font-bold text-emerald-950">
                                    Enquiry Sent!
                                </h3>
                                <p className="text-xs text-emerald-800">
                                    Thank you! Our team at {SHOP_INFO.email} will reply shortly, or you can call us directly on {SHOP_INFO.phoneDisplay}.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Your Name *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full name"
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="07830 141250"
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="you@example.co.uk"
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Item or Enquiry Topic
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Luna U-Shape Sofa / Showroom Viewing"
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Message *
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="How can we help?"
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                                >
                                    Send Message to Showroom
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}