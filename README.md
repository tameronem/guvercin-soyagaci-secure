# Güvercin Soyağacı Takip Sistemi

Modern güvercin yetiştiriciliği için geliştirilmiş, yapay zeka destekli kapsamlı bir soyağacı ve takip sistemi.

## Özellikler

- 🕊️ Güvercin kayıt ve soyağacı takibi
- 🧬 Yapay zeka destekli eşleştirme önerileri
- 📊 Sağlık ve performans kayıtları
- 📱 Mobil uyumlu arayüz
- 👥 Çoklu kullanıcı desteği
- 💳 Premium üyelik sistemi
- 🔒 Güvenli veri saklama (Supabase)

## Kurulum

### 1. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'e gidin ve sırasıyla şu dosyaları çalıştırın:
   - `supabase-schema.sql`
   - `premium-system-schema.sql`
   - `ai-breeding-schema-fixed.sql`
   - Diğer SQL dosyaları (gerekli olanlar)

### 2. Yerel Geliştirme

1. Projeyi klonlayın:
```bash
git clone https://github.com/tameronem/guvercin-soyagaci.git
cd guvercin-soyagaci
```

2. `config.js` dosyasını düzenleyin:
```javascript
window.SUPABASE_URL = 'your_supabase_url';
window.SUPABASE_ANON_KEY = 'your_anon_key';
```

3. Web sunucusu başlatın (örnek):
```bash
python -m http.server 8000
# veya
npx http-server
```

4. Tarayıcıda açın: `http://localhost:8000`

### 3. Cloudflare Pages Deployment

1. GitHub'a push edin
2. [Cloudflare Pages](https://pages.cloudflare.com) hesabı oluşturun
3. "Create a project" → GitHub'ı bağlayın
4. Build ayarları:
   - Framework preset: None
   - Build command: (boş)
   - Build output directory: /
5. Environment variables ekleyin:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

#### Cloudflare Workers Script (Opsiyonel)

Environment variables'ı inject etmek için:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname === '/config.js') {
    return new Response(`
      window.SUPABASE_URL = '${SUPABASE_URL}';
      window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
    `, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  }
  
  return fetch(request)
}
```

## Güvenlik

- API anahtarları kodda görünmez
- Supabase RLS (Row Level Security) aktif olmalı
- Hassas veriler için environment variables kullanılıyor

## Premium Özellikler

- **Ücretsiz Plan**: 5 güvercin kaydı
- **Temel Plan**: 50 güvercin, temel özellikler
- **Pro Plan**: Sınırsız güvercin, tüm özellikler

## Teknolojiler

- Frontend: Vanilla JavaScript, Tailwind CSS
- Backend: Supabase (PostgreSQL)
- Hosting: Cloudflare Pages
- AI: Yapay zeka destekli eşleştirme algoritmaları

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Destek

Sorularınız için: [Issues](https://github.com/tameronem/guvercin-soyagaci/issues)