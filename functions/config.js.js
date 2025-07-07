export function onRequest(context) {
  // Environment variables'ı al
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = context.env;
  
  // JavaScript olarak döndür
  const jsContent = `
// Cloudflare Pages Environment Variables
window.SUPABASE_URL = '${SUPABASE_URL || ''}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY || ''}';

// Debug için
console.log('[Config] Supabase URL:', window.SUPABASE_URL ? 'Loaded' : 'Missing');
console.log('[Config] Supabase Anon Key:', window.SUPABASE_ANON_KEY ? 'Loaded' : 'Missing');
`;

  return new Response(jsContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    }
  });
}