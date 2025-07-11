// PayTR Refund API Cloudflare Worker - Debug Version

async function handleRequest(request, env) {
  console.log('Worker received request:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  // Get the origin from request headers
  const origin = request.headers.get('origin') || '';
  
  // Allowed origins list
  const allowedOrigins = [
    'https://pigeonpedigre.com',
    'https://www.pigeonpedigre.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'file://' // For local file testing
  ];
  
  // CORS headers with dynamic origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Handle GET requests (for testing)
  if (request.method === 'GET') {
    console.log('Handling GET request');
    return new Response(
      JSON.stringify({ 
        status: 'ok',
        message: 'PayTR Refund Worker is running',
        timestamp: new Date().toISOString(),
        env_check: {
          has_supabase_url: !!env?.SUPABASE_URL,
          has_supabase_key: !!env?.SUPABASE_SERVICE_ROLE_KEY
        }
      }), 
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );
  }

  // Only accept POST requests
  if (request.method !== 'POST') {
    console.log('Method not allowed:', request.method);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed',
        allowed_methods: ['GET', 'POST', 'OPTIONS']
      }), 
      { 
        status: 405, 
        headers: corsHeaders 
      }
    );
  }

  try {
    // Check if environment variables are set
    if (!env || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Worker configuration error',
          details: 'Missing required environment variables'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse request body
    let body;
    try {
      const text = await request.text();
      console.log('Raw request body:', text);
      body = JSON.parse(text);
      console.log('Parsed body:', body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { user_id, merchant_oid } = body;

    // Validate required fields
    if (!user_id || !merchant_oid) {
      console.log('Missing required fields:', { user_id, merchant_oid });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'user_id ve merchant_oid gerekli',
          received: { user_id, merchant_oid }
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Processing refund request:', { user_id, merchant_oid });

    // 1. Get payment details from Supabase
    const paymentUrl = `${env.SUPABASE_URL}/rest/v1/payment_tracking?tracking_code=eq.${merchant_oid}&user_id=eq.${user_id}`;
    console.log('Fetching payment from:', paymentUrl);

    const paymentResponse = await fetch(paymentUrl, {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.ok) {
      console.error('Payment fetch failed:', paymentResponse.status, paymentResponse.statusText);
      const errorText = await paymentResponse.text();
      console.error('Error response:', errorText);
      throw new Error(`Supabase payment fetch failed: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('Payment data:', paymentData);
    
    if (!paymentData || paymentData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ödeme kaydı bulunamadı',
          searched_for: { user_id, merchant_oid }
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    const payment = paymentData[0];

    // 2. Check if payment is verified
    if (payment.status !== 'verified') {
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
    const verifiedDate = new Date(payment.verified_at);
    const now = new Date();
    const daysDiff = Math.floor((now - verifiedDate) / (1000 * 60 * 60 * 24));

    if (daysDiff > 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'İade süresi dolmuş (3 gün geçmiş)',
          days_passed: daysDiff,
          purchase_date: verifiedDate.toISOString()
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Refund eligible, processing updates...');

    // Update payment status to refunded
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
      const errorText = await updatePaymentResponse.text();
      console.error('Payment update failed:', errorText);
      throw new Error('Payment update failed');
    }

    // Update user profile - remove premium
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
      const errorText = await updateProfileResponse.text();
      console.error('Profile update failed:', errorText);
      throw new Error('Profile update failed');
    }

    // Deactivate premium subscription
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
      console.error('Subscription update failed (non-critical)');
    }

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
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'İade işlemi sırasında hata oluştu',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};