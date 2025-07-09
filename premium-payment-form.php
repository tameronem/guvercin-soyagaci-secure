<?php
/**
 * PayTR Premium Üyelik Ödeme Formu
 * Bu dosya PayTR iframe API kullanarak ödeme formu oluşturur
 * 
 * KULLANIM:
 * 1. Bu dosyayı sunucunuza yükleyin
 * 2. PayTR bilgilerinizi güncelleyin
 * 3. Kullanıcı oturumu kontrolünüzü ekleyin
 */

// Hata raporlamayı aç (geliştirme için)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// PayTR Bilgileri - BUNLARI KENDİ BİLGİLERİNİZLE DEĞİŞTİRİN
$merchant_id = 'YOUR_MERCHANT_ID';
$merchant_key = 'YOUR_MERCHANT_KEY';
$merchant_salt = 'YOUR_MERCHANT_SALT';

// Test modu (1: test, 0: gerçek)
$test_mode = "1";

// Kullanıcı bilgileri - BUNLARI KENDİ SİSTEMİNİZDEN ALIN
// Örnek olarak sabit değerler kullanılıyor
$user_id = "123"; // Veritabanından alın
$user_email = "test@example.com"; // Oturumdan alın
$user_name = "Test Kullanıcı"; // Oturumdan alın
$user_phone = "5555555555"; // Kullanıcı profilinden alın

// Sipariş bilgileri
$merchant_oid = "PRM" . time(); // Benzersiz sipariş numarası
$user_ip = $_SERVER['REMOTE_ADDR'];
$payment_amount = "3990"; // 39.90 TL (kuruş cinsinden)
$currency = "TL";

// Sepet içeriği
$user_basket = base64_encode(json_encode(array(
    array("Premium Üyelik", "39.90", 1)
)));

// Başarı ve hata URL'leri
$merchant_ok_url = "https://yoursite.com/payment-success.php";
$merchant_fail_url = "https://yoursite.com/payment-fail.php";

// PayTR notification URL (webhook)
$merchant_notify_url = "https://pigeonpedigre-paytr-notification.tamer-nem.workers.dev";

// Diğer parametreler
$timeout_limit = "30";
$no_installment = "1"; // Taksit yok
$max_installment = "0";
$user_address = "Türkiye"; // Kullanıcı adresi
$lang = "tr"; // Dil (tr/en)

// Hash oluşturma
$hash_str = $merchant_id . $user_ip . $merchant_oid . $user_email . $payment_amount . $user_basket . $no_installment . $max_installment . $currency . $test_mode;
$paytr_token = base64_encode(hash_hmac('sha256', $hash_str . $merchant_salt, $merchant_key, true));

// PayTR'a gönderilecek veri
$post_vals = array(
    'merchant_id' => $merchant_id,
    'user_ip' => $user_ip,
    'merchant_oid' => $merchant_oid,
    'email' => $user_email,
    'payment_amount' => $payment_amount,
    'paytr_token' => $paytr_token,
    'user_basket' => $user_basket,
    'no_installment' => $no_installment,
    'max_installment' => $max_installment,
    'user_name' => $user_name,
    'user_address' => $user_address,
    'user_phone' => $user_phone,
    'merchant_ok_url' => $merchant_ok_url,
    'merchant_fail_url' => $merchant_fail_url,
    'merchant_notify_url' => $merchant_notify_url,
    'timeout_limit' => $timeout_limit,
    'currency' => $currency,
    'test_mode' => $test_mode,
    'lang' => $lang
);

// PayTR API'ye istek gönder
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://www.paytr.com/odeme/api/get-token");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_vals);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    die("PayTR bağlantı hatası: " . curl_error($ch));
}

curl_close($ch);

// Sonucu çöz
$result = json_decode($result, 1);

if ($result['status'] == 'success') {
    $token = $result['token'];
} else {
    die("PayTR token hatası. Sebep: " . $result['reason']);
}
?>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Üyelik Ödemesi</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .info-box {
            background: #e8f4f8;
            border: 1px solid #b8e0ea;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .payment-frame {
            width: 100%;
            min-height: 600px;
            border: none;
        }
        .back-button {
            display: inline-block;
            padding: 10px 20px;
            background: #6c757d;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Premium Üyelik Ödemesi</h1>
        
        <div class="info-box">
            <p><strong>Sipariş No:</strong> <?php echo $merchant_oid; ?></p>
            <p><strong>Tutar:</strong> 39.90 TL</p>
            <p><strong>Açıklama:</strong> Premium Üyelik (1 Yıl)</p>
        </div>

        <!-- PayTR iframe -->
        <iframe src="https://www.paytr.com/odeme/guvenli/<?php echo $token; ?>" 
                id="paytriframe" 
                class="payment-frame"
                frameborder="0" 
                scrolling="yes">
        </iframe>

        <a href="/" class="back-button">Ana Sayfaya Dön</a>
    </div>

    <script>
        // PayTR callback fonksiyonu
        window.addEventListener('message', function(e) {
            if (e.origin !== "https://www.paytr.com") {
                return;
            }
            
            var data = JSON.parse(e.data);
            
            if (data.status === 'success') {
                alert('Ödemeniz başarıyla alındı! Premium üyeliğiniz aktifleştiriliyor...');
                window.location.href = '/';
            } else {
                alert('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
            }
        });
    </script>
</body>
</html>