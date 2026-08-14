import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const position = (source, needle) => source.indexOf(needle);

const publicIndex = read('index.html');
const adminIndex = read('admin/index.html');
const preferences = read('js/app-preferences.js');
const i18n = read('js/i18n.js');
const blog = read('js/blog.js');
const publicAi = read('js/ai-agent.js');
const adminState = read('admin/js/admin-state.js');
const adminApp = read('admin/js/admin-app.js');
const adminCopilot = read('admin/js/admin-copilot.js');
const sourceFiles = [preferences, i18n, blog, publicAi, adminState, adminApp, adminCopilot].join('\n').toLowerCase();

assert.ok(position(publicIndex, 'js/app-preferences.js') >= 0, 'Public preferences module must be loaded.');
assert.ok(position(publicIndex, 'js/app-preferences.js') < position(publicIndex, 'js/i18n.js'), 'Preferences must load before i18n.');
assert.ok(position(adminIndex, 'js/admin-state.js') >= 0, 'Admin state module must be loaded.');
assert.ok(position(adminIndex, 'js/admin-state.js') < position(adminIndex, 'js/admin-app.js'), 'Admin state must load before admin app.');
assert.ok(!adminIndex.includes('xlsx.full.min.js'), 'Excel parser must not be loaded with every admin page view.');
assert.ok(!adminIndex.includes('mammoth.browser.min.js'), 'Word parser must not be loaded with every admin page view.');

assert.match(preferences, /window\.AmwajPreferences/);
assert.match(i18n, /AmwajPreferences/);
assert.match(blog, /AmwajPreferences/);
assert.match(adminState, /dependency-free boundary/);
assert.match(adminState, /Editors, dialogs, Copilot conversations, and unsaved form fields must remain local/);
assert.match(adminApp, /invalidateServerState\('pricing'\)/);
assert.match(adminApp, /invalidateServerState\('blog'\)/);
assert.match(adminApp, /invalidateServerState\('reviews'\)/);
assert.match(adminApp, /invalidateServerState\('settings'\)/);

assert.match(publicAi, /const aiState = \{ chat: 'idle', planner: 'idle' \}/);
assert.match(publicAi, /setAiStatus\('chat', 'loading'\)/);
assert.match(publicAi, /setAiStatus\('chat', 'streaming'\)/);
assert.match(publicAi, /completeAiWorkflow\('chat', 'success'\)/);
assert.match(publicAi, /completeAiWorkflow\('chat', 'error'\)/);
assert.match(publicAi, /aiState\.chat !== 'idle'/);
assert.match(publicAi, /aiState\.planner !== 'idle'/);
assert.match(adminCopilot, /lifecycle: 'idle'/);
assert.match(adminCopilot, /setLifecycle\('draft-ready'\)/);
assert.match(adminCopilot, /setLifecycle\('editor-review'\)/);
assert.match(adminCopilot, /setLifecycle\('executing'\)/);
assert.match(adminCopilot, /setLifecycle\('verified'\)/);
assert.match(adminCopilot, /openEditorPrefill/);
assert.match(adminCopilot, /executePendingMutation/);
assert.match(adminCopilot, /function loadDocumentParser\(kind\)/);
assert.match(adminCopilot, /parserLoads\.has\(kind\)/);
assert.match(adminCopilot, /await loadDocumentParser\('excel'\)/);
assert.match(adminCopilot, /await loadDocumentParser\('word'\)/);

assert.ok(!sourceFiles.includes('zustand'), 'No Zustand dependency may be introduced.');
assert.ok(!sourceFiles.includes('redux'), 'No Redux dependency may be introduced.');
console.log('نجح اختبار عقد معمارية الحالة والتحميل ودورة AI.');
