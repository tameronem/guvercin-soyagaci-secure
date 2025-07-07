// jsPDF Loader - CDN'den yüklenmeye çalışır, başarısız olursa hata verir
(function() {
    // CDN'den yüklemeyi dene
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = function() {
        console.log('jsPDF loaded from CDN');
    };
    script.onerror = function() {
        console.error('jsPDF could not be loaded from CDN');
        // Fallback: Basit bir jsPDF mock objesi oluştur
        window.jspdf = {
            jsPDF: function() {
                return {
                    text: function() { return this; },
                    save: function() { 
                        alert('PDF özelliği şu anda kullanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
                        return this; 
                    },
                    addImage: function() { return this; },
                    internal: {
                        pageSize: {
                            getWidth: function() { return 210; },
                            getHeight: function() { return 297; }
                        }
                    }
                };
            }
        };
    };
    document.head.appendChild(script);
})();