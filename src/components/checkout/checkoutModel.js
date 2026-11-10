/**
 * Checkout rules with no UI attached (see tests/checkoutModel.test.js).
 */

export const PAYMENT_METHODS = [
    {
        id: 'card',
        online: true,
        title: 'Pay securely by card',
        blurb: 'Debit or credit card. You will be taken to a secure Stripe payment page.',
    },
    {
        id: 'klarna',
        online: true,
        title: 'Pay with Klarna',
        blurb: 'Spread the cost or pay later. Klarna will show the options available to you. 18+, subject to status.',
    },
    {
        id: 'cod',
        online: false,
        deliveryOnly: true,
        title: 'Pay on delivery',
        blurb: 'Inspect your furniture when it arrives and pay our delivery team by cash or card machine.',
    },
    {
        id: 'showroom',
        online: false,
        title: 'Reserve now, pay in the Maltby showroom',
        blurb: 'We hold your items. Pay by card or cash at High Street, Maltby.',
    },
    {
        id: 'bacs',
        online: false,
        title: 'Bank transfer',
        blurb: 'We will hold your order until your transfer arrives.',
    },
];

/** Methods the customer can pick right now, in display order. */
export function availableMethods(paymentOptions, deliveryMethod) {
    const enabled = paymentOptions || {};
    return PAYMENT_METHODS.filter(
        (m) => enabled[m.id] && !(m.deliveryOnly && deliveryMethod !== 'delivery')
    );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/** Returns { field, message } for the first problem, or null when the form is complete. */
export function validateCheckoutForm(form, deliveryMethod) {
    if (form.fullName.trim().length < 2) {
        return { field: 'fullName', message: 'Please enter your full name.' };
    }
    if (!EMAIL.test(form.email.trim())) {
        return { field: 'email', message: 'Please enter a valid email address.' };
    }
    if (form.phone.replace(/\D/g, '').length < 7) {
        return { field: 'phone', message: 'Please enter a contact telephone number.' };
    }
    if (deliveryMethod === 'delivery') {
        if (!form.address.trim()) {
            return { field: 'address', message: 'Please enter your delivery street address.' };
        }
        if (!form.city.trim()) return { field: 'city', message: 'Please enter your town or city.' };
        if (!UK_POSTCODE.test(form.postcode.trim())) {
            return { field: 'postcode', message: 'Please enter a valid UK postcode.' };
        }
    }
    if (!form.paymentMethod) {
        return { field: 'paymentMethod', message: 'Please choose how you would like to pay.' };
    }
    if (!form.agreedTerms) {
        return {
            field: 'agreedTerms',
            message: 'Please confirm that you agree to the Terms & Conditions.',
        };
    }
    return null;
}

/** Shape the request body for POST /api/checkout. */
export function buildCheckoutRequest(form, cart, deliveryMethod, totalPence) {
    return {
        deliveryMethod,
        paymentMethod: form.paymentMethod,
        agreedTerms: form.agreedTerms,
        expectedTotalPence: totalPence,
        customer: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            postcode: form.postcode.trim().toUpperCase(),
        },
        items: cart.map((item) => ({ id: item.id, qty: item.qty, selections: item.selections })),
    };
}
