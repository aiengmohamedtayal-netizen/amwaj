import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

import chatHandler from '../api/chat.js';
import tripPlannerHandler from '../api/trip-planner.js';
import reviewsHandler from '../api/reviews.js';

function createResponse() {
    const state = { statusCode: 200, headers: {}, body: undefined, ended: false };
    return {
        state,
        setHeader(name, value) { state.headers[name.toLowerCase()] = value; },
        status(code) { state.statusCode = code; return this; },
        json(payload) { state.body = payload; return this; },
        write(chunk) { state.body = `${state.body || ''}${chunk}`; },
        end() { state.ended = true; return this; }
    };
}

function request({ method = 'POST', body = {}, ip = '203.0.113.10' } = {}) {
    return {
        method,
        body,
        headers: { 'x-vercel-forwarded-for': ip },
        socket: { remoteAddress: '127.0.0.1' }
    };
}

function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

test('public AI APIs expose constrained CORS and reject unsupported methods', async () => {
    const chatRes = createResponse();
    await chatHandler(request({ method: 'GET', ip: '203.0.113.11' }), chatRes);
    assert.equal(chatRes.state.statusCode, 405);
    assert.equal(chatRes.state.headers['access-control-allow-origin'], '*');
    assert.equal(chatRes.state.body.error, 'METHOD_NOT_ALLOWED');

    const tripRes = createResponse();
    await tripPlannerHandler(request({ method: 'OPTIONS', ip: '203.0.113.12' }), tripRes);
    assert.equal(tripRes.state.statusCode, 204);
    assert.equal(tripRes.state.headers['access-control-allow-methods'], 'POST, OPTIONS');
});

test('chat rejects oversized or structurally invalid public input before contacting a provider', async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; return jsonResponse({}); };
    try {
        const invalidRes = createResponse();
        await chatHandler(request({
            body: { messages: [{ role: 'user', content: '' }] },
            ip: '203.0.113.13'
        }), invalidRes);
        assert.equal(invalidRes.state.statusCode, 400);
        assert.equal(invalidRes.state.body.error, 'VALIDATION_ERROR');

        const largeRes = createResponse();
        await chatHandler(request({
            body: JSON.stringify({ messages: [{ role: 'user', content: 'x'.repeat(70 * 1024) }] }),
            ip: '203.0.113.14'
        }), largeRes);
        assert.equal(largeRes.state.statusCode, 413);
        assert.equal(calls, 0);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('chat applies its bounded provider payload on a valid non-streaming request', async () => {
    const originalFetch = globalThis.fetch;
    const originalKey = process.env.SOVEREIGN_EG_API_KEY;
    let observedPayload;
    process.env.SOVEREIGN_EG_API_KEY = 'test-key';
    globalThis.fetch = async (_url, options) => {
        observedPayload = JSON.parse(options.body);
        return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
    };
    try {
        const res = createResponse();
        await chatHandler(request({
            body: { messages: [{ role: 'user', content: 'مرحبا' }], stream: false },
            ip: '203.0.113.15'
        }), res);
        assert.equal(res.state.statusCode, 200);
        assert.equal(observedPayload.max_tokens, 800);
        assert.equal(observedPayload.stream, false);
    } finally {
        globalThis.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.SOVEREIGN_EG_API_KEY;
        else process.env.SOVEREIGN_EG_API_KEY = originalKey;
    }
});

test('trip planner keeps its shape while bounding context and output cost', async () => {
    const originalFetch = globalThis.fetch;
    const originalKey = process.env.SOVEREIGN_EG_API_KEY;
    let observedPayload;
    process.env.SOVEREIGN_EG_API_KEY = 'test-key';
    globalThis.fetch = async (_url, options) => {
        observedPayload = JSON.parse(options.body);
        return jsonResponse({
            choices: [{ message: { content: JSON.stringify({ summary: 'خطة مختصرة', itinerary: [] }) } }]
        });
    };
    try {
        const res = createResponse();
        await tripPlannerHandler(request({
            body: {
                destination: 'القاهرة',
                duration: 3,
                business_context: { notes: 'x'.repeat(30 * 1024) }
            },
            ip: '203.0.113.16'
        }), res);
        assert.equal(res.state.statusCode, 200);
        assert.equal(observedPayload.max_tokens, 1600);
        assert.ok(observedPayload.messages[1].content.length < 28000);
        assert.equal(res.state.body.plan.summary, 'خطة مختصرة');
    } finally {
        globalThis.fetch = originalFetch;
        if (originalKey === undefined) delete process.env.SOVEREIGN_EG_API_KEY;
        else process.env.SOVEREIGN_EG_API_KEY = originalKey;
    }
});

test('review endpoint validates input, discards honeypots, and submits only valid pending records through existing RLS', async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (_url, options) => {
        calls.push(JSON.parse(options.body));
        return new Response('', { status: 201 });
    };
    try {
        const invalidRes = createResponse();
        await reviewsHandler(request({ body: { customer_name: 'A', rating: 9, review_text: 'قصير' }, ip: '203.0.113.17' }), invalidRes);
        assert.equal(invalidRes.state.statusCode, 400);

        const trapRes = createResponse();
        await reviewsHandler(request({
            body: { customer_name: 'عميل', rating: 5, review_text: 'هذه مراجعة صالحة للاختبار فقط.', company_website: 'https://bot.example' },
            ip: '203.0.113.18'
        }), trapRes);
        assert.equal(trapRes.state.statusCode, 202);
        assert.equal(calls.length, 0);

        const successRes = createResponse();
        await reviewsHandler(request({
            body: { customer_name: 'عميل', rating: 5, review_text: 'هذه مراجعة صالحة للاختبار فقط.' },
            ip: '203.0.113.19'
        }), successRes);
        assert.equal(successRes.state.statusCode, 201);
        assert.deepEqual(calls[0], {
            customer_name: 'عميل',
            rating: 5,
            review_text: 'هذه مراجعة صالحة للاختبار فقط.'
        });
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('Vercel configuration enforces the planned browser hardening headers', () => {
    const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
    const headerMap = Object.fromEntries(config.headers[0].headers.map((header) => [header.key, header.value]));
    assert.match(headerMap['Content-Security-Policy'], /default-src 'self'/);
    assert.equal(headerMap['X-Content-Type-Options'], 'nosniff');
    assert.equal(headerMap['X-Frame-Options'], 'DENY');
    assert.match(headerMap['Strict-Transport-Security'], /max-age=63072000/);
});
