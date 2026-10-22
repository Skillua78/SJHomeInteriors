export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { customer, items, total, orderRef } = body;

        if (!customer || !items || !items.length) {
            return new Response(JSON.stringify({ error: 'Incomplete order payload' }), { status: 400 });
        }

        const orderId = orderRef || `SJH-${Date.now()}`;
        const statements = [];

        statements.push(
            env.DB.prepare(
                `INSERT INTO orders (
          id, customer_name, customer_email, customer_phone, delivery_address,
          city, postcode, delivery_method, items_json, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                orderId,
                String(customer.fullName || '').slice(0, 100),
                String(customer.email || '').slice(0, 100),
                String(customer.phone || '').slice(0, 30),
                String(customer.address || '').slice(0, 200),
                String(customer.city || '').slice(0, 60),
                String(customer.postcode || '').slice(0, 20),
                customer.deliveryMethod || 'delivery',
                JSON.stringify(items),
                Number(total) || 0
            )
        );

        // Only deduct stock if stock is not NULL (untracked stock stays NULL)
        for (const item of items) {
            const quantity = Math.max(1, parseInt(item.qty, 10) || 1);
            statements.push(
                env.DB.prepare(
                    `UPDATE products
           SET stock = CASE WHEN stock IS NULL THEN NULL ELSE MAX(0, stock - ?) END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
                ).bind(quantity, item.id)
            );
        }

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