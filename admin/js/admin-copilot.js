(() => {
  'use strict';

  const API_PATH = '/api/admin-copilot';
  const storageKey = 'amwaj_admin_copilot_open';
  const editorPrefillStorageKey = 'amwaj_admin_copilot_editor_prefill';
  const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
  const MAX_DOCUMENT_TEXT = 24000;
  const state = { open: false, busy: false, language: 'ar', history: [], pendingMutation: null, attachments: [], documentAttachment: null, editorPrefills: new Map(), prefillSequence: 0 };

  const routes = Object.freeze({
    '/admin/': 'لوحة التحكم',
    '/admin/packages/': 'البرامج',
    '/admin/destinations/': 'الوجهات',
    '/admin/services/': 'الخدمات',
    '/admin/pricing/': 'التسعير',
    '/admin/blog/': 'المدونة',
    '/admin/reviews/': 'آراء العملاء',
    '/admin/settings/': 'الإعدادات'
  });

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function text(value, fallback = '') {
    const result = String(value ?? '').trim();
    return result || fallback;
  }

  function currentPageContext() {
    const route = `${window.location.pathname.replace(/\/+$/, '') || '/'}${window.location.pathname.endsWith('/') ? '' : '/'}`;
    const entityByRoute = {
      '/admin/destinations/': 'destinations', '/admin/packages/': 'packages', '/admin/services/': 'services',
      '/admin/pricing/': 'pricing_offers', '/admin/blog/': 'blog_posts', '/admin/reviews/': 'customer_reviews', '/admin/settings/': 'site_settings'
    };
    const selectedId = Array.from(document.querySelectorAll('dialog[open] [data-id]'))
      .map((node) => text(node.dataset.id, ''))
      .find(Boolean) || '';
    return { route: routes[route] ? route : '/admin/', entity: entityByRoute[route] || '', mode: selectedId ? 'editor' : (route === '/admin/pricing/' ? 'pricing' : 'list'), recordId: selectedId };
  }

  function requestId() {
    return window.crypto?.randomUUID?.() || null;
  }

  function actionName(mutation) {
    const verbs = { create: 'إضافة', update: 'تعديل', delete: 'حذف' };
    const nouns = {
      destinations: 'وجهة', packages: 'برنامج', services: 'خدمة', pricing_offers: 'عرض سعر',
      blog_categories: 'تصنيف مدونة', blog_posts: 'مقال مدونة', customer_reviews: 'رأي عميل', site_settings: 'إعداد موقع'
    };
    return `${verbs[mutation?.operation] || 'إجراء'} ${nouns[mutation?.entity] || 'عنصر'}`;
  }

  function mutationSummary(mutation) {
    if (!mutation) return '';
    if (mutation.operation === 'delete') return 'سيُحذف السجل المحدد نهائياً. لا يمكن التراجع عن هذا الإجراء.';
    const labels = {
      category: 'الفئة', title_ar: 'العنوان العربي', title_en: 'العنوان الإنجليزي', description_ar: 'الوصف العربي', description_en: 'الوصف الإنجليزي', image_url: 'الصورة المرفوعة', featured_image_url: 'صورة الغلاف المرفوعة', image_alt_ar: 'وصف الصورة العربي', image_alt_en: 'وصف الصورة الإنجليزي', featured_image_alt_ar: 'وصف الغلاف العربي', featured_image_alt_en: 'وصف الغلاف الإنجليزي', status: 'الحالة', is_active: 'التفعيل', is_featured: 'التمييز', sort_order: 'ترتيب العرض', price_label_ar: 'وصف السعر العربي', price_label_en: 'وصف السعر الإنجليزي', icon_class: 'الأيقونة', category_id: 'التصنيف', content_ar: 'المحتوى العربي', content_en: 'المحتوى الإنجليزي', excerpt_ar: 'الملخص العربي', excerpt_en: 'الملخص الإنجليزي'
    };
    const fields = Object.keys(mutation.patch || {}).map((field) => labels[field] || field);
    return fields.length ? `الحقول التي ستتغير: ${fields.join('، ')}` : 'سيُحفظ التغيير المقترح.';
  }

  function root() { return document.getElementById('admin-copilot-root'); }
  function messages() { return document.getElementById('admin-copilot-messages'); }
  function input() { return document.getElementById('admin-copilot-input'); }
  function submitButton() { return document.getElementById('admin-copilot-submit'); }
  function fileInput() { return document.getElementById('admin-copilot-file'); }
  function documentInput() { return document.getElementById('admin-copilot-document'); }
  function attachmentTray() { return document.getElementById('admin-copilot-attachments'); }

  function shell() {
    const container = document.createElement('div');
    container.id = 'admin-copilot-root';
    container.className = 'admin-copilot';
    container.innerHTML = `
      <button class="admin-copilot-launcher" type="button" data-copilot="toggle" aria-label="فتح مساعد أمواج الإداري" aria-expanded="false" aria-controls="admin-copilot-panel">
        <span class="admin-copilot-launcher-icon"><i class="fa-solid fa-sparkles" aria-hidden="true"></i></span>
        <span>مساعد أمواج</span>
      </button>
      <section class="admin-copilot-panel" id="admin-copilot-panel" role="dialog" aria-modal="false" aria-label="مساعد أمواج الإداري" aria-hidden="true" tabindex="-1">
        <header class="admin-copilot-head">
          <div class="admin-copilot-title"><span class="admin-copilot-avatar"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span><span><strong>مساعد أمواج الإداري</strong><small><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> GPT-5.6 Luna · متصل بالبيانات الحية</small></span></div>
          <div class="admin-copilot-head-actions"><button type="button" class="admin-copilot-icon-button" data-copilot="language" aria-label="التبديل إلى الإنجليزية" title="Arabic / English">ع</button><button type="button" class="admin-copilot-icon-button" data-copilot="close" aria-label="إغلاق المساعد"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
        </header>
        <div class="admin-copilot-notice"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>ارفع صورة أو ملف Excel أو Word (.docx) ليحلله المساعد. لن يُنفذ أي تغيير قبل تأكيدك.</span></div>
        <div id="admin-copilot-context" class="admin-copilot-context" aria-live="polite"></div>
        <div id="admin-copilot-messages" class="admin-copilot-messages" aria-live="polite" aria-relevant="additions text">
          <article class="copilot-message copilot-message-assistant"><div class="copilot-message-mark"><i class="fa-solid fa-sparkles" aria-hidden="true"></i></div><div class="copilot-message-body"><p>مرحباً. اسألني عن الأسعار أو المحتوى أو آراء العملاء، أو اطلب مني إعداد تعديل وسأعرضه عليك للتأكيد أولاً.</p></div></article>
        </div>
        <div class="admin-copilot-suggestions" aria-label="اقتراحات سريعة">
          <button type="button" data-copilot-question="ما هي عروض الأسعار المنشورة والمتاحة حالياً؟">العروض المتاحة</button>
          <button type="button" data-copilot-question="أظهر لي المسودات التي تحتاج مراجعة.">مراجعة المسودات</button>
          <button type="button" data-copilot-question="هل توجد آراء عملاء بانتظار الاعتماد؟">آراء بانتظار الاعتماد</button>
        </div>
        <div id="admin-copilot-attachments" class="admin-copilot-attachments" aria-live="polite"></div>
        <form class="admin-copilot-composer" id="admin-copilot-form">
          <label class="sr-only" for="admin-copilot-input">اكتب طلبك لمساعد أمواج الإداري</label>
          <input id="admin-copilot-file" class="admin-copilot-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="رفع صورة">
          <input id="admin-copilot-document" class="admin-copilot-file-input" type="file" accept=".xlsx,.xls,.csv,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-label="رفع ملف Excel أو Word">
          <button class="admin-copilot-upload" type="button" data-copilot="upload-image" aria-label="رفع صورة" title="رفع صورة"><i class="fa-solid fa-image" aria-hidden="true"></i></button>
          <button class="admin-copilot-upload admin-copilot-upload-document" type="button" data-copilot="upload-document" aria-label="رفع ملف Excel أو Word" title="رفع Excel أو Word"><i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i></button>
          <textarea id="admin-copilot-input" rows="2" maxlength="4200" placeholder="مثال: حلّل ملف الأسعار المرفق واقترح التحديث المناسب" autocomplete="off"></textarea>
          <button id="admin-copilot-submit" class="admin-copilot-send" type="submit" aria-label="إرسال الطلب"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>
        </form>
      </section>`;
    document.body.append(container);
  }

  function scrollToLatest() {
    const node = messages();
    if (node) node.scrollTop = node.scrollHeight;
  }

  function updateContextIndicator() {
    const node = document.getElementById('admin-copilot-context');
    if (!node) return;
    const context = currentPageContext();
    const section = routes[context.route] || 'لوحة التحكم';
    const recordNote = context.recordId ? ' · سجل مفتوح للتحقق' : '';
    node.innerHTML = `<i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>السياق الحالي: ${escapeHtml(section)}${escapeHtml(recordNote)}</span>`;
  }

  function appendMessage(role, content, extra = {}) {
    const list = messages();
    if (!list) return;
    const article = document.createElement('article');
    article.className = `copilot-message copilot-message-${role}`;
    const mark = role === 'assistant' ? '<div class="copilot-message-mark"><i class="fa-solid fa-sparkles" aria-hidden="true"></i></div>' : '';
    article.innerHTML = `${mark}<div class="copilot-message-body"><p>${escapeHtml(content)}</p></div>`;
    list.append(article);

    if (role === 'assistant' && extra.verified === true) {
      const verified = document.createElement('p');
      verified.className = 'copilot-verified-note';
      verified.innerHTML = '<i class="fa-solid fa-shield-halved" aria-hidden="true"></i> إجابة مستندة إلى بيانات حية تحقّق منها الخادم';
      article.querySelector('.copilot-message-body').append(verified);
    }
    if (role === 'assistant' && Array.isArray(extra.sources) && extra.sources.length) {
      const sourceText = extra.sources.map((source) => source.label).filter(Boolean).slice(0, 4).join(' • ');
      if (sourceText) {
        const sources = document.createElement('p');
        sources.className = 'copilot-sources';
        sources.innerHTML = `<i class="fa-solid fa-database" aria-hidden="true"></i> مصدر حي: ${escapeHtml(sourceText)}`;
        article.querySelector('.copilot-message-body').append(sources);
      }
    }
    if (role === 'assistant' && Array.isArray(extra.navigationActions) && extra.navigationActions.length) {
      const nav = document.createElement('div');
      nav.className = 'copilot-action-links';
      extra.navigationActions.forEach((action) => {
        if (!routes[action.path]) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.copilotNavigate = action.path;
        button.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${escapeHtml(text(action.label, routes[action.path]))}`;
        nav.append(button);
      });
      if (nav.childElementCount) article.querySelector('.copilot-message-body').append(nav);
    }
    if (role === 'assistant' && extra.editorPrefill) appendEditorPrefillCard(extra.editorPrefill, article.querySelector('.copilot-message-body'));
    if (role === 'assistant' && extra.proposedMutation) appendMutationCard(extra.proposedMutation, article.querySelector('.copilot-message-body'));
    if (role === 'assistant' && extra.execution) appendExecutionStatus(extra.execution, article.querySelector('.copilot-message-body'));
    scrollToLatest();
  }

  function appendEditorPrefillCard(prefill, parent) {
    const routeByEntity = { destinations: '/admin/destinations/', packages: '/admin/packages/', services: '/admin/services/', pricing_offers: '/admin/pricing/', blog_posts: '/admin/blog/' };
    const route = routeByEntity[prefill?.entity];
    if (!route || !['create', 'update'].includes(prefill?.operation)) return;
    const id = `draft-${Date.now()}-${++state.prefillSequence}`;
    state.editorPrefills.set(id, prefill);
    const card = document.createElement('section');
    card.className = 'copilot-prefill-card';
    const title = prefill.operation === 'create' ? `مسودة ${actionName(prefill)}` : `تعديل مقترح: ${actionName(prefill)}`;
    const message = prefill.operation === 'create'
      ? 'سيفتح المحرر بالحقول المقترحة. راجعها ثم احفظ مسودة أو انشر بنفسك.'
      : 'سيفتح السجل المتحقق منه مع تمييز الحقول المقترحة. لن يُحفظ أي تغيير تلقائيًا.';
    card.innerHTML = `<div class="copilot-prefill-card-title"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i><strong>${escapeHtml(title)}</strong></div><p>${escapeHtml(mutationSummary(prefill))}</p><p class="copilot-prefill-card-note">${escapeHtml(message)}</p><div class="copilot-mutation-actions"><button type="button" class="btn btn-primary" data-copilot="open-editor-prefill" data-prefill-id="${id}"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> فتح في المحرر للمراجعة</button></div>`;
    parent.append(card);
  }

  function openEditorPrefill(prefillId) {
    const prefill = state.editorPrefills.get(prefillId);
    const routeByEntity = { destinations: '/admin/destinations/', packages: '/admin/packages/', services: '/admin/services/', pricing_offers: '/admin/pricing/', blog_posts: '/admin/blog/' };
    const route = routeByEntity[prefill?.entity];
    if (!prefill || !route) return;
    try { sessionStorage.setItem(editorPrefillStorageKey, JSON.stringify(prefill)); } catch { appendMessage('assistant', 'تعذر تجهيز المسودة في المتصفح. أعد المحاولة.'); return; }
    setOpen(false, { focus: false });
    window.location.assign(route);
  }

  function appendExecutionStatus(result, parent) {
    const verification = result?.verification || {};
    const status = document.createElement('p');
    status.className = `copilot-execution-status${verification.exists === false ? ' is-deleted' : ''}`;
    const summary = verification.record?.title ? `السجل المتحقق منه: ${verification.record.title}` : verification.exists === false ? 'تم التحقق من عدم بقاء السجل بعد الحذف.' : 'تم التحقق من النتيجة من البيانات الحية.';
    status.innerHTML = `<i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${escapeHtml(summary)}${result.auditLogged === false ? ' — تعذر حفظ سجل التدقيق، لكن النتيجة تحققت من البيانات.' : ''}`;
    parent.append(status);
  }

  function appendMutationCard(mutation, parent) {
    state.pendingMutation = mutation;
    const dangerous = mutation.operation === 'delete';
    const card = document.createElement('section');
    card.className = `copilot-mutation-card${dangerous ? ' is-dangerous' : ''}`;
    card.innerHTML = `<div class="copilot-mutation-title"><span><i class="fa-solid ${dangerous ? 'fa-triangle-exclamation' : 'fa-pen-to-square'}" aria-hidden="true"></i></span><div><strong>${escapeHtml(actionName(mutation))}</strong><p>${escapeHtml(mutationSummary(mutation))}</p></div></div><div class="copilot-mutation-actions"><button type="button" class="btn btn-small ${dangerous ? 'btn-danger' : 'btn-primary'}" data-copilot="confirm-mutation">${dangerous ? 'تأكيد الحذف' : 'تأكيد وتنفيذ'}</button><button type="button" class="btn btn-small" data-copilot="cancel-mutation">إلغاء</button></div>`;
    parent.append(card);
  }

  function renderAttachments() {
    const tray = attachmentTray();
    if (!tray) return;
    tray.innerHTML = '';
    state.attachments.forEach((attachment, index) => {
      const card = document.createElement('div');
      card.className = 'admin-copilot-attachment';
      const preview = document.createElement('img');
      preview.src = attachment.url;
      preview.alt = attachment.name || 'صورة مرفوعة';
      preview.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = attachment.name || 'صورة مرفوعة';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.copilot = 'remove-attachment';
      remove.dataset.attachmentIndex = String(index);
      remove.setAttribute('aria-label', 'إزالة الصورة المرفقة');
      remove.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      card.append(preview, label, remove);
      tray.append(card);
    });
    if (state.documentAttachment) {
      const attachment = state.documentAttachment;
      const card = document.createElement('div');
      card.className = 'admin-copilot-attachment admin-copilot-document';
      const preview = document.createElement('span');
      preview.className = 'admin-copilot-document-icon';
      preview.innerHTML = `<i class="fa-solid ${attachment.kind === 'excel' ? 'fa-file-excel' : 'fa-file-word'}" aria-hidden="true"></i>`;
      const label = document.createElement('span');
      label.textContent = attachment.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.copilot = 'remove-document';
      remove.setAttribute('aria-label', 'إزالة الملف المرفق');
      remove.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
      card.append(preview, label, remove);
      tray.append(card);
    }
    tray.hidden = !state.attachments.length && !state.documentAttachment;
  }

  async function uploadAttachment(file) {
    if (!(file instanceof File) || state.busy) return;
    if (state.attachments.length >= 3) {
      appendMessage('assistant', 'يمكن إرفاق 3 صور كحد أقصى في المحادثة الواحدة.');
      return;
    }
    setBusy(true);
    try {
      const result = await window.AmwajAdminClient.uploadImage(file, 'admin-copilot');
      state.attachments.push({ url: result.publicUrl, name: file.name });
      renderAttachments();
      appendMessage('assistant', `تم رفع الصورة «${file.name}». اكتب الآن ما تريد إضافته أو تعديله؛ هذه هي الطريقة الوحيدة لإضافة الصور، ولا يلزم إدخال أي رابط.`);
    } catch (error) {
      appendMessage('assistant', error.message || 'تعذر رفع الصورة.');
    } finally {
      if (fileInput()) fileInput().value = '';
      setBusy(false);
      input()?.focus();
    }
  }

  function tidyDocumentText(value, max = 600) {
    return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function cutDocumentText(value) {
    const textValue = String(value || '').trim();
    return textValue.length > MAX_DOCUMENT_TEXT ? `${textValue.slice(0, MAX_DOCUMENT_TEXT)}\n\n[تم اختصار بقية الملف لحماية سعة المحادثة]` : textValue;
  }

  function documentKind(file) {
    const name = String(file?.name || '').toLowerCase();
    if (/\.(xlsx|xls|csv)$/.test(name)) return 'excel';
    if (/\.docx$/.test(name)) return 'word';
    return '';
  }

  async function extractDocument(file) {
    if (!(file instanceof File)) throw new Error('اختر ملفاً صالحاً أولاً.');
    if (file.size > MAX_DOCUMENT_BYTES) throw new Error('الحد الأقصى لملف Excel أو Word هو 5 ميجابايت.');
    const kind = documentKind(file);
    if (!kind) throw new Error('الصيغ المدعومة هي Excel ‏(.xlsx و.xls و.csv) وWord ‏(.docx) فقط.');
    const arrayBuffer = await file.arrayBuffer();
    if (kind === 'excel') {
      if (!window.XLSX) throw new Error('تعذر تحميل محلل Excel. حدّث الصفحة ثم حاول مرة أخرى.');
      const workbook = window.XLSX.read(arrayBuffer, { type: 'array', cellFormula: false, cellHTML: false, cellText: true });
      const sections = workbook.SheetNames.slice(0, 5).map((sheetName) => {
        const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false, blankrows: false })
          .slice(0, 121)
          .map((row) => row.map((cell) => tidyDocumentText(cell, 240)).join(' | '))
          .filter(Boolean);
        return rows.length ? `[ورقة: ${tidyDocumentText(sheetName, 100)}]\n${rows.join('\n')}` : '';
      }).filter(Boolean);
      const content = cutDocumentText(sections.join('\n\n'));
      if (!content) throw new Error('ملف Excel لا يحتوي على بيانات قابلة للقراءة.');
      return { kind, name: tidyDocumentText(file.name, 180), mimeType: file.type || 'application/vnd.ms-excel', content };
    }
    if (!window.mammoth) throw new Error('تعذر تحميل محلل Word. حدّث الصفحة ثم حاول مرة أخرى.');
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    const content = cutDocumentText(String(result.value || '').split(/\n+/).map((line) => tidyDocumentText(line, 1200)).filter(Boolean).join('\n'));
    if (!content) throw new Error('ملف Word لا يحتوي على نص قابل للقراءة.');
    return { kind, name: tidyDocumentText(file.name, 180), mimeType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', content };
  }

  async function uploadDocument(file) {
    if (state.busy) return;
    setBusy(true);
    try {
      state.documentAttachment = await extractDocument(file);
      renderAttachments();
      appendMessage('assistant', `تمت قراءة ملف «${state.documentAttachment.name}» في المتصفح ولم يُحفظ كملف على الموقع. اكتب المطلوب منه، مثل: «حلّل الأسعار واقترح التحديث المناسب». سأعرض أي تعديل للمراجعة والتأكيد أولاً.`);
    } catch (error) {
      appendMessage('assistant', error.message || 'تعذر قراءة الملف.');
    } finally {
      if (documentInput()) documentInput().value = '';
      setBusy(false);
      input()?.focus();
    }
  }

  function appendTyping() {
    const list = messages();
    if (!list) return;
    const typing = document.createElement('article');
    typing.id = 'admin-copilot-typing';
    typing.className = 'copilot-message copilot-message-assistant copilot-typing';
    typing.innerHTML = '<div class="copilot-message-mark"><i class="fa-solid fa-sparkles" aria-hidden="true"></i></div><div class="copilot-message-body"><span></span><span></span><span></span></div>';
    list.append(typing);
    scrollToLatest();
  }

  function removeTyping() { document.getElementById('admin-copilot-typing')?.remove(); }

  function setBusy(busy) {
    state.busy = busy;
    const button = submitButton();
    const field = input();
    const uploads = document.querySelectorAll('.admin-copilot-upload');
    const picker = fileInput();
    const documentPicker = documentInput();
    if (button) { button.disabled = busy; button.setAttribute('aria-busy', String(busy)); }
    if (field) field.disabled = busy;
    uploads.forEach((upload) => { upload.disabled = busy; });
    if (picker) picker.disabled = busy;
    if (documentPicker) documentPicker.disabled = busy;
  }

  async function adminToken() {
    const session = await window.AmwajAdminClient?.getValidSession?.();
    if (!session?.access_token) throw new Error('انتهت جلسة الإدارة. سجّل الدخول ثم حاول مجدداً.');
    return session.access_token;
  }

  async function request(body) {
    const token = await adminToken();
    const response = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const content = await response.text();
    let parsed = {};
    try { parsed = content ? JSON.parse(content) : {}; } catch { parsed = {}; }
    if (!response.ok) throw new Error(parsed.message || 'تعذر تشغيل مساعد الإدارة حالياً.');
    return parsed;
  }

  async function ask(question) {
    updateContextIndicator();
    const message = text(question);
    if (!message || state.busy) return;
    appendMessage('user', message);
    state.history.push({ role: 'user', content: message });
    state.history = state.history.slice(-10);
    if (input()) input().value = '';
    setBusy(true);
    appendTyping();
    try {
      const result = await request({ mode: 'chat', requestId: requestId(), pageContext: currentPageContext(), message, history: state.history.slice(0, -1), language: state.language, attachments: state.attachments, document: state.documentAttachment });
      const reply = result.reply || {};
      appendMessage('assistant', text(reply.answer, 'لم أتمكن من استخراج إجابة موثوقة الآن.'), reply);
      state.history.push({ role: 'assistant', content: text(reply.answer) });
      state.history = state.history.slice(-10);
    } catch (error) {
      appendMessage('assistant', error.message || 'حدث خطأ أثناء تشغيل مساعد الإدارة.');
    } finally {
      removeTyping();
      setBusy(false);
      input()?.focus();
    }
  }

  async function executePendingMutation() {
    const mutation = state.pendingMutation;
    if (!mutation || state.busy) return;
    const confirmText = mutation.operation === 'delete'
      ? 'سيتم حذف هذا السجل نهائياً. هل تريد المتابعة؟'
      : 'سيتم حفظ التغيير في بيانات أمواج الحية. هل تريد المتابعة؟';
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    appendTyping();
    try {
      const result = await request({ mode: 'execute', requestId: requestId(), pageContext: currentPageContext(), confirmed: true, mutation, attachments: state.attachments });
      state.pendingMutation = null;
      if (result?.result?.operation === 'create' && result?.result?.entity === 'packages') {
        state.attachments = [];
        renderAttachments();
      }
      appendMessage('assistant', text(result.message, 'تم تنفيذ الإجراء بعد التأكيد.'), { execution: result.result });
      window.dispatchEvent(new CustomEvent('amwaj:copilot-mutated', { detail: result.result }));
      const cards = document.querySelectorAll('.copilot-mutation-card');
      cards.forEach((card) => { card.classList.add('is-complete'); card.querySelectorAll('button').forEach((button) => { button.disabled = true; }); });
    } catch (error) {
      appendMessage('assistant', error.message || 'تعذر تنفيذ الإجراء المطلوب.');
    } finally {
      removeTyping();
      setBusy(false);
    }
  }

  function setOpen(open, { focus = true } = {}) {
    state.open = Boolean(open);
    const panel = document.getElementById('admin-copilot-panel');
    const launcher = document.querySelector('.admin-copilot-launcher');
    if (!panel || !launcher) return;
    if (state.open) updateContextIndicator();
    panel.classList.toggle('is-open', state.open);
    panel.setAttribute('aria-hidden', String(!state.open));
    launcher.setAttribute('aria-expanded', String(state.open));
    document.documentElement.classList.toggle('copilot-open', state.open);
    try { sessionStorage.setItem(storageKey, String(state.open)); } catch { /* no storage required */ }
    if (state.open && focus) window.setTimeout(() => input()?.focus(), 80);
    if (!state.open && focus) launcher.focus();
  }

  function navigate(path) {
    if (!routes[path]) return;
    setOpen(false, { focus: false });
    window.location.assign(path);
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const command = event.target.closest('[data-copilot]')?.dataset.copilot;
      if (command === 'toggle') setOpen(!state.open);
      if (command === 'close') setOpen(false);
      if (command === 'language') {
        state.language = state.language === 'ar' ? 'en' : 'ar';
        event.target.closest('button').textContent = state.language === 'ar' ? 'ع' : 'EN';
        event.target.closest('button').setAttribute('aria-label', state.language === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic');
      }
      if (command === 'confirm-mutation') executePendingMutation();
      if (command === 'open-editor-prefill') openEditorPrefill(event.target.closest('[data-prefill-id]')?.dataset.prefillId || '');
      if (command === 'upload-image') fileInput()?.click();
      if (command === 'upload-document') documentInput()?.click();
      if (command === 'remove-attachment') {
        const index = Number(event.target.closest('[data-attachment-index]')?.dataset.attachmentIndex);
        if (Number.isInteger(index) && index >= 0) {
          state.attachments.splice(index, 1);
          renderAttachments();
        }
      }
      if (command === 'remove-document') {
        state.documentAttachment = null;
        renderAttachments();
        appendMessage('assistant', 'تمت إزالة الملف المرفق. لم يُرسل أي محتوى منه إلى المساعد بعد.');
      }
      if (command === 'cancel-mutation') {
        state.pendingMutation = null;
        event.target.closest('.copilot-mutation-card')?.remove();
        appendMessage('assistant', 'تم إلغاء الإجراء. لم يتغير أي شيء في البيانات.');
      }
      const question = event.target.closest('[data-copilot-question]')?.dataset.copilotQuestion;
      if (question) ask(question);
      const nav = event.target.closest('[data-copilot-navigate]')?.dataset.copilotNavigate;
      if (nav) navigate(nav);
    });
    document.addEventListener('change', (event) => {
      if (event.target?.id === 'admin-copilot-file') uploadAttachment(event.target.files?.[0]);
      if (event.target?.id === 'admin-copilot-document') uploadDocument(event.target.files?.[0]);
    });
    document.addEventListener('submit', (event) => {
      if (event.target?.id !== 'admin-copilot-form') return;
      event.preventDefault();
      ask(input()?.value || '');
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.open) setOpen(false);
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && document.activeElement === input()) ask(input()?.value || '');
    });
  }

  async function initialize() {
    if (root() || !window.AmwajAdminClient) return;
    try {
      const auth = await window.AmwajAdminClient.requireAdmin();
      if (!auth?.isAdmin) return;
      shell();
      updateContextIndicator();
      renderAttachments();
      bindEvents();
      try { if (sessionStorage.getItem(storageKey) === 'true') setOpen(true, { focus: false }); } catch { /* no storage required */ }
    } catch { /* The main admin app owns authentication errors. */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
