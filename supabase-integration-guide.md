# SUPABASE ENTEGRASYON REHBERİ

## 1. HTML Dosyasına Eklenecek Script'ler

`guvercin-soyagaci.html` dosyasının `<head>` bölümüne ekleyin:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase Scripts -->
<script src="js/supabase-client.js"></script>
<script src="js/auth-supabase.js"></script>
<script src="js/database-supabase.js"></script>
<script src="js/storage-supabase.js"></script>
```

## 2. Supabase Client Yapılandırması

`js/supabase-client.js` dosyasını açın ve şu değerleri güncelleyin:

```javascript
// BUNLARI KENDİ DEĞERLERİNİZLE DEĞİŞTİRİN!
const SUPABASE_URL = https://sjoaeucsjiqqthwnoxmv.supabase.co
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqb2FldWNzamlxcXRod25veG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM1MzcsImV4cCI6MjA2Njc5OTUzN30.5VdeN7Hy5ak36-YtVYORIMYlL_J-qFzoj1_tiS0zJ2k
```

## 3. Auth Fonksiyonlarını Değiştirme

### A. Kayıt Fonksiyonu

Eski kod:
```javascript
function register() {
    // localStorage kullanımı
}
```

Yeni kod:
```javascript
async function register() {
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const result = await SupabaseAuth.register(email, password, firstName, lastName);
    
    if (result.success) {
        showNotification(result.message, 'success');
        if (result.requiresVerification) {
            // Email doğrulama sayfasına yönlendir
            showEmailVerificationMessage();
        } else {
            closeAuthModal();
            showHomepage();
        }
    } else {
        showNotification(result.message, 'error');
    }
}
```

### B. Giriş Fonksiyonu

Eski kod:
```javascript
function login() {
    // localStorage kullanımı
}
```

Yeni kod:
```javascript
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const result = await SupabaseAuth.login(email, password);
    
    if (result.success) {
        showNotification(result.message, 'success');
        closeAuthModal();
        storage.currentUser = result.user; // Geçici uyumluluk
        showHomepage();
    } else {
        showNotification(result.message, 'error');
    }
}
```

### C. Çıkış Fonksiyonu

Eski kod:
```javascript
function logout() {
    storage.currentUser = null;
    localStorage.removeItem('currentUser');
    showHomepage();
}
```

Yeni kod:
```javascript
async function logout() {
    const result = await SupabaseAuth.logout();
    
    if (result.success) {
        storage.currentUser = null;
        showHomepage();
    } else {
        showNotification(result.message, 'error');
    }
}
```

## 4. Veritabanı İşlemlerini Değiştirme

### A. Güvercin Ekleme

Eski kod:
```javascript
function addPigeon() {
    const pigeon = {
        id: Date.now().toString(),
        // ...
    };
    storage.pigeons.push(pigeon);
    saveStorage();
}
```

Yeni kod:
```javascript
async function addPigeon() {
    const pigeonData = {
        name: document.getElementById('pigeonName').value,
        bandNumber: document.getElementById('bandNumber').value,
        gender: document.getElementById('gender').value,
        breed: document.getElementById('breed').value,
        birthDate: document.getElementById('birthDate').value,
        fatherId: document.getElementById('father').value || null,
        motherId: document.getElementById('mother').value || null,
        description: document.getElementById('description').value
    };

    const result = await SupabaseDB.addPigeon(pigeonData);
    
    if (result.success) {
        // Resim yükleme
        const imageInput = document.getElementById('pigeonImage');
        if (imageInput.files[0]) {
            await SupabaseStorage.uploadPigeonImage(imageInput.files[0], result.data.id);
        }
        
        showNotification('Güvercin başarıyla eklendi', 'success');
        closeModal('addPigeonModal');
        showPigeons();
    } else {
        showNotification(result.error, 'error');
    }
}
```

### B. Güvercinleri Listeleme

Eski kod:
```javascript
function showPigeons() {
    const userPigeons = storage.pigeons.filter(p => p.userId === storage.currentUser.id);
    // ...
}
```

Yeni kod:
```javascript
async function showPigeons() {
    if (!await checkAuth()) return;
    
    const user = await SupabaseAuth.getCurrentUser();
    const result = await SupabaseDB.getPigeons(user.id);
    
    if (result.success) {
        displayPigeonsList(result.data);
    } else {
        showNotification('Güvercinler yüklenemedi', 'error');
    }
}
```

## 5. Premium Kontrolleri Ekleme

```javascript
// Premium özellik kontrolü
async function checkPremiumFeature(feature) {
    const user = await SupabaseAuth.getCurrentUser();
    const premiumStatus = await supabaseClient.checkPremiumStatus(user.id);
    
    switch(feature) {
        case 'export_excel':
            if (!['pro', 'premium'].includes(premiumStatus.plan)) {
                showUpgradeModal('Bu özellik Pro ve Premium planlarda kullanılabilir');
                return false;
            }
            break;
            
        case 'genetic_analysis':
            if (premiumStatus.plan !== 'premium') {
                showUpgradeModal('Bu özellik sadece Premium planda kullanılabilir');
                return false;
            }
            break;
    }
    
    return true;
}

// Kullanım örneği
async function exportToExcel() {
    if (!await checkPremiumFeature('export_excel')) return;
    
    // Excel export işlemi
}
```

## 6. Migration Script

Mevcut localStorage verilerini Supabase'e taşımak için:

```javascript
async function migrateToSupabase() {
    const localData = {
        pigeons: JSON.parse(localStorage.getItem('pigeons') || '[]'),
        matings: JSON.parse(localStorage.getItem('matings') || '[]'),
        races: JSON.parse(localStorage.getItem('races') || '[]'),
        // ...
    };
    
    // Her veri tipini sırayla taşı
    for (const pigeon of localData.pigeons) {
        await SupabaseDB.addPigeon({
            name: pigeon.name,
            bandNumber: pigeon.bandNumber,
            // ...
        });
    }
    
    showNotification('Veriler başarıyla taşındı!', 'success');
}
```

## 7. Hata Yönetimi

```javascript
// Global hata yakalayıcı
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('Bir hata oluştu, lütfen tekrar deneyin', 'error');
});

// Supabase hata kontrolü
function handleSupabaseError(error) {
    if (error.code === 'PGRST116') {
        showNotification('Kayıt bulunamadı', 'error');
    } else if (error.code === '23505') {
        showNotification('Bu kayıt zaten mevcut', 'error');
    } else {
        showNotification(error.message || 'Beklenmeyen bir hata oluştu', 'error');
    }
}
```

## 8. Test Etme

1. Tarayıcı konsolunu açın (F12)
2. Debug mode'u kontrol edin: `window.supabaseClient.logDebug('Test', {test: true})`
3. Bağlantıyı test edin:
```javascript
// Konsola yapıştırın
(async () => {
    const { data, error } = await supabase.auth.getSession();
    console.log('Session:', data, 'Error:', error);
})();
```

## Önemli Notlar

1. **CORS Ayarları**: Localhost'tan test ederken CORS hatası alabilirsiniz. Supabase Dashboard'dan ayarlayın.

2. **Rate Limiting**: Supabase'in rate limit'lerine dikkat edin (saniyede max 100 istek).

3. **Offline Destek**: İnternet bağlantısı kesildiğinde localStorage'a geçici kayıt yapabilirsiniz.

4. **Error Boundaries**: Kritik fonksiyonları try-catch ile sarın.

5. **Loading States**: Async işlemler sırasında loading spinner gösterin.