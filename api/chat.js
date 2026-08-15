/**
 * Amwaj Travel & Tourism — AI assistant proxy.
 * Secrets are read only from Vercel server environment variables.
 * SovereignEG / DeepSeek V4 Flash is primary; Groq is an operational fallback.
 */
const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 24000;

function clientIp(req) {
    return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function isRateLimited(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + WINDOW_MS };
    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + WINDOW_MS;
    }
    record.count += 1;
    rateLimitMap.set(ip, record);
    return record.count > MAX_REQUESTS_PER_WINDOW;
}

function validMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return false;
    return messages.every((message) => {
        if (!message || typeof message !== 'object') return false;
        if (!['system', 'user', 'assistant', 'tool'].includes(message.role)) return false;
        // OpenAI-compatible tool turns legitimately use a null/omitted content field.
        // Accept them only when the tool-call structure is present and bounded.
        if (message.role === 'assistant' && Array.isArray(message.tool_calls)) {
            return message.tool_calls.length > 0 && message.tool_calls.length <= 8 && message.tool_calls.every((call) => (
                call && typeof call === 'object' &&
                (typeof call.id === 'string' || typeof call.id === 'undefined') &&
                call.function && typeof call.function.name === 'string' &&
                call.function.name.length <= 120 &&
                (typeof call.function.arguments === 'string' || typeof call.function.arguments === 'undefined')
            ));
        }
        if (message.role === 'tool') {
            return typeof message.tool_call_id === 'string' && message.tool_call_id.length <= 160 &&
                typeof message.content === 'string' && message.content.length <= MAX_MESSAGE_CHARS;
        }
        if (typeof message.content === 'string') return message.content.trim().length > 0 && message.content.length <= MAX_MESSAGE_CHARS;
        return Array.isArray(message.content) && message.content.length > 0;
    });
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
    return fetch(provider.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({ ...payload, model: provider.model })
    });
}

export default async function handler(req, res) {
    const startTime = Date.now();
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const ip = clientIp(req);
    if (isRateLimited(ip)) {
        console.warn(`[AI_RATE_LIMIT] ip=${ip}`);
        return res.status(429).json({ error: 'Too Many Requests', message: 'يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { messages, tools, stream = true } = body;
        if (!validMessages(messages)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'يجب إرسال قائمة رسائل صالحة وغير فارغة إلى المساعد.'
            });
        }

        const providers = configuredProviders();
        if (providers.length === 0) {
            console.error('[AI_CONFIG_ERROR] No primary or fallback provider key is configured');
            return res.status(500).json({ error: 'Configuration Error', message: 'خدمة المساعد غير مهيأة على الخادم حالياً.' });
        }

        const payload = { messages, temperature: 0.7, stream: Boolean(stream) };
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
                console.error(`[AI_PROVIDER_REQUEST_ERROR] provider=${provider.name} error=${providerError.message}`);
            }
        }

        if (!upstream || !activeProvider) {
            return res.status(502).json({ error: 'AI Provider Error', message: 'تعذّر الوصول إلى خدمة المساعد حالياً. يرجى المحاولة لاحقاً.' });
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
        console.error('[AI_SERVERLESS_ERROR]', error);
        return res.status(500).json({ error: 'Internal Server Error', message: 'حدث خطأ أثناء تشغيل المساعد الذكي.' });
    }
}
