// SUPABASE AUTH IMPLEMENTATION

// Helper function to get supabase client
async function getSupabase() {
    // First try to get the client directly
    if (window.supabaseClient && window.supabaseClient.client) {
        return window.supabaseClient.client;
    }
    
    // If not available, wait for initialization
    if (window.supabaseClient && window.supabaseClient.waitForInit) {
        try {
            console.log('[SupabaseAuth] Waiting for Supabase client initialization...');
            const client = await window.supabaseClient.waitForInit();
            console.log('[SupabaseAuth] Supabase client ready');
            return client;
        } catch (error) {
            console.error('[SupabaseAuth] Failed to initialize Supabase client:', error);
            return null;
        }
    }
    
    console.error('[SupabaseAuth] Supabase client not available');
    return null;
}

// Auth Functions
const SupabaseAuth = {
    // Kayıt ol
    async register(email, password, firstName, lastName) {
        try {
            // 1. Supabase Auth ile kullanıcı oluştur
            const supabase = await getSupabase();
            if (!supabase) throw new Error('Supabase client not initialized');
            
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName
                    }
                }
            });

            if (error) throw error;

            // 2. Email doğrulama kapalı - yaşlı kullanıcılar için
            // Direkt başarılı kayıt
            return {
                success: true,
                message: 'Kayıt başarılı! Hoş geldiniz!',
                user: data.user,
                requiresVerification: false
            };

        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: error.message || 'Kayıt sırasında hata oluştu'
            };
        }
    },

    // Giriş yap
    async login(email, password) {
        try {
            const supabase = await getSupabase();
            if (!supabase) throw new Error('Supabase client not initialized');
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Kullanıcı profilini getir
            const profile = window.supabaseClient ? await window.supabaseClient.getUserProfile(data.user.id) : null;
            
            // Session storage'a kaydet (geçici uyumluluk için)
            const userData = {
                id: data.user.id,
                email: data.user.email,
                firstName: profile?.first_name || '',
                lastName: profile?.last_name || '',
                name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
                subscription_plan: profile?.subscription_plan || 'free',
                pigeon_limit: profile?.pigeon_limit || 5
            };

            // Geçici olarak localStorage'a da kaydet (migration için)
            localStorage.setItem('currentUser', JSON.stringify(userData));

            return {
                success: true,
                message: 'Giriş başarılı!',
                user: userData
            };

        } catch (error) {
            console.error('Login error:', error);
            
            // Özel hata mesajları
            if (error.message.includes('Invalid login credentials')) {
                return {
                    success: false,
                    message: 'Email veya şifre hatalı'
                };
            }
            
            return {
                success: false,
                message: error.message || 'Giriş sırasında hata oluştu'
            };
        }
    },

    // Çıkış yap
    async logout() {
        try {
            const supabase = await getSupabase();
            if (!supabase) throw new Error('Supabase client not initialized');
            
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // LocalStorage temizle
            localStorage.removeItem('currentUser');

            return {
                success: true,
                message: 'Çıkış yapıldı'
            };

        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                message: error.message || 'Çıkış sırasında hata oluştu'
            };
        }
    },

    // Şifre sıfırlama emaili gönder
    async resetPassword(email) {
        try {
            const supabase = await getSupabase();
            if (!supabase) throw new Error('Supabase client not initialized');
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Şifre sıfırlama linki email adresinize gönderildi'
            };

        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: error.message || 'Şifre sıfırlama sırasında hata oluştu'
            };
        }
    },

    // Şifre güncelle
    async updatePassword(newPassword) {
        try {
            const supabase = await getSupabase();
            if (!supabase) throw new Error('Supabase client not initialized');
            
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Şifreniz başarıyla güncellendi'
            };

        } catch (error) {
            console.error('Update password error:', error);
            return {
                success: false,
                message: error.message || 'Şifre güncelleme sırasında hata oluştu'
            };
        }
    },

    // Mevcut kullanıcıyı getir
    async getCurrentUser() {
        try {
            const supabase = await getSupabase();
            if (!supabase) throw new Error('Supabase client not initialized');
            
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) return null;

            // Profil bilgilerini getir
            const profile = window.supabaseClient ? await window.supabaseClient.getUserProfile(user.id) : null;
            
            return {
                id: user.id,
                email: user.email,
                firstName: profile?.first_name || '',
                lastName: profile?.last_name || '',
                name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
                subscription_plan: profile?.subscription_plan || 'free',
                pigeon_limit: profile?.pigeon_limit || 5
            };

        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    // Email doğrulama
    async verifyEmail(token) {
        try {
            const supabase = await getSupabase();
            if (!supabase) throw new Error('Supabase client not initialized');
            
            const { error } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'signup'
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Email adresiniz doğrulandı!'
            };

        } catch (error) {
            console.error('Verify email error:', error);
            return {
                success: false,
                message: error.message || 'Email doğrulama sırasında hata oluştu'
            };
        }
    }
};

// Event handlers
function handleSignIn(session) {
    console.log('User signed in:', session.user.email);
    // Dashboard'a yönlendir
    if (typeof showHomepage === 'function') {
        showHomepage();
    }
}

function handleSignOut() {
    console.log('User signed out');
    // Storage'ı temizle
    if (typeof window.storage !== 'undefined') {
        window.storage.currentUser = null;
    }
    // Tüm async işlemleri iptal et
    if (window.currentAsyncOperations) {
        window.currentAsyncOperations.forEach(op => {
            if (op && typeof op.cancel === 'function') {
                op.cancel();
            }
        });
        window.currentAsyncOperations = [];
    }
    // Biraz bekle ve sonra homepage'i göster
    setTimeout(() => {
        if (typeof showHomepage === 'function') {
            showHomepage();
        }
    }, 100);
}

function handleUserUpdate(session) {
    console.log('User updated:', session.user.email);
    // Kullanıcı bilgilerini güncelle
    SupabaseAuth.getCurrentUser().then(user => {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
    });
}

// Export
window.SupabaseAuth = SupabaseAuth;