const fs = require('fs');
const file = 'C:/Users/ff0594/Documents/LA ESQUINA 51/la-esquina-51/src/app/api/orders/route.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `    if (coupon_code) {
      // Use RPC for atomic transaction when a coupon is provided
      const rpcItems = items.map((item) => {
        const snapshotOptions = [...(item.selected_options || [])];
        if (item.note) {
          snapshotOptions.push({ is_note: true, option_name: item.note } as any);
        }
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product_price,
          options_snapshot: snapshotOptions,
        };
      });

      const { data: orderId, error: rpcError } = await adminSupabase.rpc('create_order_with_coupon', {
        p_user_id: body.user_id ?? null,
        p_order_number: orderNumber,
        p_total: secureTotal,
        p_subtotal: subtotal,
        p_delivery_fee: secureDeliveryFee,
        p_status: 'PENDING',
        p_payment_method: payment_method || 'CASH',
        p_payment_status: 'PENDING',
        p_customer_name: customer_name,
        p_customer_phone: cleanPhone,
        p_customer_address: fullAddress,
        p_delivery_zone_id: zone_id,
        p_notes: notes ?? null,
        p_items: rpcItems,
        p_coupon_code: coupon_code
      });

      if (rpcError) throw new Error(rpcError.message || 'Error aplicando el cupón o creando el pedido');
    } else {
      // Standard order creation without coupon
      const { data: orderData, error: orderError } = await adminSupabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          status: 'PENDING',
          customer_name,
          customer_phone: cleanPhone,
          customer_email: customer_email ?? null,
          user_id: body.user_id ?? null,
          delivery_address: fullAddress,
          delivery_floor: delivery_floor ?? null,
          delivery_door: delivery_door ?? null,
          delivery_zone_id: zone_id,
          delivery_zone_name: zoneData.name,
          subtotal,
          delivery_fee: secureDeliveryFee,
          total: secureTotal,
          notes: notes ?? null,
          payment_method: payment_method || 'CASH',
          cash_change_for: payment_method === 'CASH' && cash_change_for ? Number(cash_change_for) : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => {
        const snapshotOptions = [...(item.selected_options || [])];
        if (item.note) {
          snapshotOptions.push({ is_note: true, option_name: item.note } as any);
        }
        
        return {
          order_id: orderData.id,
          product_id: item.product_id,
          product_name_snapshot: item.product_name,
          product_price_snapshot: item.product_price,
          quantity: item.quantity,
          options_snapshot: snapshotOptions,
          extras_snapshot: item.selected_extras ?? [],
          item_total: item.line_total,
        };
      });

      const { error: itemsError } = await adminSupabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
    }`;

const startIdx = content.indexOf('    // Insert order');
const endIdxStr = 'if (itemsError) throw itemsError;';
const endIdx = content.indexOf(endIdxStr, startIdx) + endIdxStr.length;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced order insertion logic');
} else {
  console.error('Could not find start or end index');
}
`;
