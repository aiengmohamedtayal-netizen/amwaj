(function () {
  'use strict';

  const config = window.AMWAJ_SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey) {
    throw new Error('Amwaj Supabase public configuration is missing.');
  }

  const SESSION_KEY = 'amwaj_admin_session_v1';
  const apiBase = config.url.replace(/\/$/, '');

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function baseHeaders(token, extra) {
    return {
      apikey: config.publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extra || {})
    };
  }

  async function readResponse(response) {
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!response.ok) {
      const message = body?.message || body?.msg || body?.error_description || body?.hint || `Request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }

  async function authRequest(path, options) {
    const response = await fetch(`${apiBase}/auth/v1${path}`, {
      ...options,
      headers: baseHeaders(null, { 'Content-Type': 'application/json', ...(options?.headers || {}) })
    });
    return readResponse(response);
  }

  async function refreshSession(session) {
    if (!session?.refresh_token) return null;
    try {
      const refreshed = await authRequest('/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      return saveSession(refreshed);
    } catch {
      clearSession();
      return null;
    }
  }

  async function getValidSession() {
    const session = getSession();
    if (!session?.access_token) return null;
    const expiresSoon = !session.expires_at || session.expires_at <= Math.floor(Date.now() / 1000) + 60;
    return expiresSoon ? refreshSession(session) : session;
  }

  async function signInWithPassword(email, password) {
    const session = await authRequest('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return saveSession(session);
  }

  async function signOut() {
    const session = await getValidSession();
    try {
      if (session?.access_token) {
        await authRequest('/logout', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      }
    } finally {
      clearSession();
    }
  }

  async function rest(path, options) {
    let session = await getValidSession();
    const response = await fetch(`${apiBase}/rest/v1/${path}`, {
      ...options,
      headers: baseHeaders(session?.access_token, {
        Accept: 'application/json',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options?.headers || {})
      })
    });
    if (response.status === 401 && session?.refresh_token) {
      session = await refreshSession(session);
      if (session?.access_token) {
        const retried = await fetch(`${apiBase}/rest/v1/${path}`, {
          ...options,
          headers: baseHeaders(session.access_token, {
            Accept: 'application/json',
            ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options?.headers || {})
          })
        });
        return readResponse(retried);
      }
    }
    return readResponse(response);
  }

  async function getMyProfile(session) {
    const user = session?.user;
    if (!user?.id) return null;
    const rows = await rest(`profiles?select=id,full_name,is_admin&id=eq.${encodeURIComponent(user.id)}&limit=1`, { method: 'GET' });
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  async function requireAdmin() {
    const session = await getValidSession();
    if (!session) return { session: null, profile: null, isAdmin: false };
    try {
      const profile = await getMyProfile(session);
      return { session, profile, isAdmin: Boolean(profile?.is_admin) };
    } catch {
      return { session, profile: null, isAdmin: false };
    }
  }

  async function list(table, options) {
    const params = new URLSearchParams({ select: options?.select || '*' });
    if (options?.order) params.set('order', options.order);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.filters) Object.entries(options.filters).forEach(([key, value]) => params.set(key, value));
    return rest(`${table}?${params.toString()}`, { method: 'GET' });
  }

  async function create(table, payload) {
    return rest(table, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
  }

  async function update(table, id, payload) {
    return rest(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
  }

  async function updateSetting(key, payload) {
    return rest(`site_settings?setting_key=eq.${encodeURIComponent(key)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
  }

  async function remove(table, id) {
    return rest(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' }
    });
  }

  function safeMediaFilename(filename) {
    const normalized = String(filename || 'image').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
    return normalized || 'image';
  }

  function publicMediaUrl(path) {
    return `${apiBase}/storage/v1/object/public/amwaj-media/${path.split('/').map(encodeURIComponent).join('/')}`;
  }

  async function uploadImage(file, scope) {
    if (!(file instanceof File)) throw new Error('اختر ملف صورة صالحًا أولًا.');
    const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
    if (!acceptedTypes.has(file.type)) throw new Error('صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP أو AVIF.');
    if (file.size > 5242880) throw new Error('حجم الصورة أكبر من الحد المسموح (5 ميغابايت).');
    const session = await getValidSession();
    if (!session?.access_token) throw new Error('انتهت جلسة المدير. سجّل الدخول ثم أعد المحاولة.');
    const folder = String(scope || 'general').replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const unique = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${folder}/${unique}-${safeMediaFilename(file.name)}`;
    const response = await fetch(`${apiBase}/storage/v1/object/amwaj-media/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: baseHeaders(session.access_token, { 'Content-Type': file.type, 'x-upsert': 'false' }),
      body: file
    });
    await readResponse(response);
    return { path, publicUrl: publicMediaUrl(path) };
  }

  window.AmwajAdminClient = Object.freeze({
    config: { url: apiBase, publishableKey: config.publishableKey },
    getSession,
    getValidSession,
    signInWithPassword,
    signOut,
    requireAdmin,
    list,
    create,
    update,
    remove,
    uploadImage,
    publicMediaUrl,
    updateSetting
  });
}());
