export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Health check endpoint - GET request ile kontrol
    if (request.method === 'GET') {
      const path = url.pathname;
      
      // Ana health check
      if (path === '/' || path === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment_check: {
            has_merchant_key: !!env.MERCHANT_KEY,
            has_merchant_salt: !!env.MERCHANT_SALT,
            has_supabase_url: !!env.SUPABASE_URL,
            has_service_key: !!env.SUPABASE_SERVICE_KEY,
            merchant_key_length: env.MERCHANT_KEY ? env.MERCHANT_KEY.length : 0,
            service_key_preview: env.SUPABASE_SERVICE_KEY ? env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'missing'
          }
        }, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Supabase bağlantı testi
      if (path === '/test-db') {
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
          return new Response(JSON.stringify({
            error: 'Missing Supabase credentials',
            has_url: !!env.SUPABASE_URL,
            has_key: !!env.SUPABASE_SERVICE_KEY
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        try {
          const testResponse = await fetch(
            `${env.SUPABASE_URL}/rest/v1/payment_tracking?limit=1`,
            {
              headers: {
                'apikey': env.SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
              }
            }
          );
          
          return new Response(JSON.stringify({
            database_connection: 'ok',
            status: testResponse.status,
            statusText: testResponse.statusText,
            headers: Object.fromEntries(testResponse.headers.entries())
          }, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            database_connection: 'error',
            error: error.message,
            stack: error.stack
          }, null, 2), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      return new Response('Available endpoints: /, /health, /test-db', { status: 200 });
    }

    // PayTR notification endpoint - sadece POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

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
    console.log('Incoming request from IP:', clientIP);
    
    // IP kontrolü (production'da aktif edilmeli)
    // if (!allowedIPs.includes(clientIP)) {
    //   console.error('Unauthorized IP:', clientIP);
    //   return new Response('OK'); // PayTR'ye OK dön ama işlemi yapma
    // }

    try {
      // Form data'yı parse et
      console.log('Parsing form data...');
      const formData = await request.formData();
      const post = {};
      for (const [key, value] of formData.entries()) {
        post[key] = value;
      }
      
      console.log('Received data:', JSON.stringify(post));

      // Gerekli parametreleri kontrol et
      if (!post.merchant_oid || !post.status || !post.total_amount || !post.hash) {
        console.error('Missing required parameters:', {
          has_merchant_oid: !!post.merchant_oid,
          has_status: !!post.status,
          has_total_amount: !!post.total_amount,
          has_hash: !!post.hash
        });
        return new Response('OK'); // PayTR'ye OK dön
      }

      // 1. HASH DOĞRULAMASI
      const merchant_key = env.MERCHANT_KEY;
      const merchant_salt = env.MERCHANT_SALT;

      if (!merchant_key || !merchant_salt) {
        console.error('Missing PayTR credentials in environment');
        return new Response('OK'); // PayTR'ye OK dön
      }

      // Hash hesaplama
      console.log('Calculating hash...');
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
        console.error('Hash mismatch', { 
          calculated: hash, 
          received: post.hash,
          hashStr: hashStr 
        });
        return new Response('OK'); // PayTR'ye OK dön
      }

      console.log('Hash verified successfully');

      // 2. SUPABASE İŞLEMLERİ
      const supabaseUrl = env.SUPABASE_URL;
      const supabaseServiceKey = env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials in environment');
        return new Response('OK'); // PayTR'ye OK dön
      }

      // Ödeme kaydını sorgula
      console.log('Querying payment:', post.merchant_oid);
      const orderResponse = await fetch(
        `${supabaseUrl}/rest/v1/payment_tracking?merchant_oid=eq.${post.merchant_oid}`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        }
      );

      if (!orderResponse.ok) {
        const errorBody = await orderResponse.text();
        console.error('Database query error:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          body: errorBody,
          url: `${supabaseUrl}/rest/v1/payment_tracking?merchant_oid=eq.${post.merchant_oid}`
        });
        return new Response('OK'); // PayTR'ye OK dön
      }

      const payments = await orderResponse.json();
      console.log('Payments found:', payments.length);
      
      const payment = payments[0];

      if (!payment) {
        console.error('Payment not found:', post.merchant_oid);
        
        // Yedek mekanizma: Payment kaydı yoksa oluştur
        // Bu durumda user_id bilgisini alamayacağız, bu yüzden bu kayıt
        // admin panel üzerinden manuel inceleme gerektirecek
        console.log('Creating missing payment record as fallback...');
        
        try {
          const fallbackResponse = await fetch(
            `${supabaseUrl}/rest/v1/payment_tracking`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({
                merchant_oid: post.merchant_oid,
                tracking_code: post.merchant_oid,
                amount: parseFloat(post.total_amount) / 100,
                currency: 'TRY',
                status: 'requires_manual_review',
                email: post.user_email || 'unknown',
                paytr_notification_data: JSON.stringify(post),
                created_at: new Date().toISOString(),
                notes: 'Created by notification worker - missing initial payment record'
              })
            }
          );
          
          if (fallbackResponse.ok) {
            console.log('Fallback payment record created');
            // Admin'e bildirim gönderilebilir
            return new Response('OK');
          } else {
            const errorText = await fallbackResponse.text();
            console.error('Failed to create fallback payment:', errorText);
          }
        } catch (fallbackError) {
          console.error('Fallback creation error:', fallbackError);
        }
        
        return new Response('OK');
      }

      console.log('Payment details:', {
        id: payment.id,
        user_id: payment.user_id,
        status: payment.status
      });

      // Mükerrer işlem kontrolü
      if (payment.status !== 'pending') {
        console.log('Payment already processed:', {
          merchant_oid: post.merchant_oid,
          current_status: payment.status
        });
        return new Response('OK');
      }

      const user_id = payment.user_id;

      // 3. ÖDEME DURUMUNA GÖRE İŞLEM
      if (post.status === 'success') {
        // BAŞARILI ÖDEME
        console.log('Processing successful payment...');

        // Payment tracking tablosunu güncelle
        const updateOrderResponse = await fetch(
          `${supabaseUrl}/rest/v1/payment_tracking?merchant_oid=eq.${post.merchant_oid}`,
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
              paytr_hash: post.hash,
              updated_at: new Date().toISOString()
            })
          }
        );

        if (!updateOrderResponse.ok) {
          const errorBody = await updateOrderResponse.text();
          console.error('Failed to update payment:', {
            status: updateOrderResponse.status,
            body: errorBody
          });
          // Hata olsa bile OK dön
        } else {
          console.log('Payment updated successfully');
        }

        // Profiles tablosunu güncelle - Premium yap
        console.log('Updating user profile to premium...');
        const premiumExpiresAt = new Date();
        premiumExpiresAt.setMonth(premiumExpiresAt.getMonth() + 1); // 1 ay ekle

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
          const errorBody = await updateProfileResponse.text();
          console.error('Failed to update profile:', {
            status: updateProfileResponse.status,
            body: errorBody,
            user_id: user_id
          });
          // Order güncellendi ama profil güncellenemedi - manuel müdahale gerekebilir
        } else {
          console.log('Profile updated to premium successfully');
        }

        console.log('Payment processing completed:', {
          merchant_oid: post.merchant_oid,
          user_id: user_id,
          amount: post.total_amount,
          status: 'success'
        });

      } else {
        // BAŞARISIZ ÖDEME
        console.log('Processing failed payment...');

        const updateOrderResponse = await fetch(
          `${supabaseUrl}/rest/v1/payment_tracking?merchant_oid=eq.${post.merchant_oid}`,
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
              failed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        );

        if (!updateOrderResponse.ok) {
          const errorBody = await updateOrderResponse.text();
          console.error('Failed to update failed payment:', {
            status: updateOrderResponse.status,
            body: errorBody
          });
        }

        console.log('Payment failed processing completed:', {
          merchant_oid: post.merchant_oid,
          reason: post.failed_reason_msg
        });
      }

      // 4. PAYTR'A OK CEVABI DÖN
      console.log('Returning OK to PayTR');
      return new Response('OK');

    } catch (error) {
      console.error('Critical error in notification processing:', {
        error: error.message,
        stack: error.stack,
        name: error.constructor.name
      });
      
      // Hata durumunda bile OK dönelim ki PayTR tekrar denemesin
      return new Response('OK');
    }
  }
};