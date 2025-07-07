-- AŞAMA 2: Eksik profiles kayıtlarını oluştur
-- Bu script auth.users'da olup profiles'da olmayan kullanıcılar için profil oluşturur

-- Önce eksik profilleri görelim (opsiyonel - kontrol için)
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Eksik profilleri oluştur
INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    created_at,
    pigeon_limit,
    subscription_plan,
    is_premium
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)) as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    au.created_at,
    5 as pigeon_limit,  -- Varsayılan free plan limiti
    'free' as subscription_plan,
    false as is_premium
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Oluşturulan kayıtları kontrol et
SELECT COUNT(*) as new_profiles_created
FROM public.profiles p
WHERE p.created_at >= NOW() - INTERVAL '1 minute';

-- AŞAMA 3: Gelecekte otomatik profil oluşturması için trigger
-- Bu trigger yeni kullanıcılar için otomatik profil oluşturur

-- Önce varsa eski trigger'ı kaldır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Yeni kullanıcı için otomatik profil oluşturan fonksiyon
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        created_at,
        pigeon_limit,
        subscription_plan,
        is_premium
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.created_at,
        5,  -- Varsayılan free plan limiti
        'free',
        false
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profil zaten varsa, hata vermeden devam et
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Trigger'ın çalıştığını kontrol et
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Not: Bu SQL'i Supabase Dashboard'da SQL Editor'de çalıştırın
-- Tüm aşamalar tamamlandıktan sonra sisteminiz düzgün çalışmalıdır