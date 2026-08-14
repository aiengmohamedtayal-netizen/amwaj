(() => {
  'use strict';

  const API_PATH = '/api/admin-copilot';
  const storageKey = 'amwaj_admin_copilot_open';
  const state = { open: false, busy: false, language: 'ar', history: [], pendingMutation: null, attachments: [] };

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
        <div class="admin-copilot-notice"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>ارفع الصورة كملف فقط ثم أنشئ برنامجاً بالمحادثة، أو اطلب أي تعديل. لن يُنفذ أي تغيير قبل تأكيدك.</span></div>
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
          <input id="admin-copilot-file" class="admin-copilot-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="رفع صورة للبرنامج">
          <button class="admin-copilot-upload" type="button" data-copilot="upload-image" aria-label="رفع صورة للبرنامج" title="رفع صورة"><i class="fa-solid fa-image" aria-hidden="true"></i></button>
          <textarea id="admin-copilot-input" rows="2" maxlength="4200" placeholder="مثال: أريد إضافة برنامج جديد بهذه الصورة" autocomplete="off"></textarea>
          <button id="admin-copilot-submit" class="admin-copilot-send" type="submit" aria-label="إرسال الطلب"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>
        </form>
      </section>`;
    document.body.append(container);
  }

  function scrollToLatest() {
    const node = messages();
    if (node) node.scrollTop = node.scrollHeight;
  }

  function appendMessage(role, content, extra = {}) {
    const list = messages();
    if (!list) return;
    const article = document.createElement('article');
    article.className = `copilot-message copilot-message-${role}`;
    const mark = role === 'assistant' ? '<div class="copilot-message-mark"><i class="fa-solid fa-sparkles" aria-hidden="true"></i></div>' : '';
    article.innerHTML = `${mark}<div class="copilot-message-body"><p>${escapeHtml(content)}</p></div>`;
    list.append(article);

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
    if (role === 'assistant' && extra.proposedMutation) appendMutationCard(extra.proposedMutation, article.querySelector('.copilot-message-body'));
    scrollToLatest();
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
    tray.hidden = !state.attachments.length;
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
    const upload = document.querySelector('.admin-copilot-upload');
    const picker = fileInput();
    if (button) { button.disabled = busy; button.setAttribute('aria-busy', String(busy)); }
    if (field) field.disabled = busy;
    if (upload) upload.disabled = busy;
    if (picker) picker.disabled = busy;
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
    const message = text(question);
    if (!message || state.busy) return;
    appendMessage('user', message);
    state.history.push({ role: 'user', content: message });
    state.history = state.history.slice(-6);
    if (input()) input().value = '';
    setBusy(true);
    appendTyping();
    try {
      const result = await request({ mode: 'chat', message, history: state.history.slice(0, -1), language: state.language, attachments: state.attachments });
      const reply = result.reply || {};
      appendMessage('assistant', text(reply.answer, 'لم أتمكن من استخراج إجابة موثوقة الآن.'), reply);
      state.history.push({ role: 'assistant', content: text(reply.answer) });
      state.history = state.history.slice(-6);
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
      const result = await request({ mode: 'execute', confirmed: true, mutation, attachments: state.attachments });
      state.pendingMutation = null;
      if (result?.result?.operation === 'create' && result?.result?.entity === 'packages') {
        state.attachments = [];
        renderAttachments();
      }
      appendMessage('assistant', text(result.message, 'تم تنفيذ الإجراء بعد التأكيد.'));
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
      if (command === 'upload-image') fileInput()?.click();
      if (command === 'remove-attachment') {
        const index = Number(event.target.closest('[data-attachment-index]')?.dataset.attachmentIndex);
        if (Number.isInteger(index) && index >= 0) {
          state.attachments.splice(index, 1);
          renderAttachments();
        }
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
      if (event.target?.id !== 'admin-copilot-file') return;
      uploadAttachment(event.target.files?.[0]);
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
      renderAttachments();
      bindEvents();
      try { if (sessionStorage.getItem(storageKey) === 'true') setOpen(true, { focus: false }); } catch { /* no storage required */ }
    } catch { /* The main admin app owns authentication errors. */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
