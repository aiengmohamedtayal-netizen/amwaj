const MAX_LOOKUP_LIMIT = 12;

export const ADMIN_READ_TOOL_DEFINITIONS = Object.freeze([
  {
    type: 'function',
    function: {
      name: 'get_entity_summary',
      description: 'Return a verified count and a compact status summary for one Amwaj admin entity. Use this before making a factual claim about that entity.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          entity: { type: 'string', enum: ['destinations', 'packages', 'services', 'pricing_offers', 'blog_categories', 'blog_posts', 'customer_reviews', 'site_settings'] }
        },
        required: ['entity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_entity_records',
      description: 'Return a small verified list of current records for one entity. Use a search phrase only when it narrows the request; do not use this for bulk export.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          entity: { type: 'string', enum: ['destinations', 'packages', 'services', 'pricing_offers', 'blog_categories', 'blog_posts', 'customer_reviews', 'site_settings'] },
          search: { type: 'string', maxLength: 100 },
          limit: { type: 'integer', minimum: 1, maximum: 12 }
        },
        required: ['entity']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_entity_record',
      description: 'Return one verified record by its known id or setting key. Use only after an id or key was supplied by a verified tool result, the current editor context, or the administrator.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          entity: { type: 'string', enum: ['destinations', 'packages', 'services', 'pricing_offers', 'blog_categories', 'blog_posts', 'customer_reviews', 'site_settings'] },
          recordId: { type: 'string', maxLength: 120 }
        },
        required: ['entity', 'recordId']
      }
    }
  }
]);

export function parseToolArguments(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function sanitizeReadToolCall(call, entityConfig) {
  const name = String(call?.function?.name || '');
  if (!['get_entity_summary', 'list_entity_records', 'get_entity_record'].includes(name)) return null;
  const args = parseToolArguments(call?.function?.arguments);
  const entity = typeof args.entity === 'string' ? args.entity.trim() : '';
  if (!entityConfig?.[entity]) return null;
  const config = entityConfig[entity];
  const recordId = typeof args.recordId === 'string' ? args.recordId.trim().slice(0, 120) : '';
  const search = typeof args.search === 'string' ? args.search.trim().slice(0, 100) : '';
  const limitValue = Number(args.limit);
  const limit = Number.isInteger(limitValue) ? Math.max(1, Math.min(MAX_LOOKUP_LIMIT, limitValue)) : 6;
  if (name === 'get_entity_record' && !recordId) return null;
  return { callId: String(call?.id || '').slice(0, 120), name, entity, recordId, search, limit, config };
}

export function summaryForRows(entity, rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const byStatus = {};
  for (const row of safeRows) {
    const key = String(row?.status || (row?.is_active === false ? 'inactive' : 'unspecified'));
    byStatus[key] = (byStatus[key] || 0) + 1;
  }
  return { entity, count: safeRows.length, statusCounts: byStatus };
}

export function compactRecord(entity, config, record) {
  if (!record || !config) return null;
  const id = String(record[config.idField] || '');
  const title = record.title_ar || record.title_en || record.customer_name || record.setting_key || id;
  return {
    id,
    title: String(title || '').slice(0, 180),
    status: record.status || null,
    isActive: typeof record.is_active === 'boolean' ? record.is_active : null,
    updatedAt: record.updated_at || record.reviewed_at || record.submitted_at || null
  };
}

export function sourceForRecord(entity, config, record) {
  const compact = compactRecord(entity, config, record);
  return compact ? { table: entity, id: compact.id, label: compact.title } : null;
}

export function normalizeToolResult(value) {
  const sources = Array.isArray(value?.sources) ? value.sources.filter(Boolean).slice(0, 12) : [];
  const data = value?.data && typeof value.data === 'object' ? value.data : {};
  return { verified: true, source: 'supabase', sources, data };
}
