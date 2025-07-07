// SUPABASE CLIENT CONFIGURATION

// Supabase credentials - BUNLARI KENDİ DEĞERLERİNİZLE DEĞİŞTİRİN!
const SUPABASE_URL = 'https://sjoaeucsjiqqthwnoxmv.supabase.co'; // örn: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqb2FldWNzamlxcXRod25veG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM1MzcsImV4cCI6MjA2Njc5OTUzN30.5VdeN7Hy5ak36-YtVYORIMYlL_J-qFzoj1_tiS0zJ2k'; // Dashboard > Settings > API'den alın

// Supabase client oluştur
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Debug mode
const DEBUG = true;

// Helper functions
const logDebug = (message, data = null) => {
    if (DEBUG) {
        console.log(`[Supabase] ${message}`, data);
    }
};

// Auth state değişikliklerini dinle
supabase.auth.onAuthStateChange((event, session) => {
    logDebug('Auth state changed:', { event, session });
    
    if (event === 'SIGNED_IN') {
        // Kullanıcı giriş yaptı
        handleSignIn(session);
    } else if (event === 'SIGNED_OUT') {
        // Kullanıcı çıkış yaptı
        handleSignOut();
    } else if (event === 'USER_UPDATED') {
        // Kullanıcı bilgileri güncellendi
        handleUserUpdate(session);
    }
});

// Session kontrolü
async function checkSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        logDebug('Session check error:', error);
        return null;
    }
    return session;
}

// Kullanıcı profili getir
async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        logDebug('Get profile error:', error);
        return null;
    }
    return data;
}

// Premium plan kontrolü
async function checkPremiumStatus(userId) {
    const profile = await getUserProfile(userId);
    if (!profile) return { plan: 'free', limit: 5 };
    
    return {
        plan: profile.subscription_plan,
        limit: profile.pigeon_limit,
        start: profile.subscription_start,
        end: profile.subscription_end
    };
}

// Export functions
window.supabaseClient = {
    client: supabase,
    checkSession,
    getUserProfile,
    checkPremiumStatus,
    logDebug
};