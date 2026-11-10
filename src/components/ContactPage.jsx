import { useState } from 'react';
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Send,
    CheckCircle2,
    MessageCircle,
    Share2,
    ExternalLink,
} from 'lucide-react';
import { formatWhatsAppHref } from './Footer';
import { validateSafeHttpsUrl } from '../utils/security';

export default function ContactPage({ siteSettings }) {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const phone = siteSettings?.phone || '07830 141250';
    const email = siteSettings?.email || 'info@sjhomeinteriors.co.uk';
    const address = siteSettings?.address || 'High Street, Maltby, Rotherham, S66 8JE';
    const openingHours =
        siteSettings?.openingHours || 'Mon–Sat: 10:00 AM – 5:00 PM | Sun: 11:00 AM – 4:00 PM';
    const facebookUrl = validateSafeHttpsUrl(siteSettings?.facebookUrl);
    const whatsappHref = formatWhatsAppHref(siteSettings?.whatsappNumber);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                    Visit Or Message Us
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1C1B18] mt-1">
                    Maltby Showroom & Customer Care
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
                    Experience our fabric swatches, sofa comfort, and dining sets in person at our Maltby
                    showroom or reach out directly to our team below.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Direct Contact Channels + Optional Facebook & WhatsApp */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
                        <h2 className="font-serif text-2xl font-bold text-[#1C1B18]">
                            Showroom Details
                        </h2>

                        <div className="space-y-4 text-xs">
                            <div className="flex items-start gap-3.5">
                                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-[#9A7B56]">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1C1B18] text-sm">Showroom Address</h3>
                                    <p className="text-stone-600 mt-0.5">{address}</p>
                                </div>
                            </div>

                            {phone && (
                                <div className="flex items-start gap-3.5">
                                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-[#9A7B56]">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#1C1B18] text-sm">Telephone</h3>
                                        <a
                                            href={`tel:${phone.replace(/\s+/g, '')}`}
                                            className="text-[#9A7B56] font-semibold hover:underline block mt-0.5 text-sm"
                                        >
                                            {phone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {email && (
                                <div className="flex items-start gap-3.5">
                                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-[#9A7B56]">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#1C1B18] text-sm">Email Enquiries</h3>
                                        <a
                                            href={`mailto:${email}`}
                                            className="text-[#9A7B56] font-semibold hover:underline block mt-0.5 text-sm break-all"
                                        >
                                            {email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3.5">
                                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-[#9A7B56]">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1C1B18] text-sm">Opening Hours</h3>
                                    <p className="text-stone-600 mt-0.5 whitespace-pre-line">{openingHours}</p>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Social & Instant Messaging Buttons (Appear only when configured) */}
                        {(whatsappHref || facebookUrl) && (
                            <div className="pt-5 border-t border-stone-200 space-y-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                                    Direct Social & Instant Chat
                                </span>
                                <div className="flex flex-col sm:flex-row gap-2.5">
                                    {whatsappHref && (
                                        <a
                                            href={whatsappHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span>Chat on WhatsApp</span>
                                            <ExternalLink className="w-3 h-3 opacity-80" />
                                        </a>
                                    )}

                                    {facebookUrl && (
                                        <a
                                            href={facebookUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            <span>Visit Our Facebook</span>
                                            <ExternalLink className="w-3 h-3 opacity-80" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Customer Enquiry Form */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
                    {submitted ? (
                        <div className="py-12 text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-[#1C1B18]">
                                Thank You for Reaching Out
                            </h3>
                            <p className="text-xs text-stone-600 max-w-md mx-auto">
                                We have received your enquiry. Our Maltby showroom team will respond as soon as
                                possible.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSubmitted(false);
                                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                                }}
                                className="px-6 py-2.5 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                            >
                                Send Another Message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h2 className="font-serif text-2xl font-bold text-[#1C1B18] mb-2">
                                Send a Showroom Enquiry
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Your Full Name *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Sarah Jenkins"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Your Email Address *
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="you@example.co.uk"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Your Phone Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter your mobile or landline"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Subject *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="e.g. Delivery quote or fabric sample"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    How Can We Help? *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Tell us which sofa, bed, or dining piece you are interested in..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                                <Send className="w-3.5 h-3.5" /> Send Message
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}