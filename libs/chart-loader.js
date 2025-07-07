// Chart.js Loader - CDN'den yüklenmeye çalışır
(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
        console.log('Chart.js loaded from CDN');
    };
    script.onerror = function() {
        console.error('Chart.js could not be loaded from CDN');
        // Basit bir fallback
        window.Chart = function() {
            console.warn('Chart.js yüklenemedi. Grafikler gösterilemeyecek.');
        };
    };
    document.head.appendChild(script);
})();