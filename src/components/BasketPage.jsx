import { useState } from 'react';
import {
    ArrowLeft,
    Trash2,
    Plus,
    Minus,
    ShieldCheck,
    Truck,
    CheckCircle2,
    CreditCard,
    Sparkles,
} from 'lucide-react';
import { SHOP_INFO } from '../data/products';

export default function BasketPage({
    cart,
    onUpdateQty,
    onRemoveItem,
    onCompleteOrder,
    onBackToShop,
}) {
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: 'Rotherham',
        postcode: 'S66 8LA',
        deliveryMethod: 'delivery',
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
        notes: '',
    });

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = form.deliveryMethod === 'collection' ? 0 : 0; // Free 2-man delivery included
    const grandTotal = subtotal + deliveryFee;

    const fillDemoDetails = () => {
        setForm({
            fullName: 'James Thornton',
            email: 'james.thornton@example.co.uk',
            phone: '07830 141250',
            address: '42 High Street, Maltby',
            city: 'Rotherham, South Yorkshire',
            postcode: 'S66 8LA',
            deliveryMethod: 'delivery',
            cardName: 'MR J THORNTON',
            cardNumber: '4539 •••• •••• 8821',
            expiry: '08/29',
            cvc: '842',
            notes: 'Please call 30 mins before arrival. Ground floor living room assembly.',
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const orderRef = `SJH-${Math.floor(100000 + Math.random() * 900000)}`;
        const snapshot = {
            orderRef,
            customer: form,
            items: [...cart],
            total: grandTotal,
            date: new Date().toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
        };
        onCompleteOrder(snapshot);
        setOrderSuccess(snapshot);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (orderSuccess) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-16">
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-xl text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        Order Confirmed &bull; Stock Updated
                    </span>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-2">
                        Thank You, {orderSuccess.customer.fullName}!
                    </h1>
                    <p className="text-sm text-stone-600 mt-2">
                        Your order reference is{' '}
                        <strong className="text-[#1C1B18]">{orderSuccess.orderRef}</strong>. A confirmation has been logged and our Maltby showroom team will contact you on{' '}
                        <strong>{orderSuccess.customer.phone}</strong> to confirm your delivery slot.
                    </p>

                    <div className="mt-8 p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                            Order Summary ({orderSuccess.date})
                        </h3>
                        {orderSuccess.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs py-1.5 border-b border-stone-200/60">
                                <span>
                                    {item.qty}x <strong>{item.name}</strong> ({item.selectedColor})
                                </span>
                                <span className="font-semibold">
                                    £{(item.price * item.qty).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between text-base font-bold pt-2">
                            <span>Total Paid</span>
                            <span className="text-[#9A7B56]">
                                £{orderSuccess.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button
                            onClick={onBackToShop}
                            className="px-8 py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                        >
                            Return to Showroom Catalog
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button
                onClick={onBackToShop}
                className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-[#9A7B56] mb-6 cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-stone-200">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        SJ Home Interiors Checkout
                    </span>
                    <h1 className="font-serif text-3xl sm:text-5xl font-bold mt-1">
                        Your Shopping Basket
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={fillDemoDetails}
                    className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F0ECE1] hover:bg-[#9A7B56] hover:text-white text-xs font-semibold text-[#1C1B18] transition cursor-pointer"
                >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Demo Buyer Info
                </button>
            </div>

            {cart.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                    <p className="text-stone-500 text-sm mb-6">Your basket is currently empty.</p>
                    <button
                        onClick={onBackToShop}
                        className="px-7 py-3.5 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                    >
                        Browse Furniture
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Basket Items + Delivery Form */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Item List */}
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4">
                            <h2 className="font-serif text-2xl font-bold">
                                1. Review Selected Items ({cart.reduce((s, i) => s + i.qty, 0)})
                            </h2>
                            {cart.map((item, idx) => (
                                <div
                                    key={`${item.id}-${item.selectedColor}`}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-24 h-20 rounded-xl object-cover"
                                    />
                                    <div className="flex-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7B56]">
                                            {item.category}
                                        </span>
                                        <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-stone-600">
                                            Finish: <strong>{item.selectedColor}</strong> &bull; Delivery: {item.delivery}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(idx, -1)}
                                            className="w-8 h-8 rounded-full bg-white border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(idx, 1)}
                                            className="w-8 h-8 rounded-full bg-white border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-base font-bold text-[#1C1B18]">
                                            £{(item.price * item.qty).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveItem(idx)}
                                            className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3 h-3" /> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Customer & Delivery Details Form */}
                        <form
                            id="checkout-form"
                            onSubmit={handleSubmit}
                            className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="font-serif text-2xl font-bold">
                                    2. Delivery & Payment Information
                                </h2>
                                <button
                                    type="button"
                                    onClick={fillDemoDetails}
                                    className="text-xs font-semibold text-[#9A7B56] hover:underline cursor-pointer"
                                >
                                    Fill Placeholder Data
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={form.fullName}
                                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                        placeholder="e.g. James Thornton"
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Phone Number (For Delivery Slot) *
                                    </label>
                                    <input
                                        required
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="07830 141250"
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="you@example.co.uk"
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Street Address *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        placeholder="House number and street name"
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Town / City *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                                        Postcode *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={form.postcode}
                                        onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                </div>
                            </div>

                            {/* Simulated Card Payment Fields */}
                            <div className="pt-4 border-t border-stone-200">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18] flex items-center gap-1.5 mb-3">
                                    <CreditCard className="w-4 h-4 text-[#9A7B56]" /> Card Payment (Demo Transaction)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-3">
                                        <input
                                            required
                                            type="text"
                                            value={form.cardNumber}
                                            onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                                            placeholder="Card Number (e.g. 4539 •••• •••• 8821)"
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            required
                                            type="text"
                                            value={form.cardName}
                                            onChange={(e) => setForm({ ...form, cardName: e.target.value })}
                                            placeholder="Name on Card"
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            required
                                            type="text"
                                            value={form.expiry}
                                            onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                                            placeholder="MM/YY"
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            required
                                            type="text"
                                            value={form.cvc}
                                            onChange={(e) => setForm({ ...form, cvc: e.target.value })}
                                            placeholder="CVC"
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Order Summary Box */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 sticky top-28 space-y-5">
                            <h2 className="font-serif text-2xl font-bold">Order Summary</h2>

                            <div className="space-y-2.5 text-xs border-b border-stone-200 pb-4">
                                <div className="flex justify-between">
                                    <span className="text-stone-600">Items Subtotal</span>
                                    <span className="font-semibold">
                                        £{subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-600">Two-Person White-Glove Delivery</span>
                                    <span className="font-semibold text-emerald-700">FREE</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-600">Room of Choice Assembly</span>
                                    <span className="font-semibold text-emerald-700">INCLUDED</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-baseline">
                                <span className="text-base font-bold">Total to Pay</span>
                                <span className="text-2xl font-bold text-[#9A7B56]">
                                    £{grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                className="w-full py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white font-semibold text-sm transition shadow-lg cursor-pointer"
                            >
                                Complete Purchase (£{grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })})
                            </button>

                            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2 text-[11px] text-stone-600">
                                <div className="flex items-center gap-2 font-semibold text-[#1C1B18]">
                                    <ShieldCheck className="w-4 h-4 text-[#9A7B56]" /> SJ Home Interiors Guarantee
                                </div>
                                <p>
                                    Prefer to pay on delivery or inspect in store? Visit us at{' '}
                                    <strong>{SHOP_INFO.address}</strong> or call{' '}
                                    <strong>{SHOP_INFO.phoneDisplay}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}