/*
 * AMWAJ public browser preferences.
 * Owns only cross-page UI preferences; it never stores server data or form state.
 */
(function () {
  'use strict';

  const LANGUAGE_STORAGE_KEY = 'lang';
  const DEFAULT_LANGUAGE = 'ar';
  const supportedLanguages = new Set(['ar', 'en']);

  function normalizeLanguage(value) {
    return supportedLanguages.has(value) ? value : DEFAULT_LANGUAGE;
  }

  function readStoredLanguage() {
    try {
      return normalizeLanguage(window.localStorage?.getItem(LANGUAGE_STORAGE_KEY));
    } catch (_) {
      return DEFAULT_LANGUAGE;
    }
  }

  let language = readStoredLanguage();

  function applyDocumentLanguage(nextLanguage) {
    if (!document?.documentElement) return;
    document.documentElement.setAttribute('lang', nextLanguage);
    document.documentElement.setAttribute('dir', nextLanguage === 'ar' ? 'rtl' : 'ltr');
  }

  function publishLanguageChange(nextLanguage, previousLanguage, source) {
    window.dispatchEvent(new CustomEvent('amwaj:languagechange', {
      detail: { language: nextLanguage, previousLanguage, source: source || 'preferences' }
    }));
  }

  function setLanguage(nextLanguage, options = {}) {
    const normalized = normalizeLanguage(nextLanguage);
    const previousLanguage = language;
    language = normalized;
    applyDocumentLanguage(language);

    if (options.persist !== false) {
      try { window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language); } catch (_) { /* browser storage can be unavailable */ }
    }

    if (options.notify !== false && (previousLanguage !== language || options.force === true)) {
      publishLanguageChange(language, previousLanguage, options.source);
    }
    return language;
  }

  function getLanguage() {
    return language;
  }

  function toggleLanguage() {
    return setLanguage(language === 'ar' ? 'en' : 'ar', { source: 'toggle' });
  }

  applyDocumentLanguage(language);

  const api = Object.freeze({
    getLanguage,
    setLanguage,
    toggleLanguage,
    storageKey: LANGUAGE_STORAGE_KEY
  });

  window.AmwajPreferences = api;
  // Legacy global entry points are intentionally preserved for inline markup and existing scripts.
  window.setLanguage = (nextLanguage) => api.setLanguage(nextLanguage, { source: 'legacy-global' });
  window.toggleLanguage = () => api.toggleLanguage();
}());
