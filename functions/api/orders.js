/**
 * /api/orders
 * POST: Atomic order capture and real-time inventory decrement in D1
 */

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { customer, items, total, orderRef } = body;

        if (!customer || !items || !items.length) {
            return new Response(JSON.stringify({ error: 'Incomplete order payload' }), { status: 400 });
        }

        const orderId = orderRef || `SJH-${Date.now()}`;
        const statements = [];

        // 1. Insert new order record
        statements.push(
            env.DB.prepare(
                `INSERT INTO orders (
          id, customer_name, customer_email, customer_phone, delivery_address,
          city, postcode, delivery_method, items_json, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                orderId,
                customer.fullName.slice(0, 100),
                customer.email.slice(0, 100),
                customer.phone.slice(0, 30),
                customer.address.slice(0, 200),
                customer.city.slice(0, 60),
                customer.postcode.slice(0, 20),
                customer.deliveryMethod || 'delivery',
                JSON.stringify(items),
                total
            )
        );

        // 2. Decrement stock atomically per item purchased
        for (const item of items) {
            const quantity = Math.max(1, parseInt(item.qty, 10) || 1);
            statements.push(
                env.DB.prepare(
                    'UPDATE products SET stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                ).bind(quantity, item.id)
            );
        }

        // Execute atomic batch transaction
        await env.DB.batch(statements);

        return new Response(
            JSON.stringify({ success: true, orderId }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: 'Transaction failed', details: err.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}