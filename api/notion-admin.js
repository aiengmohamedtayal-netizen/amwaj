import crypto from 'node:crypto';

/**
 * Amwaj Notion Admin Center
 *
 * Receives signed Notion webhook events, retrieves the matching Notion page,
 * validates an allowlisted action, performs the server-side Supabase mutation,
 * and writes a safe result back to Notion. No client receives the service-role
 * key or the Notion connection token.
 */
export const config = { api: { bodyParser: false } };

const DEFAULT_SUPABASE_URL = 'https://wufguxedvhqechlqwoye.supabase.co';
const NOTION_BASE_URL = 'https://api.notion.com/v1';
const DEFAULT_NOTION_VERSION = '2025-09-03';
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_NOTION_BLOCKS = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROCESSABLE_EVENT_TYPES = new Set(['page.created', 'page.properties_updated', 'page.content_updated']);
const ACTIONS = new Set(['Create', 'Update', 'Publish', 'Archive', 'Delete', 'Invite Admin', 'Disable Admin', 'Reactivate Admin', 'Sync']);
const ENTITY_NAMES = new Set(['Package', 'Destination', 'Service', 'Pricing Offer', 'Blog Category', 'Blog Post', 'Review', 'Setting', 'Admin User']);

function env(name, fallback = '') {
  return String(process.env[name] || fallback).trim();
}

function configuration() {
  return {
    supabaseUrl: env('SUPABASE_URL', DEFAULT_SUPABASE_URL).replace(/\/$/, ''),
    serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
    notionToken: env('NOTION_API_TOKEN'),
    notionDataSourceId: env('NOTION_ADMIN_DATA_SOURCE_ID'),
    webhookToken: env('NOTION_WEBHOOK_VERIFICATION_TOKEN'),
    notionVersion: env('NOTION_API_VERSION', DEFAULT_NOTION_VERSION),
    authRedirectTo: env('SUPABASE_AUTH_REDIRECT_TO', 'https://amwaj-virid.vercel.app/admin/'),
  };
}

function missingConfiguration(config) {
  return ['serviceRoleKey', 'notionToken', 'notionDataSourceId', 'webhookToken']
    .filter((name) => !config[name]);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimText(value, max = 12000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function nullableText(value, max = 12000) {
  const text = trimText(value, max);
  return text || null;
}

function error(message, status = 400) {
  const output = new Error(message);
  output.status = status;
  return output;
}

function safeJsonParse(value, fallback = null) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(error('Webhook payload is too large.', 413));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function signatureMatches(rawBody, token, suppliedSignature) {
  if (!rawBody || !token || !suppliedSignature) return false;
  const expected = crypto.createHmac('sha256', token).update(rawBody).digest('hex');
  const supplied = String(suppliedSignature).trim();
  if (expected.length !== supplied.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

function notionHeaders(config, extra = {}) {
  return {
    Authorization: `Bearer ${config.notionToken}`,
    'Notion-Version': config.notionVersion,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function notionRequest(config, path, options = {}) {
  const response = await fetch(`${NOTION_BASE_URL}${path}`, {
    ...options,
    headers: notionHeaders(config, options.headers || {}),
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = payload?.message || `Notion API request failed (${response.status})`;
    throw error(message, response.status >= 500 ? 502 : 400);
  }
  return payload;
}

function supabaseHeaders(config, extra = {}) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function supabaseRequest(config, path, options = {}) {
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: supabaseHeaders(config, options.headers || {}),
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = payload?.message || payload?.msg || payload?.error_description || `Supabase request failed (${response.status})`;
    throw error(message, response.status >= 500 ? 502 : 400);
  }
  return payload;
}

function property(page, name) {
  return page?.properties?.[name] || null;
}

function richTextValue(item) {
  const values = Array.isArray(item?.rich_text) ? item.rich_text : (Array.isArray(item?.title) ? item.title : []);
  return values.map((part) => part?.plain_text || part?.text?.content || '').join('').trim();
}

function stringProperty(page, name) {
  const item = property(page, name);
  if (!item) return '';
  if (item.type === 'title' || item.type === 'rich_text') return richTextValue(item);
  if (item.type === 'url') return String(item.url || '').trim();
  if (item.type === 'email') return String(item.email || '').trim();
  if (item.type === 'select' || item.type === 'status') return String(item.select?.name || item.status?.name || '').trim();
  if (item.type === 'number') return item.number == null ? '' : String(item.number);
  if (item.type === 'date') return String(item.date?.start || '').trim();
  return '';
}

function numberProperty(page, name) {
  const item = property(page, name);
  return item?.type === 'number' && Number.isFinite(item.number) ? Number(item.number) : null;
}

function checkboxProperty(page, name) {
  const item = property(page, name);
  return item?.type === 'checkbox' ? item.checkbox === true : false;
}

function selectProperty(page, name) {
  return stringProperty(page, name);
}

function lowerStatus(value) {
  return trimText(value, 80).toLowerCase().replace(/\s+/g, '_');
}

function statusForNotion(value) {
  const normalized = lowerStatus(value);
  if (normalized === 'published') return 'Published';
  if (normalized === 'archived' || normalized === 'inactive') return 'Archived';
  if (normalized === 'approved') return 'Approved';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'pending') return 'Pending';
  return 'Draft';
}

function numberFromPage(page, name, { integer = false, nullable = true } = {}) {
  const value = numberProperty(page, name);
  if (value === null) return nullable ? null : undefined;
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value))) throw error(`${name} must be ${integer ? 'an integer' : 'a number'}.`);
  return value;
}

function boolFromPage(page, name) {
  return checkboxProperty(page, name);
}

function ensureUuid(value, field) {
  if (!UUID_PATTERN.test(String(value || ''))) throw error(`${field} must be a valid UUID.`);
  return String(value);
}

function ensureHttpsUrl(value, field, required = false) {
  const text = trimText(value, 1800);
  if (!text && !required) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:') throw new Error('invalid protocol');
    return url.toString();
  } catch {
    throw error(`${field} must be a valid HTTPS URL.`);
  }
}

function slugify(value, fallback) {
  const slug = String(value || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function generatedSlug(page, entity) {
  const requested = trimText(stringProperty(page, 'Slug'), 130).toLowerCase();
  if (requested) {
    if (!SAFE_SLUG_PATTERN.test(requested)) throw error('Slug may contain lowercase letters, numbers, and hyphens only.');
    return requested;
  }
  const seed = stringProperty(page, 'Title EN') || stringProperty(page, 'Name') || entity;
  return `${slugify(seed, entity.toLowerCase().replace(/\s+/g, '-'))}-${crypto.randomUUID().slice(0, 8)}`;
}

function jsonArrayProperty(page, name) {
  const raw = stringProperty(page, name);
  if (!raw) return [];
  const parsed = safeJsonParse(raw, null);
  if (!Array.isArray(parsed) || parsed.length > 24 || parsed.some((item) => typeof item !== 'string' || item.length > 220)) {
    throw error(`${name} must be a JSON array of short text values.`);
  }
  return parsed.map((item) => item.trim()).filter(Boolean);
}

function jsonObjectProperty(page, name) {
  const raw = stringProperty(page, name);
  const parsed = safeJsonParse(raw, null);
  if (!isPlainObject(parsed)) throw error(`${name} must be a JSON object.`);
  return parsed;
}

function mapCommonCard(page, entity) {
  const data = {
    slug: generatedSlug(page, entity),
    category: lowerStatus(stringProperty(page, 'Category')),
    title_ar: trimText(stringProperty(page, 'Title AR'), 500),
    title_en: trimText(stringProperty(page, 'Title EN'), 500),
    description_ar: trimText(stringProperty(page, 'Description AR'), 12000),
    description_en: trimText(stringProperty(page, 'Description EN'), 12000),
    image_url: ensureHttpsUrl(stringProperty(page, 'Image URL'), 'Image URL', true),
    image_alt_ar: nullableText(stringProperty(page, 'Image Alt AR'), 500),
    image_alt_en: nullableText(stringProperty(page, 'Image Alt EN'), 500),
    badge_ar: nullableText(stringProperty(page, 'Badge AR'), 220),
    badge_en: nullableText(stringProperty(page, 'Badge EN'), 220),
    rating: numberFromPage(page, 'Rating', { nullable: true }),
    highlights: jsonArrayProperty(page, 'Highlights JSON'),
    price_label_ar: trimText(stringProperty(page, 'Price AR'), 400),
    price_label_en: trimText(stringProperty(page, 'Price EN'), 400),
    status: lowerStatus(selectProperty(page, 'Status')) || 'draft',
    is_active: boolFromPage(page, 'Active'),
    is_featured: boolFromPage(page, 'Featured'),
    sort_order: numberFromPage(page, 'Sort Order', { integer: true, nullable: false }) ?? 0,
  };
  const validCategories = entity === 'Package' ? ['vip', 'family', 'honeymoon'] : ['egypt', 'international', 'umrah'];
  if (!validCategories.includes(data.category)) throw error(`Category is invalid for ${entity}.`);
  if (!data.title_ar || !data.title_en || !data.description_ar || !data.description_en || !data.price_label_ar || !data.price_label_en) {
    throw error(`${entity} requires bilingual title, description, and price labels.`);
  }
  if (!['draft', 'published'].includes(data.status)) data.status = 'draft';
  if (data.rating !== null && (data.rating < 0 || data.rating > 5)) throw error('Rating must be between 0 and 5.');
  if (data.sort_order < 0) throw error('Sort Order cannot be negative.');
  return data;
}

function mapService(page) {
  const data = {
    slug: generatedSlug(page, 'Service'),
    icon_class: trimText(stringProperty(page, 'Icon Class'), 180),
    title_ar: trimText(stringProperty(page, 'Title AR'), 500),
    title_en: trimText(stringProperty(page, 'Title EN'), 500),
    description_ar: trimText(stringProperty(page, 'Description AR'), 12000),
    description_en: trimText(stringProperty(page, 'Description EN'), 12000),
    status: lowerStatus(selectProperty(page, 'Status')) || 'draft',
    is_active: boolFromPage(page, 'Active'),
    sort_order: numberFromPage(page, 'Sort Order', { integer: true, nullable: false }) ?? 0,
  };
  if (!data.icon_class || !data.title_ar || !data.title_en || !data.description_ar || !data.description_en) throw error('Service requires icon class and bilingual title and description.');
  if (!['draft', 'published'].includes(data.status)) data.status = 'draft';
  if (data.sort_order < 0) throw error('Sort Order cannot be negative.');
  return data;
}

function mapPricingOffer(page) {
  const packageId = trimText(stringProperty(page, 'Package ID'), 80);
  const serviceId = trimText(stringProperty(page, 'Service ID'), 80);
  const destinationId = trimText(stringProperty(page, 'Destination ID'), 80);
  const data = {
    package_id: packageId ? ensureUuid(packageId, 'Package ID') : null,
    service_id: serviceId ? ensureUuid(serviceId, 'Service ID') : null,
    destination_id: ensureUuid(destinationId, 'Destination ID'),
    trip_style: lowerStatus(selectProperty(page, 'Trip Style')) || 'custom',
    departure_month: trimText(stringProperty(page, 'Departure Month'), 20),
    min_travelers: numberFromPage(page, 'Min Travelers', { integer: true, nullable: false }) ?? 1,
    max_travelers: numberFromPage(page, 'Max Travelers', { integer: true, nullable: false }) ?? 50,
    pricing_unit: 'per_traveler',
    price_mode: lowerStatus(selectProperty(page, 'Price Mode')) || 'quote',
    price_amount: numberFromPage(page, 'Price Amount', { nullable: true }),
    discounted_price_amount: numberFromPage(page, 'Discounted Price Amount', { nullable: true }),
    currency: 'EGP',
    availability: lowerStatus(selectProperty(page, 'Availability')) || 'available',
    seats_available: numberFromPage(page, 'Seats Available', { integer: true, nullable: true }),
    notes_ar: nullableText(stringProperty(page, 'Notes AR'), 12000),
    notes_en: nullableText(stringProperty(page, 'Notes EN'), 12000),
    status: lowerStatus(selectProperty(page, 'Status')) || 'draft',
    sort_order: numberFromPage(page, 'Sort Order', { integer: true, nullable: false }) ?? 0,
  };
  if (data.package_id && data.service_id) throw error('A pricing offer can reference either Package ID or Service ID, not both.');
  if (!data.package_id && !data.service_id) throw error('A pricing offer requires Package ID or Service ID.');
  if (!['family', 'honeymoon', 'umrah', 'budget', 'vip', 'custom'].includes(data.trip_style)) throw error('Trip Style is invalid.');
  if (!/^\d{4}-\d{2}-01$/.test(data.departure_month)) throw error('Departure Month must be the first day of a month, e.g. 2026-09-01.');
  if (data.min_travelers < 1 || data.max_travelers < data.min_travelers) throw error('Traveler counts are invalid.');
  if (!['quote', 'fixed', 'starting_from', 'discount'].includes(data.price_mode)) throw error('Price Mode is invalid.');
  if (!['available', 'limited', 'sold_out'].includes(data.availability)) throw error('Availability is invalid.');
  if (!['draft', 'published', 'archived'].includes(data.status)) throw error('Status is invalid for a pricing offer.');
  if (data.price_mode !== 'quote' && (!Number.isFinite(data.price_amount) || data.price_amount < 0)) throw error('Price Amount is required unless Price Mode is quote.');
  if (data.price_mode === 'discount' && (!Number.isFinite(data.discounted_price_amount) || data.discounted_price_amount < 0 || data.discounted_price_amount >= data.price_amount)) throw error('Discounted Price Amount must be lower than Price Amount.');
  if (data.seats_available !== null && data.seats_available < 0) throw error('Seats Available cannot be negative.');
  return data;
}

function mapBlogCategory(page) {
  const data = {
    slug: generatedSlug(page, 'Blog Category'),
    title_ar: trimText(stringProperty(page, 'Title AR'), 500),
    title_en: trimText(stringProperty(page, 'Title EN'), 500),
    description_ar: nullableText(stringProperty(page, 'Description AR'), 12000),
    description_en: nullableText(stringProperty(page, 'Description EN'), 12000),
    status: lowerStatus(selectProperty(page, 'Status')) || 'active',
    sort_order: numberFromPage(page, 'Sort Order', { integer: true, nullable: false }) ?? 0,
  };
  if (!data.title_ar || !data.title_en) throw error('Blog Category requires Title AR and Title EN.');
  if (!['active', 'archived'].includes(data.status)) data.status = 'active';
  if (data.sort_order < 0) throw error('Sort Order cannot be negative.');
  return data;
}

function markdownFromRichText(richText) {
  return (Array.isArray(richText) ? richText : []).map((part) => {
    const text = part?.plain_text || part?.text?.content || '';
    const annotations = part?.annotations || {};
    let output = text;
    if (annotations.code) output = `\`${output}\``;
    if (annotations.bold) output = `**${output}**`;
    if (annotations.italic) output = `*${output}*`;
    if (annotations.strikethrough) output = `~~${output}~~`;
    if (part?.href) output = `[${output}](${part.href})`;
    return output;
  }).join('');
}

function blockToMarkdown(block) {
  const content = block?.[block?.type] || {};
  const richText = markdownFromRichText(content.rich_text || []);
  switch (block?.type) {
    case 'paragraph': return richText;
    case 'heading_1': return `# ${richText}`;
    case 'heading_2': return `## ${richText}`;
    case 'heading_3': return `### ${richText}`;
    case 'bulleted_list_item': return `- ${richText}`;
    case 'numbered_list_item': return `1. ${richText}`;
    case 'to_do': return `- [${content.checked ? 'x' : ' '}] ${richText}`;
    case 'quote': return `> ${richText}`;
    case 'callout': return `> ${richText}`;
    case 'code': return `\`\`\`${content.language || ''}\n${richText}\n\`\`\``;
    case 'divider': return '---';
    default: return richText;
  }
}

async function fetchPageMarkdown(config, pageId) {
  const blocks = [];
  let cursor = '';
  while (blocks.length < MAX_NOTION_BLOCKS) {
    const query = new URLSearchParams({ page_size: '100' });
    if (cursor) query.set('start_cursor', cursor);
    const payload = await notionRequest(config, `/blocks/${encodeURIComponent(pageId)}/children?${query.toString()}`);
    blocks.push(...(Array.isArray(payload?.results) ? payload.results : []));
    if (!payload?.has_more || !payload?.next_cursor) break;
    cursor = payload.next_cursor;
  }
  return blocks.map(blockToMarkdown).filter(Boolean).join('\n\n').trim();
}

function splitBilingualMarkdown(markdown) {
  const marker = /^##\s+(?:English Content|المحتوى الإنجليزي|English)\s*$/im;
  const match = marker.exec(markdown);
  if (!match) return { content_ar: markdown, content_en: '' };
  const before = markdown.slice(0, match.index).replace(/^##\s+(?:المحتوى العربي|Arabic Content|Arabic)\s*$/im, '').trim();
  const after = markdown.slice(match.index + match[0].length).trim();
  return { content_ar: before, content_en: after };
}

async function mapBlogPost(config, page) {
  const categoryId = ensureUuid(trimText(stringProperty(page, 'Category ID'), 80), 'Category ID');
  const markdown = await fetchPageMarkdown(config, page.id);
  const content = splitBilingualMarkdown(markdown);
  const data = {
    slug: generatedSlug(page, 'Blog Post'),
    category_id: categoryId,
    title_ar: trimText(stringProperty(page, 'Title AR'), 500),
    title_en: trimText(stringProperty(page, 'Title EN'), 500),
    excerpt_ar: trimText(stringProperty(page, 'Excerpt AR'), 12000),
    excerpt_en: trimText(stringProperty(page, 'Excerpt EN'), 12000),
    content_ar: trimText(content.content_ar, 48000),
    content_en: trimText(content.content_en, 48000),
    featured_image_url: ensureHttpsUrl(stringProperty(page, 'Image URL'), 'Image URL', false),
    featured_image_alt_ar: nullableText(stringProperty(page, 'Image Alt AR'), 500),
    featured_image_alt_en: nullableText(stringProperty(page, 'Image Alt EN'), 500),
    seo_title_ar: nullableText(stringProperty(page, 'SEO Title AR'), 500),
    seo_title_en: nullableText(stringProperty(page, 'SEO Title EN'), 500),
    seo_description_ar: nullableText(stringProperty(page, 'SEO Description AR'), 12000),
    seo_description_en: nullableText(stringProperty(page, 'SEO Description EN'), 12000),
    og_image_url: ensureHttpsUrl(stringProperty(page, 'OG Image URL'), 'OG Image URL', false),
    status: lowerStatus(selectProperty(page, 'Status')) || 'draft',
    is_featured: boolFromPage(page, 'Featured'),
    sort_order: numberFromPage(page, 'Sort Order', { integer: true, nullable: false }) ?? 0,
    published_at: stringProperty(page, 'Published At') || null,
  };
  if (!data.title_ar || !data.title_en) throw error('Blog Post requires Title AR and Title EN.');
  if (!['draft', 'published', 'archived'].includes(data.status)) data.status = 'draft';
  if (data.sort_order < 0) throw error('Sort Order cannot be negative.');
  return data;
}

function mapReview(page) {
  const status = lowerStatus(selectProperty(page, 'Status')) || 'pending';
  if (!['pending', 'approved', 'rejected'].includes(status)) throw error('Review status is invalid.');
  return {
    status,
    is_featured: boolFromPage(page, 'Featured'),
    reviewed_at: status === 'pending' ? null : new Date().toISOString(),
  };
}

function mapSetting(page) {
  const settingKey = trimText(stringProperty(page, 'Setting Key') || stringProperty(page, 'External ID'), 130);
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(settingKey)) throw error('Setting Key is invalid.');
  return {
    setting_key: settingKey,
    value: jsonObjectProperty(page, 'Setting Value JSON'),
    is_public: boolFromPage(page, 'Active'),
  };
}

async function mapEntity(config, page, entity) {
  if (entity === 'Package' || entity === 'Destination') return mapCommonCard(page, entity);
  if (entity === 'Service') return mapService(page);
  if (entity === 'Pricing Offer') return mapPricingOffer(page);
  if (entity === 'Blog Category') return mapBlogCategory(page);
  if (entity === 'Blog Post') return mapBlogPost(config, page);
  if (entity === 'Review') return mapReview(page);
  if (entity === 'Setting') return mapSetting(page);
  throw error('Unsupported entity.');
}

const TABLE_BY_ENTITY = Object.freeze({
  Package: { table: 'packages', idField: 'id' },
  Destination: { table: 'destinations', idField: 'id' },
  Service: { table: 'services', idField: 'id' },
  'Pricing Offer': { table: 'pricing_offers', idField: 'id' },
  'Blog Category': { table: 'blog_categories', idField: 'id' },
  'Blog Post': { table: 'blog_posts', idField: 'id' },
  Review: { table: 'customer_reviews', idField: 'id' },
  Setting: { table: 'site_settings', idField: 'setting_key' },
});

function externalIdFor(page, entity) {
  const value = trimText(stringProperty(page, entity === 'Admin User' ? 'Auth User ID' : 'External ID'), 130);
  if (!value) return '';
  if (entity !== 'Setting' && !UUID_PATTERN.test(value)) throw error('External ID must be a UUID for this entity.');
  return value;
}

async function fetchExisting(config, entity, externalId) {
  const table = TABLE_BY_ENTITY[entity];
  if (!table) return null;
  const value = encodeURIComponent(externalId);
  const rows = await supabaseRequest(config, `/rest/v1/${table.table}?select=*&${table.idField}=eq.${value}&limit=1`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function createRecord(config, entity, patch) {
  const table = TABLE_BY_ENTITY[entity];
  const rows = await supabaseRequest(config, `/rest/v1/${table.table}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  return Array.isArray(rows) ? rows[0] || null : rows;
}

async function updateRecord(config, entity, externalId, patch) {
  const table = TABLE_BY_ENTITY[entity];
  const rows = await supabaseRequest(config, `/rest/v1/${table.table}?${table.idField}=eq.${encodeURIComponent(externalId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  return Array.isArray(rows) ? rows[0] || null : rows;
}

async function deleteRecord(config, entity, externalId) {
  const table = TABLE_BY_ENTITY[entity];
  await supabaseRequest(config, `/rest/v1/${table.table}?${table.idField}=eq.${encodeURIComponent(externalId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
}

async function authAdminRequest(config, path, options = {}) {
  return supabaseRequest(config, path, options);
}

async function inviteAdmin(config, page) {
  const email = trimText(stringProperty(page, 'Email'), 320).toLowerCase();
  const fullName = trimText(stringProperty(page, 'Name'), 240);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw error('Email is invalid.');
  if (!fullName) throw error('Name is required for an admin invitation.');
  const invitation = await authAdminRequest(config, '/auth/v1/invite', {
    method: 'POST',
    body: JSON.stringify({ email, data: { full_name: fullName }, redirect_to: config.authRedirectTo }),
  });
  const userId = invitation?.user?.id || invitation?.id;
  if (!UUID_PATTERN.test(String(userId || ''))) throw error('Supabase did not return the invited user ID.', 502);
  const profiles = await supabaseRequest(config, '/rest/v1/profiles', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ id: userId, full_name: fullName, is_admin: true }),
  });
  return { id: userId, email, full_name: fullName, profile: Array.isArray(profiles) ? profiles[0] || null : profiles };
}

async function updateAdmin(config, userId, page) {
  ensureUuid(userId, 'Auth User ID');
  const fullName = trimText(stringProperty(page, 'Name'), 240);
  if (!fullName) throw error('Name is required.');
  await authAdminRequest(config, `/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify({ user_metadata: { full_name: fullName } }),
  });
  const profiles = await supabaseRequest(config, `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ full_name: fullName }),
  });
  return { id: userId, full_name: fullName, profile: Array.isArray(profiles) ? profiles[0] || null : profiles };
}

async function setAdminEnabled(config, userId, enabled) {
  ensureUuid(userId, 'Auth User ID');
  await authAdminRequest(config, `/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify({ ban_duration: enabled ? 'none' : '876000h' }),
  });
  const profiles = await supabaseRequest(config, `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ is_admin: enabled }),
  });
  return { id: userId, is_admin: enabled, profile: Array.isArray(profiles) ? profiles[0] || null : profiles };
}

async function deleteAdmin(config, userId) {
  ensureUuid(userId, 'Auth User ID');
  await supabaseRequest(config, `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
  await authAdminRequest(config, `/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

function archivePatch(entity, existing) {
  if (entity === 'Package' || entity === 'Destination' || entity === 'Service') return { is_active: false };
  if (entity === 'Review') return { status: 'rejected', is_featured: false, reviewed_at: new Date().toISOString() };
  if (entity === 'Blog Category') return { status: 'archived' };
  if (entity === 'Setting') return { is_public: false };
  return { status: 'archived', ...(entity === 'Blog Post' && !existing.published_at ? {} : {}) };
}

function publishPatch(entity, existing) {
  if (entity === 'Package' || entity === 'Destination' || entity === 'Service') return { status: 'published', is_active: true };
  if (entity === 'Review') return { status: 'approved', reviewed_at: new Date().toISOString() };
  if (entity === 'Blog Category') return { status: 'active' };
  if (entity === 'Setting') return { is_public: true };
  return { status: 'published', ...(entity === 'Blog Post' && !existing.published_at ? { published_at: new Date().toISOString() } : {}) };
}

async function executeContentAction(config, page, entity, action) {
  const externalId = externalIdFor(page, entity);
  const isCreate = action === 'Create';
  if (isCreate && externalId) throw error('Create requires an empty External ID.');
  if (!isCreate && !externalId) throw error(`${action} requires External ID.`);
  if (action === 'Delete' && !checkboxProperty(page, 'Confirm Delete')) throw error('Delete requires Confirm Delete to be checked.');
  let existing = null;
  if (!isCreate) {
    existing = await fetchExisting(config, entity, externalId);
    if (!existing) throw error('The linked Supabase record was not found.', 404);
  }
  if (action === 'Delete') {
    await deleteRecord(config, entity, externalId);
    return { operation: 'delete', entity, externalId, record: null, archiveNotionPage: true };
  }
  if (action === 'Sync') return { operation: 'sync', entity, externalId, record: existing };
  let patch;
  if (action === 'Publish') patch = publishPatch(entity, existing);
  else if (action === 'Archive') patch = archivePatch(entity, existing);
  else {
    if (entity === 'Review' && isCreate) throw error('Reviews are created through the public review form, not Notion.');
    patch = await mapEntity(config, page, entity);
  }
  const record = isCreate ? await createRecord(config, entity, patch) : await updateRecord(config, entity, externalId, patch);
  if (!record) throw error('Supabase did not return the saved record.', 502);
  return { operation: action.toLowerCase(), entity, externalId: record.id || record.setting_key || externalId, record };
}

async function executeAdminAction(config, page, action) {
  const authUserId = externalIdFor(page, 'Admin User');
  if (action === 'Invite Admin') {
    if (authUserId) throw error('Invite Admin requires an empty Auth User ID.');
    const record = await inviteAdmin(config, page);
    return { operation: 'invite', entity: 'Admin User', externalId: record.id, record };
  }
  if (!authUserId) throw error(`${action} requires Auth User ID.`);
  if (action === 'Update') {
    const record = await updateAdmin(config, authUserId, page);
    return { operation: 'update', entity: 'Admin User', externalId: authUserId, record };
  }
  if (action === 'Disable Admin') {
    const record = await setAdminEnabled(config, authUserId, false);
    return { operation: 'disable', entity: 'Admin User', externalId: authUserId, record };
  }
  if (action === 'Reactivate Admin') {
    const record = await setAdminEnabled(config, authUserId, true);
    return { operation: 'reactivate', entity: 'Admin User', externalId: authUserId, record };
  }
  if (action === 'Delete') {
    if (!checkboxProperty(page, 'Confirm Delete')) throw error('Delete requires Confirm Delete to be checked.');
    await deleteAdmin(config, authUserId);
    return { operation: 'delete', entity: 'Admin User', externalId: authUserId, record: null, archiveNotionPage: true };
  }
  if (action === 'Sync') return { operation: 'sync', entity: 'Admin User', externalId: authUserId, record: { id: authUserId } };
  throw error('Unsupported action for Admin User.');
}

function textProperty(value) {
  const text = trimText(String(value ?? ''), 1800);
  return { rich_text: text ? [{ type: 'text', text: { content: text } }] : [] };
}

function titleProperty(value) {
  const text = trimText(String(value ?? ''), 1800);
  return { title: text ? [{ type: 'text', text: { content: text } }] : [] };
}

function selectUpdate(value) {
  return { select: value ? { name: value } : null };
}

function checkboxUpdate(value) {
  return { checkbox: value === true };
}

function dateUpdate(value) {
  return { date: value ? { start: String(value) } : null };
}

function propertiesFromRecord(entity, record) {
  if (!record) return {};
  const common = {
    'External ID': textProperty(record.id || record.setting_key || ''),
    'Title AR': textProperty(record.title_ar || ''),
    'Title EN': textProperty(record.title_en || ''),
    'Description AR': textProperty(record.description_ar || ''),
    'Description EN': textProperty(record.description_en || ''),
    'Status': selectUpdate(statusForNotion(record.status)),
    'Active': checkboxUpdate(record.is_active ?? record.is_public ?? false),
    'Featured': checkboxUpdate(record.is_featured === true),
    'Sort Order': { number: Number.isFinite(record.sort_order) ? record.sort_order : null },
  };
  if (entity === 'Package' || entity === 'Destination') {
    return {
      ...common,
      Name: titleProperty(record.title_en || record.title_ar || ''),
      Category: textProperty(record.category || ''),
      'Image URL': { url: record.image_url || null },
      'Image Alt AR': textProperty(record.image_alt_ar || ''),
      'Image Alt EN': textProperty(record.image_alt_en || ''),
      'Badge AR': textProperty(record.badge_ar || ''),
      'Badge EN': textProperty(record.badge_en || ''),
      Rating: { number: Number.isFinite(Number(record.rating)) ? Number(record.rating) : null },
      'Highlights JSON': textProperty(JSON.stringify(record.highlights || [])),
      'Price AR': textProperty(record.price_label_ar || ''),
      'Price EN': textProperty(record.price_label_en || ''),
      'Price Mode': selectUpdate(record.price_mode || 'quote'),
      'Price Amount': { number: Number.isFinite(Number(record.price_amount)) ? Number(record.price_amount) : null },
      'Discounted Price Amount': { number: Number.isFinite(Number(record.discounted_price_amount)) ? Number(record.discounted_price_amount) : null },
      Slug: textProperty(record.slug || ''),
    };
  }
  if (entity === 'Service') {
    return { ...common, Name: titleProperty(record.title_en || record.title_ar || ''), 'Icon Class': textProperty(record.icon_class || ''), Slug: textProperty(record.slug || '') };
  }
  if (entity === 'Pricing Offer') {
    return {
      ...common,
      Name: titleProperty(`Pricing offer ${record.id || ''}`),
      'Package ID': textProperty(record.package_id || ''),
      'Service ID': textProperty(record.service_id || ''),
      'Destination ID': textProperty(record.destination_id || ''),
      'Trip Style': selectUpdate(record.trip_style || 'custom'),
      'Departure Month': dateUpdate(record.departure_month),
      'Min Travelers': { number: record.min_travelers ?? null },
      'Max Travelers': { number: record.max_travelers ?? null },
      'Price Mode': selectUpdate(record.price_mode || 'quote'),
      'Price Amount': { number: Number.isFinite(Number(record.price_amount)) ? Number(record.price_amount) : null },
      'Discounted Price Amount': { number: Number.isFinite(Number(record.discounted_price_amount)) ? Number(record.discounted_price_amount) : null },
      Availability: selectUpdate(record.availability || 'available'),
      'Seats Available': { number: record.seats_available ?? null },
      'Notes AR': textProperty(record.notes_ar || ''),
      'Notes EN': textProperty(record.notes_en || ''),
    };
  }
  if (entity === 'Blog Category') return { ...common, Name: titleProperty(record.title_en || record.title_ar || ''), Slug: textProperty(record.slug || '') };
  if (entity === 'Blog Post') {
    return {
      ...common,
      Name: titleProperty(record.title_en || record.title_ar || ''),
      Slug: textProperty(record.slug || ''),
      'Category ID': textProperty(record.category_id || ''),
      'Excerpt AR': textProperty(record.excerpt_ar || ''),
      'Excerpt EN': textProperty(record.excerpt_en || ''),
      'Image URL': { url: record.featured_image_url || null },
      'Image Alt AR': textProperty(record.featured_image_alt_ar || ''),
      'Image Alt EN': textProperty(record.featured_image_alt_en || ''),
      'SEO Title AR': textProperty(record.seo_title_ar || ''),
      'SEO Title EN': textProperty(record.seo_title_en || ''),
      'SEO Description AR': textProperty(record.seo_description_ar || ''),
      'SEO Description EN': textProperty(record.seo_description_en || ''),
      'OG Image URL': { url: record.og_image_url || null },
      'Published At': dateUpdate(record.published_at),
    };
  }
  if (entity === 'Review') {
    return {
      ...common,
      Name: titleProperty(record.customer_name || ''),
      'Customer Name': textProperty(record.customer_name || ''),
      Rating: { number: record.rating ?? null },
      'Review Text': textProperty(record.review_text || ''),
      'Published At': dateUpdate(record.submitted_at),
    };
  }
  if (entity === 'Setting') {
    return {
      ...common,
      Name: titleProperty(record.setting_key || ''),
      'External ID': textProperty(record.setting_key || ''),
      'Setting Key': textProperty(record.setting_key || ''),
      'Setting Value JSON': textProperty(JSON.stringify(record.value || {})),
    };
  }
  return common;
}

function operationProperties({ processStatus, action = undefined, requestId = undefined, resultMessage = undefined, externalId = undefined, authUserId = undefined, status = undefined }) {
  const properties = {
    'Process Status': selectUpdate(processStatus),
    'Processed At': dateUpdate(new Date().toISOString()),
  };
  if (action !== undefined) properties.Action = selectUpdate(action);
  if (requestId !== undefined) properties['Action Request ID'] = textProperty(requestId);
  if (resultMessage !== undefined) properties['Result Message'] = textProperty(resultMessage);
  if (externalId !== undefined) properties['External ID'] = textProperty(externalId);
  if (authUserId !== undefined) properties['Auth User ID'] = textProperty(authUserId);
  if (status !== undefined) properties.Status = selectUpdate(status);
  return properties;
}

async function updateNotionPage(config, pageId, properties) {
  return notionRequest(config, `/pages/${encodeURIComponent(pageId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
}

async function archiveNotionPage(config, pageId) {
  return notionRequest(config, `/pages/${encodeURIComponent(pageId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ in_trash: true }),
  });
}

async function claimOperation(config, { notionEventId, notionPageId, entity, action }) {
  const rows = await supabaseRequest(config, '/rest/v1/notion_admin_operation_logs', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({
      notion_event_id: notionEventId,
      notion_page_id: notionPageId,
      data_source_id: config.notionDataSourceId,
      entity_type: entity,
      action_type: action,
      status: 'processing',
      metadata: { source: 'notion_webhook' },
    }),
  });
  if (Array.isArray(rows) && rows[0]) return { claimed: true, operation: rows[0] };
  const existing = await supabaseRequest(config, `/rest/v1/notion_admin_operation_logs?select=id,request_id,status,external_id,created_at&notion_event_id=eq.${encodeURIComponent(notionEventId)}&limit=1`);
  return { claimed: false, operation: Array.isArray(existing) ? existing[0] || null : null };
}

async function updateOperation(config, operationId, patch) {
  if (!operationId) return null;
  const rows = await supabaseRequest(config, `/rest/v1/notion_admin_operation_logs?id=eq.${encodeURIComponent(operationId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
  return Array.isArray(rows) ? rows[0] || null : rows;
}

function eventPageId(event) {
  return String(event?.entity?.id || event?.data?.page_id || event?.page_id || '').trim();
}

function safeResultMessage(message) {
  return trimText(message, 850).replace(/[\r\n]+/g, ' ');
}

async function processPageEvent(config, event, webhookEventId) {
  const pageId = eventPageId(event);
  if (!pageId) return { ignored: true, reason: 'No page ID in event.' };
  const page = await notionRequest(config, `/pages/${encodeURIComponent(pageId)}`);
  if (String(page?.parent?.data_source_id || '') !== config.notionDataSourceId) return { ignored: true, reason: 'Page is outside the Amwaj data source.' };
  const entity = selectProperty(page, 'Entity');
  const action = selectProperty(page, 'Action');
  const processStatus = selectProperty(page, 'Process Status');
  if (!ENTITY_NAMES.has(entity)) return { ignored: true, reason: 'Unknown entity.' };
  if (!ACTIONS.has(action)) return { ignored: true, reason: 'No actionable request.' };
  if (processStatus !== 'Ready' && processStatus !== 'Failed') return { ignored: true, reason: 'Page is not ready for execution.' };

  const claim = await claimOperation(config, { notionEventId: webhookEventId, notionPageId: pageId, entity, action });
  if (!claim.claimed) {
    return { ignored: true, reason: `Webhook event was already processed (${claim.operation?.status || 'unknown'}).` };
  }
  const requestId = claim.operation?.request_id || crypto.randomUUID();
  await updateNotionPage(config, pageId, operationProperties({ processStatus: 'Processing', requestId, resultMessage: '' }));
  try {
    const result = entity === 'Admin User'
      ? await executeAdminAction(config, page, action)
      : await executeContentAction(config, page, entity, action);
    const resultProperties = {
      ...propertiesFromRecord(entity, result.record),
      ...operationProperties({
        processStatus: 'Completed',
        action: 'No Action',
        requestId,
        resultMessage: `${action} completed successfully.`,
        externalId: entity === 'Admin User' ? undefined : result.externalId,
        authUserId: entity === 'Admin User' ? result.externalId : undefined,
        status: result.record?.status ? statusForNotion(result.record.status) : (action === 'Archive' ? 'Archived' : undefined),
      }),
    };
    await updateNotionPage(config, pageId, resultProperties);
    if (result.archiveNotionPage) await archiveNotionPage(config, pageId);
    await updateOperation(config, claim.operation?.id, {
      status: 'completed',
      external_id: result.externalId || null,
      result_message: `${action} completed successfully.`,
      completed_at: new Date().toISOString(),
      metadata: { source: 'notion_webhook', request_id: requestId, entity, action },
    });
    console.log(JSON.stringify({ event: 'notion_admin_completed', requestId, pageId, entity, action, externalId: result.externalId || null }));
    return { ok: true, requestId, entity, action, externalId: result.externalId || null };
  } catch (caught) {
    const message = safeResultMessage(caught?.message || 'Unexpected action failure.');
    await updateOperation(config, claim.operation?.id, { status: 'failed', result_message: message, metadata: { source: 'notion_webhook', request_id: requestId, entity, action } });
    await updateNotionPage(config, pageId, operationProperties({ processStatus: 'Failed', requestId, resultMessage: message }));
    console.error(JSON.stringify({ event: 'notion_admin_failed', requestId, pageId, entity, action, message }));
    throw caught;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const rawBody = await readRawBody(req);
    const event = safeJsonParse(rawBody.toString('utf8'), null);
    if (!isPlainObject(event)) return res.status(400).json({ error: 'Invalid JSON payload' });
    if (event.verification_token) {
      console.log(JSON.stringify({ event: 'notion_webhook_verification', verificationToken: String(event.verification_token) }));
      return res.status(200).json({ ok: true, verification_received: true });
    }

    const config = configuration();
    const missing = missingConfiguration(config);
    if (missing.length) return res.status(503).json({ error: 'Notion admin is not configured', missing });
    if (!signatureMatches(rawBody, config.webhookToken, req.headers['x-notion-signature'])) return res.status(401).json({ error: 'Invalid Notion webhook signature' });
    if (!PROCESSABLE_EVENT_TYPES.has(String(event.type || ''))) return res.status(202).json({ ok: true, ignored: true, reason: 'Event type is not processed.' });

    const webhookEventId = trimText(event.id, 240) || crypto.createHash('sha256').update(rawBody).digest('hex');
    const result = await processPageEvent(config, event, webhookEventId);
    return res.status(200).json(result);
  } catch (caught) {
    const status = Number.isInteger(caught?.status) ? caught.status : 500;
    const message = safeResultMessage(caught?.message || 'Internal Server Error');
    return res.status(status).json({ error: status >= 500 ? 'Notion admin processing failed' : message, message });
  }
}
