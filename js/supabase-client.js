// SUPABASE CLIENT CONFIGURATION

// Supabase credentials - config.js dosyasından veya environment'tan gelir
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

// Yapılandırma kontrolü
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Supabase] Yapılandırma eksik! Lütfen config.js dosyasını kontrol edin.');
    console.error('[Supabase] Detaylı kurulum için README.md dosyasına bakın.');
}

// Supabase client oluştur
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Debug mode
const DEBUG = true;

// Helper functions
const logDebug = (message, data = null) => {
    if (DEBUG) {
        console.log(`[Supabase] ${message}`, data);
    }
};

// Auth state değişikliklerini dinle
if (supabase) {
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
}

// Session kontrolü
async function checkSession() {
    if (!supabase) {
        logDebug('Supabase client not initialized');
        return null;
    }
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        logDebug('Session check error:', error);
        return null;
    }
    return session;
}

// Kullanıcı profili getir
async function getUserProfile(userId) {
    if (!supabase) {
        logDebug('Supabase client not initialized');
        return null;
    }
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

// Also export supabase directly for backward compatibility
window.supabase = supabase;