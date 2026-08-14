/*
 * AMWAJ public language presentation.
 * Shared persistence and language ownership live in app-preferences.js when available.
 */
(function () {
  'use strict';

  function normalizeLanguage(value) {
    return value === 'en' ? 'en' : 'ar';
  }

  function updateLanguagePresentation(language) {
    const lang = normalizeLanguage(language);
    document.querySelectorAll('[data-ph-en]').forEach((element) => {
      const placeholder = lang === 'ar' ? element.getAttribute('data-ph-ar') : element.getAttribute('data-ph-en');
      if (placeholder) element.placeholder = placeholder;
    });

    document.title = lang === 'ar'
      ? 'شركة أمواج للسياحة | Amwaj Travel & Tourism - ترخيص فئة (أ) 1766'
      : 'Amwaj Travel | Premium Travel Agency in Egypt (Lic. 1766)';
  }

  function fallbackSetLanguage(nextLanguage) {
    const lang = normalizeLanguage(nextLanguage);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    try { localStorage.setItem('lang', lang); } catch (_) { /* no-op */ }
    updateLanguagePresentation(lang);
    window.dispatchEvent(new CustomEvent('amwaj:languagechange', { detail: { language: lang, source: 'i18n-fallback' } }));
    return lang;
  }

  function currentLanguage() {
    return window.AmwajPreferences?.getLanguage?.()
      || normalizeLanguage(document.documentElement.getAttribute('lang') || localStorage.lang || 'ar');
  }

  function setLanguage(nextLanguage) {
    if (window.AmwajPreferences?.setLanguage) return window.AmwajPreferences.setLanguage(nextLanguage, { source: 'i18n' });
    return fallbackSetLanguage(nextLanguage);
  }

  function toggleLanguage() {
    if (window.AmwajPreferences?.toggleLanguage) return window.AmwajPreferences.toggleLanguage();
    return setLanguage(currentLanguage() === 'ar' ? 'en' : 'ar');
  }

  window.setLanguage = setLanguage;
  window.toggleLanguage = toggleLanguage;
  window.addEventListener('amwaj:languagechange', (event) => updateLanguagePresentation(event.detail?.language || currentLanguage()));

  function initializeLanguagePresentation() {
    const language = currentLanguage();
    if (window.AmwajPreferences?.setLanguage) {
      window.AmwajPreferences.setLanguage(language, { source: 'i18n-init', notify: false });
    } else {
      fallbackSetLanguage(language);
      return;
    }
    updateLanguagePresentation(language);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeLanguagePresentation, { once: true });
  else initializeLanguagePresentation();
}());
