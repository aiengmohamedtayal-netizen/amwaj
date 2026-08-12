/**
 * Amwaj Travel & Tourism - Vercel Serverless AI Proxy Endpoint
 * Production Security: Zero hardcoded keys, environment variables resolution,
 * IP rate limiting, structured server logging, and clean provider abstraction.
 */

// In-memory window tracker per lambda invocation
const rateLimitMap = new Map();

export default async function handler(req, res) {
    const startTime = Date.now();

    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Client IP Detection
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();

    // Rate Limiting (10 requests per minute per IP)
    const now = Date.now();
    const windowMs = 60 * 1000;
    const ipData = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + windowMs };

    if (now > ipData.resetTime) {
        ipData.count = 0;
        ipData.resetTime = now + windowMs;
    }

    ipData.count += 1;
    rateLimitMap.set(clientIp, ipData);

    if (ipData.count > 10) {
        console.warn(`[RATE_LIMIT_EXCEEDED] IP: ${clientIp}`);
        return res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded. Please wait a minute.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { messages, tools, model, stream = true } = body;

        // Prefer Groq whenever its server-side key is configured. A legacy TokenRouter
        // variable may still be present in Vercel, but must never override the approved
        // Groq integration or route requests to an unavailable Kimi model.
        const groqKey = (process.env.GROQ_API_KEY || '').trim();
        const tokenRouterKey = (process.env.TOKENROUTER_API_KEY || process.env.KIMI_API_KEY || '').trim();
        const useGroq = Boolean(groqKey);
        const apiKey = groqKey || tokenRouterKey;

        if (!apiKey) {
            console.error('[CONFIG_ERROR] No GROQ_API_KEY or fallback provider key found in process.env');
            return res.status(500).json({
                error: 'AI provider is not configured.',
                message: 'The AI assistant is temporarily unconfigured on the server.'
            });
        }

        const isTokenRouter = !useGroq && Boolean(tokenRouterKey);
        const endpointUrl = isTokenRouter
            ? 'https://api.tokenrouter.com/v1/chat/completions'
            : 'https://api.groq.com/openai/v1/chat/completions';

        const targetModel = isTokenRouter
            ? (model || 'moonshotai/kimi-k3-free')
            : (model && /^llama-(3\.1|3\.3)-/i.test(model) ? model : 'llama-3.3-70b-versatile');

        const payload = {
            model: targetModel,
            messages: messages || [],
            temperature: 0.7,
            stream: stream
        };

        if (tools && Array.isArray(tools) && tools.length > 0) {
            payload.tools = tools;
        }

        const apiRes = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const latencyMs = Date.now() - startTime;
        console.log(`[AI_LOG] Timestamp=${new Date().toISOString()} IP=${clientIp} LatencyMs=${latencyMs} Status=${apiRes.status} Model=${targetModel}`);

        if (!apiRes.ok) {
            const errText = await apiRes.text();
            console.error(`[AI_UPSTREAM_ERROR] Status=${apiRes.status}: ${errText}`);
            return res.status(apiRes.status).json({
                error: 'AI Provider Error',
                message: 'The AI assistant is temporarily unavailable.'
            });
        }

        if (stream && apiRes.body) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const reader = apiRes.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            return res.end();
        } else {
            const data = await apiRes.json();
            return res.status(200).json(data);
        }

    } catch (error) {
        console.error('[SERVERLESS_ERROR]', error);
        return res.status(500).json({ error: 'Internal Server Error', message: 'The AI service encountered an error.' });
    }
}
