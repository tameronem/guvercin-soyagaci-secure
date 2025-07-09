<?php

// ##### MAĞAZA BİLGİLERİNİZ #################################################
$merchant_id    = '593847';
$merchant_key   = 'GHFnc6n26sKMBr18';
$merchant_salt  = 'k7177bzk3sRHrGT8';
// ###########################################################################

// ##### SİTE ENTEGRASYON BİLGİLERİ ########################################
// Bu bilgiler gerçekte sitenize giriş yapmış olan kullanıcıdan (session) veya veritabanından alınmalıdır.
$merchant_oid   = "PRM-" . time() . rand(0, 999); // Sipariş Numarası: Benzersiz olmalıdır! "PRM-" gibi bir önek ekledim.
$email          = "musteri@pigeonpedigre.com"; // Müşterinin e-posta adresi (gerçek senaryoda kullanıcıdan alınmalı)
$payment_amount = 39.90; // <<<--- DEĞİŞEN KISIM: Sepet tutarı
$user_name      = "Ali Veli"; // Gerçek senaryoda kullanıcıdan alınmalı
$user_address   = "Test Adresi, Mahallesi, Sokağı, İlçe/İl"; // Gerçek senaryoda kullanıcıdan alınmalı
$user_phone     = "05555555555"; // Gerçek senaryoda kullanıcıdan alınmalı

// Başarılı ve Başarısız ödeme sonrası yönlendirilecek sayfa URL'leri
$merchant_ok_url    = "https://www.pigeonpedigre.com/odeme_basarili.php";
$merchant_fail_url  = "https://www.pigeonpedigre.com/odeme_basarisiz.php";
// ###########################################################################


// ##### Sepet Bilgileri (user_basket) #######################################
// <<<--- DEĞİŞEN KISIM: Ürün bilgisi güncellendi
$user_basket = base64_encode(json_encode(array(
    array("Premium Üyelik", "39.90", 1) // Ürün adı, Birim Fiyatı, Adet
)));
// ###########################################################################


// ##### DİĞER BİLGİLER ########################################################
// Müşterinin IP adresi
if( isset( $_SERVER["HTTP_CLIENT_IP"] ) ) {
    $user_ip = $_SERVER["HTTP_CLIENT_IP"];
} elseif( isset( $_SERVER["HTTP_X_FORWARDED_FOR"] ) ) {
    $user_ip = $_SERVER["HTTP_X_FORWARDED_FOR"];
} else {
    $user_ip = $_SERVER["REMOTE_ADDR"];
}

$test_mode = "1"; // Test modu: 1 ise test, 0 ise canlı mod
$non_3d = "0"; // 3D Secure kullanımı: 0 ise zorunlu
$client_lang = "tr"; // Ödeme süreci dili
$installment_count = "0"; // Tek çekim için 0
$currency = "TL"; // Para birimi
// ###########################################################################


// ##### PAYTR TOKEN OLUŞTURMA ###############################################
// Token oluştururken `payment_amount`'ın ondalıklı hali kullanılır.
$hash_str = $merchant_id . $user_ip . $merchant_oid . $email . $payment_amount . $installment_count . $currency . $test_mode . $non_3d;
$paytr_token = base64_encode(hash_hmac('sha256', $hash_str . $merchant_salt, $merchant_key, true));
// ###########################################################################

// Formu POST ederken `payment_amount` kuruşa çevrilerek gönderilir.
$payment_amount_for_form = $payment_amount * 100;

?>

<!doctype html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>PayTR - Premium Üyelik Ödemesi</title>
</head>
<body>

    <h3>Premium Üyelik Satın Al (39.90 TL)</h3>

    <form action="https://www.paytr.com/odeme" method="post">
        <!-- Müşteri tarafından girilecek kart bilgileri -->
        <div>
            <label for="cc_owner">Kart Sahibi:</label>
            <input type="text" name="cc_owner" id="cc_owner" value="PAYTR TEST" required><br>
        </div>
        <div>
            <label for="card_number">Kart Numarası:</label>
            <input type="text" name="card_number" id="card_number" value="4355084355084358" required><br>
        </div>
        <div>
            <label for="expiry_month">Son Kullanma Ay:</label>
            <input type="text" name="expiry_month" id="expiry_month" value="12" required><br>
        </div>
        <div>
            <label for="expiry_year">Son Kullanma Yıl:</label>
            <input type="text" name="expiry_year" id="expiry_year" value="24" required><br>
        </div>
        <div>
            <label for="cvv">CVV:</label>
            <input type="text" name="cvv" id="cvv" value="000" required><br>
        </div>

        <!-- Gizli (hidden) olarak gönderilecek alanlar -->
        <input type="hidden" name="merchant_id" value="<?php echo $merchant_id; ?>">
        <input type="hidden" name="user_ip" value="<?php echo $user_ip; ?>">
        <input type="hidden" name="merchant_oid" value="<?php echo $merchant_oid; ?>">
        <input type="hidden" name="email" value="<?php echo $email; ?>">
        <input type="hidden" name="payment_amount" value="<?php echo $payment_amount_for_form; ?>">
        <input type="hidden" name="paytr_token" value="<?php echo $paytr_token; ?>">
        <input type="hidden" name="user_basket" value="<?php echo $user_basket; ?>">
        <input type="hidden" name="debug_on" value="1">
        <input type="hidden" name="client_lang" value="<?php echo $client_lang; ?>">
        <input type="hidden" name="non_3d" value="<?php echo $non_3d; ?>">
        <input type="hidden" name="installment_count" value="<?php echo $installment_count; ?>">
        <input type="hidden" name="merchant_ok_url" value="<?php echo $merchant_ok_url; ?>">
        <input type="hidden" name="merchant_fail_url" value="<?php echo $merchant_fail_url; ?>">
        <input type="hidden" name="test_mode" value="<?php echo $test_mode; ?>">
        <input type="hidden" name="currency" value="<?php echo $currency; ?>">
        <input type="hidden" name="user_name" value="<?php echo $user_name; ?>">
        <input type="hidden" name="user_address" value="<?php echo $user_address; ?>">
        <input type="hidden" name="user_phone" value="<?php echo $user_phone; ?>">
        <br>
        <button type="submit">39.90 TL Ödeme Yap</button>
    </form>

</body>
</html>