/*
 * AMWAJ Admin State
 * A deliberately small, dependency-free boundary for admin-only shared UI and page cache state.
 * Editors, dialogs, Copilot conversations, and unsaved form fields must remain local to their owners.
 */
(function () {
  'use strict';

  const SERVER_KEYS = new Set(['collections', 'pricing', 'blog', 'reviews', 'settings']);

  function create(initial = {}) {
    const listeners = new Set();
    const serverCache = new Map();
    const target = {
      auth: null,
      page: 'dashboard',
      collections: {},
      search: '',
      ...initial
    };

    function notify(change) {
      listeners.forEach((listener) => {
        try { listener(change, proxy); } catch (error) { console.warn('Admin state listener failed:', error); }
      });
    }

    const proxy = new Proxy(target, {
      set(object, property, value) {
        const previous = object[property];
        object[property] = value;
        if (SERVER_KEYS.has(property)) {
          serverCache.set(property, { value, updatedAt: Date.now() });
        }
        if (previous !== value) notify({ type: 'set', key: property, previous, value });
        return true;
      }
    });

    function invalidate(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      list.filter(Boolean).forEach((key) => {
        serverCache.delete(key);
        notify({ type: 'invalidate', key });
      });
    }

    function getServerCache(key) {
      return serverCache.get(key) || null;
    }

    function subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    return Object.freeze({
      state: proxy,
      invalidate,
      getServerCache,
      subscribe,
      serverKeys: Object.freeze([...SERVER_KEYS])
    });
  }

  window.AmwajAdminState = Object.freeze({ create });
}());
