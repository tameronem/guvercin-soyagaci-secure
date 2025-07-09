export default {
  async fetch(request, env) {
    // PayTR IP adresleri kontrolü (güvenlik için)
    const allowedIPs = [
      '213.14.183.130', '213.14.183.131', '213.14.183.132', 
      '213.14.183.133', '213.14.183.134', '213.14.183.135',
      '213.14.183.136', '213.14.183.137', '213.14.183.138',
      '213.14.183.139', '213.14.183.140', '213.14.183.141',
      '213.14.183.142', '213.14.183.143', '213.14.183.144',
      '213.14.183.145', '213.14.183.146', '213.14.183.147',
      '213.14.183.148', '213.14.183.149', '213.14.183.150',
      '213.14.183.151', '213.14.183.152', '213.14.183.153',
      '213.14.183.154'
    ];

    const clientIP = request.headers.get('CF-Connecting-IP');
    
    // IP kontrolü (production'da aktif edilmeli)
    // if (!allowedIPs.includes(clientIP)) {
    //   return new Response('Unauthorized', { status: 403 });
    // }

    // Sadece POST isteklerini kabul et
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Form data'yı parse et
      const formData = await request.formData();
      const post = {};
      for (const [key, value] of formData.entries()) {
        post[key] = value;
      }

      // Gerekli parametreleri kontrol et
      if (!post.merchant_oid || !post.status || !post.total_amount || !post.hash) {
        return new Response('Missing parameters', { status: 400 });
      }

      // 1. HASH DOĞRULAMASI
      const merchant_key = env.MERCHANT_KEY;
      const merchant_salt = env.MERCHANT_SALT;

      if (!merchant_key || !merchant_salt) {
        console.error('Missing PayTR credentials');
        return new Response('Configuration error', { status: 500 });
      }

      // Hash hesaplama
      const hashStr = post.merchant_oid + merchant_salt + post.status + post.total_amount;
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(merchant_key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(hashStr)
      );
      const hash = btoa(String.fromCharCode(...new Uint8Array(signature)));

      // Hash kontrolü
      if (hash !== post.hash) {
        console.error('Hash mismatch', { calculated: hash, received: post.hash });
        return new Response('PAYTR notification failed: bad hash', { status: 400 });
      }

      // 2. SUPABASE İŞLEMLERİ
      const supabaseUrl = env.SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials');
        return new Response('Configuration error', { status: 500 });
      }

      // Siparişi sorgula
      const orderResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders?merchant_oid=eq.${post.merchant_oid}`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        }
      );

      if (!orderResponse.ok) {
        console.error('Database error', orderResponse.status);
        return new Response('Database error', { status: 500 });
      }

      const orders = await orderResponse.json();
      const order = orders[0];

      if (!order) {
        console.error('Order not found', post.merchant_oid);
        return new Response('Order not found', { status: 404 });
      }

      // Mükerrer işlem kontrolü
      if (order.status !== 'pending') {
        console.log('Order already processed', post.merchant_oid);
        return new Response('OK');
      }

      const user_id = order.user_id;

      // 3. ÖDEME DURUMUNA GÖRE İŞLEM
      if (post.status === 'success') {
        // BAŞARILI ÖDEME

        // Orders tablosunu güncelle
        const updateOrderResponse = await fetch(
          `${supabaseUrl}/rest/v1/orders?merchant_oid=eq.${post.merchant_oid}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              status: 'paid',
              paid_amount: parseFloat(post.total_amount) / 100,
              payment_date: new Date().toISOString(),
              payment_type: post.payment_type || 'card',
              payment_hash: post.hash
            })
          }
        );

        if (!updateOrderResponse.ok) {
          console.error('Failed to update order', await updateOrderResponse.text());
          return new Response('Database update error', { status: 500 });
        }

        // Profiles tablosunu güncelle - Premium yap
        const premiumExpiresAt = new Date();
        premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + 1);

        const updateProfileResponse = await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${user_id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              is_premium: true,
              premium_expires_at: premiumExpiresAt.toISOString(),
              subscription_plan: 'premium',
              pigeon_limit: 9999,
              updated_at: new Date().toISOString()
            })
          }
        );

        if (!updateProfileResponse.ok) {
          console.error('Failed to update profile', await updateProfileResponse.text());
          // Order güncellendi ama profil güncellenemedi - manuel müdahale gerekebilir
          // Yine de OK dönüyoruz ki PayTR tekrar denemesin
        }

        console.log('Payment successful', {
          merchant_oid: post.merchant_oid,
          user_id: user_id,
          amount: post.total_amount
        });

      } else {
        // BAŞARISIZ ÖDEME

        const updateOrderResponse = await fetch(
          `${supabaseUrl}/rest/v1/orders?merchant_oid=eq.${post.merchant_oid}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              status: 'failed',
              failed_reason: post.failed_reason_msg || 'Unknown error',
              failed_at: new Date().toISOString()
            })
          }
        );

        if (!updateOrderResponse.ok) {
          console.error('Failed to update failed order', await updateOrderResponse.text());
        }

        console.log('Payment failed', {
          merchant_oid: post.merchant_oid,
          reason: post.failed_reason_msg
        });
      }

      // 4. PAYTR'A OK CEVABI DÖN
      return new Response('OK');

    } catch (error) {
      console.error('Notification processing error:', error);
      // Hata durumunda bile OK dönebiliriz, böylece PayTR tekrar denemez
      // Ancak bu durumu loglamamız önemli
      return new Response('OK');
    }
  }
};