import fs from 'node:fs';
import assert from 'node:assert/strict';

const admin = fs.readFileSync(new URL('./admin/js/admin-app.js', import.meta.url), 'utf8');
const copilot = fs.readFileSync(new URL('./api/admin-copilot.js', import.meta.url), 'utf8');

assert.match(admin, /packages:\s*Object\.freeze\(\{ category: Object\.freeze\(\{ allowCustom: false/);
assert.match(admin, /destinations:\s*Object\.freeze\(\{ category: Object\.freeze\(\{ allowCustom: false/);
assert.match(admin, /services:\s*Object\.freeze\(\{ icon_class: Object\.freeze\(\{ allowCustom: true/);
assert.match(admin, /pricing_offers:\s*Object\.freeze\(\{ trip_style: Object\.freeze\(\{ allowCustom: false/);
assert.match(admin, /customOptionList\(items, current, allowCustom\)/);
assert.match(admin, /القيمة الحالية المحفوظة/);
assert.match(admin, /validateFixedBusinessValues\(kind, form\)/);
assert.match(admin, /validateFixedBusinessValues\('pricing_offers', container\)/);
assert.match(copilot, /CUSTOM_LABEL_FIELDS/);
assert.match(copilot, /CUSTOM_SENTINELS/);
assert.match(copilot, /sanitizeCustomLabels/);
assert.match(copilot, /customLabels/);
console.log('custom-values-policy: PASS');
