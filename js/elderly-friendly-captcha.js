// YAŞLI KULLANICILAR İÇİN BASİT CAPTCHA SİSTEMİ

const ElderlyFriendlyCaptcha = {
    // Basit matematik sorusu oluştur
    generate() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operations = [
            {
                symbol: '+',
                calc: (a, b) => a + b,
                text: 'artı'
            }
        ];
        
        const operation = operations[0]; // Sadece toplama (yaşlılar için kolay)
        
        return {
            question: `${num1} ${operation.text} ${num2} kaçtır?`,
            display: `${num1} + ${num2} = ?`,
            answer: operation.calc(num1, num2),
            num1: num1,
            num2: num2
        };
    },

    // Captcha HTML'i oluştur
    createHTML() {
        const captcha = this.generate();
        // Session storage'a doğru cevabı kaydet
        sessionStorage.setItem('captchaAnswer', captcha.answer);
        
        return `
            <div class="captcha-container mb-4 p-4 bg-white/10 border border-gray-600 rounded-lg">
                <label class="block text-lg font-medium text-gray-300 mb-3">
                    <i class="fas fa-robot mr-2 text-cyan-400"></i>
                    Robot Kontrolü:
                </label>
                <div class="flex items-center gap-4">
                    <span class="text-3xl font-bold text-white bg-black/50 px-6 py-3 rounded-lg">
                        ${captcha.display}
                    </span>
                    <input 
                        type="number" 
                        id="captchaInput" 
                        class="w-32 px-6 py-4 text-2xl bg-black/50 border-2 border-gray-600 rounded-lg focus:border-cyan-400 text-white text-center outline-none"
                        placeholder="?"
                        required
                        min="0"
                        max="99"
                        autocomplete="off"
                    >
                </div>
                <p class="text-base text-gray-400 mt-3 italic">
                    <i class="fas fa-lightbulb mr-2 text-yellow-400"></i>
                    ${captcha.question}
                </p>
            </div>
        `;
    },

    // Captcha doğrula
    verify(userAnswer) {
        const correctAnswer = parseInt(sessionStorage.getItem('captchaAnswer'));
        const answer = parseInt(userAnswer);
        
        if (isNaN(answer)) {
            return {
                valid: false,
                message: 'Lütfen sadece rakam girin'
            };
        }
        
        if (answer === correctAnswer) {
            sessionStorage.removeItem('captchaAnswer');
            return {
                valid: true,
                message: 'Doğru!'
            };
        } else {
            return {
                valid: false,
                message: 'Yanlış cevap. Tekrar deneyin.'
            };
        }
    },

    // Form'a captcha ekle
    addToForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Captcha alanını bul veya oluştur
        let captchaDiv = form.querySelector('.captcha-wrapper');
        if (!captchaDiv) {
            captchaDiv = document.createElement('div');
            captchaDiv.className = 'captcha-wrapper';
            
            // Submit butonundan önce ekle
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton && submitButton.parentNode) {
                submitButton.parentNode.insertBefore(captchaDiv, submitButton);
            }
        }
        
        // Captcha HTML'ini ekle
        captchaDiv.innerHTML = this.createHTML();
    },

    // Yenile butonu için
    refresh() {
        // Her iki container'ı da kontrol et
        const captchaContainer = document.getElementById('captcha-container') || 
                               document.querySelector('.captcha-wrapper');
        if (captchaContainer) {
            captchaContainer.innerHTML = this.createHTML();
            console.log('[Captcha] Yenilendi');
        } else {
            console.error('[Captcha] Container bulunamadı!');
        }
    },

    // Init fonksiyonu ekle
    init() {
        console.log('[Captcha] System ready');
    }
};

// Export
window.ElderlyFriendlyCaptcha = ElderlyFriendlyCaptcha;