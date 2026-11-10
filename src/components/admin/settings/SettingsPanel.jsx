import { useEffect, useState } from 'react';
import { Save, CheckCircle2, Upload, X, Loader2 } from 'lucide-react';
import { validateSafeImageUrl } from '../../../utils/security';
import { compressImageFiles } from '../../../utils/image';
import { inputClass, labelClass, primaryButtonClass, sectionTitleClass } from '../adminUi';

const cardClass = 'p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-4';

function TextField({ id, label, value, onChange, hint, ...rest }) {
    return (
        <div>
            <label htmlFor={id} className={labelClass}>
                {label}
            </label>
            <input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputClass} {...rest} />
            {hint && <p className="text-[11px] text-stone-500 mt-1">{hint}</p>}
        </div>
    );
}

function Toggle({ label, checked, onChange, hint }) {
    return (
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#1C1B18]"
            />
            <span>
                <span className="font-semibold text-[#1C1B18]">{label}</span>
                {hint && <span className="block text-xs text-stone-500">{hint}</span>}
            </span>
        </label>
    );
}

function PaymentSettings({ form, set, stripeReady }) {
    return (
        <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
                <h3 className={sectionTitleClass}>Checkout &amp; payments</h3>
                <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        form.paymentEnabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                >
                    {form.paymentEnabled !== false ? 'Ordering open' : 'Ordering paused'}
                </span>
            </div>

            <Toggle
                label="Accept orders online"
                hint="Turn off to pause the checkout and show the message below."
                checked={form.paymentEnabled !== false}
                onChange={(v) => set({ paymentEnabled: v })}
            />
            <div>
                <label htmlFor="st-maint" className={labelClass}>
                    Message shown while ordering is paused
                </label>
                <textarea
                    id="st-maint"
                    rows={2}
                    maxLength={400}
                    value={form.paymentMaintenanceMessage || ''}
                    onChange={(e) => set({ paymentMaintenanceMessage: e.target.value })}
                    className={inputClass}
                />
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Payment methods</p>
                {!stripeReady && (
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        Card and Klarna need your Stripe keys (STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET) to
                        be added in Cloudflare Pages → Settings → Variables. Until then customers will not
                        see these two options.
                    </p>
                )}
                <Toggle
                    label="Card (Stripe)"
                    checked={form.allowCardPayment !== false}
                    onChange={(v) => set({ allowCardPayment: v })}
                />
                <Toggle
                    label="Klarna (via Stripe)"
                    checked={form.allowKlarna !== false}
                    onChange={(v) => set({ allowKlarna: v })}
                />
                <Toggle
                    label="Pay on delivery"
                    checked={form.allowCashOnDelivery !== false}
                    onChange={(v) => set({ allowCashOnDelivery: v })}
                />
                <Toggle
                    label="Reserve online, pay in showroom"
                    checked={form.allowShowroomPayment !== false}
                    onChange={(v) => set({ allowShowroomPayment: v })}
                />
                <Toggle
                    label="Bank transfer"
                    checked={Boolean(form.allowBankTransfer)}
                    onChange={(v) => set({ allowBankTransfer: v })}
                />
                {form.allowBankTransfer && (
                    <div>
                        <label htmlFor="st-bacs" className={labelClass}>
                            Bank transfer instructions (shown to the customer)
                        </label>
                        <textarea
                            id="st-bacs"
                            rows={3}
                            maxLength={500}
                            value={form.bankTransferInstructions || ''}
                            onChange={(e) => set({ bankTransferInstructions: e.target.value })}
                            className={inputClass}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

function DeliverySettings({ form, set }) {
    return (
        <section className={cardClass}>
            <h3 className={sectionTitleClass}>Delivery &amp; assembly</h3>
            <TextField
                id="st-fee"
                label="Standard delivery & assembly fee per item (£)"
                type="number"
                min="0"
                step="0.01"
                value={form.defaultDeliveryFee ?? 50}
                onChange={(v) => set({ defaultDeliveryFee: v })}
                hint="Used for every product that does not have its own fee. Set a different fee per product in its Essentials step. Showroom collection is never charged."
            />
            <Toggle
                label="Show the delivery & assembly tile on the home page"
                checked={form.showAssemblyHighlight !== false}
                onChange={(v) => set({ showAssemblyHighlight: v })}
            />
            {form.showAssemblyHighlight !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField
                        id="st-asm-title"
                        label="Tile title"
                        maxLength={80}
                        value={form.assemblyTitle}
                        onChange={(v) => set({ assemblyTitle: v })}
                    />
                    <TextField
                        id="st-asm-sub"
                        label="Tile subtitle"
                        maxLength={80}
                        value={form.assemblySubtitle}
                        onChange={(v) => set({ assemblySubtitle: v })}
                    />
                </div>
            )}
        </section>
    );
}

function ContactSettings({ form, set }) {
    return (
        <section className={cardClass}>
            <h3 className={sectionTitleClass}>Showroom contact &amp; social</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField id="st-phone" label="Phone number" value={form.phone} onChange={(v) => set({ phone: v })} />
                <TextField id="st-email" label="Email address" type="email" value={form.email} onChange={(v) => set({ email: v })} />
            </div>
            <TextField id="st-address" label="Address" value={form.address} onChange={(v) => set({ address: v })} />
            <TextField id="st-hours" label="Opening hours" value={form.openingHours} onChange={(v) => set({ openingHours: v })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                    id="st-fb"
                    label="Facebook page link"
                    type="url"
                    placeholder="https://facebook.com/…"
                    value={form.facebookUrl}
                    onChange={(v) => set({ facebookUrl: v })}
                />
                <TextField
                    id="st-wa"
                    label="WhatsApp number"
                    placeholder="e.g. 07830 141250"
                    value={form.whatsappNumber}
                    onChange={(v) => set({ whatsappNumber: v })}
                />
            </div>
        </section>
    );
}

function HomepageSettings({ form, set }) {
    return (
        <section className={cardClass}>
            <h3 className={sectionTitleClass}>Home page text</h3>
            <TextField id="st-ann" label="Announcement bar" maxLength={200} value={form.announcementText} onChange={(v) => set({ announcementText: v })} />
            <TextField id="st-badge" label="Hero badge" maxLength={80} value={form.heroBadge} onChange={(v) => set({ heroBadge: v })} />
            <TextField id="st-title" label="Hero headline" maxLength={140} value={form.heroTitle} onChange={(v) => set({ heroTitle: v })} />
            <div>
                <label htmlFor="st-sub" className={labelClass}>
                    Hero paragraph
                </label>
                <textarea
                    id="st-sub"
                    rows={3}
                    maxLength={500}
                    value={form.heroSubtitle || ''}
                    onChange={(e) => set({ heroSubtitle: e.target.value })}
                    className={inputClass}
                />
            </div>
        </section>
    );
}

function HeroSlidesSettings({ form, set, onError }) {
    const [url, setUrl] = useState('');
    const [busy, setBusy] = useState(false);
    const slides = form.heroImages || [];

    const addUrl = () => {
        const safe = validateSafeImageUrl(url);
        if (!safe || safe.startsWith('data:') || slides.length >= 10) return;
        set({ heroImages: [...slides, safe] });
        setUrl('');
    };

    const upload = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        setBusy(true);
        const { images, errors } = await compressImageFiles(files, 1800);
        setBusy(false);
        onError(errors[0] || '');
        if (images.length) set({ heroImages: [...slides, ...images].slice(0, 10) });
    };

    return (
        <section className={cardClass}>
            <h3 className={sectionTitleClass}>Home page slideshow</h3>
            <div className="flex flex-wrap gap-2">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste an https:// image link…"
                    aria-label="Slideshow image link"
                    className={`${inputClass} flex-1 min-w-[180px] w-auto`}
                />
                <button type="button" onClick={addUrl} className={primaryButtonClass}>
                    Add link
                </button>
                <label className="px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 hover:border-[#9A7B56] text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                        <Upload className="w-3.5 h-3.5 text-[#9A7B56]" aria-hidden="true" />
                    )}
                    Upload
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={busy}
                        onChange={upload}
                        className="hidden"
                    />
                </label>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slides.map((src, idx) => (
                    <li key={`${idx}-${src.slice(-24)}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => set({ heroImages: slides.filter((_, i) => i !== idx) })}
                            aria-label={`Remove slide ${idx + 1}`}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** Site-wide settings. Nothing is saved until "Save settings" is pressed. */
export default function SettingsPanel({ siteSettings, onSave }) {
    const [form, setForm] = useState(siteSettings || {});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (siteSettings) setForm(siteSettings);
    }, [siteSettings]);

    const set = (patch) => {
        setForm((prev) => ({ ...prev, ...patch }));
        setSaved(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSave(form);
            setSaved(true);
        } catch (err) {
            setError(err.message || 'Settings could not be saved.');
        } finally {
            setSaving(false);
        }
    };

    const stripeReady = Boolean(siteSettings?.stripeConfigured);

    return (
        <form onSubmit={submit} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <PaymentSettings form={form} set={set} stripeReady={stripeReady} />
                <div className="space-y-5">
                    <DeliverySettings form={form} set={set} />
                    <ContactSettings form={form} set={set} />
                </div>
                <HomepageSettings form={form} set={set} />
                <HeroSlidesSettings form={form} set={set} onError={setError} />
            </div>

            <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-stone-200 flex flex-wrap items-center justify-end gap-3">
                {error && (
                    <span role="alert" className="text-sm text-red-700">
                        {error}
                    </span>
                )}
                {saved && (
                    <span role="status" className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Settings saved
                    </span>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    className="px-7 py-3 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] disabled:bg-stone-400 text-white text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                    Save settings
                </button>
            </div>
        </form>
    );
}
