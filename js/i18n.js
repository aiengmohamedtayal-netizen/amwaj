/**
 * Amwaj Travel & Tourism - Internationalization (i18n) Engine
 * Manages Arabic-only & English-only modes, RTL/LTR layout & placeholders.
 */

function toggleLanguage() {
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
}

function setLanguage(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.lang = lang;

    // Update Input Placeholders
    document.querySelectorAll('[data-ph-en]').forEach(el => {
        const phText = lang === 'ar' ? el.getAttribute('data-ph-ar') : el.getAttribute('data-ph-en');
        if (phText) el.placeholder = phText;
    });

    // Update Page Title
    if (lang === 'ar') {
        document.title = "شركة أمواج للسياحة | Amwaj Travel & Tourism - ترخيص فئة (أ) 1766";
    } else {
        document.title = "Amwaj Travel | Premium Travel Agency in Egypt (Lic. 1766)";
    }

    window.AmwajSyncSearchLanguage?.(lang);
}

// Auto-initialize language on script load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.lang || 'ar';
    setLanguage(savedLang);
});
