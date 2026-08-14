/**
 * Public customer-review submission route.
 * This endpoint uses only the publishable Supabase key and the existing RLS policy.
 * It does not bypass RLS, elevate privileges, or change the review-moderation flow.
 */
import {
    applyPublicCors,
    createMemoryRateLimiter,
    fetchWithTimeout,
    parseJsonBody,
    sendJsonError,
    trustedClientIp
} from './_lib/public-api-security.js';

const SUPABASE_URL = 'https://wufguxedvhqechlqwoye.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable__IM9SxvJHCrIh9HUsnkn5w_CerIzlPf';
const MAX_BODY_BYTES = 8 * 1024;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const UPSTREAM_TIMEOUT_MS = 10 * 1000;
const rateLimiter = createMemoryRateLimiter({
    limit: MAX_REQUESTS_PER_WINDOW,
    windowMs: REQUEST_WINDOW_MS
});

function normalizeText(value, maxLength) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function validReview({ customerName, rating, reviewText }) {
    return customerName.length >= 2
        && customerName.length <= 90
        && Number.isInteger(rating)
        && rating >= 1
        && rating <= 5
        && reviewText.length >= 10
        && reviewText.length <= 1200;
}

async function submitToSupabase(record) {
    return fetchWithTimeout(`${SUPABASE_URL}/rest/v1/customer_reviews`, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
        },
        body: JSON.stringify(record)
    }, UPSTREAM_TIMEOUT_MS);
}

export default async function handler(req, res) {
    applyPublicCors(res, { methods: 'POST, OPTIONS', headers: 'Content-Type' });
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return sendJsonError(res, 405, 'METHOD_NOT_ALLOWED', 'هذه الواجهة تقبل طلبات POST فقط.');

    const ip = trustedClientIp(req);
    const limit = rateLimiter.consume(ip);
    if (!limit.allowed) {
        console.warn(`[REVIEW_RATE_LIMIT] ip=${ip}`);
        return sendJsonError(
            res,
            429,
            'RATE_LIMITED',
            'يرجى الانتظار قبل إرسال مراجعة أخرى.',
            { 'Retry-After': String(limit.retryAfterSeconds) }
        );
    }

    try {
        const body = parseJsonBody(req, MAX_BODY_BYTES);
        const honeypot = normalizeText(body.company_website, 200);
        if (honeypot) {
            // Return a neutral success response so automated clients do not learn the signal.
            console.warn(`[REVIEW_HONEYPOT] ip=${ip}`);
            return res.status(202).json({ accepted: true });
        }

        const customerName = normalizeText(body.customer_name, 90);
        const rating = Number(body.rating);
        const reviewText = normalizeText(body.review_text, 1200);
        if (!validReview({ customerName, rating, reviewText })) {
            return sendJsonError(res, 400, 'VALIDATION_ERROR', 'يرجى إدخال الاسم والتقييم ورأي صالح ضمن الحدود المسموح بها.');
        }

        const upstream = await submitToSupabase({
            customer_name: customerName,
            rating,
            review_text: reviewText
        });
        if (!upstream.ok) {
            const detail = (await upstream.text()).slice(0, 300);
            console.error(`[REVIEW_UPSTREAM_ERROR] status=${upstream.status} body=${detail}`);
            return sendJsonError(res, 502, 'REVIEW_SERVICE_ERROR', 'تعذر استلام المراجعة الآن. يرجى المحاولة لاحقاً.');
        }

        console.log(`[REVIEW_ACCEPTED] ip=${ip} rating=${rating}`);
        return res.status(201).json({ accepted: true });
    } catch (error) {
        if (error?.code === 'PAYLOAD_TOO_LARGE') {
            return sendJsonError(res, 413, 'PAYLOAD_TOO_LARGE', 'حجم الطلب أكبر من الحد المسموح به.');
        }
        if (error?.code === 'INVALID_JSON') {
            return sendJsonError(res, 400, 'INVALID_JSON', 'صيغة الطلب غير صالحة.');
        }
        const reason = error?.name === 'AbortError' ? 'timeout' : error?.message;
        console.error(`[REVIEW_SERVER_ERROR] error=${reason}`);
        return sendJsonError(res, 500, 'INTERNAL_SERVER_ERROR', 'تعذر استلام المراجعة الآن. يرجى المحاولة لاحقاً.');
    }
}
