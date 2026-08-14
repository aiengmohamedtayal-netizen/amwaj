/**
 * Amwaj Travel & Tourism — AI assistant proxy.
 * Secrets are read only from Vercel server environment variables.
 * SovereignEG / DeepSeek V4 Flash is primary; Groq is an operational fallback.
 */
import {
    applyPublicCors,
    createMemoryRateLimiter,
    fetchWithTimeout,
    parseJsonBody,
    sendJsonError,
    trustedClientIp
} from './_lib/public-api-security.js';

const MAX_REQUESTS_PER_WINDOW = 10;
const REQUEST_WINDOW_MS = 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_MESSAGE_CHARS = 16000;
const MAX_TOOLS = 4;
const MAX_TOOL_BYTES = 6000;
const MAX_OUTPUT_TOKENS = 800;
const UPSTREAM_TIMEOUT_MS = 25 * 1000;
const rateLimiter = createMemoryRateLimiter({
    limit: MAX_REQUESTS_PER_WINDOW,
    windowMs: REQUEST_WINDOW_MS
});

function serializedBytes(value) {
    try {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
        return Number.POSITIVE_INFINITY;
    }
}

function messageLength(content) {
    if (typeof content === 'string') return content.trim().length;
    if (Array.isArray(content)) return serializedBytes(content);
    return 0;
}

function validMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return false;
    let totalLength = 0;
    const valid = messages.every((message) => {
        if (!message || typeof message !== 'object') return false;
        if (!['system', 'user', 'assistant', 'tool'].includes(message.role)) return false;
        const length = messageLength(message.content);
        totalLength += length;
        return length > 0 && length <= MAX_MESSAGE_CHARS;
    });
    return valid && totalLength <= MAX_TOTAL_MESSAGE_CHARS;
}

function validTools(tools) {
    if (tools === undefined) return true;
    return Array.isArray(tools) && tools.length <= MAX_TOOLS && serializedBytes(tools) <= MAX_TOOL_BYTES;
}

function configuredProviders() {
    const sovereignKey = String(process.env.SOVEREIGN_EG_API_KEY || '').trim();
    const groqKey = String(process.env.GROQ_API_KEY || '').trim();
    const providers = [];

    if (sovereignKey) {
        providers.push({
            name: 'SovereignEG',
            endpoint: 'https://backend.sovereigneg.com/v1/chat/completions',
            apiKey: sovereignKey,
            model: 'deepseek-v4-flash'
        });
    }
    if (groqKey) {
        providers.push({
            name: 'Groq',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            apiKey: groqKey,
            model: 'llama-3.3-70b-versatile'
        });
    }
    return providers;
}

async function requestProvider(provider, payload) {
    return fetchWithTimeout(provider.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({ ...payload, model: provider.model })
    }, UPSTREAM_TIMEOUT_MS);
}

export default async function handler(req, res) {
    const startTime = Date.now();
    applyPublicCors(res, { methods: 'POST, OPTIONS', headers: 'Content-Type' });

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return sendJsonError(res, 405, 'METHOD_NOT_ALLOWED', 'هذه الواجهة تقبل طلبات POST فقط.');

    const ip = trustedClientIp(req);
    const limit = rateLimiter.consume(ip);
    if (!limit.allowed) {
        console.warn(`[AI_RATE_LIMIT] ip=${ip}`);
        return sendJsonError(
            res,
            429,
            'RATE_LIMITED',
            'يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.',
            { 'Retry-After': String(limit.retryAfterSeconds) }
        );
    }

    try {
        const body = parseJsonBody(req, MAX_BODY_BYTES);
        const { messages, tools, stream = true } = body;
        if (!validMessages(messages) || !validTools(tools)) {
            return sendJsonError(
                res,
                400,
                'VALIDATION_ERROR',
                'يجب إرسال رسائل صالحة ضمن الحدود المسموح بها للمساعد.'
            );
        }

        const providers = configuredProviders();
        if (providers.length === 0) {
            console.error('[AI_CONFIG_ERROR] No primary or fallback provider key is configured');
            return sendJsonError(res, 500, 'CONFIGURATION_ERROR', 'خدمة المساعد غير مهيأة على الخادم حالياً.');
        }

        const payload = {
            messages,
            temperature: 0.7,
            max_tokens: MAX_OUTPUT_TOKENS,
            stream: Boolean(stream)
        };
        if (Array.isArray(tools) && tools.length > 0) payload.tools = tools;

        let upstream;
        let activeProvider;
        for (const provider of providers) {
            try {
                const response = await requestProvider(provider, payload);
                if (response.ok) {
                    upstream = response;
                    activeProvider = provider;
                    break;
                }
                const errorText = (await response.text()).slice(0, 500);
                console.error(`[AI_UPSTREAM_ERROR] provider=${provider.name} status=${response.status} body=${errorText}`);
            } catch (providerError) {
                const reason = providerError?.name === 'AbortError' ? 'timeout' : providerError?.message;
                console.error(`[AI_PROVIDER_REQUEST_ERROR] provider=${provider.name} error=${reason}`);
            }
        }

        if (!upstream || !activeProvider) {
            return sendJsonError(res, 502, 'AI_PROVIDER_ERROR', 'تعذّر الوصول إلى خدمة المساعد حالياً. يرجى المحاولة لاحقاً.');
        }

        console.log(`[AI_OK] provider=${activeProvider.name} model=${activeProvider.model} ip=${ip} latencyMs=${Date.now() - startTime}`);
        if (payload.stream && upstream.body) {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            const reader = upstream.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            return res.end();
        }

        return res.status(200).json(await upstream.json());
    } catch (error) {
        if (error?.code === 'PAYLOAD_TOO_LARGE') {
            return sendJsonError(res, 413, 'PAYLOAD_TOO_LARGE', 'حجم الطلب أكبر من الحد المسموح به.');
        }
        if (error?.code === 'INVALID_JSON') {
            return sendJsonError(res, 400, 'INVALID_JSON', 'صيغة الطلب غير صالحة.');
        }
        console.error('[AI_SERVERLESS_ERROR]', error?.message || error);
        return sendJsonError(res, 500, 'INTERNAL_SERVER_ERROR', 'حدث خطأ أثناء تشغيل المساعد الذكي.');
    }
}
