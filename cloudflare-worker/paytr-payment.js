export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://pigeonpedigre.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS request için
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Sadece POST kabul et
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    try {
      // Frontend'den gelen data
      const data = await request.json();
      const { user_id, user_email, user_name } = data;

      // PayTR parametreleri - Environment variables'dan al
      const merchant_id = env.MERCHANT_ID || '593847';
      const merchant_key = env.MERCHANT_KEY || 'GHFnc6n26sKMBr18';
      const merchant_salt = env.MERCHANT_SALT || 'k7177bzk3sRHrGT8';
      
      const merchant_oid = 'PREMIUM_' + user_id.substring(0, 8) + '_' + Date.now();
      const email = user_email;
      const payment_amount = '3990'; // 39.90 TL (kuruş cinsinden)
      const user_basket = btoa(JSON.stringify([['Premium Üyelik', '39.90', 1]]));
      const no_installment = '1';
      const max_installment = '0';
      const user_ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
      
      // URL'ler
      const merchant_ok_url = 'https://pigeonpedigre.com/?payment=success';
      const merchant_fail_url = 'https://pigeonpedigre.com/?payment=fail';
      
      // Hash oluştur - PayTR dokümantasyonuna göre
      const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}TL090${merchant_ok_url}${merchant_fail_url}0${user_name}${user_name}0000000000${merchant_salt}`;
      
      // SHA256 hash ve base64 encode
      const encoder = new TextEncoder();
      const data_encoded = encoder.encode(hashSTR);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data_encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
      const paytr_token = hashBase64;

      // PayTR'a gönderilecek form data
      const formData = new URLSearchParams();
      formData.append('merchant_id', merchant_id);
      formData.append('merchant_key', merchant_key);
      formData.append('user_ip', user_ip);
      formData.append('merchant_oid', merchant_oid);
      formData.append('email', email);
      formData.append('payment_amount', payment_amount);
      formData.append('paytr_token', paytr_token);
      formData.append('user_basket', user_basket);
      formData.append('user_name', user_name);
      formData.append('user_address', user_name);
      formData.append('user_phone', '0000000000');
      formData.append('merchant_ok_url', merchant_ok_url);
      formData.append('merchant_fail_url', merchant_fail_url);
      formData.append('timeout_limit', '90');
      formData.append('currency', 'TL');
      formData.append('test_mode', '0');
      formData.append('no_installment', no_installment);
      formData.append('max_installment', max_installment);
      formData.append('lang', 'tr');

      // PayTR API'ye istek
      const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const paytrText = await paytrResponse.text();
      
      // PayTR JSON response veya text response dönebilir
      let paytrData;
      try {
        paytrData = JSON.parse(paytrText);
      } catch (e) {
        // Text response ise parse et
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

      if (paytrData.status === 'success') {
        // Başarılı - iframe token döndür
        return new Response(JSON.stringify({
          success: true,
          token: paytrData.token,
          payment_url: `https://www.paytr.com/odeme/guvenli/${paytrData.token}`,
          merchant_oid: merchant_oid
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } else {
        // Hata
        return new Response(JSON.stringify({
          success: false,
          error: paytrData.reason || 'PayTR error'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};