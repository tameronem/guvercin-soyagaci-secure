<?php
session_start();
header('Content-Type: text/html; charset=UTF-8');

// Kullanıcı giriş kontrolü
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Giriş yapmanız gerekiyor']);
    exit;
}

// ##### SUPABASE BİLGİLERİ ################################################
// Bu bilgileri config.js'den alınan değerlerle değiştirin
$supabaseUrl = 'YOUR_SUPABASE_URL'; // Örn: https://xxxx.supabase.co
$supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
$supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY'; // Service key gerekli
// ###########################################################################

// ##### PAYTR MAĞAZA BİLGİLERİ ############################################
$merchant_id    = '593847';
$merchant_key   = 'GHFnc6n26sKMBr18';
$merchant_salt  = 'k7177bzk3sRHrGT8';
// ###########################################################################

// Session'dan kullanıcı bilgilerini al
$user_id = $_SESSION['user_id'];
$user_email = $_SESSION['user_email'];
$user_name = $_SESSION['user_name'] ?? 'Müşteri';

// Benzersiz sipariş numarası oluştur
$merchant_oid = "PRM-" . time() . "-" . rand(1000, 9999);

// 1. ADIM: Supabase'e sipariş kaydı ekle
$orderData = [
    'user_id' => $user_id,
    'merchant_oid' => $merchant_oid,
    'status' => 'pending',
    'amount' => 39.90,
    'created_at' => date('Y-m-d H:i:s')
];

// Supabase'e POST isteği gönder
$ch = curl_init($supabaseUrl . '/rest/v1/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'apikey: ' . $supabaseServiceKey,
    'Authorization: Bearer ' . $supabaseServiceKey,
    'Prefer: return=representation'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 201) {
    echo "Sipariş kaydı oluşturulamadı. Hata: " . $response;
    exit;
}

// 2. ADIM: PayTR ödeme formunu hazırla
$payment_amount = 39.90;
$user_address = "Türkiye"; // Varsayılan adres
$user_phone = "0500000000"; // Varsayılan telefon

// Başarılı ve Başarısız ödeme sonrası yönlendirilecek sayfa URL'leri
$merchant_ok_url    = "https://" . $_SERVER['HTTP_HOST'] . "/odeme-basarili.html";
$merchant_fail_url  = "https://" . $_SERVER['HTTP_HOST'] . "/odeme-basarisiz.html";

// Sepet bilgileri
$user_basket = base64_encode(json_encode([
    ["Premium Üyelik (1 Yıl)", "39.90", 1]
]));

// Müşterinin IP adresi
if(isset($_SERVER["HTTP_CLIENT_IP"])) {
    $user_ip = $_SERVER["HTTP_CLIENT_IP"];
} elseif(isset($_SERVER["HTTP_X_FORWARDED_FOR"])) {
    $user_ip = $_SERVER["HTTP_X_FORWARDED_FOR"];
} else {
    $user_ip = $_SERVER["REMOTE_ADDR"];
}

// PayTR parametreleri
$test_mode = "1"; // Test modu: 1 ise test, 0 ise canlı mod
$non_3d = "0"; // 3D Secure kullanımı: 0 ise zorunlu
$client_lang = "tr";
$installment_count = "0"; // Tek çekim
$currency = "TL";

// PayTR Token oluştur
$hash_str = $merchant_id . $user_ip . $merchant_oid . $user_email . $payment_amount . $installment_count . $currency . $test_mode . $non_3d;
$paytr_token = base64_encode(hash_hmac('sha256', $hash_str . $merchant_salt, $merchant_key, true));

// Form için ödeme tutarını kuruşa çevir
$payment_amount_for_form = $payment_amount * 100;

?>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Üyelik Ödemesi - Güvercin Soyağacı</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #0a0f1c 0%, #1a2332 100%);
            min-height: 100vh;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body class="text-white">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
        <div class="glass-card rounded-2xl p-8">
            <!-- Logo ve Başlık -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-4">
                    <i class="fas fa-dove text-3xl"></i>
                </div>
                <h1 class="text-3xl font-bold mb-2">Premium Üyelik</h1>
                <p class="text-gray-400">Güvercin Soyağacı - 1 Yıllık Üyelik</p>
            </div>

            <!-- Fiyat Bilgisi -->
            <div class="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl p-6 mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-semibold mb-2">Premium Üyelik Paketi</h3>
                        <ul class="text-sm text-gray-300 space-y-1">
                            <li><i class="fas fa-check text-green-400 mr-2"></i>Sınırsız güvercin kaydı</li>
                            <li><i class="fas fa-check text-green-400 mr-2"></i>Gelişmiş analiz özellikleri</li>
                            <li><i class="fas fa-check text-green-400 mr-2"></i>PDF soyağacı indirme</li>
                        </ul>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold">₺39.90</div>
                        <div class="text-sm text-gray-400">1 Yıl</div>
                    </div>
                </div>
            </div>

            <!-- Ödeme Formu -->
            <form action="https://www.paytr.com/odeme" method="post" id="payment-form">
                <div class="space-y-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium mb-2">Kart Sahibinin Adı Soyadı</label>
                        <input type="text" name="cc_owner" required 
                               class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-cyan-400 focus:outline-none transition"
                               placeholder="Ad Soyad">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Kart Numarası</label>
                        <input type="text" name="card_number" required maxlength="16" 
                               class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-cyan-400 focus:outline-none transition"
                               placeholder="1234 5678 9012 3456">
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Ay</label>
                            <select name="expiry_month" required 
                                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-cyan-400 focus:outline-none transition">
                                <?php for($i = 1; $i <= 12; $i++): ?>
                                    <option value="<?php echo str_pad($i, 2, '0', STR_PAD_LEFT); ?>">
                                        <?php echo str_pad($i, 2, '0', STR_PAD_LEFT); ?>
                                    </option>
                                <?php endfor; ?>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Yıl</label>
                            <select name="expiry_year" required 
                                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-cyan-400 focus:outline-none transition">
                                <?php 
                                $currentYear = date('y');
                                for($i = 0; $i < 10; $i++): 
                                    $year = $currentYear + $i;
                                ?>
                                    <option value="<?php echo $year; ?>"><?php echo $year; ?></option>
                                <?php endfor; ?>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">CVV</label>
                            <input type="text" name="cvv" required maxlength="3" 
                                   class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-cyan-400 focus:outline-none transition"
                                   placeholder="123">
                        </div>
                    </div>
                </div>

                <!-- Hidden Fields -->
                <input type="hidden" name="merchant_id" value="<?php echo $merchant_id; ?>">
                <input type="hidden" name="user_ip" value="<?php echo $user_ip; ?>">
                <input type="hidden" name="merchant_oid" value="<?php echo $merchant_oid; ?>">
                <input type="hidden" name="email" value="<?php echo $user_email; ?>">
                <input type="hidden" name="payment_amount" value="<?php echo $payment_amount_for_form; ?>">
                <input type="hidden" name="paytr_token" value="<?php echo $paytr_token; ?>">
                <input type="hidden" name="user_basket" value="<?php echo $user_basket; ?>">
                <input type="hidden" name="debug_on" value="0">
                <input type="hidden" name="client_lang" value="<?php echo $client_lang; ?>">
                <input type="hidden" name="non_3d" value="<?php echo $non_3d; ?>">
                <input type="hidden" name="installment_count" value="<?php echo $installment_count; ?>">
                <input type="hidden" name="merchant_ok_url" value="<?php echo $merchant_ok_url; ?>">
                <input type="hidden" name="merchant_fail_url" value="<?php echo $merchant_fail_url; ?>">
                <input type="hidden" name="test_mode" value="<?php echo $test_mode; ?>">
                <input type="hidden" name="currency" value="<?php echo $currency; ?>">
                <input type="hidden" name="user_name" value="<?php echo htmlspecialchars($user_name); ?>">
                <input type="hidden" name="user_address" value="<?php echo $user_address; ?>">
                <input type="hidden" name="user_phone" value="<?php echo $user_phone; ?>">

                <!-- Güvenlik Bilgisi -->
                <div class="flex items-center gap-3 mb-6 text-sm text-gray-400">
                    <i class="fas fa-lock text-green-400"></i>
                    <span>Ödeme bilgileriniz SSL ile korunmaktadır.</span>
                </div>

                <!-- Ödeme Butonu -->
                <button type="submit" 
                        class="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-lg transition duration-300 transform hover:scale-105">
                    <i class="fas fa-credit-card mr-2"></i>
                    Güvenli Ödeme Yap
                </button>
            </form>

            <!-- PayTR Logo -->
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-400 mb-2">Ödeme altyapısı</p>
                <img src="https://www.paytr.com/img/paytr-logo.png" alt="PayTR" class="h-8 mx-auto opacity-60">
            </div>
        </div>
    </div>

    <script>
        // Kart numarası formatlama
        document.querySelector('input[name="card_number"]').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });

        // Sadece sayı girişine izin ver
        ['card_number', 'cvv'].forEach(field => {
            document.querySelector(`input[name="${field}"]`).addEventListener('keypress', function(e) {
                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace') {
                    e.preventDefault();
                }
            });
        });
    </script>
</body>
</html>