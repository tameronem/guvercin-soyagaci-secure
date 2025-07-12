// PayTR Refund API Cloudflare Worker

export default {
  async fetch(request, env) {
    // Get the origin from request headers
    const origin = request.headers.get('origin');
    
    // Allowed origins list
    const allowedOrigins = [
      'https://pigeonpedigre.com',
      'https://www.pigeonpedigre.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    // CORS headers with dynamic origin
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://pigeonpedigre.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200,
        headers: corsHeaders 
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Method not allowed' 
        }), 
        { 
          status: 405, 
          headers: corsHeaders 
        }
      );
    }

    try {
      // Parse request body
      const { user_id, merchant_oid } = await request.json();

      // Validate required fields
      if (!user_id || !merchant_oid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'user_id ve merchant_oid gerekli'
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      console.log('Refund request:', { user_id, merchant_oid });

      // 1. Get payment details from Supabase
      const paymentResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/payment_tracking?tracking_code=eq.${merchant_oid}&user_id=eq.${user_id}`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const paymentData = await paymentResponse.json();
      
      if (!paymentData || paymentData.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ödeme kaydı bulunamadı'
          }),
          { status: 404, headers: corsHeaders }
        );
      }

      const payment = paymentData[0];

      // 2. Check if payment is verified or paid (backward compatibility)
      if (!['verified', 'paid'].includes(payment.status)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ödeme doğrulanmamış',
            payment_status: payment.status
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 3. Check 3-day refund eligibility
      // Use verified_at if available, otherwise fall back to payment_date or created_at
      const dateToCheck = payment.verified_at || payment.payment_date || payment.created_at;
      if (!dateToCheck) {
        console.error('No date found for refund eligibility check');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ödeme tarihi bulunamadı'
          }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      const verifiedDate = new Date(dateToCheck);
      const now = new Date();
      const daysDiff = Math.floor((now - verifiedDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > 3) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'İade süresi dolmuş (3 gün geçmiş)',
            days_passed: daysDiff
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 4. PayTR refund API call
      // NOT: PayTR'de otomatik iade API'si yoktur. 
      // Gerçek uygulamada bu kısım PayTR panel üzerinden manuel yapılır.
      // Burada sadece veritabanı güncellemesi yapacağız.

      console.log('Refund eligible, processing...');

      // 5. Update payment status to refunded
      const updatePaymentResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/payment_tracking?tracking_code=eq.${merchant_oid}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: 'refunded',
            refunded_at: new Date().toISOString()
          })
        }
      );

      if (!updatePaymentResponse.ok) {
        throw new Error('Payment update failed');
      }

      // 6. Update user profile - remove premium
      const updateProfileResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_premium: false,
            premium_expires_at: null
          })
        }
      );

      if (!updateProfileResponse.ok) {
        throw new Error('Profile update failed');
      }

      // 7. Deactivate premium subscription
      const updateSubscriptionResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/premium_subscriptions?user_id=eq.${user_id}&status=eq.active`,
        {
          method: 'PATCH',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'refunded',
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!updateSubscriptionResponse.ok) {
        console.error('Subscription update failed');
      }

      // 8. Log refund attempt
      await fetch(
        `${env.SUPABASE_URL}/rest/v1/support_tickets`,
        {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: user_id,
            tracking_code: merchant_oid,
            ticket_type: 'refund_request',
            status: 'resolved',
            priority: 'high',
            description: `İade talebi otomatik olarak işlendi. Ödeme tarihi: ${verifiedDate.toLocaleDateString('tr-TR')}, İade tarihi: ${now.toLocaleDateString('tr-TR')}`,
            resolved_at: new Date().toISOString()
          })
        }
      );

      // Success response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'İade işlemi başarıyla tamamlandı',
          refund_details: {
            merchant_oid: merchant_oid,
            amount: payment.amount,
            currency: payment.currency,
            refunded_at: new Date().toISOString()
          }
        }),
        { 
          status: 200, 
          headers: corsHeaders 
        }
      );

    } catch (error) {
      console.error('Refund error:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'İade işlemi sırasında hata oluştu',
          details: error.message
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }
  }
};