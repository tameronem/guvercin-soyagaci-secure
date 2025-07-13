// SUPABASE CLIENT CONFIGURATION

// SDK'nın yüklenmesini bekle
function waitForSupabaseSDK() {
    return new Promise((resolve) => {
        // Supabase v2 için kontrol - window.supabase global değişkeni
        function checkSDK() {
            // Önce window.supabase var mı kontrol et
            if (typeof window.supabase !== 'undefined') {
                console.log('[Supabase] window.supabase bulundu, detaylı kontrol yapılıyor...');
                // createClient fonksiyonu var mı kontrol et
                if (typeof window.supabase.createClient === 'function') {
                    return true;
                }
            }
            // Alternatif olarak window['@supabase/supabase-js'] kontrol et
            if (window['@supabase/supabase-js']) {
                console.log('[Supabase] @supabase/supabase-js modülü bulundu');
                // Bu durumda window.supabase'e ata
                window.supabase = window['@supabase/supabase-js'];
                return true;
            }
            return false;
        }
        
        if (checkSDK()) {
            console.log('[Supabase] SDK zaten yüklü!');
            resolve(true);
        } else {
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                console.log('[Supabase] SDK bekleniyor... Deneme:', attempts);
                
                if (checkSDK()) {
                    clearInterval(checkInterval);
                    console.log('[Supabase] SDK hazır!');
                    resolve(true);
                } else if (attempts > 40) { // 20 saniye bekle
                    clearInterval(checkInterval);
                    console.error('[Supabase] SDK yüklenemedi! CDN bağlantısını kontrol edin.');
                    console.error('[Supabase] Mevcut window özellikleri:', Object.keys(window).filter(k => k.includes('supabase')));
                    resolve(false);
                }
            }, 500);
        }
    });
}

// Supabase credentials - config.js dosyasından veya environment'tan gelir
let SUPABASE_URL = window.SUPABASE_URL || '';
let SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

// Supabase client instance
let supabase = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;
let isInitializing = false;

// Client initialization function
function initializeSupabaseClient() {
    // Başlatma zaten devam ediyorsa, tekrar çalıştırma
    if (isInitializing) {
        console.log('[Supabase] Başlatma zaten devam ediyor...');
        return false;
    }
    
    isInitializing = true;
    
    // Retry getting credentials
    SUPABASE_URL = window.SUPABASE_URL || '';
    SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('[Supabase] Yapılandırma eksik! Lütfen config.js dosyasını kontrol edin.');
        console.error('[Supabase] URL:', SUPABASE_URL ? 'Mevcut' : 'Eksik');
        console.error('[Supabase] Key:', SUPABASE_ANON_KEY ? 'Mevcut' : 'Eksik');
        isInitializing = false;
        return false;
    }
    
    try {
        // SDK kontrolü - önce window.supabase var mı kontrol et
        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            console.error('[Supabase] SDK henüz yüklenmedi veya createClient fonksiyonu bulunamadı!');
            console.error('[Supabase] window.supabase:', typeof window.supabase);
            isInitializing = false;
            return false;
        }
        
        // Create or recreate the client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                detectSessionInUrl: true,
                autoRefreshToken: true
            }
        });
        
        // Test the client
        supabase.auth.getSession().then(({ data, error }) => {
            if (!error) {
                console.log('[Supabase] Client başarıyla başlatıldı');
                if (data.session) {
                    console.log('[Supabase] Aktif oturum mevcut');
                }
            }
        });
        
        isInitializing = false;
        return true;
    } catch (error) {
        console.error('[Supabase] Client başlatma hatası:', error);
        isInitializing = false;
        return false;
    }
}

// Initialize on load - SDK'yı bekle
(async function() {
    console.log('[Supabase] Başlatılıyor...');
    
    // Önce SDK'nın yüklenmesini bekle
    const sdkReady = await waitForSupabaseSDK();
    
    if (!sdkReady) {
        console.error('[Supabase] SDK yüklenemedi! CDN bağlantısını kontrol edin.');
        return;
    }
    
    // SDK yüklendikten sonra client'ı başlat
    if (!initializeSupabaseClient()) {
        // Retry after a delay if initial attempt fails
        const retryInit = setInterval(() => {
            initializationAttempts++;
            console.log(`[Supabase] Başlatma denemesi ${initializationAttempts}/${MAX_INIT_ATTEMPTS}`);
            
            if (initializeSupabaseClient()) {
                clearInterval(retryInit);
                // Client başarıyla başlatıldı, auth listener'ı kur
                setupAuthListener();
            } else if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
                clearInterval(retryInit);
                console.error('[Supabase] Client başlatılamadı! config.js dosyasında SUPABASE_URL ve SUPABASE_ANON_KEY değerlerini kontrol edin.');
            }
        }, 1000);
    } else {
        // Client başarıyla başlatıldı, auth listener'ı kur
        setupAuthListener();
    }
})();

// Debug mode
const DEBUG = true;

// Helper functions
const logDebug = (message, data = null) => {
    if (DEBUG) {
        console.log(`[Supabase] ${message}`, data);
    }
};

// Auth state handler functions
function handleSignIn(session) {
    logDebug('User signed in:', session.user.email);
    // Update UI or perform other sign-in actions
    if (typeof handleUserUpdate === 'function') {
        handleUserUpdate(session);
    }
}

function handleSignOut() {
    logDebug('User signed out');
    // Clear local storage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    // Redirect or update UI as needed
}

// Safe wrapper for getting supabase client
function getSupabaseClient() {
    if (!supabase) {
        // Try to initialize again
        initializeSupabaseClient();
        if (!supabase) {
            throw new Error('[Supabase] Client başlatılamadı. config.js dosyasını kontrol edin.');
        }
    }
    return supabase;
}

// Auth state değişikliklerini dinle
function setupAuthListener() {
    try {
        const client = getSupabaseClient();
        client.auth.onAuthStateChange((event, session) => {
            logDebug('Auth state changed:', { event, session });
            
            if (event === 'SIGNED_IN') {
                // Kullanıcı giriş yaptı
                handleSignIn(session);
            } else if (event === 'SIGNED_OUT') {
                // Kullanıcı çıkış yaptı
                handleSignOut();
            } else if (event === 'USER_UPDATED') {
                // Kullanıcı bilgileri güncellendi
                if (typeof handleUserUpdate === 'function') {
                    handleUserUpdate(session);
                }
            } else if (event === 'TOKEN_REFRESHED') {
                logDebug('Token refreshed');
            }
        });
    } catch (error) {
        console.error('[Supabase] Auth listener setup hatası:', error);
    }
}

// Setup auth listener when client is ready
// This will be called after SDK and client initialization

// Session kontrolü with retry
async function checkSession() {
    try {
        const client = getSupabaseClient();
        const { data: { session }, error } = await client.auth.getSession();
        if (error) {
            logDebug('Session check error:', error);
            // Try to refresh session
            const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
            if (!refreshError && refreshData.session) {
                logDebug('Session refreshed successfully');
                return refreshData.session;
            }
            return null;
        }
        return session;
    } catch (error) {
        console.error('[Supabase] Session kontrolü hatası:', error);
        return null;
    }
}

// Kullanıcı profili getir with retry
async function getUserProfile(userId) {
    try {
        const client = getSupabaseClient();
        
        // Ensure we have a valid session
        const session = await checkSession();
        if (!session) {
            logDebug('No active session for profile fetch');
            return null;
        }
        
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            logDebug('Get profile error:', error);
            // If unauthorized, try to refresh session
            if (error.code === '401' || error.message.includes('JWT')) {
                const newSession = await checkSession();
                if (newSession) {
                    // Retry with new session
                    const { data: retryData, error: retryError } = await client
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();
                    if (!retryError) return retryData;
                }
            }
            return null;
        }
        return data;
    } catch (error) {
        console.error('[Supabase] Profil getirme hatası:', error);
        return null;
    }
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

// Safe database query wrapper
async function safeQuery(tableName, queryBuilder) {
    try {
        const client = getSupabaseClient();
        
        // Ensure session is valid
        const session = await checkSession();
        if (!session && tableName !== 'public_data') {
            throw new Error('No active session');
        }
        
        // Execute the query
        const result = await queryBuilder(client.from(tableName));
        return result;
    } catch (error) {
        console.error(`[Supabase] Query error on ${tableName}:`, error);
        throw error;
    }
}

// Export functions
window.supabaseClient = {
    client: supabase,
    getClient: getSupabaseClient,
    checkSession,
    getUserProfile,
    checkPremiumStatus,
    safeQuery,
    logDebug,
    initializeClient: initializeSupabaseClient,
    // Direct access to Supabase SDK functions for other modules
    get auth() {
        const client = getSupabaseClient();
        return client ? client.auth : null;
    },
    get from() {
        const client = getSupabaseClient();
        return client ? client.from.bind(client) : null;
    },
    get storage() {
        const client = getSupabaseClient();
        return client ? client.storage : null;
    }
};

// Also export supabase client instance for backward compatibility
// But only if SDK is loaded
if (typeof window.supabase !== 'undefined') {
    // SDK already loaded, we'll override with our client instance after initialization
    console.log('[Supabase] SDK global değişkeni mevcut, client instance beklenecek');
} else {
    // Create a getter for backward compatibility
    Object.defineProperty(window, '_supabaseClient', {
        get: function() {
            if (!supabase && !isInitializing) {
                console.warn('[Supabase] Client erişimi sırasında client bulunamadı');
            }
            return supabase;
        },
        configurable: true
    });
}