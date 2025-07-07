// QRCode.js Loader
(function() {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = function() {
        console.log('QRCode.js loaded from CDN');
    };
    script.onerror = function() {
        console.error('QRCode.js could not be loaded from CDN');
        // Basit bir fallback
        window.QRCode = function(element, options) {
            console.warn('QRCode.js yüklenemedi. QR kod oluşturulamayacak.');
            if (element && typeof element.innerHTML !== 'undefined') {
                element.innerHTML = '<p>QR kod yüklenemedi</p>';
            }
        };
    };
    document.head.appendChild(script);
})();