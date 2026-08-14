import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import handler from '../api/notion-admin.js';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.NOTION_API_TOKEN = 'notion-token';
process.env.NOTION_ADMIN_DATA_SOURCE_ID = '0bc03f1a-fb3a-4994-8e01-162efb067bc5';
process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN = 'webhook-secret';
process.env.SUPABASE_AUTH_REDIRECT_TO = 'https://amwaj-virid.vercel.app/admin/reset-password/';

const title = (value) => ({ type: 'title', title: [{ plain_text: value }] });
const email = (value) => ({ type: 'email', email: value });
const text = (value) => ({ type: 'rich_text', rich_text: [{ plain_text: value }] });
const select = (value) => ({ type: 'select', select: { name: value } });

const authUserId = 'd06cf275-42b8-4ad4-8a64-260e524569d3';
const page = {
  parent: { data_source_id: process.env.NOTION_ADMIN_DATA_SOURCE_ID },
  properties: {
    'الاسم': title('أحمد محمد'),
    'نوع المحتوى': select('مدير النظام'),
    'إجراء مطلوب': select('إرسال رابط تعيين كلمة المرور'),
    'حالة طلب التنفيذ': select('جاهز للتنفيذ'),
    'البريد الإلكتروني': email('ahmed@example.com'),
    'معرّف مستخدم الدخول': text(authUserId),
  },
};

let finalNotionPatch = null;
let recoveryRequest = null;
global.fetch = async (input, options = {}) => {
  const requestUrl = String(input);
  const method = String(options.method || 'GET').toUpperCase();
  if (requestUrl.endsWith('/v1/pages/notion-admin-1') && method === 'GET') return new Response(JSON.stringify(page), { status: 200 });
  if (requestUrl.endsWith('/v1/pages/notion-admin-1') && method === 'PATCH') {
    finalNotionPatch = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'notion-admin-1' }), { status: 200 });
  }
  if (requestUrl.includes('/rest/v1/notion_admin_operation_logs') && method === 'POST') return new Response(JSON.stringify([{ id: 'operation-1', request_id: 'request-1' }]), { status: 201 });
  if (requestUrl.includes('/rest/v1/notion_admin_operation_logs') && method === 'PATCH') return new Response(JSON.stringify([{ id: 'operation-1' }]), { status: 200 });
  if (requestUrl.endsWith('/auth/v1/recover') && method === 'POST') {
    recoveryRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({}), { status: 200 });
  }
  throw new Error(`Unexpected request: ${method} ${requestUrl}`);
};

const payload = Buffer.from(JSON.stringify({ id: 'event-accounts-1', type: 'page.properties_updated', entity: { id: 'notion-admin-1' } }));
const req = new Readable({ read() { this.push(payload); this.push(null); } });
req.method = 'POST';
req.headers = { 'x-notion-signature': crypto.createHmac('sha256', process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN).update(payload).digest('hex') };
const response = { code: null, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() {} };

await handler(req, response);
assert.equal(response.code, 200);
assert.equal(response.body.ok, true);
assert.deepEqual(recoveryRequest, { email: 'ahmed@example.com', redirect_to: process.env.SUPABASE_AUTH_REDIRECT_TO });
assert.equal(finalNotionPatch.properties['حالة طلب التنفيذ'].select.name, 'اكتمل');
assert.equal(finalNotionPatch.properties['إجراء مطلوب'].select.name, 'بدون إجراء');
assert.equal(finalNotionPatch.properties['معرّف مستخدم الدخول'].rich_text[0].text.content, authUserId);
assert.equal(finalNotionPatch.properties['رسالة النتيجة'].rich_text[0].text.content, 'تم تنفيذ إجراء «إرسال رابط تعيين كلمة المرور» بنجاح.');
console.log('نجح اختبار حسابات المديرين ورابط تعيين كلمة المرور.');
