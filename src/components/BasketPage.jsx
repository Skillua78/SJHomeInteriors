import { useState } from 'react';
import {
    Trash2,
    Plus,
    Minus,
    ArrowLeft,
    CheckCircle2,
    Truck,
    Store,
    CreditCard,
    Banknote,
    Building2,
    Wrench,
    Phone,
    Mail,
    MessageCircle,
} from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';
import { formatWhatsAppHref } from './Footer';

export default function BasketPage({
    cart,
    onUpdateQty,
    onRemoveItem,
    onCompleteOrder,
    onBackToShop,
    onNavigate,
    siteSettings,
}) {
    const [deliveryMethod, setDeliveryMethod] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postcode, setPostcode] = useState('');
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [orderCompleted, setOrderCompleted] = useState(null);
    const [formError, setFormError] = useState('');

    const paymentEnabled = siteSettings?.paymentEnabled !== false;
    const maintenanceMsg =
        siteSettings?.paymentMaintenanceMessage ||
        'Payment section currently under maintenance. Please contact us here.';
    const showroomPhone = siteSettings?.phone || '07830 141250';
    const showroomEmail = siteSettings?.email || 'info@sjhomeinteriors.co.uk';
    const whatsappHref = formatWhatsAppHref(siteSettings?.whatsappNumber);

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = deliveryMethod === 'delivery' ? 0 : 0; // Free local showroom delivery
    const grandTotal = subtotal + deliveryFee;

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!paymentEnabled) {
            setFormError('Online payment is currently paused for maintenance.');
            return;
        }

        if (!fullName.trim() || !email.trim() || !phone.trim()) {
            setFormError('Please complete your name, email address, and contact telephone number.');
            return;
        }

        if (deliveryMethod === 'delivery' && (!address.trim() || !city.trim() || !postcode.trim())) {
            setFormError('Please provide your full delivery street address, town/city, and postcode.');
            return;
        }

        if (!agreedTerms) {
            setFormError('Please confirm that you agree to the Terms & Conditions before ordering.');
            return;
        }

        const orderRef = `SJH-${Date.now().toString().slice(-6)}`;
        const snapshot = {
            orderRef,
            customer: {
                fullName: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: deliveryMethod === 'collection' ? 'Maltby Showroom Collection' : address.trim(),
                city: deliveryMethod === 'collection' ? 'Maltby' : city.trim(),
                postcode: deliveryMethod === 'collection' ? 'S66 8JE' : postcode.trim(),
                deliveryMethod,
                paymentMethod,
            },
            items: cart.map((i) => ({
                id: i.id,
                name: i.name,
                selectedColor: i.selectedColor,
                qty: i.qty,
                price: i.price,
            })),
            total: grandTotal,
        };

        await onCompleteOrder(snapshot);
        setOrderCompleted(snapshot);
    };

    if (orderCompleted) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl space-y-5">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        Order Confirmation
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B18]">
                        Thank You, {orderCompleted.customer.fullName}
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600">
                        Your order reference is{' '}
                        <strong className="text-[#1C1B18] font-mono bg-stone-100 px-2 py-1 rounded">
                            {orderCompleted.orderRef}
                        </strong>
                        . Our Maltby showroom team will contact you shortly on{' '}
                        <strong>{orderCompleted.customer.phone}</strong> to confirm your delivery slot.
                    </p>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left text-xs space-y-2">
                        <div className="flex justify-between font-bold text-[#1C1B18] border-b border-stone-200 pb-2">
                            <span>Order Total:</span>
                            <span>
                                £{orderCompleted.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        {orderCompleted.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-stone-600">
                                <span>
                                    {item.qty}x {item.name} ({item.selectedColor})
                                </span>
                                <span>£{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onBackToShop}
                        className="px-8 py-3.5 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                    >
                        Return to Showroom Catalog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <button
                type="button"
                onClick={onBackToShop}
                className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-[#9A7B56] mb-6 cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </button>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B18] mb-8">
                Your Basket & Checkout
            </h1>

            {cart.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
                    <p className="text-sm text-stone-500">Your shopping basket is currently empty.</p>
                    <button
                        type="button"
                        onClick={onBackToShop}
                        className="px-6 py-3 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                    >
                        Browse Furniture
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left 7 Cols: Basket Items */}
                    <div className="lg:col-span-7 space-y-4">
                        {cart.map((item, idx) => (
                            <div
                                key={`${item.id}-${item.selectedColor}`}
                                className="p-4 sm:p-5 rounded-3xl bg-white border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={validateSafeImageUrl(item.image)}
                                        alt={item.name}
                                        className="w-20 h-20 rounded-2xl object-cover bg-stone-100 shrink-0"
                                    />
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7B56]">
                                            {item.category}
                                        </span>
                                        <h3 className="font-serif text-lg font-bold text-[#1C1B18]">{item.name}</h3>
                                        <p className="text-xs text-stone-500">Finish: {item.selectedColor}</p>
                                        <p className="text-sm font-bold text-[#1C1B18] mt-1">
                                            £{Number(item.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center">
                                    <div className="flex items-center border border-stone-200 rounded-full bg-[#FAF8F5]">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(idx, -1)}
                                            aria-label="Decrease quantity"
                                            className="p-2 text-stone-600 hover:text-[#1C1B18] cursor-pointer"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="px-3 text-xs font-bold">{item.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(idx, 1)}
                                            aria-label="Increase quantity"
                                            className="p-2 text-stone-600 hover:text-[#1C1B18] cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRemoveItem(idx)}
                                        aria-label="Remove item"
                                        className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right 5 Cols: Payment & Checkout Section (or Maintenance Notice) */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-lg space-y-6">
                        <div className="border-b border-stone-200 pb-4">
                            <h2 className="font-serif text-2xl font-bold text-[#1C1B18]">
                                Order Summary & Payment
                            </h2>
                            <div className="flex justify-between items-baseline mt-3 text-sm">
                                <span className="text-stone-600">Total Payable:</span>
                                <span className="text-2xl font-bold text-[#1C1B18]">
                                    £{grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {!paymentEnabled ? (
                            /* MAINTENANCE MODE VIEW */
                            <div
                                role="region"
                                aria-label="Payment maintenance notice"
                                className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-4"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-amber-200/70 text-amber-900 shrink-0">
                                        <Wrench className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-amber-950">
                                            Payment Section Currently Under Maintenance
                                        </h3>
                                        <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                                            {maintenanceMsg}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => onNavigate && onNavigate('contact')}
                                        className="w-full py-3 px-4 rounded-xl bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold transition cursor-pointer"
                                    >
                                        Please Contact Us Here &rarr;
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        {showroomPhone && (
                                            <a
                                                href={`tel:${showroomPhone.replace(/\s+/g, '')}`}
                                                className="py-2.5 px-3 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-[#1C1B18] flex items-center justify-center gap-1.5 hover:border-[#9A7B56]"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-[#9A7B56]" /> {showroomPhone}
                                            </a>
                                        )}
                                        {showroomEmail && (
                                            <a
                                                href={`mailto:${showroomEmail}`}
                                                className="py-2.5 px-3 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-[#1C1B18] flex items-center justify-center gap-1.5 hover:border-[#9A7B56]"
                                            >
                                                <Mail className="w-3.5 h-3.5 text-[#9A7B56]" /> Email Us
                                            </a>
                                        )}
                                    </div>

                                    {whatsappHref && (
                                        <a
                                            href={whatsappHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Order via WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ACTIVE CHECKOUT & PAYMENT FORM */
                            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                                {formError && (
                                    <div
                                        role="alert"
                                        className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
                                    >
                                        {formError}
                                    </div>
                                )}

                                {/* Delivery vs Collection */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                                        1. Fulfilment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryMethod('delivery')}
                                            className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer flex items-center gap-2 ${deliveryMethod === 'delivery'
                                                    ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                    : 'border-stone-200 bg-[#FAF8F5] text-stone-700'
                                                }`}
                                        >
                                            <Truck className="w-4 h-4 shrink-0" />
                                            <span>Home Delivery</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryMethod('collection')}
                                            className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer flex items-center gap-2 ${deliveryMethod === 'collection'
                                                    ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                    : 'border-stone-200 bg-[#FAF8F5] text-stone-700'
                                                }`}
                                        >
                                            <Store className="w-4 h-4 shrink-0" />
                                            <span>Maltby Collection</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Customer Details (No company phone number placeholder) */}
                                <div className="space-y-3 pt-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                                        2. Your Contact Details
                                    </label>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                                Email Address *
                                            </label>
                                            <input
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.co.uk"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                                Your Contact Number *
                                            </label>
                                            <input
                                                required
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Enter your mobile number"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {deliveryMethod === 'delivery' && (
                                        <>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                                    Street Address *
                                                </label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="House number and street name"
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                                        Town / City *
                                                    </label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={city}
                                                        onChange={(e) => setCity(e.target.value)}
                                                        placeholder="e.g. Rotherham"
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                                        Postcode *
                                                    </label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={postcode}
                                                        onChange={(e) => setPostcode(e.target.value)}
                                                        placeholder="e.g. S66 8JE"
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs uppercase"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Payment Method Selection */}
                                <div className="space-y-2.5 pt-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                                        3. Payment Method
                                    </label>

                                    {siteSettings?.allowCashOnDelivery !== false && (
                                        <label
                                            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition ${paymentMethod === 'cod'
                                                    ? 'border-[#9A7B56] bg-[#FAF8F5]'
                                                    : 'border-stone-200 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold text-[#1C1B18] flex items-center gap-1.5">
                                                    <Banknote className="w-4 h-4 text-[#9A7B56]" />
                                                    Pay on Delivery (Cash or Card Machine)
                                                </div>
                                                <p className="text-[11px] text-stone-500 mt-0.5">
                                                    Inspect your furniture upon arrival and pay our delivery team directly.
                                                </p>
                                            </div>
                                        </label>
                                    )}

                                    {siteSettings?.allowShowroomPayment !== false && (
                                        <label
                                            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition ${paymentMethod === 'showroom'
                                                    ? 'border-[#9A7B56] bg-[#FAF8F5]'
                                                    : 'border-stone-200 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="showroom"
                                                checked={paymentMethod === 'showroom'}
                                                onChange={() => setPaymentMethod('showroom')}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold text-[#1C1B18] flex items-center gap-1.5">
                                                    <CreditCard className="w-4 h-4 text-[#9A7B56]" />
                                                    Reserve Online & Pay in Maltby Showroom
                                                </div>
                                                <p className="text-[11px] text-stone-500 mt-0.5">
                                                    Reserves your stock immediately. Pay by card or cash at High Street, Maltby.
                                                </p>
                                            </div>
                                        </label>
                                    )}

                                    {siteSettings?.allowBankTransfer && (
                                        <label
                                            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition ${paymentMethod === 'bacs'
                                                    ? 'border-[#9A7B56] bg-[#FAF8F5]'
                                                    : 'border-stone-200 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="bacs"
                                                checked={paymentMethod === 'bacs'}
                                                onChange={() => setPaymentMethod('bacs')}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold text-[#1C1B18] flex items-center gap-1.5">
                                                    <Building2 className="w-4 h-4 text-[#9A7B56]" />
                                                    Direct Bank Transfer (BACS)
                                                </div>
                                                {siteSettings?.bankTransferInstructions && (
                                                    <p className="text-[11px] text-stone-600 mt-1 whitespace-pre-line bg-white p-2 rounded-lg border border-stone-200">
                                                        {siteSettings.bankTransferInstructions}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    )}
                                </div>

                                <label className="flex items-start gap-2 text-[11px] text-stone-600 pt-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedTerms}
                                        onChange={(e) => setAgreedTerms(e.target.checked)}
                                        className="mt-0.5"
                                    />
                                    <span>
                                        I agree to the SJ Home Interiors Terms & Conditions and 14-day returns policy.
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer shadow-md"
                                >
                                    Confirm & Place Order (£
                                    {grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })})
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}