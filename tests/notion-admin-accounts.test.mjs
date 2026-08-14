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

const title = (value) => ({ type: 'title', title: value ? [{ plain_text: value }] : [] });
const email = (value) => ({ type: 'email', email: value || null });
const text = (value) => ({ type: 'rich_text', rich_text: value ? [{ plain_text: value }] : [] });
const select = (value) => ({ type: 'select', select: { name: value } });

const authUserId = 'd06cf275-42b8-4ad4-8a64-260e524569d3';
const directAuthUserId = 'e85fba58-d8a2-429b-ae53-4ba8c937d273';
const directPassword = 'DirectLogin!2026';

const resetPage = {
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

const directAccountTemplatePage = {
  parent: { data_source_id: process.env.NOTION_ADMIN_DATA_SOURCE_ID },
  properties: {
    'الاسم': title('قالب — حساب مدير جديد'),
    'نوع المحتوى': select('مدير النظام'),
    'إجراء مطلوب': select('إنشاء حساب مباشر'),
    'حالة طلب التنفيذ': select('جاهز للتنفيذ'),
    'البريد الإلكتروني': email(''),
    'كلمة المرور': text(''),
    'معرّف مستخدم الدخول': text(''),
  },
};

const directAccountPage = {
  parent: { data_source_id: process.env.NOTION_ADMIN_DATA_SOURCE_ID },
  properties: {
    'الاسم': title('سارة علي'),
    'نوع المحتوى': select('مدير النظام'),
    'إجراء مطلوب': select('إنشاء حساب مباشر'),
    'حالة طلب التنفيذ': select('جاهز للتنفيذ'),
    'البريد الإلكتروني': email('sara@example.com'),
    'كلمة المرور': text(directPassword),
    'معرّف مستخدم الدخول': text(''),
  },
};

let currentPage = resetPage;
let notionPatches = [];
let recoveryRequest = null;
let directAccountRequest = null;
let profileInsert = null;

global.fetch = async (input, options = {}) => {
  const requestUrl = String(input);
  const method = String(options.method || 'GET').toUpperCase();
  if (requestUrl.endsWith('/v1/pages/notion-admin-1') && method === 'GET') return new Response(JSON.stringify(currentPage), { status: 200 });
  if (requestUrl.endsWith('/v1/pages/notion-admin-1') && method === 'PATCH') {
    notionPatches.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ id: 'notion-admin-1' }), { status: 200 });
  }
  if (requestUrl.includes('/rest/v1/notion_admin_operation_logs') && method === 'POST') return new Response(JSON.stringify([{ id: 'operation-1', request_id: 'request-1' }]), { status: 201 });
  if (requestUrl.includes('/rest/v1/notion_admin_operation_logs') && method === 'PATCH') return new Response(JSON.stringify([{ id: 'operation-1' }]), { status: 200 });
  if (requestUrl.endsWith('/auth/v1/recover') && method === 'POST') {
    recoveryRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({}), { status: 200 });
  }
  if (requestUrl.endsWith('/auth/v1/admin/users') && method === 'POST') {
    directAccountRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: directAuthUserId }), { status: 200 });
  }
  if (requestUrl.endsWith('/rest/v1/profiles') && method === 'POST') {
    profileInsert = JSON.parse(options.body);
    return new Response(JSON.stringify([profileInsert]), { status: 201 });
  }
  throw new Error(`Unexpected request: ${method} ${requestUrl}`);
};

async function invokeWebhook(payloadObject) {
  const payload = Buffer.from(JSON.stringify(payloadObject));
  const req = new Readable({ read() { this.push(payload); this.push(null); } });
  req.method = 'POST';
  req.headers = { 'x-notion-signature': crypto.createHmac('sha256', process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN).update(payload).digest('hex') };
  const response = { code: null, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() {} };
  await handler(req, response);
  return response;
}

const resetResponse = await invokeWebhook({ id: 'event-accounts-1', type: 'page.properties_updated', entity: { id: 'notion-admin-1' } });
const resetFinalPatch = notionPatches.at(-1);
assert.equal(resetResponse.code, 200);
assert.equal(resetResponse.body.ok, true);
assert.deepEqual(recoveryRequest, { email: 'ahmed@example.com', redirect_to: process.env.SUPABASE_AUTH_REDIRECT_TO });
assert.equal(resetFinalPatch.properties['حالة طلب التنفيذ'].select.name, 'اكتمل');
assert.equal(resetFinalPatch.properties['إجراء مطلوب'].select.name, 'بدون إجراء');
assert.equal(resetFinalPatch.properties['معرّف مستخدم الدخول'].rich_text[0].text.content, authUserId);
assert.equal(resetFinalPatch.properties['رسالة النتيجة'].rich_text[0].text.content, 'تم تنفيذ إجراء «إرسال رابط تعيين كلمة المرور» بنجاح.');

currentPage = directAccountTemplatePage;
notionPatches = [];
directAccountRequest = null;
profileInsert = null;
const templateResponse = await invokeWebhook({ id: 'event-accounts-template-1', type: 'page.properties_updated', entity: { id: 'notion-admin-1' } });
assert.equal(templateResponse.code, 200);
assert.equal(templateResponse.body.ignored, true);
assert.equal(templateResponse.body.reason, 'Direct account template is waiting for name, email, and password.');
assert.equal(notionPatches.length, 0);
assert.equal(directAccountRequest, null);
assert.equal(profileInsert, null);

currentPage = directAccountPage;
notionPatches = [];
const directResponse = await invokeWebhook({ id: 'event-accounts-direct-1', type: 'page.properties_updated', entity: { id: 'notion-admin-1' } });
const directFinalPatch = notionPatches.at(-1);
assert.equal(directResponse.code, 200);
assert.equal(directResponse.body.ok, true);
assert.deepEqual(directAccountRequest, {
  email: 'sara@example.com',
  password: directPassword,
  email_confirm: true,
  user_metadata: { full_name: 'سارة علي' },
});
assert.deepEqual(profileInsert, { id: directAuthUserId, full_name: 'سارة علي', is_admin: true });
assert.equal(directFinalPatch.properties['حالة طلب التنفيذ'].select.name, 'اكتمل');
assert.equal(directFinalPatch.properties['إجراء مطلوب'].select.name, 'بدون إجراء');
assert.equal(directFinalPatch.properties['معرّف مستخدم الدخول'].rich_text[0].text.content, directAuthUserId);
assert.deepEqual(directFinalPatch.properties['كلمة المرور'].rich_text, []);
assert.equal(directFinalPatch.properties['رسالة النتيجة'].rich_text[0].text.content, 'تم تنفيذ إجراء «إنشاء حساب مباشر» بنجاح.');
console.log('نجح اختبار حسابات المديرين، بما في ذلك إنشاء حساب مباشر ومسح كلمة المرور من Notion.');
