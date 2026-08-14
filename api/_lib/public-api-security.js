const DEFAULT_WINDOW_MS = 60 * 1000;

function firstHeaderValue(value) {
  return String(value || '').split(',')[0].trim();
}

export function trustedClientIp(req) {
  const vercelForwarded = firstHeaderValue(req.headers['x-vercel-forwarded-for']);
  if (vercelForwarded) return vercelForwarded;

  const forwarded = firstHeaderValue(req.headers['x-forwarded-for']);
  if (forwarded) return forwarded;

  return String(req.socket?.remoteAddress || 'unknown').trim() || 'unknown';
}

export function applyPublicCors(res, { methods = 'POST, OPTIONS', headers = 'Content-Type' } = {}) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Access-Control-Max-Age', '600');
}

export function parseJsonBody(req, maxBytes) {
  const rawBody = req.body;
  if (typeof rawBody === 'string') {
    if (Buffer.byteLength(rawBody, 'utf8') > maxBytes) {
      const error = new Error('PAYLOAD_TOO_LARGE');
      error.code = 'PAYLOAD_TOO_LARGE';
      throw error;
    }
    try {
      return rawBody ? JSON.parse(rawBody) : {};
    } catch {
      const error = new Error('INVALID_JSON');
      error.code = 'INVALID_JSON';
      throw error;
    }
  }

  const body = rawBody && typeof rawBody === 'object' ? rawBody : {};
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > maxBytes) {
    const error = new Error('PAYLOAD_TOO_LARGE');
    error.code = 'PAYLOAD_TOO_LARGE';
    throw error;
  }
  return body;
}

export function createMemoryRateLimiter({ limit, windowMs = DEFAULT_WINDOW_MS, maxEntries = 5000 }) {
  const records = new Map();

  function prune(now) {
    if (records.size < maxEntries) return;
    for (const [key, value] of records) {
      if (value.resetAt <= now || records.size >= maxEntries) records.delete(key);
      if (records.size < maxEntries) break;
    }
  }

  return {
    consume(key) {
      const now = Date.now();
      prune(now);
      const current = records.get(key);
      const record = !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;
      record.count += 1;
      records.set(key, record);
      return {
        allowed: record.count <= limit,
        retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000))
      };
    }
  };
}

export async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function sendJsonError(res, status, error, message, extraHeaders = {}) {
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  return res.status(status).json({ error, message });
}
