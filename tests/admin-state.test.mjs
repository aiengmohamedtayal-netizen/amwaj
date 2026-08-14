import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'admin/js/admin-state.js'), 'utf8');
const events = [];
const context = {
  console,
  window: {
    dispatchEvent(event) { events.push(event); }
  }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'admin-state.js' });

const store = context.window.AmwajAdminState.create({ page: 'dashboard' });
const changes = [];
const unsubscribe = store.subscribe((change) => changes.push(change));

assert.equal(store.state.page, 'dashboard');
store.state.page = 'pricing';
assert.equal(changes.at(-1).type, 'set');
assert.equal(changes.at(-1).key, 'page');
assert.equal(changes.at(-1).previous, 'dashboard');
assert.equal(changes.at(-1).value, 'pricing');

const firstPricing = { offers: [{ id: 'offer-1' }] };
store.state.pricing = firstPricing;
assert.equal(store.getServerCache('pricing').value, firstPricing);
assert.ok(store.getServerCache('pricing').updatedAt > 0);

store.invalidate('pricing');
assert.equal(store.getServerCache('pricing'), null);
assert.equal(changes.at(-1).type, 'invalidate');
assert.equal(changes.at(-1).key, 'pricing');

store.state.editorDraft = { title: 'يجب أن يبقى محليًا' };
assert.equal(store.getServerCache('editorDraft'), null);
assert.ok(events.length === 0, 'The lightweight store must not require global DOM events to function.');
unsubscribe();
console.log('نجح اختبار السلوك الفعلي لمخزن حالة الإدارة.');
