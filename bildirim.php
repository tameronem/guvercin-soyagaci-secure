<?php

// ## ÖNEMLİ: Bu dosya, PayTR sunucularının sitenize ulaştığı bir "arka kapı" gibidir.
// ## Bu nedenle SESSION veya kullanıcı girişi gibi kontroller burada olmamalıdır.
// ## Güvenlik, yalnızca aşağıda yapılan "hash" kontrolü ile sağlanır.

// Gelen POST verisini alalım.
$post = $_POST;

// ##### MAĞAZA BİLGİLERİNİZİ GİRELİM ########################################
// API Entegrasyon Bilgileri - Mağaza paneline giriş yaparak BİLGİ sayfasından alabilirsiniz.
$merchant_key   = 'GHFnc6n26sKMBr18'; // Sizin Mağaza Parolanız
$merchant_salt  = 'k7177bzk3sRHrGT8'; // Sizin Mağaza Gizli Anahtarınız
// ###########################################################################

// ##### SUPABASE BİLGİLERİ ##################################################
$supabaseUrl = 'YOUR_SUPABASE_URL'; // Örn: https://xxxx.supabase.co
$supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY'; // Service key gerekli!
// ###########################################################################


// ##### 1. ADIM: PAYTR'DAN GELEN VERİNİN DOĞRULANMASI #######################
// Bu adım, gelen isteğin gerçekten PayTR'dan geldiğini ve yolda değiştirilmediğini doğrular.
// Bu kontrolü atlamanız veya hatalı yapmanız durumunda dolandırıcılığa maruz kalabilirsiniz.

// Gelen POST değerleri ile yeni bir hash oluşturuyoruz.
$hash = base64_encode(hash_hmac('sha256', $post['merchant_oid'] . $merchant_salt . $post['status'] . $post['total_amount'], $merchant_key, true));

// Oluşturulan hash ile PayTR'dan gelen hash'i karşılaştırıyoruz.
// Eşleşmiyorsa, istek sahtedir veya veri bozulmuştur, bu yüzden işlemi hemen sonlandırıyoruz.
if ($hash != $post['hash']) {
    // Güvenlik loglaması için sahte bir isteğin geldiğini kaydedebilirsiniz.
    // Örneğin: file_put_contents('paytr_security_log.txt', "BAD HASH: " . print_r($post, true) . "\n", FILE_APPEND);
    die('PAYTR notification failed: bad hash'); // PayTR'a hata mesajı gönderip işlemi durdur.
}
// ###########################################################################


// ##### 2. ADIM: SİPARİŞİN VERİTABANINDA KONTROLÜ ###########################
// Bu adım, aynı sipariş için mükerrer işlem yapılmasını önler.

$merchant_oid = $post['merchant_oid'];

// Supabase'den siparişi sorgula
$ch = curl_init($supabaseUrl . '/rest/v1/orders?merchant_oid=eq.' . $merchant_oid);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $supabaseServiceKey,
    'Authorization: Bearer ' . $supabaseServiceKey
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    die('Database error');
}

$orders = json_decode($response, true);
$order = $orders[0] ?? null;

if (!$order) {
    die('Order not found');
}

// Mükerrer işlem kontrolü
if ($order['status'] !== 'pending') {
    echo "OK";
    exit;
}

$user_id = $order['user_id'];
// ###########################################################################


// ##### 3. ADIM: GELEN SONUCA GÖRE SİPARİŞİ GÜNCELLEME #######################
// Hash ve sipariş durumu kontrolleri başarılıysa, artık siparişi güncelleyebiliriz.

if ($post['status'] == 'success') { // Ödeme BAŞARILI olduysa

    // 1. Orders tablosunu güncelle
    $updateOrderData = json_encode([
        'status' => 'paid',
        'paid_amount' => $post['total_amount'] / 100,
        'payment_date' => date('Y-m-d H:i:s')
    ]);
    
    $ch = curl_init($supabaseUrl . '/rest/v1/orders?merchant_oid=eq.' . $merchant_oid);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $updateOrderData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseServiceKey,
        'Authorization: Bearer ' . $supabaseServiceKey
    ]);
    curl_exec($ch);
    curl_close($ch);
    
    // 2. Profiles tablosunu güncelle - Premium üyelik aktif et
    $premiumExpiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
    $updateProfileData = json_encode([
        'is_premium' => true,
        'premium_expires_at' => $premiumExpiresAt,
        'subscription_plan' => 'premium',
        'pigeon_limit' => 9999 // Sınırsız için yüksek bir sayı
    ]);
    
    $ch = curl_init($supabaseUrl . '/rest/v1/profiles?id=eq.' . $user_id);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $updateProfileData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseServiceKey,
        'Authorization: Bearer ' . $supabaseServiceKey
    ]);
    curl_exec($ch);
    curl_close($ch);

    // Test için loglama
    file_put_contents('paytr_success_log.txt', "SUCCESS: " . print_r($post, true) . "\n", FILE_APPEND);

} else { // Ödeme BAŞARISIZ olduysa

    // Orders tablosunu güncelle
    $updateOrderData = json_encode([
        'status' => 'failed',
        'failed_reason' => $post['failed_reason_msg'] ?? 'Unknown error'
    ]);
    
    $ch = curl_init($supabaseUrl . '/rest/v1/orders?merchant_oid=eq.' . $merchant_oid);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $updateOrderData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'apikey: ' . $supabaseServiceKey,
        'Authorization: Bearer ' . $supabaseServiceKey
    ]);
    curl_exec($ch);
    curl_close($ch);

    // Test için loglama
    file_put_contents('paytr_failed_log.txt', "FAILED: " . print_r($post, true) . "\n", FILE_APPEND);
}

// ##### 4. ADIM: PAYTR'A "OK" YANITI GÖNDERME #############################
// Tüm işlemler bittikten sonra, PayTR sistemine bu bildirimi başarıyla aldığınızı bildirmeniz gerekir.
// Bu yanıtı göndermezseniz, PayTR bildirimin size ulaşmadığını varsayar ve tekrar tekrar göndermeye çalışır.
// Ekrana SADECE "OK" yazdırılmalıdır. Önünde veya arkasında hiçbir boşluk veya HTML kodu olmamalıdır.
echo "OK";
exit;

?>