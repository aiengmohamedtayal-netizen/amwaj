import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import handler from '../api/notion-admin.js';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
process.env.NOTION_API_TOKEN = 'notion-token';
process.env.NOTION_ADMIN_DATA_SOURCE_ID = '0bc03f1a-fb3a-4994-8e01-162efb067bc5';
process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN = 'webhook-secret';

const title = (value) => ({ type: 'title', title: [{ plain_text: value }] });
const text = (value) => ({ type: 'rich_text', rich_text: [{ plain_text: value }] });
const select = (value) => ({ type: 'select', select: { name: value } });
const number = (value) => ({ type: 'number', number: value });
const checkbox = (value) => ({ type: 'checkbox', checkbox: value });
const url = (value) => ({ type: 'url', url: value });

const page = {
  parent: { data_source_id: process.env.NOTION_ADMIN_DATA_SOURCE_ID },
  properties: {
    'الاسم': title('برنامج القاهرة العائلي'),
    'نوع المحتوى': select('برنامج'),
    'إجراء مطلوب': select('إنشاء'),
    'حالة طلب التنفيذ': select('جاهز للتنفيذ'),
    'التصنيف': text('family'),
    'العنوان العربي': text('القاهرة للعائلات'),
    'العنوان الإنجليزي': text('Cairo for Families'),
    'الوصف العربي': text('برنامج عائلي شامل في القاهرة.'),
    'الوصف الإنجليزي': text('A complete family programme in Cairo.'),
    'رابط الصورة': url('https://images.example.com/cairo.jpg'),
    'مزايا العرض JSON': text('[]'),
    'السعر بالعربية': text('يبدأ من 10,000 جنيه'),
    'السعر بالإنجليزية': text('From EGP 10,000'),
    'حالة ظهور المحتوى': select('مسودة'),
    'نشط': checkbox(true),
    'مميز': checkbox(false),
    'ترتيب العرض': number(1),
  },
};

let finalNotionPatch = null;
const createdRecord = {
  id: 'd06cf275-42b8-4ad4-8a64-260e524569d3',
  title_ar: 'القاهرة للعائلات', title_en: 'Cairo for Families',
  description_ar: 'برنامج عائلي شامل في القاهرة.', description_en: 'A complete family programme in Cairo.',
  status: 'draft', is_active: true, is_featured: false, sort_order: 1,
  category: 'family', image_url: 'https://images.example.com/cairo.jpg', highlights: [],
  price_label_ar: 'يبدأ من 10,000 جنيه', price_label_en: 'From EGP 10,000', slug: 'cairo-for-families',
};

global.fetch = async (input, options = {}) => {
  const requestUrl = String(input);
  const method = String(options.method || 'GET').toUpperCase();
  if (requestUrl.endsWith('/v1/pages/notion-page-1') && method === 'GET') return new Response(JSON.stringify(page), { status: 200 });
  if (requestUrl.endsWith('/v1/pages/notion-page-1') && method === 'PATCH') {
    finalNotionPatch = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'notion-page-1' }), { status: 200 });
  }
  if (requestUrl.includes('/rest/v1/notion_admin_operation_logs') && method === 'POST') {
    return new Response(JSON.stringify([{ id: 'operation-1', request_id: 'request-1' }]), { status: 201 });
  }
  if (requestUrl.includes('/rest/v1/notion_admin_operation_logs') && method === 'PATCH') return new Response(JSON.stringify([{ id: 'operation-1' }]), { status: 200 });
  if (requestUrl.endsWith('/rest/v1/packages') && method === 'POST') return new Response(JSON.stringify([createdRecord]), { status: 201 });
  throw new Error(`Unexpected request: ${method} ${requestUrl}`);
};

const payload = Buffer.from(JSON.stringify({ id: 'event-1', type: 'page.created', entity: { id: 'notion-page-1' } }));
const req = new Readable({ read() { this.push(payload); this.push(null); } });
req.method = 'POST';
req.headers = { 'x-notion-signature': crypto.createHmac('sha256', process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN).update(payload).digest('hex') };
const response = { code: null, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() {} };

await handler(req, response);
assert.equal(response.code, 200);
assert.equal(response.body.ok, true);
assert.equal(finalNotionPatch.properties['حالة طلب التنفيذ'].select.name, 'اكتمل');
assert.equal(finalNotionPatch.properties['إجراء مطلوب'].select.name, 'بدون إجراء');
assert.equal(finalNotionPatch.properties['رسالة النتيجة'].rich_text[0].text.content, 'تم تنفيذ إجراء «إنشاء» بنجاح.');
assert.equal(finalNotionPatch.properties['المعرّف الخارجي'].rich_text[0].text.content, createdRecord.id);
console.log('نجح اختبار مسار Notion العربي.');
