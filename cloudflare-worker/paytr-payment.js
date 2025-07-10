export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Production'da 'https://pigeonpedigre.com' yapın
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Health check endpoint
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'paytr-payment-worker',
        timestamp: new Date().toISOString(),
        environment_check: {
          has_merchant_id: !!env.MERCHANT_ID,
          has_merchant_key: !!env.MERCHANT_KEY,
          has_merchant_salt: !!env.MERCHANT_SALT,
          notification_url: 'https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev'
        }
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const data = await request.json();
      const { user_id, user_email, user_name } = data;

      // --- 1. PAYTR BİLGİLERİNİ VE PARAMETRELERİ HAZIRLA ---
      const merchant_id = env.MERCHANT_ID;
      const merchant_key = env.MERCHANT_KEY;
      const merchant_salt = env.MERCHANT_SALT;
      
      if (!merchant_id || !merchant_key || !merchant_salt) {
        throw new Error('Configuration error - Missing PayTR credentials');
      }
      
      const user_ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
      const merchant_oid = 'PRM' + Date.now();
      const email = user_email;
      const payment_amount = '3990'; // Kuruş
      const currency = 'TL';
      const test_mode = '0'; // Canlıda 0, testte 1 - GERÇEK MOD AKTİF
      const user_basket = btoa(JSON.stringify([["Premium Üyelik", "39.90", 1]]));
      const merchant_notify_url = 'https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev';

      console.log('Generated merchant_oid:', merchant_oid);

      // --- 2. DOĞRU HASH_STR OLUŞTUR ---
      // SADECE BU ALANLAR VE BU SIRAYLA!
      const hashStr = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + "1" + "0" + currency + test_mode;

      console.log('Hash String:', hashStr);

      // --- 3. DOĞRU HMAC-SHA256 HESAPLAMA ---
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
        new TextEncoder().encode(hashStr + merchant_salt)
      );
      const paytr_token = btoa(String.fromCharCode(...new Uint8Array(signature)));

      console.log('Generated Token (first 10 chars):', paytr_token.substring(0, 10) + '...');

      // --- 4. PAYTR'A GÖNDERİLECEK FORM VERİSİNİ HAZIRLA ---
      const formData = new URLSearchParams();
      formData.append('merchant_id', merchant_id);
      formData.append('user_ip', user_ip);
      formData.append('merchant_oid', merchant_oid);
      formData.append('email', email);
      formData.append('payment_amount', payment_amount);
      formData.append('paytr_token', paytr_token);
      formData.append('user_basket', user_basket);
      formData.append('debug_on', '1'); // Hata ayıklama için açık
      formData.append('no_installment', '1'); // Taksit yok
      formData.append('max_installment', '0');
      formData.append('user_name', user_name);
      formData.append('user_address', 'Türkiye');
      formData.append('user_phone', '5555555555');
      formData.append('merchant_ok_url', 'https://pigeonpedigre.com/?payment=success');
      formData.append('merchant_fail_url', 'https://pigeonpedigre.com/?payment=fail');
      formData.append('merchant_notify_url', merchant_notify_url); // Notification URL
      formData.append('timeout_limit', '30');
      formData.append('currency', currency);
      formData.append('test_mode', test_mode);
      formData.append('lang', 'tr');

      console.log('Sending request to PayTR...');

      // --- 5. PAYTR API'YE İSTEK AT ---
      const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const paytrText = await paytrResponse.text();
      console.log('PayTR Response:', paytrText);

      let paytrData;
      try {
        paytrData = JSON.parse(paytrText);
      } catch (e) {
        // JSON değilse text response olarak işle
        if (paytrText.includes('status:success')) {
          const tokenMatch = paytrText.match(/token:([a-zA-Z0-9]+)/);
          if (tokenMatch) {
            paytrData = { status: 'success', token: tokenMatch[1] };
          } else {
            paytrData = { status: 'failed', reason: 'Token parse error' };
          }
        } else {
          paytrData = { status: 'failed', reason: paytrText };
        }
      }

      // --- 6. YANITI İŞLE ---
      if (paytrData.status === 'success') {
        // PayTR token başarılı oluştu, şimdi payment_tracking kaydı ekle
        if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const trackingResponse = await fetch(
              `${env.SUPABASE_URL}/rest/v1/payment_tracking`,
              {
                method: 'POST',
                headers: {
                  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                  user_id: user_id,
                  merchant_oid: merchant_oid,
                  tracking_code: merchant_oid, // Eski sistem ile uyumluluk
                  email: email,
                  amount: 39.90,
                  currency: 'TRY',
                  status: 'pending',
                  created_at: new Date().toISOString()
                })
              }
            );

            if (!trackingResponse.ok) {
              const errorText = await trackingResponse.text();
              console.error('Payment tracking save error:', errorText);
              // Hata olsa bile token'ı döndür, frontend'de yedek kayıt var
            } else {
              console.log('Payment tracking saved successfully in worker');
            }
          } catch (trackingError) {
            console.error('Failed to save payment tracking:', trackingError);
            // Hata olsa bile devam et, frontend'de yedek var
          }
        }

        return new Response(JSON.stringify({
          success: true,
          token: paytrData.token,
          payment_url: `https://www.paytr.com/odeme/guvenli/${paytrData.token}`,
          merchant_oid: merchant_oid
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        // Hata durumunda PayTR'dan gelen sebebi logla ve döndür
        console.error('PayTR Error:', paytrData.reason);
        return new Response(JSON.stringify({
          success: false,
          error: 'PayTR Error: ' + paytrData.reason
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

    } catch (error) {
      console.error('Worker Error:', error.stack || error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};