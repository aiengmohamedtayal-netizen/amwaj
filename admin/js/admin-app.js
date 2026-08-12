(function () {
  'use strict';

  const client = window.AmwajAdminClient;
  const app = document.getElementById('admin-app');
  const toastRegion = document.getElementById('toast-region');
  const routeLabels = {
    dashboard: { title: 'لوحة التحكم', subtitle: 'ملخص سريع لمحتوى أمواج المنشور والمسودات.' },
    packages: { title: 'إدارة البرامج', subtitle: 'إضافة البرامج وتحديثها ونشرها أو أرشفتها.' },
    destinations: { title: 'إدارة الوجهات', subtitle: 'إدارة بطاقات الوجهات المعروضة لعملاء أمواج.' },
    services: { title: 'إدارة الخدمات', subtitle: 'إدارة الخدمات الداعمة لرحلة العميل.' },
    pricing: { title: 'جدول أسعار محرك البحث', subtitle: 'أدخل واعتمد عروض الرحلات الحية التي تظهر في محرك البحث العام.' },
    blog: { title: 'إدارة المدونة', subtitle: 'حرّر المقالات العربية والإنجليزية ثم راجعها وانشرها بأمان.' },
    settings: { title: 'إعدادات الموقع', subtitle: 'مراجعة وتحديث الإعدادات المسجلة في مصدر البيانات المركزي.' }
  };
  const collectionMeta = {
    packages: {
      table: 'packages', singular: 'برنامج', plural: 'البرامج', icon: 'fa-suitcase-rolling',
      categories: [['vip', 'VIP'], ['family', 'عائلي'], ['honeymoon', 'شهر عسل']], image: true, featured: true
    },
    destinations: {
      table: 'destinations', singular: 'وجهة', plural: 'الوجهات', icon: 'fa-map-location-dot',
      categories: [['egypt', 'داخل مصر'], ['international', 'دولية'], ['umrah', 'عمرة']], image: true, featured: true
    },
    services: {
      table: 'services', singular: 'خدمة', plural: 'الخدمات', icon: 'fa-concierge-bell',
      categories: [], image: false, featured: false
    }
  };
  const state = { auth: null, page: 'dashboard', collections: {}, search: '' };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
  }

  function safeUrl(value) {
    const candidate = String(value || '').trim();
    return /^(https?:\/\/|\/)/i.test(candidate) ? candidate : '';
  }

  function currentPage() {
    const queryPage = new URLSearchParams(window.location.search).get('page');
    if (queryPage && routeLabels[queryPage]) return queryPage;
    const segments = window.location.pathname.split('/').filter(Boolean);
    const candidate = segments[1] && segments[1] !== 'index.html' ? segments[1] : 'dashboard';
    return routeLabels[candidate] ? candidate : 'dashboard';
  }

  function adminPath(page) {
    return page === 'dashboard' ? '/admin/' : `/admin/${page}/`;
  }

  function showToast(type, title, detail) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}" aria-hidden="true"></i><div><strong>${escapeHtml(title)}</strong>${detail ? `<p>${escapeHtml(detail)}</p>` : ''}</div>`;
    toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), 5200);
  }

  function statusMarkup(row) {
    if (!row.is_active) return '<span class="badge badge-archived"><i class="fa-solid fa-box-archive"></i> مؤرشف</span>';
    if (row.status === 'published') return '<span class="badge badge-published"><i class="fa-solid fa-circle-check"></i> منشور</span>';
    return '<span class="badge badge-draft"><i class="fa-solid fa-pen-to-square"></i> مسودة</span>';
  }

  function formatDate(value) {
    if (!value) return '—';
    try { return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value)); } catch { return '—'; }
  }

  function initials(name) {
    return String(name || 'مدير').trim().slice(0, 1);
  }

  function escapeJson(value) {
    return escapeHtml(JSON.stringify(value ?? {}, null, 2));
  }

  function layout(content) {
    const profile = state.auth.profile || {};
    const pageLabel = routeLabels[state.page];
    const links = [
      ['dashboard', 'fa-chart-pie', 'لوحة التحكم'], ['packages', 'fa-suitcase-rolling', 'البرامج'],
      ['destinations', 'fa-map-location-dot', 'الوجهات'], ['services', 'fa-concierge-bell', 'الخدمات'],
      ['pricing', 'fa-tags', 'التسعير'], ['blog', 'fa-newspaper', 'المدونة'], ['settings', 'fa-sliders', 'الإعدادات']
    ];
    return `<div class="admin-shell">
      <aside class="sidebar" id="admin-sidebar" aria-label="التنقل الإداري">
        <a class="brand" href="/admin/" aria-label="لوحة تحكم أمواج">
          <img src="/assets/logo.png" alt="شعار أمواج للسياحة"><span><strong>أمواج للسياحة</strong><small>AMWAJ ADMIN</small></span>
        </a>
        <nav class="nav-group" aria-label="أقسام الإدارة"><span class="nav-title">القائمة الرئيسية</span>
          ${links.map(([key, icon, label]) => `<a class="nav-link ${state.page === key ? 'is-active' : ''}" href="${adminPath(key)}" ${state.page === key ? 'aria-current="page"' : ''}><i class="nav-icon fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span></a>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <p class="user-name" title="${escapeHtml(profile.full_name || state.auth.session?.user?.email || '')}"><i class="fa-solid fa-user-shield" aria-hidden="true"></i> ${escapeHtml(profile.full_name || state.auth.session?.user?.email || 'مدير أمواج')}</p>
          <button class="btn btn-ghost btn-small" type="button" data-action="sign-out"><i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج</button>
        </div>
      </aside>
      <section class="main-area">
        <header class="topbar">
          <div class="topbar-label"><button class="btn icon-btn mobile-nav-toggle" type="button" data-action="toggle-nav" aria-label="فتح القائمة"><i class="fa-solid fa-bars"></i></button><div><h1>${escapeHtml(pageLabel.title)}</h1><p>${escapeHtml(pageLabel.subtitle)}</p></div></div>
          <div class="topbar-actions"><button class="btn btn-small" type="button" data-action="export-pdf"><i class="fa-solid fa-file-pdf"></i> تصدير PDF</button><a class="btn btn-small" href="/" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> عرض الموقع العام</a></div>
        </header>
        <main id="admin-content" class="page-content" tabindex="-1">${content}</main>
      </section>
    </div>`;
  }

  function loadingMarkup(label) {
    return `<section class="panel loading-state" aria-label="${escapeHtml(label)}"><div class="spinner" aria-hidden="true"></div><p>${escapeHtml(label)}</p></section>`;
  }

  function errorMarkup(message) {
    return `<section class="panel error-state"><div><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><h3>تعذر تحميل البيانات</h3><p>${escapeHtml(message)}</p><button class="btn btn-primary btn-small" type="button" data-action="reload-page">إعادة المحاولة</button></div></section>`;
  }

  function pageHeader(title, description, action) {
    return `<header class="page-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${action || ''}</header>`;
  }

  async function renderDashboard() {
    app.innerHTML = layout(loadingMarkup('جارٍ تحميل ملخص المحتوى…'));
    try {
      const [packages, destinations, services] = await Promise.all([
        client.list('packages', { order: 'sort_order.asc,updated_at.desc' }),
        client.list('destinations', { order: 'sort_order.asc,updated_at.desc' }),
        client.list('services', { order: 'sort_order.asc,updated_at.desc' })
      ]);
      state.collections = { packages, destinations, services };
      const all = [...packages, ...destinations, ...services];
      const published = all.filter((row) => row.status === 'published' && row.is_active).length;
      const drafts = all.filter((row) => row.status === 'draft' && row.is_active).length;
      const updated = [...all].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 6);
      const metric = (icon, tint, color, label, value) => `<article class="metric-card" style="--metric-tint:${tint};--metric-color:${color}"><div class="metric-icon"><i class="fa-solid ${icon}"></i></div><p class="metric-label">${label}</p><p class="metric-value">${value}</p></article>`;
      const greeting = `مرحبًا، ${state.auth.profile?.full_name ? state.auth.profile.full_name : 'مدير أمواج'}`;
      const content = `${pageHeader(greeting, 'أدِر المحتوى والتسعير من مصدر البيانات المركزي دون تغيير الواجهة العامة.')}
        <section class="metrics" aria-label="ملخص المحتوى">
          ${metric('fa-suitcase-rolling', 'rgba(0,153,216,.12)', '#0099D8', 'البرامج', packages.length)}
          ${metric('fa-map-location-dot', 'rgba(0,194,168,.13)', '#00A38D', 'الوجهات', destinations.length)}
          ${metric('fa-concierge-bell', 'rgba(253,186,33,.18)', '#A76B00', 'الخدمات', services.length)}
          ${metric('fa-file-pen', 'rgba(100,116,139,.13)', '#475569', 'مسودات قيد المراجعة', drafts)}
        </section>
        <section class="panel"><div class="panel-head"><div><h3 class="panel-title">إجراءات سريعة</h3><p class="panel-subtitle">أنشئ عنصرًا جديدًا أو راجع حالة النشر الحالية.</p></div><span class="badge badge-active"><i class="fa-solid fa-circle"></i> ${published} عنصر منشور</span></div>
          <div class="quick-actions"><button class="btn btn-primary" data-action="new-item" data-kind="packages"><i class="fa-solid fa-plus"></i> إضافة برنامج</button><button class="btn" data-action="new-item" data-kind="destinations"><i class="fa-solid fa-plus"></i> إضافة وجهة</button><button class="btn" data-action="new-item" data-kind="services"><i class="fa-solid fa-plus"></i> إضافة خدمة</button><a class="btn" href="/admin/pricing/"><i class="fa-solid fa-tags"></i> مراجعة التسعير</a><a class="btn" href="/admin/blog/"><i class="fa-solid fa-newspaper"></i> إدارة المدونة</a></div>
        </section>
        <section class="panel"><div class="panel-head"><div><h3 class="panel-title">آخر التحديثات</h3><p class="panel-subtitle">أحدث تغييرات المحتوى المسجلة في Supabase.</p></div></div>
          ${updated.length ? `<ul class="recent-list">${updated.map((item) => `<li><div><strong>${escapeHtml(item.title_ar)}</strong><time>آخر تحديث: ${formatDate(item.updated_at)}</time></div>${statusMarkup(item)}</li>`).join('')}</ul>` : '<div class="empty-state"><div><i class="fa-solid fa-folder-open"></i><h3>لا توجد عناصر بعد</h3><p>أضف برنامجًا أو وجهة أو خدمة لبدء إدارة المحتوى.</p></div></div>'}
        </section>`;
      app.innerHTML = layout(content);
    } catch (error) {
      app.innerHTML = layout(errorMarkup(error.message));
    }
  }

  function listRows(kind, rows) {
    const meta = collectionMeta[kind];
    if (!rows.length) return `<div class="empty-state"><div><i class="fa-solid ${meta.icon}"></i><h3>لا توجد ${meta.plural} مطابقة</h3><p>ابدأ بإضافة ${meta.singular} جديدة أو غيّر عبارة البحث.</p></div></div>`;
    return `<div class="table-scroll"><table><thead><tr><th>${meta.image ? 'المحتوى' : 'الخدمة'}</th><th>الفئة</th><th>الحالة</th><th>آخر تحديث</th><th><span class="sr-only">إجراءات</span></th></tr></thead><tbody>
      ${rows.map((row) => `<tr><td><div class="row-title">${meta.image ? `<img class="row-image" src="${escapeHtml(safeUrl(row.image_url))}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="row-image" aria-hidden="true"><i class="fa-solid ${escapeHtml(row.icon_class || 'fa-star')}"></i></span>`}<span><strong>${escapeHtml(row.title_ar)}</strong><span>${escapeHtml(row.title_en)}</span></span></div></td><td>${escapeHtml(meta.categories.find(([key]) => key === row.category)?.[1] || row.category || '—')}</td><td><div style="display:flex;gap:.35rem;flex-wrap:wrap">${statusMarkup(row)}${row.is_featured ? '<span class="badge badge-featured"><i class="fa-solid fa-star"></i> مميز</span>' : ''}</div></td><td><span class="muted">${formatDate(row.updated_at)}</span></td><td><div class="table-actions"><button class="btn btn-small" data-action="preview" data-kind="${kind}" data-id="${row.id}" aria-label="معاينة ${escapeHtml(row.title_ar)}"><i class="fa-regular fa-eye"></i></button><button class="btn btn-small" data-action="edit-item" data-kind="${kind}" data-id="${row.id}" aria-label="تعديل ${escapeHtml(row.title_ar)}"><i class="fa-solid fa-pen"></i></button>${meta.featured ? `<button class="btn btn-small" data-action="toggle-featured" data-kind="${kind}" data-id="${row.id}" aria-label="تغيير حالة التمييز"><i class="fa-solid fa-star"></i></button>` : ''}<button class="btn btn-small ${row.is_active ? 'btn-danger' : ''}" data-action="toggle-archive" data-kind="${kind}" data-id="${row.id}" aria-label="${row.is_active ? 'أرشفة' : 'إعادة تفعيل'} ${escapeHtml(row.title_ar)}"><i class="fa-solid ${row.is_active ? 'fa-box-archive' : 'fa-rotate-left'}"></i></button><button class="btn btn-small btn-danger" data-action="delete-item" data-kind="${kind}" data-id="${row.id}" aria-label="حذف ${escapeHtml(row.title_ar)}"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('')}
    </tbody></table></div>`;
  }

  async function renderCollection(kind) {
    const meta = collectionMeta[kind];
    app.innerHTML = layout(`${pageHeader(`إدارة ${meta.plural}`, `يمكن للمدير فقط إضافة ${meta.plural} وتحديثها أو حفظها كمسودة.`, `<button class="btn btn-primary" data-action="new-item" data-kind="${kind}"><i class="fa-solid fa-plus"></i> إضافة ${meta.singular}</button>`)}${loadingMarkup(`جارٍ تحميل ${meta.plural}…`)}`);
    try {
      const rows = await client.list(meta.table, { order: 'sort_order.asc,updated_at.desc' });
      state.collections[kind] = rows;
      const content = `${pageHeader(`إدارة ${meta.plural}`, `يمكن للمدير فقط إضافة ${meta.plural} وتحديثها أو حفظها كمسودة.`, `<button class="btn btn-primary" data-action="new-item" data-kind="${kind}"><i class="fa-solid fa-plus"></i> إضافة ${meta.singular}</button>`)}
      <div class="toolbar"><div class="search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input id="collection-search" class="input" type="search" placeholder="ابحث بالاسم العربي أو الإنجليزي…" value="${escapeHtml(state.search)}"></div><span class="muted">${rows.length} ${meta.singular}</span></div>
      <section class="panel table-card" id="collection-table">${listRows(kind, rows.filter((row) => `${row.title_ar} ${row.title_en}`.toLowerCase().includes(state.search.toLowerCase())))}</section>`;
      app.innerHTML = layout(content);
      document.getElementById('collection-search')?.addEventListener('input', (event) => {
        state.search = event.target.value;
        document.getElementById('collection-table').innerHTML = listRows(kind, rows.filter((row) => `${row.title_ar} ${row.title_en}`.toLowerCase().includes(state.search.toLowerCase())));
      });
    } catch (error) {
      app.innerHTML = layout(`${pageHeader(`إدارة ${meta.plural}`, '')}${errorMarkup(error.message)}`);
    }
  }

  function categoryOptions(kind, selected) {
    return collectionMeta[kind].categories.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('');
  }

  function field(label, name, value, options) {
    const settings = options || {};
    const className = settings.full ? 'field full' : 'field';
    const type = settings.type || 'text';
    const required = settings.required === false ? '' : 'required';
    const placeholder = settings.placeholder ? ` placeholder="${escapeHtml(settings.placeholder)}"` : '';
    if (settings.select) return `<div class="${className}"><label for="field-${name}">${label}</label><select class="select" id="field-${name}" name="${name}" ${required}>${settings.select}</select>${settings.hint ? `<span class="field-hint">${settings.hint}</span>` : ''}</div>`;
    if (settings.textarea) return `<div class="${className}"><label for="field-${name}">${label}</label><textarea class="textarea" id="field-${name}" name="${name}" ${required}${placeholder}>${escapeHtml(value || '')}</textarea>${settings.hint ? `<span class="field-hint">${settings.hint}</span>` : ''}</div>`;
    return `<div class="${className}"><label for="field-${name}">${label}</label><input class="input" id="field-${name}" name="${name}" type="${type}" value="${escapeHtml(value ?? '')}" ${required}${placeholder}${settings.step ? ` step="${settings.step}"` : ''}>${settings.hint ? `<span class="field-hint">${settings.hint}</span>` : ''}</div>`;
  }

  function checkField(label, name, checked) {
    return `<label class="check-field"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
  }

  function imageUploadField(fileName, urlName, currentUrl, scope, label) {
    const preview = safeUrl(currentUrl);
    return `<div class="field full media-upload-field"><label for="field-${fileName}">${label || 'رفع صورة'}</label><input class="input" id="field-${fileName}" name="${fileName}" type="file" accept="image/jpeg,image/png,image/webp,image/avif" data-media-scope="${escapeHtml(scope || 'general')}"><input name="${urlName}" type="hidden" value="${escapeHtml(currentUrl || '')}"><span class="field-hint">JPG أو PNG أو WebP أو AVIF، حتى 5 ميغابايت. تُحفظ الصورة في مساحة وسائط أمواج الآمنة.</span>${preview ? `<img class="media-upload-preview" src="${escapeHtml(preview)}" alt="" onerror="this.remove()">` : ''}</div>`;
  }

  function openDialog(title, subtitle, body, footer) {
    const dialog = document.createElement('dialog');
    dialog.className = 'dialog';
    dialog.innerHTML = `<div class="dialog-content"><header class="dialog-header"><div><h3>${escapeHtml(title)}</h3>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div><button class="close-dialog" type="button" aria-label="إغلاق" data-close-dialog><i class="fa-solid fa-xmark"></i></button></header><div class="dialog-body">${body}</div>${footer ? `<footer class="dialog-footer">${footer}</footer>` : ''}</div>`;
    document.body.append(dialog);
    dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
    return dialog;
  }

  function openPreview(kind, row) {
    const isService = kind === 'services';
    const image = isService ? '' : `<img src="${escapeHtml(safeUrl(row.image_url))}" alt="${escapeHtml(row.image_alt_ar || row.title_ar)}">`;
    const icon = isService ? `<div style="display:grid;place-items:center;min-height:9rem;background:var(--color-primary-light);color:var(--color-primary);font-size:3rem"><i class="fa-solid ${escapeHtml(row.icon_class || 'fa-star')}"></i></div>` : '';
    openDialog(`معاينة: ${row.title_ar}`, 'معاينة تحريرية فقط؛ لا تغيّر الموقع العام في هذه المرحلة.', `<article class="preview-card">${image || icon}<div class="preview-copy">${row.badge_ar ? `<span class="badge badge-featured">${escapeHtml(row.badge_ar)}</span>` : ''}<h4>${escapeHtml(row.title_ar)}</h4><p>${escapeHtml(row.description_ar)}</p>${row.price_label_ar ? `<p class="preview-price">${escapeHtml(row.price_label_ar)}</p>` : ''}</div></article>`, '<button class="btn" type="button" data-close-dialog>إغلاق</button>');
  }

  function openItemEditor(kind, row) {
    const meta = collectionMeta[kind];
    const isNew = !row;
    const item = row || { status: 'draft', is_active: true, sort_order: 0, rating: '', highlights: [], category: meta.categories[0]?.[0] || '', is_featured: false };
    const common = `
      ${field('المعرّف النصي (Slug)', 'slug', item.slug, { hint: 'حروف إنجليزية صغيرة وأرقام وشرطات فقط.', placeholder: 'example-trip' })}
      ${meta.categories.length ? field('الفئة', 'category', item.category, { select: categoryOptions(kind, item.category) }) : ''}
      ${field('العنوان بالعربية', 'title_ar', item.title_ar)}
      ${field('العنوان بالإنجليزية', 'title_en', item.title_en)}
      ${field('الوصف بالعربية', 'description_ar', item.description_ar, { textarea: true, full: true })}
      ${field('الوصف بالإنجليزية', 'description_en', item.description_en, { textarea: true, full: true })}
      ${field('ترتيب العرض', 'sort_order', item.sort_order, { type: 'number', step: '1' })}
      ${checkField('العنصر نشط', 'is_active', item.is_active)}
    `;
    const media = meta.image ? `
      ${imageUploadField('image_file', 'image_url', item.image_url, kind, 'صورة البطاقة')}
      ${field('النص البديل بالعربية', 'image_alt_ar', item.image_alt_ar, { required: false })}
      ${field('النص البديل بالإنجليزية', 'image_alt_en', item.image_alt_en, { required: false })}
      ${field('شارة بالعربية', 'badge_ar', item.badge_ar, { required: false })}
      ${field('شارة بالإنجليزية', 'badge_en', item.badge_en, { required: false })}
      ${field('التقييم', 'rating', item.rating, { type: 'number', required: false, step: '0.1', hint: 'من 0 إلى 5.' })}
      ${field('المزايا', 'highlights', Array.isArray(item.highlights) ? item.highlights.join('\n') : '', { textarea: true, full: true, required: false, hint: 'اكتب ميزة واحدة في كل سطر.' })}
      ${field('وصف السعر بالعربية', 'price_label_ar', item.price_label_ar, { full: true })}
      ${field('وصف السعر بالإنجليزية', 'price_label_en', item.price_label_en, { full: true })}
      ${meta.featured ? checkField('إظهار كعنصر مميز', 'is_featured', item.is_featured) : ''}
    ` : `${field('فئة الأيقونة', 'icon_class', item.icon_class, { hint: 'مثال: fa-plane أو fa-hotel.' })}`;
    const dialog = openDialog(`${isNew ? 'إضافة' : 'تعديل'} ${meta.singular}`, 'الحفظ كمسودة لا ينشر المحتوى. النشر يعرضه لزوار الموقع عند اكتمال الربط العام.', `<form id="item-editor" class="form-grid" novalidate>${common}${media}</form>`, `<button type="button" class="btn" data-close-dialog>إلغاء</button><button type="button" class="btn" data-action="save-item" data-kind="${kind}" data-id="${item.id || ''}" data-mode="draft"><i class="fa-solid fa-floppy-disk"></i> حفظ كمسودة</button><button type="button" class="btn btn-primary" data-action="save-item" data-kind="${kind}" data-id="${item.id || ''}" data-mode="published"><i class="fa-solid fa-paper-plane"></i> نشر</button>`);
    dialog.dataset.kind = kind;
  }

  function itemPayloadFromForm(kind, form, mode) {
    const data = new FormData(form);
    const meta = collectionMeta[kind];
    const value = (name) => String(data.get(name) || '').trim();
    const payload = {
      slug: value('slug'), title_ar: value('title_ar'), title_en: value('title_en'),
      description_ar: value('description_ar'), description_en: value('description_en'),
      status: mode, is_active: data.has('is_active'), sort_order: Number(value('sort_order') || 0)
    };
    if (meta.categories.length) payload.category = value('category');
    if (meta.image) {
      const ratingRaw = value('rating');
      payload.image_url = value('image_url'); payload.image_alt_ar = value('image_alt_ar') || null; payload.image_alt_en = value('image_alt_en') || null;
      payload.badge_ar = value('badge_ar') || null; payload.badge_en = value('badge_en') || null;
      payload.rating = ratingRaw ? Number(ratingRaw) : null;
      payload.highlights = value('highlights').split('\n').map((line) => line.trim()).filter(Boolean);
      payload.price_label_ar = value('price_label_ar'); payload.price_label_en = value('price_label_en');
      if (meta.featured) payload.is_featured = data.has('is_featured');
    } else { payload.icon_class = value('icon_class'); }
    return payload;
  }

  async function saveItem(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#item-editor');
    if (!form.reportValidity()) return;
    const kind = button.dataset.kind;
    const meta = collectionMeta[kind];
    button.disabled = true;
    try {
      const imageFile = form.querySelector('[name="image_file"]')?.files?.[0];
      if (imageFile) {
        button.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> جارٍ رفع الصورة…';
        const upload = await client.uploadImage(imageFile, kind);
        form.querySelector('[name="image_url"]').value = upload.publicUrl;
      }
      const payload = itemPayloadFromForm(kind, form, button.dataset.mode);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) throw new Error('صيغة المعرّف غير صحيحة. استخدم حروفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.');
      if (meta.image && !payload.image_url) throw new Error('ارفع صورة للبطاقة قبل الحفظ.');
      if (payload.rating !== null && (payload.rating < 0 || payload.rating > 5)) throw new Error('التقييم غير صحيح. أدخل قيمة بين 0 و5.');
      if (button.dataset.id) await client.update(meta.table, button.dataset.id, payload); else await client.create(meta.table, payload);
      dialog.close();
      showToast('success', button.dataset.mode === 'published' ? 'تم نشر المحتوى' : 'تم حفظ المسودة', `${meta.singular} جاهز للمراجعة.`);
      await renderCollection(kind);
    } catch (error) {
      showToast('error', 'تعذر حفظ التغييرات', error.message);
      button.disabled = false;
    }
  }

  async function updateItemAction(kind, id, action) {
    const meta = collectionMeta[kind];
    const item = (state.collections[kind] || []).find((row) => row.id === id);
    if (!item) return;
    const isArchive = action === 'archive';
    if (isArchive && !window.confirm(`هل تريد أرشفة ${item.title_ar}؟ لن يظهر للزوار بعد الربط العام.`)) return;
    try {
      if (action === 'featured') await client.update(meta.table, id, { is_featured: !item.is_featured });
      if (action === 'archive') await client.update(meta.table, id, { is_active: false });
      if (action === 'restore') await client.update(meta.table, id, { is_active: true });
      showToast('success', 'تم تحديث العنصر', action === 'archive' ? 'تمت الأرشفة.' : action === 'restore' ? 'تمت إعادة التفعيل.' : 'تم تحديث حالة التمييز.');
      await renderCollection(kind);
    } catch (error) { showToast('error', 'تعذر تحديث العنصر', error.message); }
  }

  async function deleteItem(kind, id) {
    const meta = collectionMeta[kind];
    const item = (state.collections[kind] || []).find((row) => row.id === id);
    if (!item) return;
    const offerNote = kind === 'packages' || kind === 'services' ? '\nسيُحذف أيضًا أي عرض سعر مرتبط بهذا العنصر.' : kind === 'destinations' ? '\nلا يمكن حذف الوجهة إن كانت مرتبطة بعروض أسعار؛ احذف العروض أو غيّر وجهتها أولًا.' : '';
    if (!window.confirm(`هل تريد حذف ${meta.singular} «${item.title_ar}» نهائيًا؟\nلا يمكن التراجع عن هذا الإجراء.${offerNote}`)) return;
    try {
      await client.remove(meta.table, id);
      showToast('success', 'تم حذف العنصر', `حُذفت ${meta.singular} من قاعدة البيانات.`);
      await renderCollection(kind);
    } catch (error) { showToast('error', 'تعذر حذف العنصر', error.message); }
  }

  const offerModes = [['quote', 'طلب عرض سعر'], ['fixed', 'سعر ثابت'], ['starting_from', 'يبدأ من'], ['discount', 'خصم']];
  const offerAvailability = [['available', 'متاح'], ['limited', 'مقاعد محدودة'], ['sold_out', 'نفدت المقاعد']];
  const offerStatuses = [['draft', 'مسودة'], ['published', 'منشور'], ['archived', 'مؤرشف']];
  const offerStyles = [['family', 'عائلية'], ['honeymoon', 'شهر عسل'], ['umrah', 'عمرة'], ['budget', 'اقتصادية'], ['vip', 'VIP'], ['custom', 'مخصصة']];

  function optionList(items, selected) {
    return items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
  }

  function money(value) {
    return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function departureMonth(value) {
    return value ? String(value).slice(0, 7) : '';
  }

  function offerSubject(item) {
    const collections = state.pricing || {};
    if (item.package_id) return (collections.packages || []).find((row) => row.id === item.package_id) || { title_ar: 'برنامج غير متاح', title_en: '' };
    return (collections.services || []).find((row) => row.id === item.service_id) || { title_ar: 'خدمة غير متاحة', title_en: '' };
  }

  function offerDestination(item) {
    return (state.pricing?.destinations || []).find((row) => row.id === item.destination_id) || { title_ar: 'وجهة غير متاحة' };
  }

  function offerSubjectOptions(item) {
    const selected = item?.package_id ? `package:${item.package_id}` : item?.service_id ? `service:${item.service_id}` : '';
    const packages = (state.pricing?.packages || []).map((row) => `<option value="package:${row.id}" ${selected === `package:${row.id}` ? 'selected' : ''}>برنامج — ${escapeHtml(row.title_ar)}</option>`).join('');
    const services = (state.pricing?.services || []).map((row) => `<option value="service:${row.id}" ${selected === `service:${row.id}` ? 'selected' : ''}>خدمة — ${escapeHtml(row.title_ar)}</option>`).join('');
    return `<option value="" ${selected ? '' : 'selected'} disabled>اختر برنامجًا أو خدمة</option><optgroup label="البرامج">${packages}</optgroup><optgroup label="الخدمات">${services}</optgroup>`;
  }

  function offerDestinationOptions(selected) {
    return `<option value="" ${selected ? '' : 'selected'} disabled>اختر الوجهة</option>${(state.pricing?.destinations || []).map((row) => `<option value="${row.id}" ${selected === row.id ? 'selected' : ''}>${escapeHtml(row.title_ar)}</option>`).join('')}`;
  }

  function offerStatusMarkup(item) {
    const status = item.status === 'published' ? '<span class="badge badge-published"><i class="fa-solid fa-circle-check"></i> منشور</span>' : item.status === 'archived' ? '<span class="badge badge-archived"><i class="fa-solid fa-box-archive"></i> مؤرشف</span>' : '<span class="badge badge-draft"><i class="fa-solid fa-pen-to-square"></i> مسودة</span>';
    const availability = item.availability === 'available' ? '<span class="badge badge-active">متاح</span>' : item.availability === 'limited' ? '<span class="badge badge-featured">محدود</span>' : '<span class="badge badge-archived">نفد</span>';
    return `<div style="display:flex;gap:.35rem;flex-wrap:wrap">${status}${availability}</div>`;
  }

  function offerPriceText(item) {
    if (item.price_mode === 'quote') return 'طلب عرض سعر';
    if (item.price_mode === 'starting_from') return `يبدأ من ${money(item.price_amount)} ج.م.`;
    if (item.price_mode === 'discount') return `${money(item.discounted_price_amount)} ج.م. بدلًا من ${money(item.price_amount)} ج.م.`;
    return `${money(item.price_amount)} ج.م.`;
  }

  function pricingSheetRows(offers) {
    if (!offers.length) return '<tr><td colspan="11"><div class="empty-state"><div><i class="fa-solid fa-table-cells-large"></i><h3>لا توجد عروض أسعار بعد</h3><p>أضف أول صف ثم احفظه كمسودة أو انشره لتظهر نتيجته في محرك البحث.</p></div></div></td></tr>';
    return offers.map((item) => {
      const subject = offerSubject(item);
      const destination = offerDestination(item);
      return `<tr data-offer-id="${item.id}">
        <td><select class="select sheet-select" data-offer-field="subject">${offerSubjectOptions(item)}</select><small class="muted">${escapeHtml(subject.title_en || '')}</small></td>
        <td><select class="select sheet-select" data-offer-field="destination_id">${offerDestinationOptions(item.destination_id)}</select><small class="muted">${escapeHtml(destination.title_ar)}</small></td>
        <td><select class="select sheet-select" data-offer-field="trip_style">${optionList(offerStyles, item.trip_style)}</select></td>
        <td><input class="input sheet-input" data-offer-field="departure_month" type="month" value="${escapeHtml(departureMonth(item.departure_month))}" aria-label="شهر السفر"></td>
        <td><div style="display:flex;gap:.4rem"><input class="input sheet-input" data-offer-field="min_travelers" type="number" min="1" value="${item.min_travelers}" aria-label="الحد الأدنى للمسافرين"><input class="input sheet-input" data-offer-field="max_travelers" type="number" min="1" value="${item.max_travelers}" aria-label="الحد الأقصى للمسافرين"></div></td>
        <td><select class="select sheet-select" data-offer-field="price_mode">${optionList(offerModes, item.price_mode)}</select></td>
        <td><input class="input sheet-input" data-offer-field="price_amount" type="number" min="0" step="0.01" value="${item.price_amount ?? ''}" aria-label="السعر للفرد بالجنيه المصري"><small class="muted">ج.م./فرد</small></td>
        <td><input class="input sheet-input" data-offer-field="discounted_price_amount" type="number" min="0" step="0.01" value="${item.discounted_price_amount ?? ''}" aria-label="سعر الخصم للفرد بالجنيه المصري"><small class="muted">ج.م./فرد</small></td>
        <td><select class="select sheet-select" data-offer-field="availability">${optionList(offerAvailability, item.availability)}</select><input class="input sheet-input" data-offer-field="seats_available" type="number" min="0" value="${item.seats_available ?? ''}" placeholder="المقاعد" aria-label="المقاعد المتاحة"></td>
        <td><select class="select sheet-select" data-offer-field="status">${optionList(offerStatuses, item.status)}</select><div style="margin-top:.35rem">${offerStatusMarkup(item)}</div></td>
        <td><div class="table-actions"><button class="btn btn-small" type="button" data-action="preview-offer" data-id="${item.id}" aria-label="معاينة العرض"><i class="fa-regular fa-eye"></i></button><button class="btn btn-small" type="button" data-action="edit-offer" data-id="${item.id}" aria-label="تفاصيل العرض"><i class="fa-solid fa-pen"></i></button><button class="btn btn-small btn-danger" type="button" data-action="delete-offer" data-id="${item.id}" aria-label="حذف عرض السعر"><i class="fa-solid fa-trash"></i></button><button class="btn btn-primary btn-small" type="button" data-action="save-offer-row" data-id="${item.id}"><i class="fa-solid fa-floppy-disk"></i> حفظ</button></div></td>
      </tr>`;
    }).join('');
  }

  function pricingSheet(offers) {
    return `<div class="table-scroll"><table class="pricing-sheet"><thead><tr><th>البرنامج / الخدمة</th><th>الوجهة</th><th>نوع الرحلة</th><th>شهر السفر</th><th>المسافرون<br><small>من / إلى</small></th><th>طريقة السعر</th><th>السعر للفرد</th><th>سعر الخصم</th><th>التوفر والمقاعد</th><th>حالة النشر</th><th>إجراءات</th></tr></thead><tbody>${pricingSheetRows(offers)}</tbody></table></div>`;
  }

  function filteredOffers(query) {
    const term = String(query || '').trim().toLowerCase();
    if (!term) return state.pricing?.offers || [];
    return (state.pricing?.offers || []).filter((item) => {
      const subject = offerSubject(item);
      const destination = offerDestination(item);
      return `${subject.title_ar} ${subject.title_en} ${destination.title_ar} ${item.departure_month} ${item.trip_style}`.toLowerCase().includes(term);
    });
  }

  async function renderPricing() {
    app.innerHTML = layout(`${pageHeader('جدول أسعار محرك البحث', 'أدخل عروضًا لكل برنامج أو خدمة ثم احفظها كمسودة أو انشرها لتصل إلى محرك البحث.')}${loadingMarkup('جارٍ تحميل جدول الأسعار…')}`);
    try {
      const [offers, packages, destinations, services] = await Promise.all([
        client.list('pricing_offers', { order: 'departure_month.desc,sort_order.asc,updated_at.desc' }),
        client.list('packages', { order: 'sort_order.asc,title_ar.asc' }),
        client.list('destinations', { order: 'sort_order.asc,title_ar.asc' }),
        client.list('services', { order: 'sort_order.asc,title_ar.asc' })
      ]);
      state.pricing = { offers, packages, destinations, services };
      const content = `${pageHeader('جدول أسعار محرك البحث', 'كل صف هو عرض حقيقي مستقل. يُظهر المحرك العام العروض المنشورة والمتاحة فقط.', '<button class="btn btn-primary" type="button" data-action="new-offer"><i class="fa-solid fa-plus"></i> إضافة صف سعر</button>')}
        <section class="panel table-card"><div class="panel-head"><div><h3 class="panel-title">ورقة الأسعار المباشرة</h3><p class="panel-subtitle">عدّل الخانات مباشرة كجدول Excel ثم اضغط حفظ في الصف. العملة ثابتة بالجنيه المصري والسعر لكل مسافر.</p></div><span class="badge badge-active"><i class="fa-solid fa-database"></i> ${offers.length} عرض</span></div>
          <div class="toolbar"><div class="search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input id="pricing-search" class="input" type="search" placeholder="ابحث بالبرنامج أو الخدمة أو الوجهة أو الشهر…"></div><span class="muted">العروض المنشورة والمتاحة فقط تظهر للزائر.</span></div>
          <div id="pricing-sheet">${pricingSheet(offers)}</div>
        </section>`;
      app.innerHTML = layout(content);
      document.getElementById('pricing-search')?.addEventListener('input', (event) => { document.getElementById('pricing-sheet').innerHTML = pricingSheet(filteredOffers(event.target.value)); });
    } catch (error) { app.innerHTML = layout(`${pageHeader('جدول أسعار محرك البحث', '')}${errorMarkup(error.message)}`); }
  }

  function offerValue(container, name) {
    return String(container.querySelector(`[data-offer-field="${name}"]`)?.value || '').trim();
  }

  function offerPayload(container, statusOverride) {
    const subject = offerValue(container, 'subject');
    const [subjectType, subjectId] = subject.split(':');
    const departure = offerValue(container, 'departure_month');
    const mode = offerValue(container, 'price_mode');
    const priceRaw = offerValue(container, 'price_amount');
    const discountRaw = offerValue(container, 'discounted_price_amount');
    const minTravelers = Number(offerValue(container, 'min_travelers'));
    const maxTravelers = Number(offerValue(container, 'max_travelers'));
    const seatsRaw = offerValue(container, 'seats_available');
    const availability = offerValue(container, 'availability');
    const price = priceRaw === '' ? null : Number(priceRaw);
    const discounted = discountRaw === '' ? null : Number(discountRaw);
    if (!subjectId || !['package', 'service'].includes(subjectType)) throw new Error('اختر برنامجًا أو خدمة للعرض.');
    if (!offerValue(container, 'destination_id') || !/^\d{4}-\d{2}$/.test(departure)) throw new Error('اختر الوجهة وشهر السفر.');
    if (!Number.isInteger(minTravelers) || !Number.isInteger(maxTravelers) || minTravelers < 1 || maxTravelers < minTravelers) throw new Error('حدّد عدد المسافرين بشكل صحيح.');
    if ((mode === 'fixed' || mode === 'starting_from') && (price === null || price < 0)) throw new Error('السعر الأساسي مطلوب لهذا النوع من التسعير.');
    if (mode === 'discount' && (price === null || discounted === null || price < 0 || discounted < 0 || discounted >= price)) throw new Error('سعر الخصم يجب أن يكون أقل من السعر الأساسي.');
    return {
      package_id: subjectType === 'package' ? subjectId : null,
      service_id: subjectType === 'service' ? subjectId : null,
      destination_id: offerValue(container, 'destination_id'),
      trip_style: offerValue(container, 'trip_style'),
      departure_month: `${departure}-01`,
      min_travelers: minTravelers,
      max_travelers: maxTravelers,
      pricing_unit: 'per_traveler',
      price_mode: mode,
      price_amount: mode === 'quote' ? null : price,
      discounted_price_amount: mode === 'discount' ? discounted : null,
      currency: 'EGP',
      availability,
      seats_available: availability === 'sold_out' ? 0 : (seatsRaw === '' ? null : Number(seatsRaw)),
      notes_ar: offerValue(container, 'notes_ar') || null,
      notes_en: offerValue(container, 'notes_en') || null,
      status: statusOverride || offerValue(container, 'status'),
      sort_order: Number(offerValue(container, 'sort_order') || 0)
    };
  }

  function offerEditorBody(item) {
    const offer = item || { package_id: '', service_id: '', destination_id: '', trip_style: 'custom', departure_month: '', min_travelers: 1, max_travelers: 4, price_mode: 'fixed', price_amount: '', discounted_price_amount: '', availability: 'available', seats_available: '', status: 'draft', sort_order: 0, notes_ar: '', notes_en: '' };
    return `<form id="offer-editor" class="form-grid" novalidate>
      <div class="field full"><label for="field-subject">البرنامج أو الخدمة</label><select id="field-subject" class="select" data-offer-field="subject" required>${offerSubjectOptions(offer)}</select><span class="field-hint">كل عرض مرتبط ببرنامج واحد أو خدمة واحدة فقط.</span></div>
      <div class="field"><label for="field-destination_id">الوجهة</label><select id="field-destination_id" class="select" data-offer-field="destination_id" required>${offerDestinationOptions(offer.destination_id)}</select></div>
      <div class="field"><label for="field-trip_style">نوع الرحلة</label><select id="field-trip_style" class="select" data-offer-field="trip_style">${optionList(offerStyles, offer.trip_style)}</select></div>
      <div class="field"><label for="field-departure_month">شهر السفر</label><input id="field-departure_month" class="input" data-offer-field="departure_month" type="month" value="${escapeHtml(departureMonth(offer.departure_month))}" required></div>
      <div class="field"><label for="field-min_travelers">أقل عدد للمسافرين</label><input id="field-min_travelers" class="input" data-offer-field="min_travelers" type="number" min="1" value="${offer.min_travelers}" required></div>
      <div class="field"><label for="field-max_travelers">أقصى عدد للمسافرين</label><input id="field-max_travelers" class="input" data-offer-field="max_travelers" type="number" min="1" value="${offer.max_travelers}" required></div>
      <div class="field"><label for="field-price_mode">طريقة السعر</label><select id="field-price_mode" class="select" data-offer-field="price_mode">${optionList(offerModes, offer.price_mode)}</select></div>
      <div class="field"><label for="field-price_amount">السعر للفرد (EGP)</label><input id="field-price_amount" class="input" data-offer-field="price_amount" type="number" min="0" step="0.01" value="${offer.price_amount ?? ''}"></div>
      <div class="field"><label for="field-discounted_price_amount">سعر الخصم للفرد (EGP)</label><input id="field-discounted_price_amount" class="input" data-offer-field="discounted_price_amount" type="number" min="0" step="0.01" value="${offer.discounted_price_amount ?? ''}"></div>
      <div class="field"><label for="field-availability">التوفر</label><select id="field-availability" class="select" data-offer-field="availability">${optionList(offerAvailability, offer.availability)}</select></div>
      <div class="field"><label for="field-seats_available">المقاعد المتاحة</label><input id="field-seats_available" class="input" data-offer-field="seats_available" type="number" min="0" value="${offer.seats_available ?? ''}"></div>
      <div class="field"><label for="field-status">حالة النشر</label><select id="field-status" class="select" data-offer-field="status">${optionList(offerStatuses, offer.status)}</select></div>
      <div class="field"><label for="field-sort_order">ترتيب العرض</label><input id="field-sort_order" class="input" data-offer-field="sort_order" type="number" min="0" value="${offer.sort_order || 0}"></div>
      <div class="field full"><label for="field-notes_ar">ملاحظات العرض بالعربية</label><textarea id="field-notes_ar" class="textarea" data-offer-field="notes_ar" placeholder="مثال: السعر لا يشمل التأشيرة.">${escapeHtml(offer.notes_ar || '')}</textarea></div>
      <div class="field full"><label for="field-notes_en">Offer notes in English</label><textarea id="field-notes_en" class="textarea" data-offer-field="notes_en" dir="ltr" placeholder="Example: Visa fees are excluded.">${escapeHtml(offer.notes_en || '')}</textarea></div>
    </form>`;
  }

  function openOfferEditor(item) {
    const isNew = !item;
    openDialog(isNew ? 'إضافة صف سعر جديد' : 'تفاصيل عرض السعر', 'احفظه كمسودة للمراجعة أو انشره بعد التحقق. سيظهر للزائر فقط إذا كان منشورًا ومتوافرًا.', offerEditorBody(item), `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn" type="button" data-action="save-offer-editor" data-id="${item?.id || ''}" data-status="draft"><i class="fa-solid fa-floppy-disk"></i> حفظ كمسودة</button><button class="btn btn-primary" type="button" data-action="save-offer-editor" data-id="${item?.id || ''}" data-status="published"><i class="fa-solid fa-paper-plane"></i> نشر</button>`);
  }

  async function saveOfferRow(button) {
    const row = button.closest('tr');
    try {
      const payload = offerPayload(row);
      button.disabled = true;
      await client.update('pricing_offers', button.dataset.id, payload);
      showToast('success', 'تم حفظ صف السعر', 'تم تحديث العرض في قاعدة البيانات المركزية.');
      await renderPricing();
    } catch (error) { showToast('error', 'تعذر حفظ صف السعر', error.message); button.disabled = false; }
  }

  async function deleteOffer(id) {
    const offer = (state.pricing?.offers || []).find((item) => item.id === id);
    if (!offer) return;
    const subject = offerSubject(offer);
    if (!window.confirm(`هل تريد حذف عرض السعر المرتبط بـ «${subject.title_ar}» نهائيًا؟\nلن يظهر هذا العرض في محرك البحث بعد الحذف.`)) return;
    try {
      await client.remove('pricing_offers', id);
      showToast('success', 'تم حذف عرض السعر', 'أُزيل العرض من محرك البحث وقاعدة البيانات.');
      await renderPricing();
    } catch (error) { showToast('error', 'تعذر حذف عرض السعر', error.message); }
  }

  async function saveOfferEditor(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#offer-editor');
    if (!form.reportValidity()) return;
    try {
      const payload = offerPayload(form, button.dataset.status);
      button.disabled = true;
      if (button.dataset.id) await client.update('pricing_offers', button.dataset.id, payload); else await client.create('pricing_offers', payload);
      dialog.close();
      showToast('success', button.dataset.status === 'published' ? 'تم نشر عرض السعر' : 'تم حفظ عرض السعر كمسودة', 'أصبح العرض محفوظًا في Supabase.');
      await renderPricing();
    } catch (error) { showToast('error', 'تعذر حفظ عرض السعر', error.message); button.disabled = false; }
  }

  function openOfferPreview(item) {
    const subject = offerSubject(item);
    const destination = offerDestination(item);
    const travelers = `${item.min_travelers}–${item.max_travelers} مسافرين`;
    openDialog(`معاينة: ${subject.title_ar}`, 'هذه المعاينة تمثل البطاقة التي قد يراها العميل بعد نشر العرض.', `<article class="preview-card"><div class="preview-copy"><span class="badge badge-featured">${escapeHtml(offerDestination(item).title_ar)}</span><h4>${escapeHtml(subject.title_ar)}</h4><p>شهر السفر: ${escapeHtml(departureMonth(item.departure_month))} · ${escapeHtml(travelers)}</p><p class="preview-price">${escapeHtml(offerPriceText(item))}</p>${item.notes_ar ? `<p>${escapeHtml(item.notes_ar)}</p>` : ''}<div style="margin-top:1rem">${offerStatusMarkup(item)}</div></div></article>`, '<button class="btn" type="button" data-close-dialog>إغلاق</button>');
  }

  async function renderSettings() {
    app.innerHTML = layout(`${pageHeader('إعدادات الموقع', 'الإعدادات الحالية من Supabase فقط.')}${loadingMarkup('جارٍ تحميل الإعدادات…')}`);
    try {
      const settings = await client.list('site_settings', { order: 'setting_key.asc' });
      state.collections.settings = settings;
      const content = `${pageHeader('إعدادات الموقع', 'الإعدادات الحالية من Supabase فقط.')}
        <section class="panel"><div class="panel-head"><div><h3 class="panel-title">الإعدادات المسجلة</h3><p class="panel-subtitle">حدّث قيمة JSON بحذر للحفاظ على بنية بيانات الموقع الحالية.</p></div><span class="badge badge-active"><i class="fa-solid fa-database"></i> مصدر مركزي</span></div>
          ${settings.length ? `<div style="display:grid;gap:1rem;margin-top:1rem">${settings.map((item) => `<article class="editor-card" style="padding:1rem"><div class="panel-head"><div><h4 style="margin:0">${escapeHtml(item.setting_key)}</h4><p class="panel-subtitle">${item.is_public ? 'إعداد عام قابل للقراءة' : 'إعداد إداري خاص'}</p></div><button class="btn btn-small" data-action="edit-setting" data-key="${escapeHtml(item.setting_key)}"><i class="fa-solid fa-pen"></i> تعديل</button></div><pre style="overflow:auto;max-height:10rem;margin:1rem 0 0;padding:.75rem;background:#f8fafc;border-radius:.75rem;font:600 .75rem/1.6 var(--font-english);direction:ltr;text-align:left">${escapeJson(item.value)}</pre></article>`).join('')}</div>` : '<div class="empty-state"><div><i class="fa-solid fa-sliders"></i><h3>لا توجد إعدادات مسجلة</h3><p>لم يضف الموقع الحالي إعدادات قابلة للإدارة بعد.</p></div></div>'}
        </section>`;
      app.innerHTML = layout(content);
    } catch (error) { app.innerHTML = layout(`${pageHeader('إعدادات الموقع', '')}${errorMarkup(error.message)}`); }
  }

  function openSettingEditor(setting) {
    openDialog(`تعديل: ${setting.setting_key}`, 'يجب أن تكون القيمة كائن JSON صالحًا.', `<form id="setting-editor" class="form-grid"><div class="field full"><label for="setting-value">القيمة</label><textarea id="setting-value" name="value" class="textarea" dir="ltr" style="min-height:16rem;font-family:var(--font-english)" required>${escapeJson(setting.value)}</textarea><span class="field-hint">لا تعدّل البنية إلا عندما تعرف أثرها على الواجهة المستقبلية.</span></div></form>`, `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn btn-primary" type="button" data-action="save-setting" data-key="${escapeHtml(setting.setting_key)}"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>`);
  }

  async function saveSetting(button) {
    const dialog = button.closest('dialog');
    const fieldElement = dialog.querySelector('#setting-value');
    let value;
    try { value = JSON.parse(fieldElement.value); } catch { showToast('error', 'صيغة JSON غير صحيحة', 'تحقق من الأقواس والفواصل ثم حاول مرة أخرى.'); fieldElement.focus(); return; }
    if (Array.isArray(value) || value === null || typeof value !== 'object') { showToast('error', 'قيمة غير مدعومة', 'يجب أن تكون القيمة كائن JSON وليس قائمة أو نصًا منفردًا.'); return; }
    button.disabled = true;
    try { await client.updateSetting(button.dataset.key, { value }); dialog.close(); showToast('success', 'تم حفظ الإعداد', 'تم تحديث الإعداد المركزي.'); await renderSettings(); } catch (error) { showToast('error', 'تعذر حفظ الإعداد', error.message); button.disabled = false; }
  }

  function blogRoute() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[1] === 'blog' ? parts.slice(2) : [];
  }

  function blogStatusMarkup(post) {
    if (post.status === 'published') return '<span class="badge badge-published"><i class="fa-solid fa-circle-check"></i> منشور</span>';
    if (post.status === 'archived') return '<span class="badge badge-archived"><i class="fa-solid fa-box-archive"></i> مؤرشف</span>';
    return '<span class="badge badge-draft"><i class="fa-solid fa-pen-to-square"></i> مسودة</span>';
  }

  function markdownToSafeHtml(markdown) {
    const inline = (value) => escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/gi, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    const lines = String(markdown || '').replace(/\r/g, '').split('\n');
    const output = [];
    let list = [];
    const flushList = () => { if (list.length) { output.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`); list = []; } };
    lines.forEach((line) => {
      if (/^[-*]\s+/.test(line)) { list.push(line.replace(/^[-*]\s+/, '')); return; }
      flushList();
      if (!line.trim()) return;
      if (/^###\s+/.test(line)) output.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`);
      else if (/^##\s+/.test(line)) output.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`);
      else if (/^#\s+/.test(line)) output.push(`<h2>${inline(line.replace(/^#\s+/, ''))}</h2>`);
      else if (/^>\s+/.test(line)) output.push(`<blockquote>${inline(line.replace(/^>\s+/, ''))}</blockquote>`);
      else output.push(`<p>${inline(line)}</p>`);
    });
    flushList();
    return output.join('') || '<p>لا يوجد محتوى بعد.</p>';
  }

  function blogCategoryOptions(selected) {
    return `<option value="" disabled ${selected ? '' : 'selected'}>اختر التصنيف</option>${(state.blog?.categories || []).filter((category) => category.status === 'active').map((category) => `<option value="${category.id}" ${selected === category.id ? 'selected' : ''}>${escapeHtml(category.title_ar)} / ${escapeHtml(category.title_en)}</option>`).join('')}`;
  }

  function blogListRows(posts) {
    if (!posts.length) return '<div class="empty-state"><div><i class="fa-solid fa-newspaper"></i><h3>لا توجد مقالات مطابقة</h3><p>ابدأ بمسودة جديدة ثم راجعها وانشرها عند الجاهزية.</p></div></div>';
    return `<div class="table-scroll"><table><thead><tr><th>المقال</th><th>التصنيف</th><th>الحالة</th><th>النشر / التحديث</th><th><span class="sr-only">إجراءات</span></th></tr></thead><tbody>${posts.map((post) => `<tr><td><div class="row-title">${post.featured_image_url ? `<img class="row-image" src="${escapeHtml(safeUrl(post.featured_image_url))}" alt="" onerror="this.style.visibility='hidden'">` : '<span class="row-image" aria-hidden="true"><i class="fa-solid fa-newspaper"></i></span>'}<span><strong>${escapeHtml(post.title_ar)}</strong><span>${escapeHtml(post.title_en)}</span></span></div></td><td>${escapeHtml(post.blog_categories?.title_ar || '—')}</td><td><div style="display:flex;gap:.35rem;flex-wrap:wrap">${blogStatusMarkup(post)}${post.is_featured ? '<span class="badge badge-featured"><i class="fa-solid fa-star"></i> مميز</span>' : ''}</div></td><td><span class="muted">${post.published_at ? `نشر: ${formatDate(post.published_at)}` : `تحديث: ${formatDate(post.updated_at)}`}</span></td><td><div class="table-actions"><button class="btn btn-small" data-action="preview-blog" data-id="${post.id}" aria-label="معاينة المقال"><i class="fa-regular fa-eye"></i></button><button class="btn btn-small" data-action="edit-blog" data-id="${post.id}" aria-label="تعديل المقال"><i class="fa-solid fa-pen"></i></button>${post.status !== 'published' ? `<button class="btn btn-small" data-action="publish-blog" data-id="${post.id}" aria-label="نشر المقال"><i class="fa-solid fa-upload"></i></button>` : `<button class="btn btn-small" data-action="archive-blog" data-id="${post.id}" aria-label="أرشفة المقال"><i class="fa-solid fa-box-archive"></i></button>`}<button class="btn btn-small btn-danger" data-action="delete-blog" data-id="${post.id}" aria-label="حذف المقال"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('')}</tbody></table></div>`;
  }

  function openBlogEditor(post) {
    const current = post || { status: 'draft', is_featured: false, sort_order: 0, excerpt_ar: '', excerpt_en: '', content_ar: '', content_en: '', featured_image_url: '', featured_image_alt_ar: '', featured_image_alt_en: '', seo_title_ar: '', seo_title_en: '', seo_description_ar: '', seo_description_en: '', og_image_url: '' };
    const editor = `<form id="blog-editor" class="form-grid"><div class="field"><label for="blog-slug">المعرّف بالرابط (Slug)</label><input id="blog-slug" name="slug" class="input" dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" value="${escapeHtml(current.slug || '')}" placeholder="best-time-to-visit-egypt" required><span class="field-hint">إنجليزي صغير وشرطات فقط. لا يُغيَّر الرابط المنشور بلا ضرورة.</span></div><div class="field"><label for="blog-category">التصنيف</label><select id="blog-category" name="category_id" class="select" required>${blogCategoryOptions(current.category_id)}</select></div><div class="field"><label for="blog-title-ar">العنوان بالعربية</label><input id="blog-title-ar" name="title_ar" class="input" value="${escapeHtml(current.title_ar || '')}" required></div><div class="field"><label for="blog-title-en">العنوان بالإنجليزية</label><input id="blog-title-en" name="title_en" class="input" dir="ltr" value="${escapeHtml(current.title_en || '')}" required></div>${imageUploadField('blog_image_file', 'featured_image_url', current.featured_image_url, 'blog', 'صورة غلاف المقال')}<div class="field"><label for="blog-image-alt-ar">وصف الصورة بالعربية</label><input id="blog-image-alt-ar" name="featured_image_alt_ar" class="input" value="${escapeHtml(current.featured_image_alt_ar || '')}"></div><div class="field"><label for="blog-image-alt-en">وصف الصورة بالإنجليزية</label><input id="blog-image-alt-en" name="featured_image_alt_en" class="input" dir="ltr" value="${escapeHtml(current.featured_image_alt_en || '')}"></div><div class="field full"><label for="blog-excerpt-ar">الملخص بالعربية</label><textarea id="blog-excerpt-ar" name="excerpt_ar" class="textarea" required>${escapeHtml(current.excerpt_ar || '')}</textarea></div><div class="field full"><label for="blog-excerpt-en">الملخص بالإنجليزية</label><textarea id="blog-excerpt-en" name="excerpt_en" class="textarea" dir="ltr" required>${escapeHtml(current.excerpt_en || '')}</textarea></div><div class="field full"><label for="blog-content-ar">المقال بالعربية (Markdown آمن)</label><textarea id="blog-content-ar" name="content_ar" class="textarea" style="min-height:14rem" required>${escapeHtml(current.content_ar || '')}</textarea><span class="field-hint">يدعم العناوين والفقـرات والقوائم والروابط والاقتباسات والتأكيد، ولا يقبل HTML خامًا.</span></div><div class="field full"><label for="blog-content-en">المقال بالإنجليزية (Markdown آمن)</label><textarea id="blog-content-en" name="content_en" class="textarea" dir="ltr" style="min-height:14rem" required>${escapeHtml(current.content_en || '')}</textarea></div><div class="field"><label for="blog-seo-ar">عنوان SEO بالعربية</label><input id="blog-seo-ar" name="seo_title_ar" class="input" value="${escapeHtml(current.seo_title_ar || '')}"></div><div class="field"><label for="blog-seo-en">عنوان SEO بالإنجليزية</label><input id="blog-seo-en" name="seo_title_en" class="input" dir="ltr" value="${escapeHtml(current.seo_title_en || '')}"></div><div class="field"><label for="blog-seo-description-ar">وصف SEO بالعربية</label><textarea id="blog-seo-description-ar" name="seo_description_ar" class="textarea">${escapeHtml(current.seo_description_ar || '')}</textarea></div><div class="field"><label for="blog-seo-description-en">وصف SEO بالإنجليزية</label><textarea id="blog-seo-description-en" name="seo_description_en" class="textarea" dir="ltr">${escapeHtml(current.seo_description_en || '')}</textarea></div><div class="field"><label for="blog-og-image">صورة Open Graph</label><input id="blog-og-image" name="og_image_url" class="input" type="url" dir="ltr" value="${escapeHtml(current.og_image_url || '')}" placeholder="اختياري؛ يستعمل الغلاف افتراضيًا"></div><div class="field"><label for="blog-sort">ترتيب الظهور</label><input id="blog-sort" name="sort_order" class="input" type="number" min="0" value="${Number(current.sort_order || 0)}"></div><div class="field full"><label class="check-label"><input type="checkbox" name="is_featured" ${current.is_featured ? 'checked' : ''}> <span>تعيين المقال كعنصر مميز عند النشر</span></label></div></form>`;
    openDialog(post ? 'تعديل المقال' : 'مقال جديد', 'احفظ مسودة أولًا أو انشر بعد استكمال المحتوى الثنائي اللغة.', editor, `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn" type="button" data-action="save-blog" data-status="draft" data-id="${post?.id || ''}"><i class="fa-solid fa-floppy-disk"></i> حفظ مسودة</button><button class="btn btn-primary" type="button" data-action="save-blog" data-status="published" data-id="${post?.id || ''}"><i class="fa-solid fa-upload"></i> نشر</button>`);
  }

  function blogPayload(form, status, existing) {
    const values = Object.fromEntries(new FormData(form).entries());
    const slug = String(values.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('صيغة الرابط غير صحيحة. استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.');
    const required = ['title_ar', 'title_en', 'category_id'];
    if (status === 'published') required.push('excerpt_ar', 'excerpt_en', 'content_ar', 'content_en');
    if (required.some((field) => !String(values[field] || '').trim())) throw new Error('أكمل الحقول المطلوبة قبل النشر.');
    // Image URLs are normally populated by the secure Supabase Storage uploader. Keep optional URLs
    // non-blocking so a valid uploader result or existing asset never prevents saving an article.
    const optionalUrl = (value) => String(value || '').trim() || null;
    return { slug, title_ar: values.title_ar.trim(), title_en: values.title_en.trim(), excerpt_ar: values.excerpt_ar.trim(), excerpt_en: values.excerpt_en.trim(), content_ar: values.content_ar.trim(), content_en: values.content_en.trim(), featured_image_url: optionalUrl(values.featured_image_url), featured_image_alt_ar: values.featured_image_alt_ar.trim() || null, featured_image_alt_en: values.featured_image_alt_en.trim() || null, category_id: values.category_id, status, is_featured: Boolean(form.querySelector('[name="is_featured"]')?.checked) && status === 'published', sort_order: Math.max(0, Number(values.sort_order || 0)), seo_title_ar: values.seo_title_ar.trim() || null, seo_title_en: values.seo_title_en.trim() || null, seo_description_ar: values.seo_description_ar.trim() || null, seo_description_en: values.seo_description_en.trim() || null, og_image_url: optionalUrl(values.og_image_url), author_id: existing?.author_id || state.auth.session?.user?.id || null, updated_by: state.auth.session?.user?.id || null, ...(status === 'published' ? { published_at: existing?.published_at || new Date().toISOString() } : {}) };
  }

  async function saveBlog(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#blog-editor');
    const existing = (state.blog?.posts || []).find((post) => post.id === button.dataset.id) || null;
    button.disabled = true;
    try {
      const imageFile = form.querySelector('[name="blog_image_file"]')?.files?.[0];
      if (imageFile) {
        button.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> جارٍ رفع الغلاف…';
        const upload = await client.uploadImage(imageFile, 'blog');
        form.querySelector('[name="featured_image_url"]').value = upload.publicUrl;
      }
      const payload = blogPayload(form, button.dataset.status, existing);
      if (button.dataset.status === 'published' && !payload.featured_image_url) throw new Error('ارفع صورة غلاف للمقال قبل النشر.');
      if (existing) await client.update('blog_posts', existing.id, payload); else await client.create('blog_posts', payload);
      dialog.close();
      showToast('success', button.dataset.status === 'published' ? 'تم نشر المقال' : 'تم حفظ المسودة', 'تُعرض المقالات المنشورة فقط للزائر.');
      await renderBlog();
    } catch (error) {
      showToast('error', 'تعذر حفظ المقال', error.message);
      button.disabled = false;
    }
  }

  function openBlogPreview(post) {
    const image = safeUrl(post.featured_image_url);
    openDialog('معاينة إدارية للمقال', 'هذه المعاينة لا تنشر المقال ولا تجعله متاحًا للزوار.', `<article class="blog-preview" dir="rtl">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.featured_image_alt_ar || '')}" style="width:100%;max-height:18rem;object-fit:cover;border-radius:1rem">` : ''}<p class="muted" style="margin-top:1rem">${escapeHtml(post.blog_categories?.title_ar || '')} · ${formatDate(post.published_at || post.updated_at)}</p><h2>${escapeHtml(post.title_ar)}</h2><p class="lead">${escapeHtml(post.excerpt_ar)}</p><div class="prose">${markdownToSafeHtml(post.content_ar)}</div><hr><div dir="ltr" style="text-align:left"><h2>${escapeHtml(post.title_en)}</h2><p class="lead">${escapeHtml(post.excerpt_en)}</p><div class="prose">${markdownToSafeHtml(post.content_en)}</div></div></article>`, '<button class="btn btn-primary" type="button" data-close-dialog>إغلاق</button>');
  }

  function categoryRows(categories) {
    if (!categories.length) return '<div class="empty-state"><div><i class="fa-solid fa-folder-tree"></i><h3>لا توجد تصنيفات</h3><p>أضف تصنيفًا صغيرًا ومحددًا قبل إنشاء المقالات.</p></div></div>';
    return `<div class="table-scroll"><table><thead><tr><th>التصنيف</th><th>الرابط</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${categories.map((category) => `<tr><td><strong>${escapeHtml(category.title_ar)}</strong><br><span class="muted">${escapeHtml(category.title_en)}</span></td><td dir="ltr">${escapeHtml(category.slug)}</td><td>${category.status === 'active' ? '<span class="badge badge-published">نشط</span>' : '<span class="badge badge-archived">مؤرشف</span>'}</td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-blog-category" data-id="${category.id}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-small" data-action="toggle-blog-category" data-id="${category.id}"><i class="fa-solid fa-box-archive"></i></button><button class="btn btn-small btn-danger" data-action="delete-blog-category" data-id="${category.id}" aria-label="حذف التصنيف"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('')}</tbody></table></div>`;
  }

  function openCategoryEditor(category) {
    const current = category || { status: 'active', sort_order: 0, description_ar: '', description_en: '' };
    openDialog(category ? 'تعديل التصنيف' : 'تصنيف جديد', 'أبقِ التصنيف قصيرًا وواضحًا لتسهيل ربط المقالات ذات الصلة.', `<form id="blog-category-editor" class="form-grid"><div class="field"><label>الاسم بالعربية</label><input class="input" name="title_ar" value="${escapeHtml(current.title_ar || '')}" required></div><div class="field"><label>الاسم بالإنجليزية</label><input class="input" dir="ltr" name="title_en" value="${escapeHtml(current.title_en || '')}" required></div><div class="field"><label>الرابط</label><input class="input" dir="ltr" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" value="${escapeHtml(current.slug || '')}" required></div><div class="field"><label>الترتيب</label><input class="input" type="number" min="0" name="sort_order" value="${Number(current.sort_order || 0)}"></div><div class="field full"><label>وصف بالعربية</label><textarea class="textarea" name="description_ar">${escapeHtml(current.description_ar || '')}</textarea></div><div class="field full"><label>وصف بالإنجليزية</label><textarea class="textarea" dir="ltr" name="description_en">${escapeHtml(current.description_en || '')}</textarea></div></form>`, `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn btn-primary" type="button" data-action="save-blog-category" data-id="${category?.id || ''}"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>`);
  }

  async function saveBlogCategory(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#blog-category-editor');
    const values = Object.fromEntries(new FormData(form).entries());
    const slug = String(values.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { showToast('error', 'صيغة الرابط غير صحيحة', 'استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.'); return; }
    const existing = (state.blog?.categories || []).find((category) => category.id === button.dataset.id);
    const payload = { slug, title_ar: values.title_ar.trim(), title_en: values.title_en.trim(), description_ar: values.description_ar.trim() || null, description_en: values.description_en.trim() || null, status: existing?.status || 'active', sort_order: Math.max(0, Number(values.sort_order || 0)) };
    button.disabled = true;
    try { if (existing) await client.update('blog_categories', existing.id, payload); else await client.create('blog_categories', payload); dialog.close(); showToast('success', 'تم حفظ التصنيف', 'يمكن الآن ربط المقالات بهذا التصنيف.'); await renderBlog(); } catch (error) { showToast('error', 'تعذر حفظ التصنيف', error.message); button.disabled = false; }
  }

  async function renderBlog() {
    app.innerHTML = layout(loadingMarkup('جارٍ تحميل المدونة…'));
    try {
      const [posts, categories] = await Promise.all([
        client.list('blog_posts', { select: '*,blog_categories(title_ar,title_en,slug)', order: 'updated_at.desc' }),
        client.list('blog_categories', { order: 'sort_order.asc,title_ar.asc' })
      ]);
      state.blog = { posts, categories };
      const route = blogRoute();
      if (route[0] === 'categories') {
        app.innerHTML = layout(`${pageHeader('تصنيفات المدونة', 'تُستخدم التصنيفات النشطة لربط المقالات المتشابهة وإظهار مقالات ذات صلة.', '<button class="btn btn-primary" data-action="new-blog-category"><i class="fa-solid fa-plus"></i> تصنيف جديد</button>')}<section class="panel table-card">${categoryRows(categories)}</section>`);
        return;
      }
      const content = `${pageHeader('إدارة المدونة', 'أنشئ محتوى عربيًا وإنجليزيًا، واحفظه مسودة ثم عاينه أو انشره.', '<div class="quick-actions"><a class="btn" href="/admin/blog/categories/"><i class="fa-solid fa-folder-tree"></i> التصنيفات</a><button class="btn btn-primary" data-action="new-blog"><i class="fa-solid fa-plus"></i> مقال جديد</button></div>')}<div class="toolbar"><div class="search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input id="blog-search" class="input" type="search" placeholder="ابحث بالعنوان أو الرابط أو التصنيف…"></div><span class="muted">${posts.length} مقال</span></div><section class="panel table-card" id="blog-table">${blogListRows(posts)}</section>`;
      app.innerHTML = layout(content);
      document.getElementById('blog-search')?.addEventListener('input', (event) => { const term = event.target.value.toLowerCase().trim(); document.getElementById('blog-table').innerHTML = blogListRows(posts.filter((post) => `${post.title_ar} ${post.title_en} ${post.slug} ${post.blog_categories?.title_ar || ''}`.toLowerCase().includes(term))); });
      if (route[0] === 'new') window.setTimeout(() => openBlogEditor(null), 0);
      if (route[0] && route[1] === 'edit') { const post = posts.find((item) => item.id === route[0]); if (post) window.setTimeout(() => openBlogEditor(post), 0); }
    } catch (error) { app.innerHTML = layout(`${pageHeader('إدارة المدونة', '')}${errorMarkup(error.message)}`); }
  }

  async function updateBlogStatus(id, status) {
    const post = (state.blog?.posts || []).find((item) => item.id === id);
    if (!post) return;
    try { await client.update('blog_posts', id, { status, is_featured: status === 'published' ? post.is_featured : false, ...(status === 'published' ? { published_at: post.published_at || new Date().toISOString() } : {}) }); showToast('success', status === 'published' ? 'تم نشر المقال' : 'تمت أرشفة المقال', 'تم تحديث حالته في المصدر المركزي.'); await renderBlog(); } catch (error) { showToast('error', 'تعذر تحديث المقال', error.message); }
  }

  async function deleteBlog(id) {
    const post = (state.blog?.posts || []).find((item) => item.id === id);
    if (!post) return;
    const liveNote = post.status === 'published' ? '\nالمقال منشور الآن وسيختفي من الموقع العام فورًا.' : '';
    if (!window.confirm(`هل تريد حذف المقال «${post.title_ar}» نهائيًا؟\nلا يمكن التراجع عن هذا الإجراء.${liveNote}`)) return;
    try { await client.remove('blog_posts', id); showToast('success', 'تم حذف المقال', 'أُزيل المقال من قاعدة البيانات ومن الموقع العام إن كان منشورًا.'); await renderBlog(); } catch (error) { showToast('error', 'تعذر حذف المقال', error.message); }
  }

  async function toggleBlogCategory(id) {
    const category = (state.blog?.categories || []).find((item) => item.id === id);
    if (!category) return;
    try { await client.update('blog_categories', id, { status: category.status === 'active' ? 'archived' : 'active' }); showToast('success', 'تم تحديث التصنيف', 'تم حفظ حالة التصنيف في المصدر المركزي.'); await renderBlog(); } catch (error) { showToast('error', 'تعذر تحديث التصنيف', error.message); }
  }

  async function deleteBlogCategory(id) {
    const category = (state.blog?.categories || []).find((item) => item.id === id);
    if (!category) return;
    const linkedPosts = (state.blog?.posts || []).filter((post) => post.category_id === id).length;
    if (linkedPosts) { showToast('error', 'لا يمكن حذف التصنيف', `التصنيف مرتبط بـ ${linkedPosts} مقال؛ انقل المقالات إلى تصنيف آخر أولًا.`); return; }
    if (!window.confirm(`هل تريد حذف التصنيف «${category.title_ar}» نهائيًا؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
    try { await client.remove('blog_categories', id); showToast('success', 'تم حذف التصنيف', 'أُزيل التصنيف من قاعدة البيانات.'); await renderBlog(); } catch (error) { showToast('error', 'تعذر حذف التصنيف', error.message); }
  }

  async function renderPage() {
    state.page = currentPage();
    state.search = '';
    document.title = `${routeLabels[state.page].title} | أمواج للسياحة`;
    if (state.page === 'dashboard') return renderDashboard();
    if (collectionMeta[state.page]) return renderCollection(state.page);
    if (state.page === 'pricing') return renderPricing();
    if (state.page === 'blog') return renderBlog();
    if (state.page === 'settings') return renderSettings();
    return renderDashboard();
  }

  async function handleAction(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'toggle-nav') document.getElementById('admin-sidebar')?.classList.toggle('is-open');
    if (action === 'reload-page') renderPage();
    if (action === 'export-pdf') { window.print(); }
    if (action === 'sign-out') { await client.signOut(); window.location.replace('/admin/login/'); }
    if (action === 'new-item') openItemEditor(target.dataset.kind, null);
    if (action === 'edit-item') { const row = (state.collections[target.dataset.kind] || []).find((item) => item.id === target.dataset.id); if (row) openItemEditor(target.dataset.kind, row); }
    if (action === 'preview') { const row = (state.collections[target.dataset.kind] || []).find((item) => item.id === target.dataset.id); if (row) openPreview(target.dataset.kind, row); }
    if (action === 'save-item') saveItem(target);
    if (action === 'toggle-featured') updateItemAction(target.dataset.kind, target.dataset.id, 'featured');
    if (action === 'toggle-archive') { const row = (state.collections[target.dataset.kind] || []).find((item) => item.id === target.dataset.id); if (row) updateItemAction(target.dataset.kind, target.dataset.id, row.is_active ? 'archive' : 'restore'); }
    if (action === 'delete-item') deleteItem(target.dataset.kind, target.dataset.id);
    if (action === 'new-offer') openOfferEditor(null);
    if (action === 'edit-offer') { const row = (state.pricing?.offers || []).find((item) => item.id === target.dataset.id); if (row) openOfferEditor(row); }
    if (action === 'preview-offer') { const row = (state.pricing?.offers || []).find((item) => item.id === target.dataset.id); if (row) openOfferPreview(row); }
    if (action === 'save-offer-row') saveOfferRow(target);
    if (action === 'delete-offer') deleteOffer(target.dataset.id);
    if (action === 'save-offer-editor') saveOfferEditor(target);
    if (action === 'edit-setting') { const row = (state.collections.settings || []).find((item) => item.setting_key === target.dataset.key); if (row) openSettingEditor(row); }
    if (action === 'save-setting') saveSetting(target);
    if (action === 'new-blog') openBlogEditor(null);
    if (action === 'edit-blog') { const post = (state.blog?.posts || []).find((item) => item.id === target.dataset.id); if (post) openBlogEditor(post); }
    if (action === 'preview-blog') { const post = (state.blog?.posts || []).find((item) => item.id === target.dataset.id); if (post) openBlogPreview(post); }
    if (action === 'save-blog') saveBlog(target);
    if (action === 'publish-blog') updateBlogStatus(target.dataset.id, 'published');
    if (action === 'archive-blog') updateBlogStatus(target.dataset.id, 'archived');
    if (action === 'delete-blog') deleteBlog(target.dataset.id);
    if (action === 'new-blog-category') openCategoryEditor(null);
    if (action === 'edit-blog-category') { const category = (state.blog?.categories || []).find((item) => item.id === target.dataset.id); if (category) openCategoryEditor(category); }
    if (action === 'save-blog-category') saveBlogCategory(target);
    if (action === 'toggle-blog-category') toggleBlogCategory(target.dataset.id);
    if (action === 'delete-blog-category') deleteBlogCategory(target.dataset.id);
    if (action === 'close-dialog') target.closest('dialog')?.close();
  }

  async function initialize() {
    app.innerHTML = '<main class="loading-state" aria-label="جارٍ التحقق من صلاحية الوصول"><div class="spinner" aria-hidden="true"></div><p>جارٍ التحقق من صلاحية الوصول…</p></main>';
    state.auth = await client.requireAdmin();
    if (!state.auth.isAdmin) { window.location.replace('/admin/login/'); return; }
    await renderPage();
  }

  document.addEventListener('click', (event) => { handleAction(event); });
  initialize();
}());
