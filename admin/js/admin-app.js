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
    reviews: { title: 'آراء العملاء', subtitle: 'راجع آراء الزوار واعتمد الموثوق منها قبل ظهورها في الموقع العام.' },
    settings: { title: 'إعدادات الموقع', subtitle: 'مراجعة وتحديث الإعدادات المسجلة في مصدر البيانات المركزي.' }
  };
  const serviceIconOptions = [
    ['fa-concierge-bell', 'خدمات سياحية عامة'],
    ['fa-plane', 'طيران ورحلات جوية'],
    ['fa-hotel', 'فنادق وإقامة'],
    ['fa-passport', 'تأشيرات وجوازات'],
    ['fa-ticket', 'تذاكر وحجوزات'],
    ['fa-car', 'انتقالات وسيارات'],
    ['fa-bus', 'حافلات ونقل جماعي'],
    ['fa-ship', 'رحلات بحرية'],
    ['fa-train', 'رحلات قطار'],
    ['fa-kaaba', 'حج وعمرة'],
    ['fa-umbrella-beach', 'شاطئ وعطلات'],
    ['fa-map-location-dot', 'وجهات وإرشاد سياحي'],
    ['fa-suitcase-rolling', 'برامج سياحية'],
    ['fa-calendar-days', 'تنظيم وجدولة الرحلات'],
    ['fa-headset', 'دعم وخدمة عملاء'],
    ['fa-star', 'خدمة مميزة'],
    ['fa-shield-halved', 'حماية وتأمين'],
    ['fa-earth-americas', 'سياحة دولية']
  ];

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
  // Central policy for business values. System-controlled fields stay fixed; approved
  // business fields resolve custom labels to business_option_values before save.
  const customValuePolicy = Object.freeze({
    packages: Object.freeze({ category: Object.freeze({ allowCustom: true, fieldKey: 'package.category', referenceColumn: 'category_value_id', customLabel: 'اكتب اسم الفئة' }) }),
    destinations: Object.freeze({ category: Object.freeze({ allowCustom: true, fieldKey: 'destination.category', referenceColumn: 'category_value_id', customLabel: 'اكتب اسم تصنيف الوجهة' }) }),
    services: Object.freeze({ icon_class: Object.freeze({ allowCustom: true, customLabel: 'مثال: fa-camera' }) }),
    pricing_offers: Object.freeze({ trip_style: Object.freeze({ allowCustom: true, fieldKey: 'pricing.trip_style', referenceColumn: 'trip_style_value_id', customLabel: 'اكتب نوع رحلة مخصصًا' }) })
  });
  const state = { auth: null, page: 'dashboard', collections: {}, search: '', businessOptions: {} };
  const editorPrefillStorageKey = 'amwaj_admin_copilot_editor_prefill';
  async function loadBusinessOptions() {
    try {
      const rows = await client.list('business_option_values', {
        select: 'id,field_key,value_key,label_ar,label_en,is_active,sort_order',
        order: 'field_key.asc,sort_order.asc,label_ar.asc',
        filters: { is_active: 'eq.true' }
      });
      state.businessOptions = (Array.isArray(rows) ? rows : []).reduce((groups, row) => {
        const key = String(row.field_key || '').trim();
        if (!key) return groups;
        (groups[key] ||= []).push(row);
        return groups;
      }, {});
    } catch {
      state.businessOptions = {};
    }
    return state.businessOptions;
  }

  function businessOptionItems(fieldKey, fallbackItems) {
    const items = Array.isArray(fallbackItems) ? fallbackItems.slice() : [];
    const seen = new Set(items.map(([value]) => String(value)));
    (state.businessOptions[String(fieldKey || '').trim()] || []).forEach((row) => {
      const value = String(row.value_key || row.label_ar || '').trim();
      const label = String(row.label_ar || row.label_en || value).trim();
      if (value && !seen.has(value)) {
        items.push([value, label]);
        seen.add(value);
      }
    });
    return items;
  }

  const draftFallbacks = {
    imageUrl: '/assets/logo.png',
    priceLabelAr: 'قيد التحديث',
    priceLabelEn: 'Coming soon'
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
  }

  function safeUrl(value) {
    const candidate = String(value || '').trim();
    return /^(https?:\/\/|\/)/i.test(candidate) ? candidate : '';
  }

  function editorValue(value, fallback) {
    return String(value || '') === fallback ? '' : value;
  }

  function autoSlug(title, records, fallback) {
    const base = String(title || '').toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback;
    const used = new Set((records || []).map((record) => String(record.slug || '').toLowerCase()).filter(Boolean));
    if (!used.has(base)) return base;
    let suffix = 2;
    while (used.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
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

  function setButtonBusy(button, busy) {
    if (!button) return;
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
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
      ['pricing', 'fa-tags', 'التسعير'], ['blog', 'fa-newspaper', 'المدونة'], ['reviews', 'fa-star-half-stroke', 'آراء العملاء'], ['settings', 'fa-sliders', 'الإعدادات']
    ];
    return `<div class="admin-shell">
      <aside class="sidebar" id="admin-sidebar" aria-label="التنقل الإداري" aria-hidden="false">
        <div class="sidebar-mobile-head">
          <span>قائمة الإدارة</span>
          <button class="btn icon-btn sidebar-close" type="button" data-action="close-nav" aria-label="إغلاق القائمة"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
        <a class="brand" href="/admin/" data-action="navigate" aria-label="لوحة تحكم أمواج">
          <img src="/assets/logo.png" alt="شعار أمواج للسياحة"><span><strong>أمواج للسياحة</strong><small>AMWAJ ADMIN</small></span>
        </a>
        <nav class="nav-group" aria-label="أقسام الإدارة"><span class="nav-title">القائمة الرئيسية</span>
          ${links.map(([key, icon, label]) => `<a class="nav-link ${state.page === key ? 'is-active' : ''}" href="${adminPath(key)}" data-action="navigate" ${state.page === key ? 'aria-current="page"' : ''}><i class="nav-icon fa-solid ${icon}" aria-hidden="true"></i><span class="nav-label">${label}</span><i class="nav-link-arrow fa-solid fa-chevron-left" aria-hidden="true"></i></a>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user-card">
            <span class="sidebar-user-avatar"><i class="fa-solid fa-user" aria-hidden="true"></i><b aria-hidden="true"></b></span>
            <span class="sidebar-user-copy"><strong title="${escapeHtml(profile.full_name || state.auth.session?.user?.email || '')}">${escapeHtml(profile.full_name || 'Amwaj Travel Administrator')}</strong><small>مدير النظام</small></span>
            <span class="sidebar-user-menu" aria-hidden="true"><i class="fa-solid fa-ellipsis-vertical"></i></span>
          </div>
          <button class="sidebar-signout btn btn-ghost" type="button" data-action="sign-out"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> تسجيل الخروج</button>
          <button class="sidebar-assistant-card" type="button" data-copilot="toggle" aria-label="فتح مساعد أمواج الإداري">
            <span class="sidebar-assistant-copy"><strong>مساعد أمواج</strong><small>خدمتك في أي وقت</small></span>
            <span class="sidebar-assistant-icon"><i class="fa-solid fa-message" aria-hidden="true"></i></span>
          </button>
          <p class="developer-credit" dir="ltr"><i class="fa-solid fa-code" aria-hidden="true"></i><span>Developed by</span><strong>YOMNA ELHAMAMSY</strong></p>
        </div>
      </aside>
      <button class="sidebar-backdrop" type="button" data-action="close-nav" aria-label="إغلاق القائمة الجانبية"></button>
      <section class="main-area">
        <header class="topbar">
          <div class="topbar-label"><button class="btn icon-btn mobile-nav-toggle" type="button" data-action="toggle-nav" aria-label="فتح القائمة" aria-controls="admin-sidebar" aria-expanded="false"><span class="nav-toggle-glyph" aria-hidden="true"><span></span><span></span><span></span></span></button><div class="topbar-copy"><p class="page-kicker"><i class="fa-solid fa-sparkles" aria-hidden="true"></i> مساحة الإدارة</p><h1>${escapeHtml(pageLabel.title)}</h1><p>${escapeHtml(pageLabel.subtitle)}</p></div></div>
          <div class="topbar-actions"><button class="btn btn-small" type="button" data-action="export-pdf" title="تصدير الصفحة الحالية كملف PDF"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> تصدير PDF</button><a class="btn btn-small" href="/" target="_blank" rel="noopener" title="فتح الموقع العام في علامة تبويب جديدة"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> عرض الموقع العام</a></div>
        </header>
        <main id="admin-content" class="page-content" tabindex="-1" data-page="${escapeHtml(state.page)}">${content}</main>
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

  const CUSTOM_SELECT_VALUE = '__other__';

  function categoryOptions(kind, selected) {
    return collectionMeta[kind].categories.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('');
  }

  function customOptionList(items, selected, allowCustom = true) {
    const current = String(selected ?? '');
    const known = items.some(([value]) => value === current);
    const selectedValue = known ? current : (allowCustom ? CUSTOM_SELECT_VALUE : current || (items[0]?.[0] || ''));
    const currentOption = !known && current && !allowCustom
      ? `<option value="${escapeHtml(current)}" selected>القيمة الحالية المحفوظة: ${escapeHtml(current)}</option>`
      : '';
    const options = items.map(([value, label]) => `<option value="${escapeHtml(value)}" ${selectedValue === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    if (!allowCustom) return `${currentOption}${options}`;
    const otherOption = !known && current ? `<option value="${CUSTOM_SELECT_VALUE}" selected>أخرى (القيمة الحالية)</option>` : `<option value="${CUSTOM_SELECT_VALUE}" ${selectedValue === CUSTOM_SELECT_VALUE ? 'selected' : ''}>أخرى</option>`;
    return `${options}${otherOption}`;
  }

  function customSelectField(label, name, items, selected, options = {}) {
    const allowCustom = options.allowCustom !== false;
    const availableItems = businessOptionItems(options.fieldKey, items);
    const current = String(selected ?? '');
    const known = availableItems.some(([value]) => value === current);
    const isOther = allowCustom && !known;
    const customValue = isOther ? current : '';
    const className = options.full ? 'field full custom-select-field' : 'field custom-select-field';
    const required = options.required === false ? '' : 'required';
    const customLabel = options.customLabel || `اكتب ${label}`;
    const hint = options.hint || (allowCustom ? 'اختر قيمة جاهزة أو «أخرى» لكتابة قيمة من عندك.' : 'القائمة تعرض القيم النظامية المدعومة حاليًا.');
    const customInput = allowCustom ? `<input class="input custom-option-input" name="${name}_custom" data-custom-select-value-for="${name}" type="text" value="${escapeHtml(customValue)}" placeholder="${escapeHtml(customLabel)}" ${isOther ? '' : 'hidden'}><span class="field-hint">${escapeHtml(hint)}</span>` : `<span class="field-hint">${escapeHtml(hint)}</span>`;
    return `<div class="${className}" data-custom-select><label for="field-${name}">${label}</label><select class="select" id="field-${name}" name="${name}" data-custom-select-choice ${required}>${customOptionList(availableItems, current, allowCustom)}</select>${customInput}</div>`;
  }

  function serviceIconField(selected) {
    const current = String(selected || 'fa-star');
    const known = serviceIconOptions.some(([value]) => value === current);
    return `<div class="field custom-select-field icon-picker-field" data-custom-select><label for="field-icon_class">الأيقونة المستخدمة للخدمة</label><div class="icon-picker"><select class="select" id="field-icon_class" name="icon_class" data-custom-select-choice required>${customOptionList(serviceIconOptions, current)}</select><span class="icon-picker-preview" data-icon-preview aria-hidden="true"><i class="fa-solid ${escapeHtml(current)}"></i></span></div><input class="input custom-option-input" name="icon_class_custom" data-custom-select-value-for="icon_class" type="text" value="${escapeHtml(known ? '' : current)}" placeholder="مثال: fa-camera" ${known ? 'hidden' : ''}><span class="field-hint">اختر أيقونة جاهزة، أو اختر «أخرى» واكتب فئة Font Awesome مخصصة. ستظهر المعاينة بجوار القائمة.</span></div>`;
  }

  function customSelectValue(form, name) {
    const selected = String(form.querySelector(`[name="${name}"]`)?.value || '').trim();
    if (selected !== CUSTOM_SELECT_VALUE) return selected;
    return String(form.querySelector(`[name="${name}_custom"]`)?.value || '').trim();
  }

  function isOtherSelection(form, name) {
    return String(form.querySelector(`[name="${name}"]`)?.value || '').trim() === CUSTOM_SELECT_VALUE;
  }

  async function resolveBusinessReference(kind, form, payload) {
    const rules = customValuePolicy[kind] || {};
    for (const [name, rule] of Object.entries(rules)) {
      if (!rule.fieldKey || !rule.referenceColumn || !isOtherSelection(form, name)) continue;
      const label = customSelectValue(form, name);
      const option = await client.resolveBusinessOption(rule.fieldKey, label, label);
      if (!option?.id) throw new Error('تعذر اعتماد القيمة المخصصة. أعد المحاولة أو اختر قيمة جاهزة.');
      (state.businessOptions[rule.fieldKey] ||= []).push(option);
      payload[name] = String(option.label_ar || label).trim();
      payload[rule.referenceColumn] = option.id;
    }
    return payload;
  }

  function clearBusinessReferenceForKnownValue(kind, form, payload) {
    const rules = customValuePolicy[kind] || {};
    Object.entries(rules).forEach(([name, rule]) => {
      if (!rule.referenceColumn || !form.querySelector(`[name="${name}"]`)) return;
      if (!isOtherSelection(form, name)) payload[rule.referenceColumn] = null;
    });
    return payload;
  }

  function customOfferSelectField(label, name, items, selected, customLabel, compact = false, options = {}) {
    const allowCustom = options.allowCustom !== false;
    const availableItems = businessOptionItems(options.fieldKey, items);
    const current = String(selected ?? '');
    const known = availableItems.some(([value]) => value === current);
    const id = compact ? '' : ` id="field-${name}"`;
    const hint = options.hint || 'اختر قيمة جاهزة أو «أخرى» لكتابة قيمة من عندك.';
    const input = allowCustom ? `<input class="input${compact ? ' sheet-input' : ''} custom-option-input" name="${name}_custom" data-offer-field="${name}_custom" data-custom-select-value-for="${name}" type="text" value="${escapeHtml(known ? '' : current)}" placeholder="${escapeHtml(customLabel)}" ${known ? 'hidden' : ''}>` : '';
    return `<div class="${compact ? 'custom-select-compact' : 'custom-select-field'}" data-custom-select><label${compact ? ' class="sr-only"' : ` for="field-${name}"`}>${label}</label><select class="select${compact ? ' sheet-select' : ''}"${id} name="${name}" data-offer-field="${name}" data-custom-select-choice required>${customOptionList(availableItems, current, allowCustom)}</select>${input}<span class="field-hint"${compact ? ' hidden' : ''}>${escapeHtml(hint)}</span></div>`;
  }

  function validateCustomSelections(container) {
    container.querySelectorAll('[data-custom-select-choice]').forEach((select) => {
      if (select.value !== CUSTOM_SELECT_VALUE) return;
      const custom = container.querySelector(`[data-custom-select-value-for="${select.name}"]`);
      if (!String(custom?.value || '').trim()) throw new Error(`اكتب القيمة المخصصة في حقل «${select.name}» بعد اختيار «أخرى».`);
    });
  }

  function validateFixedBusinessValues(kind, container) {
    const rules = customValuePolicy[kind] || {};
    Object.entries(rules).forEach(([name, rule]) => {
      if (rule.allowCustom !== false) return;
      const select = container.querySelector(`[name="${name}"], [data-offer-field="${name}"]`);
      if (!select) return;
      const value = String(select.value || '').trim();
      const items = kind === 'pricing_offers' ? offerStyles : collectionMeta[kind]?.categories || [];
      if (value && value !== CUSTOM_SELECT_VALUE && !items.some(([optionValue]) => optionValue === value)) {
        throw new Error(`لا يمكن حفظ القيمة المخصصة «${value}» في هذا الحقل الآن. ${rule.hint || 'يلزم اعتماد دعم قاعدة البيانات أولاً.'}`);
      }
      if (value === CUSTOM_SELECT_VALUE) {
        throw new Error(`هذا الحقل مضبوط على قيم نظامية فقط. ${rule.hint || ''}`.trim());
      }
    });
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
    return `<div class="field full media-upload-field"><label for="field-${fileName}">${label || 'رفع صورة'}</label><input class="input" id="field-${fileName}" name="${fileName}" type="file" accept="image/jpeg,image/png,image/webp,image/avif" data-media-scope="${escapeHtml(scope || 'general')}"><input name="${urlName}" type="hidden" value="${escapeHtml(currentUrl || '')}"><span class="field-hint">JPG / PNG / WebP / AVIF — حتى 5 ميغابايت</span>${preview ? `<img class="media-upload-preview" src="${escapeHtml(preview)}" alt="" onerror="this.remove()">` : ''}</div>`;
  }

  function advancedSection(content, summary = 'إعدادات متقدمة') {
    return `<details class="editor-advanced"><summary><span><i class="fa-solid fa-sliders" aria-hidden="true"></i> ${summary}</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary><div class="editor-advanced-content form-grid">${content}</div></details>`;
  }

  function dynamicEditorField(content, options = {}) {
    const categories = Array.isArray(options.categories) ? options.categories.filter(Boolean) : [];
    const categoryRule = categories.length ? ` data-category-show="${escapeHtml(categories.join(','))}"` : '';
    const priceRule = options.requiresPrice ? ' data-requires-price="true"' : '';
    const width = options.full ? ' full' : '';
    return `<div class="dynamic-editor-field${width}"${categoryRule}${priceRule}>${content}</div>`;
  }

  function syncDynamicItemEditor(dialog) {
    const form = dialog?.querySelector('#item-editor');
    if (!form) return;
    const category = String(form.querySelector('[name="category"]')?.value || '').trim();
    const hasPrice = Boolean(String(form.querySelector('[name="price_label_ar"]')?.value || '').trim());
    dialog.querySelectorAll('[data-category-show]').forEach((element) => {
      const permitted = String(element.dataset.categoryShow || '').split(',').map((value) => value.trim()).filter(Boolean);
      const visible = !permitted.length || permitted.includes(category);
      element.hidden = !visible;
      element.setAttribute('aria-hidden', String(!visible));
    });
    dialog.querySelectorAll('[data-requires-price]').forEach((element) => {
      element.hidden = !hasPrice;
      element.setAttribute('aria-hidden', String(!hasPrice));
    });
    const noPriceHint = dialog.querySelector('[data-no-price-hint]');
    if (noPriceHint) noPriceHint.hidden = hasPrice;
  }

  function bindDynamicItemEditor(dialog) {
    const form = dialog?.querySelector('#item-editor');
    if (!form) return;
    form.querySelector('[name="category"]')?.addEventListener('change', () => syncDynamicItemEditor(dialog));
    form.querySelector('[name="price_label_ar"]')?.addEventListener('input', () => syncDynamicItemEditor(dialog));
    syncDynamicItemEditor(dialog);
  }

  function copilotPrefillNotice(fields, customLabels = {}) {
    const count = Array.isArray(fields) ? fields.length : 0;
    const labels = Object.entries(customLabels || {}).filter(([field, value]) => field && String(value || '').trim());
    if (!count && !labels.length) return '';
    const customNote = labels.length ? `<span>قيم مخصصة مقترحة للمراجعة: ${labels.map(([, value]) => `«${escapeHtml(value)}»`).join('، ')}. لن تُحفظ تلقائيًا، وقد يتطلب حفظها اعتماد دعم قاعدة البيانات أولًا.</span>` : '';
    return `<div class="copilot-prefill-notice full" role="status"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><div><strong>مسودة مقترحة من مساعد الإدارة</strong><span>تمت تعبئة ${count} ${count === 1 ? 'حقل' : 'حقول'} للمراجعة فقط. لن يُحفظ أو يُنشر أي شيء قبل اختيارك أحد أزرار الحفظ.</span>${customNote}</div></div>`;
  }

  function markCopilotPrefill(dialog, fields) {
    const names = Array.isArray(fields) ? fields.filter((name) => /^[a-z_]+$/.test(name)) : [];
    names.forEach((name) => {
      const input = dialog.querySelector(`[name="${name}"], [data-offer-field="${name}"]`);
      if (!input) return;
      input.closest('.field, .check-field, .media-upload-field')?.classList.add('is-copilot-prefilled');
      const advanced = input.closest('.editor-advanced');
      if (advanced) advanced.open = true;
    });
  }

  function englishField(label, name, value, sourceName, options) {
    const settings = options || {};
    const className = settings.full ? 'field full' : 'field';
    const required = settings.required ? 'required' : '';
    const id = `field-${name}`;
    const generate = `<button class="btn btn-small btn-translate" type="button" data-action="generate-english" data-source="${escapeHtml(sourceName)}" data-target="${escapeHtml(name)}"><i class="fa-solid fa-language" aria-hidden="true"></i> توليد تلقائي</button>`;
    if (settings.textarea) return `<div class="${className}"><div class="field-heading"><label for="${id}">${label}</label>${generate}</div><textarea class="textarea" id="${id}" name="${name}" dir="ltr" ${required}${settings.style ? ` style="${settings.style}"` : ''}>${escapeHtml(value || '')}</textarea>${settings.hint ? `<span class="field-hint">${settings.hint}</span>` : ''}</div>`;
    return `<div class="${className}"><div class="field-heading"><label for="${id}">${label}</label>${generate}</div><input class="input" id="${id}" name="${name}" type="text" dir="ltr" value="${escapeHtml(value || '')}" ${required}>${settings.hint ? `<span class="field-hint">${settings.hint}</span>` : ''}</div>`;
  }

  async function generateEnglish(button) {
    const dialog = button.closest('dialog');
    const source = dialog?.querySelector(`[name="${button.dataset.source}"]`);
    const target = dialog?.querySelector(`[name="${button.dataset.target}"]`);
    const sourceText = String(source?.value || '').trim();
    if (!source || !target || !sourceText) {
      showToast('error', 'أدخل النص العربي أولًا', 'اكتب المحتوى العربي الذي تريد توليد نسخته الإنجليزية.');
      source?.focus();
      return;
    }
    const session = await client.getValidSession();
    if (!session?.access_token) {
      showToast('error', 'انتهت الجلسة', 'سجّل الدخول مرة أخرى ثم أعد المحاولة.');
      return;
    }
    const original = button.innerHTML;
    try {
      setButtonBusy(button, true);
      button.innerHTML = '<i class="fa-solid fa-spinner"></i> جارٍ التوليد…';
      const response = await fetch('/api/admin-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: 'translate', targetLang: 'en', text: sourceText })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.translation) throw new Error(result?.message || 'تعذر توليد النص الإنجليزي حالياً.');
      target.value = result.translation;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      showToast('success', 'تم توليد الإنجليزية', 'يمكنك مراجعة النص وتعديله قبل الحفظ أو النشر.');
    } catch (error) {
      showToast('error', 'تعذر توليد الإنجليزية', error.message);
    } finally {
      button.innerHTML = original;
      setButtonBusy(button, false);
    }
  }

  async function generateDerivedFields(button) {
    const dialog = button.closest('dialog');
    const title = String(dialog?.querySelector('[name="title_ar"]')?.value || '').trim();
    const description = String(dialog?.querySelector('[name="description_ar"]')?.value || '').trim();
    const altField = dialog?.querySelector('[name="image_alt_ar"]');
    const highlightsField = dialog?.querySelector('[name="highlights"]');
    if (!title && !description) {
      showToast('error', 'أدخل المحتوى العربي أولًا', 'اكتب عنوانًا أو وصفًا بالعربية قبل توليد الحقول المساعدة.');
      dialog?.querySelector('[name="title_ar"]')?.focus();
      return;
    }
    if (!altField && !highlightsField) return;
    const session = await client.getValidSession();
    if (!session?.access_token) {
      showToast('error', 'انتهت الجلسة', 'سجّل الدخول مرة أخرى ثم أعد المحاولة.');
      return;
    }
    const original = button.innerHTML;
    try {
      setButtonBusy(button, true);
      button.innerHTML = '<i class="fa-solid fa-spinner"></i> جارٍ التوليد…';
      const response = await fetch('/api/admin-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ mode: 'derive', title, description })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.derived) throw new Error(result?.message || 'تعذر توليد الحقول المساعدة حالياً.');
      let filled = 0;
      if (altField && !String(altField.value || '').trim() && result.derived.image_alt_ar) {
        altField.value = result.derived.image_alt_ar;
        altField.dispatchEvent(new Event('input', { bubbles: true }));
        filled += 1;
      }
      if (highlightsField && !String(highlightsField.value || '').trim() && Array.isArray(result.derived.highlights) && result.derived.highlights.length) {
        highlightsField.value = result.derived.highlights.join('\n');
        highlightsField.dispatchEvent(new Event('input', { bubbles: true }));
        filled += 1;
      }
      if (filled) showToast('success', 'تم توليد الحقول المساعدة', 'راجِع النص البديل والمزايا قبل الحفظ. لم نستبدل أي تعديل يدوي موجود.');
      else showToast('info', 'تم الحفاظ على تعديلاتك', 'الحقول المساعدة تحتوي قيمًا بالفعل، لذلك لم نستبدلها.');
    } catch (error) {
      showToast('error', 'تعذر توليد الحقول المساعدة', error.message);
    } finally {
      button.innerHTML = original;
      setButtonBusy(button, false);
    }
  }

  function openDialog(title, subtitle, body, footer) {
    const dialog = document.createElement('dialog');
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.className = 'dialog';
    dialog.innerHTML = `<div class="dialog-content"><header class="dialog-header"><div><h3>${escapeHtml(title)}</h3>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}<span class="dialog-state" data-dialog-state aria-live="polite"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>جميع التغييرات محفوظة</span></span></div><button class="close-dialog" type="button" aria-label="إغلاق" data-close-dialog><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header><div class="dialog-body">${body}</div>${footer ? `<footer class="dialog-footer">${footer}</footer>` : ''}</div>`;
    const setDirty = () => {
      const stateElement = dialog.querySelector('[data-dialog-state]');
      if (!stateElement || stateElement.classList.contains('is-dirty')) return;
      stateElement.classList.add('is-dirty');
      stateElement.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>توجد تعديلات غير محفوظة</span>';
    };
    const updateLocalPreview = (input) => {
      const file = input.files?.[0];
      if (!file) return;
      const field = input.closest('.media-upload-field');
      if (!field) return;
      const oldPreview = field.querySelector('.media-upload-preview');
      if (oldPreview?.dataset.objectUrl) URL.revokeObjectURL(oldPreview.dataset.objectUrl);
      const preview = oldPreview || document.createElement('img');
      preview.className = 'media-upload-preview';
      preview.alt = '';
      const objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      preview.dataset.objectUrl = objectUrl;
      if (!oldPreview) field.append(preview);
    };
    document.body.append(dialog);
    dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('input', (event) => { if (event.target.closest('form')) setDirty(); });
    const syncCustomSelect = (select, focusCustom = false) => {
      const wrapper = select.closest('[data-custom-select]');
      const customInput = wrapper?.querySelector(`[data-custom-select-value-for="${select.name}"]`);
      const isOther = select.value === CUSTOM_SELECT_VALUE;
      if (customInput) {
        customInput.hidden = !isOther;
        if (isOther && focusCustom) customInput.focus();
      }
      const preview = select.closest('.icon-picker')?.querySelector('[data-icon-preview] i');
      if (preview) preview.className = `fa-solid ${(isOther ? customInput?.value : select.value) || 'fa-star'}`;
    };
    dialog.addEventListener('change', (event) => {
      if (event.target.closest('form')) setDirty();
      if (event.target.matches('input[type="file"]')) updateLocalPreview(event.target);
      if (event.target.matches('select[data-custom-select-choice]')) syncCustomSelect(event.target, true);
    });
    dialog.addEventListener('input', (event) => {
      if (event.target.matches('[data-custom-select-value-for]')) {
        const select = dialog.querySelector(`[name="${event.target.dataset.customSelectValueFor}"]`);
        if (select) syncCustomSelect(select);
      }
    });
    dialog.addEventListener('close', () => {
      dialog.querySelectorAll('.media-upload-preview[data-object-url]').forEach((image) => URL.revokeObjectURL(image.dataset.objectUrl));
      dialog.remove();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
    dialog.showModal();
    window.requestAnimationFrame(() => dialog.querySelector('input:not([type="hidden"]), select, textarea, button')?.focus());
    return dialog;
  }

  function openPreview(kind, row) {
    const isService = kind === 'services';
    const image = isService ? '' : `<img src="${escapeHtml(safeUrl(row.image_url))}" alt="${escapeHtml(row.image_alt_ar || row.title_ar)}">`;
    const icon = isService ? `<div style="display:grid;place-items:center;min-height:9rem;background:var(--color-primary-light);color:var(--color-primary);font-size:3rem"><i class="fa-solid ${escapeHtml(row.icon_class || 'fa-star')}"></i></div>` : '';
    openDialog(`معاينة: ${row.title_ar}`, 'معاينة تحريرية فقط؛ لا تغيّر الموقع العام في هذه المرحلة.', `<article class="preview-card">${image || icon}<div class="preview-copy">${row.badge_ar ? `<span class="badge badge-featured">${escapeHtml(row.badge_ar)}</span>` : ''}<h4>${escapeHtml(row.title_ar)}</h4><p>${escapeHtml(row.description_ar)}</p>${row.price_label_ar ? `<p class="preview-price">${escapeHtml(row.price_label_ar)}</p>` : ''}</div></article>`, '<button class="btn" type="button" data-close-dialog>إغلاق</button>');
  }

  function openItemEditor(kind, row, options = {}) {
    const meta = collectionMeta[kind];
    const patch = options?.patch && typeof options.patch === 'object' && !Array.isArray(options.patch) ? options.patch : {};
    const isNew = !row;
    const item = { ...(row || { status: 'draft', is_active: true, sort_order: 0, rating: '', highlights: [], category: meta.categories[0]?.[0] || '', is_featured: false }), ...patch };
    const primary = meta.image ? `
      ${customSelectField('الفئة', 'category', meta.categories, item.category, { ...(customValuePolicy[kind]?.category || {}), full: false })}
      ${field('العنوان بالعربية', 'title_ar', item.title_ar)}
      ${field('الوصف بالعربية', 'description_ar', item.description_ar, { textarea: true, full: true })}
      ${imageUploadField('image_file', 'image_url', editorValue(item.image_url, draftFallbacks.imageUrl), kind, 'صورة البطاقة')}
      ${field('السعر أو وصف السعر بالعربية', 'price_label_ar', editorValue(item.price_label_ar, draftFallbacks.priceLabelAr), { full: true, required: false, placeholder: 'مثال: يبدأ من 45,000 ج.م أو تواصل لمعرفة السعر' })}
    ` : `
      ${field('العنوان بالعربية', 'title_ar', item.title_ar)}
      ${field('الوصف بالعربية', 'description_ar', item.description_ar, { textarea: true, full: true })}
      ${serviceIconField(item.icon_class || 'fa-star')}
    `;
    const advanced = meta.image ? `
      ${englishField('العنوان بالإنجليزية', 'title_en', item.title_en, 'title_ar')}
      ${englishField('الوصف بالإنجليزية', 'description_en', item.description_en, 'description_ar', { textarea: true, full: true })}
      ${dynamicEditorField(englishField('السعر أو وصف السعر بالإنجليزية', 'price_label_en', editorValue(item.price_label_en, draftFallbacks.priceLabelEn), 'price_label_ar', { full: true }), { requiresPrice: true, full: true })}
      <p class="dynamic-form-hint full" data-no-price-hint>لم تُدخل سعرًا الآن، لذلك أُخفيت تفاصيل السعر الإنجليزية الاختيارية. ستظهر تلقائيًا عند كتابة سعر أو وصف سعر بالعربية.</p>
      <div class="field full derived-fields-control"><div class="field-heading"><strong>حقول مساعدة من المحتوى العربي</strong><button class="btn btn-small btn-translate" type="button" data-action="generate-derived"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> توليد تلقائي</button></div><span class="field-hint">يستخرج نصًا بديلًا ومزايا من المحتوى الذي أدخلته فقط، ولا يستبدل تعديلاتك اليدوية.</span></div>
      ${field('النص البديل بالعربية', 'image_alt_ar', item.image_alt_ar, { required: false })}
      ${englishField('النص البديل بالإنجليزية', 'image_alt_en', item.image_alt_en, 'image_alt_ar')}
      ${dynamicEditorField(field('شارة بالعربية', 'badge_ar', item.badge_ar, { required: false }), { categories: kind === 'packages' ? ['vip'] : ['umrah'] })}
      ${dynamicEditorField(englishField('شارة بالإنجليزية', 'badge_en', item.badge_en, 'badge_ar'), { categories: kind === 'packages' ? ['vip'] : ['umrah'] })}
      ${field('التقييم', 'rating', item.rating, { type: 'number', required: false, step: '0.1', hint: 'من 0 إلى 5.' })}
      ${field('المزايا', 'highlights', Array.isArray(item.highlights) ? item.highlights.join('\n') : '', { textarea: true, full: true, required: false, hint: 'اكتب ميزة واحدة في كل سطر.' })}
      ${field('ترتيب العرض', 'sort_order', item.sort_order, { type: 'number', step: '1', required: false })}
      ${checkField('العنصر نشط', 'is_active', item.is_active)}
      ${meta.featured ? checkField('إظهار كعنصر مميز', 'is_featured', item.is_featured) : ''}
    ` : `
      ${englishField('العنوان بالإنجليزية', 'title_en', item.title_en, 'title_ar')}
      ${englishField('الوصف بالإنجليزية', 'description_en', item.description_en, 'description_ar', { textarea: true, full: true })}
      ${field('ترتيب العرض', 'sort_order', item.sort_order, { type: 'number', step: '1', required: false })}
      ${checkField('الخدمة نشطة', 'is_active', item.is_active)}
    `;
    const dialog = openDialog(`${isNew ? 'إضافة' : 'تعديل'} ${meta.singular}`, 'احفظ مسودة في أي وقت. عند النشر فقط سنطلب الحقول اللازمة لعرض المحتوى للزوار.', `<form id="item-editor" class="form-grid" novalidate>${copilotPrefillNotice(Object.keys(patch), options.customLabels)}<input type="hidden" name="slug" value="${escapeHtml(item.slug || '')}">${primary}<div class="full">${advancedSection(advanced)}</div></form>`, `<button type="button" class="btn" data-close-dialog>إلغاء</button><button type="button" class="btn" data-action="save-item" data-kind="${kind}" data-id="${item.id || ''}" data-mode="draft"><i class="fa-solid fa-floppy-disk"></i> حفظ مسودة</button><button type="button" class="btn btn-primary" data-action="save-item" data-kind="${kind}" data-id="${item.id || ''}" data-mode="published"><i class="fa-solid fa-paper-plane"></i> نشر</button>`);
    dialog.dataset.kind = kind;
    markCopilotPrefill(dialog, Object.keys(patch));
    bindDynamicItemEditor(dialog);
  }

  function itemPayloadFromForm(kind, form, mode) {
    const data = new FormData(form);
    const meta = collectionMeta[kind];
    const value = (name) => customSelectValue(form, name);
    const payload = {
      slug: value('slug') || autoSlug(value('title_en'), state.collections[kind], `${kind}-item`), title_ar: value('title_ar'), title_en: value('title_en'),
      description_ar: value('description_ar'), description_en: value('description_en'),
      status: mode, is_active: data.has('is_active'), sort_order: Math.max(0, Number(value('sort_order') || 0))
    };
    if (meta.categories.length) payload.category = value('category');
    if (meta.image) {
      const ratingRaw = value('rating');
      payload.image_url = value('image_url') || draftFallbacks.imageUrl; payload.image_alt_ar = value('image_alt_ar') || null; payload.image_alt_en = value('image_alt_en') || null;
      payload.badge_ar = value('badge_ar') || null; payload.badge_en = value('badge_en') || null;
      payload.rating = ratingRaw ? Number(ratingRaw) : null;
      payload.highlights = value('highlights').split('\n').map((line) => line.trim()).filter(Boolean);
      payload.price_label_ar = value('price_label_ar') || draftFallbacks.priceLabelAr; payload.price_label_en = value('price_label_en') || draftFallbacks.priceLabelEn;
      if (meta.featured) payload.is_featured = data.has('is_featured');
    } else { payload.icon_class = value('icon_class') || 'fa-star'; }
    return payload;
  }

  function itemPublishIssues(kind, payload) {
    const meta = collectionMeta[kind];
    const issues = [];
    if (!payload.title_ar) issues.push('العنوان بالعربية');
    if (!payload.title_en) issues.push('العنوان بالإنجليزية');
    if (!payload.description_ar) issues.push('الوصف بالعربية');
    if (!payload.description_en) issues.push('الوصف بالإنجليزية');
    if (meta.categories.length && !payload.category) issues.push('الفئة');
    if (meta.image && (!payload.image_url || payload.image_url === draftFallbacks.imageUrl)) issues.push('صورة البطاقة');
    if (meta.image && (!payload.price_label_ar || payload.price_label_ar === draftFallbacks.priceLabelAr)) issues.push('السعر أو وصف السعر بالعربية');
    if (meta.image && (!payload.price_label_en || payload.price_label_en === draftFallbacks.priceLabelEn)) issues.push('السعر أو وصف السعر بالإنجليزية');
    if (!meta.image && !payload.icon_class) issues.push('فئة الأيقونة');
    return issues;
  }

  async function saveItem(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#item-editor');
    const kind = button.dataset.kind;
    if (!form.reportValidity()) return;
    try {
      validateCustomSelections(form);
      validateFixedBusinessValues(kind, form);
    } catch (error) { showToast('error', 'القيمة غير مدعومة حاليًا', error.message); return; }
    const meta = collectionMeta[kind];
    const mode = button.dataset.mode;
    setButtonBusy(button, true);
    try {
      const imageFile = form.querySelector('[name="image_file"]')?.files?.[0];
      if (imageFile) {
        button.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> جارٍ رفع الصورة…';
        const upload = await client.uploadImage(imageFile, kind);
        form.querySelector('[name="image_url"]').value = upload.publicUrl;
      }
      const payload = itemPayloadFromForm(kind, form, mode);
      clearBusinessReferenceForKnownValue(kind, form, payload);
      await resolveBusinessReference(kind, form, payload);
      if (mode === 'published') {
        const issues = itemPublishIssues(kind, payload);
        if (issues.length) throw new Error(`للنشر، أكمل: ${issues.join('، ')}.`);
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) throw new Error('تعذر إنشاء رابط داخلي صالح. اكتب عنوانًا إنجليزيًا أو أضفه من الإعدادات المتقدمة.');
      if (payload.rating !== null && (payload.rating < 0 || payload.rating > 5)) throw new Error('التقييم غير صحيح. أدخل قيمة بين 0 و5.');
      if (button.dataset.id) await client.update(meta.table, button.dataset.id, payload); else await client.create(meta.table, payload);
      dialog.close();
      showToast('success', mode === 'published' ? 'تم نشر المحتوى' : 'تم حفظ المسودة', mode === 'published' ? 'أصبح المحتوى متاحًا للزوار.' : `${meta.singular} جاهز للمراجعة لاحقًا.`);
      await renderCollection(kind);
    } catch (error) {
      showToast('error', 'تعذر حفظ التغييرات', error.message);
      setButtonBusy(button, false);
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
        <td>      ${customOfferSelectField('نوع الرحلة', 'trip_style', offerStyles, item.trip_style, 'اكتب نوع رحلة مخصصًا', true, customValuePolicy.pricing_offers.trip_style)}</td>
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
      await loadBusinessOptions();
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
    const selected = String(container.querySelector(`[data-offer-field="${name}"]`)?.value || '').trim();
    if (selected !== CUSTOM_SELECT_VALUE) return selected;
    return String(container.querySelector(`[data-offer-field="${name}_custom"]`)?.value || '').trim();
  }

  async function offerPayload(container, statusOverride) {
    validateCustomSelections(container);
    validateFixedBusinessValues('pricing_offers', container);
    const subject = offerValue(container, 'subject');
    const [subjectType, subjectId] = subject.split(':');
    const departure = offerValue(container, 'departure_month');
    const status = statusOverride || offerValue(container, 'status') || 'draft';
    const priceRaw = offerValue(container, 'price_amount');
    const discountRaw = offerValue(container, 'discounted_price_amount');
    const minTravelers = Number(offerValue(container, 'min_travelers'));
    const maxTravelers = Number(offerValue(container, 'max_travelers'));
    const seatsRaw = offerValue(container, 'seats_available');
    const availability = offerValue(container, 'availability') || 'available';
    const price = priceRaw === '' ? null : Number(priceRaw);
    const discounted = discountRaw === '' ? null : Number(discountRaw);
    let mode = offerValue(container, 'price_mode') || 'fixed';
    if (price === null && (mode === 'fixed' || mode === 'starting_from')) mode = 'quote';
    if (!subjectId || !['package', 'service'].includes(subjectType)) throw new Error('اختر برنامجًا أو خدمة لعرض السعر.');
    if (!offerValue(container, 'destination_id')) throw new Error('اختر وجهة عرض السعر.');
    if (!/^\d{4}-\d{2}$/.test(departure)) throw new Error('اختر شهر السفر بصيغة صحيحة.');
    if (!Number.isInteger(minTravelers) || !Number.isInteger(maxTravelers) || minTravelers < 1 || maxTravelers < minTravelers) throw new Error('حدّد نطاق المسافرين بشكل صحيح: الرقم الأدنى لا يتجاوز الأعلى.');
    if (status === 'published' && (mode === 'fixed' || mode === 'starting_from') && (price === null || price < 0)) throw new Error('للنشر، أدخل السعر للفرد أو اختر «طلب عرض سعر» من الإعدادات المتقدمة.');
    if (status === 'published' && mode === 'discount' && (price === null || discounted === null || price < 0 || discounted < 0 || discounted >= price)) throw new Error('للنشر بسعر مخفض، أدخل السعر الأساسي وسعر خصم أقل منه.');
    const payload = {
      package_id: subjectType === 'package' ? subjectId : null,
      service_id: subjectType === 'service' ? subjectId : null,
      destination_id: offerValue(container, 'destination_id'),
      trip_style: offerValue(container, 'trip_style') || 'custom',
      trip_style_value_id: null,
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
      status,
      sort_order: Math.max(0, Number(offerValue(container, 'sort_order') || 0))
    };
    if (isOtherSelection(container, 'trip_style')) {
      const label = offerValue(container, 'trip_style');
      const option = await client.resolveBusinessOption('pricing.trip_style', label, label);
      if (!option?.id) throw new Error('تعذر اعتماد نوع الرحلة المخصص. أعد المحاولة أو اختر قيمة جاهزة.');
      (state.businessOptions['pricing.trip_style'] ||= []).push(option);
      payload.trip_style = String(option.label_ar || label).trim();
      payload.trip_style_value_id = option.id;
    }
    return payload;
  }

  function offerEditorBody(item) {
    const offer = item || { package_id: '', service_id: '', destination_id: '', trip_style: 'custom', departure_month: '', min_travelers: 1, max_travelers: 4, price_mode: 'fixed', price_amount: '', discounted_price_amount: '', availability: 'available', seats_available: '', status: 'draft', sort_order: 0, notes_ar: '', notes_en: '' };
    const advanced = `
      ${customOfferSelectField('نوع الرحلة', 'trip_style', offerStyles, offer.trip_style, 'اكتب نوع رحلة مخصصًا', false, customValuePolicy.pricing_offers.trip_style)}
      <div class="field"><label for="field-price_mode">طريقة السعر</label><select id="field-price_mode" class="select" data-offer-field="price_mode">${optionList(offerModes, offer.price_mode)}</select><span class="field-hint">اترك السعر فارغًا في المسودة ليصبح «طلب عرض سعر».</span></div>
      <div class="field"><label for="field-discounted_price_amount">سعر الخصم للفرد (ج.م.)</label><input id="field-discounted_price_amount" class="input" data-offer-field="discounted_price_amount" type="number" min="0" step="0.01" value="${offer.discounted_price_amount ?? ''}"></div>
      <div class="field"><label for="field-seats_available">المقاعد المتاحة</label><input id="field-seats_available" class="input" data-offer-field="seats_available" type="number" min="0" value="${offer.seats_available ?? ''}"></div>
      <div class="field"><label for="field-sort_order">ترتيب العرض</label><input id="field-sort_order" class="input" data-offer-field="sort_order" type="number" min="0" value="${offer.sort_order || 0}"></div>
      <div class="field full"><label for="field-notes_ar">ملاحظات العرض بالعربية</label><textarea id="field-notes_ar" class="textarea" data-offer-field="notes_ar">${escapeHtml(offer.notes_ar || '')}</textarea></div>
      <div class="field full"><label for="field-notes_en">ملاحظات العرض بالإنجليزية</label><textarea id="field-notes_en" class="textarea" data-offer-field="notes_en" dir="ltr">${escapeHtml(offer.notes_en || '')}</textarea></div>`;
    return `<form id="offer-editor" class="form-grid" novalidate>
      <div class="field full"><label for="field-subject">البرنامج أو الخدمة</label><select id="field-subject" class="select" data-offer-field="subject">${offerSubjectOptions(offer)}</select></div>
      <div class="field"><label for="field-destination_id">الوجهة</label><select id="field-destination_id" class="select" data-offer-field="destination_id">${offerDestinationOptions(offer.destination_id)}</select></div>
      <div class="field"><label for="field-departure_month">شهر السفر</label><input id="field-departure_month" class="input" data-offer-field="departure_month" type="month" value="${escapeHtml(departureMonth(offer.departure_month))}"></div>
      <div class="field"><label for="field-min_travelers">أقل عدد للمسافرين</label><input id="field-min_travelers" class="input" data-offer-field="min_travelers" type="number" min="1" value="${offer.min_travelers}"></div>
      <div class="field"><label for="field-max_travelers">أقصى عدد للمسافرين</label><input id="field-max_travelers" class="input" data-offer-field="max_travelers" type="number" min="1" value="${offer.max_travelers}"></div>
      <div class="field full"><label for="field-price_amount">السعر للفرد بالجنيه المصري</label><input id="field-price_amount" class="input" data-offer-field="price_amount" type="number" min="0" step="0.01" value="${offer.price_amount ?? ''}" placeholder="مثال: 45000"><span class="field-hint">العملة ثابتة: جنيه مصري، والوحدة ثابتة: لكل مسافر.</span></div>
      <div class="field full"><label for="field-availability">حالة التوفر</label><select id="field-availability" class="select" data-offer-field="availability">${optionList(offerAvailability, offer.availability)}</select></div>
      <div class="full">${advancedSection(advanced)}</div>
    </form>`;
  }

  function openOfferEditor(item, options = {}) {
    const patch = options?.patch && typeof options.patch === 'object' && !Array.isArray(options.patch) ? options.patch : {};
    const current = { ...(item || {}), ...patch };
    const isNew = !item;
    const body = `${copilotPrefillNotice(Object.keys(patch), options.customLabels)}${offerEditorBody(current)}`;
    const dialog = openDialog(isNew ? 'إضافة صف سعر جديد' : 'تفاصيل عرض السعر', 'احفظه كمسودة للمراجعة أو انشره بعد التحقق. سيظهر للزائر فقط إذا كان منشورًا ومتوافرًا.', body, `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn" type="button" data-action="save-offer-editor" data-id="${item?.id || ''}" data-status="draft"><i class="fa-solid fa-floppy-disk"></i> حفظ كمسودة</button><button class="btn btn-primary" type="button" data-action="save-offer-editor" data-id="${item?.id || ''}" data-status="published"><i class="fa-solid fa-paper-plane"></i> نشر</button>`);
    markCopilotPrefill(dialog, Object.keys(patch));
  }

  async function saveOfferRow(button) {
    const row = button.closest('tr');
    try {
      const payload = await offerPayload(row);
      setButtonBusy(button, true);
      await client.update('pricing_offers', button.dataset.id, payload);
      showToast('success', 'تم حفظ صف السعر', 'تم تحديث العرض في قاعدة البيانات المركزية.');
      await renderPricing();
    } catch (error) { showToast('error', 'تعذر حفظ صف السعر', error.message); setButtonBusy(button, false); }
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
      validateCustomSelections(form);
      const payload = await offerPayload(form, button.dataset.status);
      setButtonBusy(button, true);
      if (button.dataset.id) await client.update('pricing_offers', button.dataset.id, payload); else await client.create('pricing_offers', payload);
      dialog.close();
      showToast('success', button.dataset.status === 'published' ? 'تم نشر عرض السعر' : 'تم حفظ عرض السعر كمسودة', 'أصبح العرض محفوظًا في Supabase.');
      await renderPricing();
    } catch (error) { showToast('error', 'تعذر حفظ عرض السعر', error.message); setButtonBusy(button, false); }
  }

  function openOfferPreview(item) {
    const subject = offerSubject(item);
    const destination = offerDestination(item);
    const travelers = `${item.min_travelers}–${item.max_travelers} مسافرين`;
    openDialog(`معاينة: ${subject.title_ar}`, 'هذه المعاينة تمثل البطاقة التي قد يراها العميل بعد نشر العرض.', `<article class="preview-card"><div class="preview-copy"><span class="badge badge-featured">${escapeHtml(offerDestination(item).title_ar)}</span><h4>${escapeHtml(subject.title_ar)}</h4><p>شهر السفر: ${escapeHtml(departureMonth(item.departure_month))} · ${escapeHtml(travelers)}</p><p class="preview-price">${escapeHtml(offerPriceText(item))}</p>${item.notes_ar ? `<p>${escapeHtml(item.notes_ar)}</p>` : ''}<div style="margin-top:1rem">${offerStatusMarkup(item)}</div></div></article>`, '<button class="btn" type="button" data-close-dialog>إغلاق</button>');
  }

  function reviewStatusMarkup(review) {
    const labels = {
      pending: '<span class="badge badge-draft"><i class="fa-solid fa-hourglass-half"></i> قيد المراجعة</span>',
      approved: '<span class="badge badge-published"><i class="fa-solid fa-circle-check"></i> معتمد</span>',
      rejected: '<span class="badge badge-archived"><i class="fa-solid fa-circle-xmark"></i> مرفوض</span>'
    };
    return labels[review.status] || labels.pending;
  }

  function reviewStars(rating) {
    const count = Math.max(1, Math.min(5, Number(rating) || 1));
    return `<span class="review-admin-stars" aria-label="${count} من 5">${'<i class="fa-solid fa-star" aria-hidden="true"></i>'.repeat(count)}${'<i class="fa-regular fa-star" aria-hidden="true"></i>'.repeat(5 - count)}</span>`;
  }

  function reviewRows(reviews) {
    if (!reviews.length) return '<div class="empty-state"><div><i class="fa-solid fa-comments"></i><h3>لا توجد آراء واردة</h3><p>ستظهر آراء الزوار المرسلة من الموقع العام هنا للمراجعة.</p></div></div>';
    return `<div class="table-scroll"><table><thead><tr><th>العميل والرأي</th><th>التقييم</th><th>الحالة</th><th>تاريخ الإرسال</th><th><span class="sr-only">إجراءات</span></th></tr></thead><tbody>${reviews.map((review) => `<tr><td><strong>${escapeHtml(review.customer_name)}</strong><p class="review-admin-copy">${escapeHtml(review.review_text)}</p></td><td>${reviewStars(review.rating)}</td><td>${reviewStatusMarkup(review)}</td><td><span class="muted">${formatDate(review.submitted_at)}</span></td><td><div class="table-actions"><button class="btn btn-small" data-action="edit-review" data-id="${review.id}" aria-label="مراجعة وتعديل الرأي"><i class="fa-solid fa-pen"></i></button>${review.status !== 'approved' ? `<button class="btn btn-small" data-action="approve-review" data-id="${review.id}" aria-label="اعتماد الرأي"><i class="fa-solid fa-check"></i></button>` : ''}${review.status !== 'rejected' ? `<button class="btn btn-small" data-action="reject-review" data-id="${review.id}" aria-label="رفض الرأي"><i class="fa-solid fa-ban"></i></button>` : ''}<button class="btn btn-small btn-danger" data-action="delete-review" data-id="${review.id}" aria-label="حذف الرأي"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join('')}</tbody></table></div>`;
  }

  async function renderReviews() {
    app.innerHTML = layout(`${pageHeader('آراء العملاء', 'الآراء الجديدة لا تظهر للعامة إلا بعد اعتمادها من هنا.')}${loadingMarkup('جارٍ تحميل آراء العملاء…')}`);
    try {
      const reviews = await client.list('customer_reviews', { order: 'submitted_at.desc' });
      state.reviews = reviews;
      const pending = reviews.filter((review) => review.status === 'pending').length;
      const approved = reviews.filter((review) => review.status === 'approved').length;
      const rejected = reviews.filter((review) => review.status === 'rejected').length;
      const content = `${pageHeader('آراء العملاء', 'اعتمد الرأي الموثوق ليظهر في الموقع العام، أو ارفضه أو احذفه نهائيًا.', `<div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap"><span class="badge badge-draft"><i class="fa-solid fa-hourglass-half"></i> ${pending} بانتظار المراجعة</span><button class="btn btn-primary" type="button" data-action="new-review"><i class="fa-solid fa-plus"></i> إضافة رأي</button></div>`)}<section class="panel table-card"><div class="panel-head"><div><h3 class="panel-title">سجل مراجعات الزوار</h3><p class="panel-subtitle">يُعرض للعامة فقط ما يحمل حالة «معتمد».</p></div><div style="display:flex;gap:.45rem;flex-wrap:wrap"><span class="badge badge-published">${approved} معتمد</span><span class="badge badge-archived">${rejected} مرفوض</span></div></div><div class="toolbar"><div class="search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input id="reviews-search" class="input" type="search" placeholder="ابحث بالاسم أو نص الرأي…"></div><span class="muted">${reviews.length} رأي</span></div><div id="reviews-table">${reviewRows(reviews)}</div></section>`;
      app.innerHTML = layout(content);
      document.getElementById('reviews-search')?.addEventListener('input', (event) => {
        const term = event.target.value.toLowerCase().trim();
        document.getElementById('reviews-table').innerHTML = reviewRows(reviews.filter((review) => `${review.customer_name} ${review.review_text}`.toLowerCase().includes(term)));
      });
    } catch (error) { app.innerHTML = layout(`${pageHeader('آراء العملاء', '')}${errorMarkup(error.message)}`); }
  }

  function reviewStatusOptions(selected) {
    return ['pending', 'approved', 'rejected'].map((status) => `<option value="${status}" ${status === selected ? 'selected' : ''}>${status === 'pending' ? 'قيد المراجعة' : status === 'approved' ? 'معتمد' : 'مرفوض'}</option>`).join('');
  }

  function openReviewEditor(review = null) {
    const isNew = !review;
    const value = review || { customer_name: '', rating: 5, review_text: '', status: 'pending', is_featured: false };
    const advanced = `<label class="field checkbox-field"><input type="checkbox" name="is_featured" ${value.is_featured ? 'checked' : ''}> <span>إبراز هذا الرأي في الموقع</span></label>`;
    const statusControl = isNew
      ? `<input type="hidden" name="status" value="pending"><div class="field"><label>حالة المراجعة</label><div class="input input-readonly">قيد المراجعة</div><span class="field-hint">احفظ الرأي أولًا، ثم راجعه واعتمده أو ارفضه.</span></div>`
      : `<div class="field"><label for="review-status">حالة المراجعة</label><select id="review-status" class="select" name="status">${reviewStatusOptions(value.status || 'pending')}</select><span class="field-hint">المعتمد فقط يظهر في الموقع العام.</span></div>`;
    const footer = isNew
      ? `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn btn-primary" type="button" data-action="save-review"><i class="fa-solid fa-floppy-disk"></i> حفظ للمراجعة</button>`
      : `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn" type="button" data-action="save-review" data-id="${review.id}"><i class="fa-solid fa-floppy-disk"></i> حفظ</button><button class="btn btn-primary" type="button" data-action="save-review" data-status="approved" data-id="${review.id}"><i class="fa-solid fa-check"></i> اعتماد</button><button class="btn" type="button" data-action="save-review" data-status="rejected" data-id="${review.id}"><i class="fa-solid fa-ban"></i> رفض</button>`;
    openDialog(isNew ? 'إضافة رأي للمراجعة' : `مراجعة رأي: ${value.customer_name}`, isNew ? 'احفظ الرأي كـ«قيد المراجعة» ثم اعتمده فقط عندما يكون مناسبًا للنشر.' : 'راجع النص والتقييم والحالة. لا يظهر للعامة إلا الرأي المعتمد.', `<form id="review-editor" class="form-grid"><div class="field"><label for="review-customer-name">اسم العميل</label><input id="review-customer-name" class="input" name="customer_name" value="${escapeHtml(value.customer_name || '')}" required maxlength="120"></div><div class="field"><label for="review-rating">التقييم</label><select id="review-rating" class="select" name="rating" required>${[5,4,3,2,1].map((rating) => `<option value="${rating}" ${Number(value.rating) === rating ? 'selected' : ''}>${rating} من 5</option>`).join('')}</select></div><div class="field full"><label for="review-text">رأي العميل</label><textarea id="review-text" class="textarea" name="review_text" required maxlength="1500" placeholder="اكتب تجربة العميل باختصار…">${escapeHtml(value.review_text || '')}</textarea></div>${statusControl}${advancedSection(advanced, 'خيارات إضافية')}</form>`, footer);
  }

  async function saveReview(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#review-editor');
    if (!form.reportValidity()) return;
    const existing = (state.reviews || []).find((item) => item.id === button.dataset.id) || null;
    const chosenStatus = button.dataset.status || form.elements.status.value;
    const payload = {
      customer_name: form.elements.customer_name.value.trim(),
      rating: Number(form.elements.rating.value),
      review_text: form.elements.review_text.value.trim(),
      status: chosenStatus,
      is_featured: Boolean(form.elements.is_featured.checked),
      reviewed_at: chosenStatus === 'pending' ? null : (existing?.reviewed_at || new Date().toISOString())
    };
    try {
      setButtonBusy(button, true);
      if (existing) await client.update('customer_reviews', existing.id, payload); else await client.create('customer_reviews', { ...payload, submitted_at: new Date().toISOString() });
      dialog.close();
      showToast('success', chosenStatus === 'approved' ? 'تم اعتماد الرأي' : chosenStatus === 'rejected' ? 'تم رفض الرأي' : 'تم حفظ الرأي للمراجعة', chosenStatus === 'approved' ? 'أصبح الرأي ظاهرًا في الموقع العام.' : 'يمكنك اعتماده أو رفضه لاحقًا.');
      await renderReviews();
    } catch (error) { showToast('error', 'تعذر حفظ الرأي', error.message); setButtonBusy(button, false); }
  }

  async function updateReviewStatus(id, status) {
    const review = (state.reviews || []).find((item) => item.id === id);
    if (!review) return;
    const action = status === 'approved' ? 'اعتماد' : 'رفض';
    const impact = status === 'approved' ? 'سيظهر هذا الرأي في الموقع العام فورًا.' : 'لن يظهر هذا الرأي في الموقع العام.';
    if (!window.confirm(`هل تريد ${action} رأي «${review.customer_name}»؟\n${impact}`)) return;
    try {
      await client.update('customer_reviews', id, { status, reviewed_at: new Date().toISOString() });
      showToast('success', status === 'approved' ? 'تم اعتماد الرأي' : 'تم رفض الرأي', impact);
      await renderReviews();
    } catch (error) { showToast('error', `تعذر ${action} الرأي`, error.message); }
  }

  async function deleteReview(id) {
    const review = (state.reviews || []).find((item) => item.id === id);
    if (!review) return;
    if (!window.confirm(`هل تريد حذف رأي «${review.customer_name}» نهائيًا؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await client.remove('customer_reviews', id);
      showToast('success', 'تم حذف الرأي', 'أُزيل الرأي من قائمة المراجعات والموقع العام إن كان معتمدًا.');
      await renderReviews();
    } catch (error) { showToast('error', 'تعذر حذف الرأي', error.message); }
  }

  const SETTING_PRESENTATION = Object.freeze({
    company_identity: { title: 'هوية الشركة', description: 'الاسم والبيانات التنظيمية الأساسية للشركة.' },
    contact: { title: 'بيانات التواصل', description: 'وسائل تواصل العملاء والعناوين المعروضة في الموقع.' },
    location: { title: 'موقع الشركة', description: 'المدينة والإحداثيات ورابط الخريطة.' },
    site_meta: { title: 'بيانات ظهور الموقع', description: 'عنوان الموقع ووصفه والرابط الأساسي لمحركات البحث.' },
    social_links: { title: 'الروابط الرسمية', description: 'روابط القنوات والمنصات الرسمية للشركة.' }
  });

  const SETTING_FIELD_LABELS = Object.freeze({
    name_ar: 'الاسم بالعربية', name_en: 'الاسم بالإنجليزية', founded_on: 'تاريخ التأسيس', chairman: 'رئيس مجلس الإدارة', chairman_ar: 'رئيس مجلس الإدارة بالعربية', chairman_en: 'رئيس مجلس الإدارة بالإنجليزية', etaa_member: 'عضو في ETAA', licence_number: 'رقم الترخيص', license_number: 'رقم الترخيص', licence_category: 'فئة الترخيص', license_category: 'فئة الترخيص', license_category_ar: 'فئة الترخيص بالعربية', license_category_en: 'فئة الترخيص بالإنجليزية', responsible_manager: 'المدير المسؤول', responsible_manager_ar: 'المدير المسؤول', responsible_manager_en: 'المدير المسؤول بالإنجليزية', email: 'البريد الإلكتروني', landline: 'الهاتف الأرضي', phone: 'رقم الهاتف', mobile_whatsapp: 'أرقام واتساب', address_ar: 'العنوان بالعربية', address_en: 'العنوان بالإنجليزية', city_ar: 'المدينة بالعربية', city_en: 'المدينة بالإنجليزية', latitude: 'خط العرض', longitude: 'خط الطول', map_embed_url: 'رابط تضمين الخريطة', title: 'عنوان ظهور الموقع', canonical_url: 'الرابط الأساسي للموقع', description_ar: 'الوصف بالعربية', website: 'الموقع الرسمي', facebook: 'فيسبوك', whatsapp: 'واتساب', etaa: 'رابط عضوية ETAA'
  });

  const SETTING_ADVANCED_FIELDS = Object.freeze({
    company_identity: ['founded_on', 'chairman', 'chairman_ar', 'chairman_en', 'etaa_member', 'etaa', 'licence_number', 'license_number', 'licence_category', 'license_category', 'license_category_ar', 'license_category_en', 'responsible_manager', 'responsible_manager_ar', 'responsible_manager_en'],
    contact: [],
    location: ['latitude', 'longitude', 'map_embed_url'],
    site_meta: ['canonical_url'],
    social_links: []
  });

  function settingLabel(key) { return SETTING_FIELD_LABELS[key] || key.replace(/[_-]+/g, ' '); }
  function settingPresentation(setting) { return SETTING_PRESENTATION[setting.setting_key] || { title: setting.setting_key.replace(/[_-]+/g, ' '), description: setting.is_public ? 'إعداد عام معروض في الموقع.' : 'إعداد إداري خاص.' }; }
  function settingSummary(value) { return Object.entries(value || {}).slice(0, 3).map(([key, item]) => `<span><strong>${escapeHtml(settingLabel(key))}:</strong> ${escapeHtml(Array.isArray(item) ? item.join('، ') : String(item ?? '—'))}</span>`).join(''); }
  function settingInputType(key, value) {
    if (typeof value === 'number') return 'number';
    if (/email/i.test(key)) return 'email';
    if (/whatsapp_numbers|phone|landline/i.test(key)) return 'tel';
    if (/url|website|facebook|map_embed/i.test(key)) return 'url';
    if (/date/i.test(key)) return 'date';
    return 'text';
  }
  function splitSettingFields(setting) {
    const advancedKeys = new Set(SETTING_ADVANCED_FIELDS[setting.setting_key] || []);
    return Object.entries(setting.value || {}).reduce((groups, entry) => {
      groups[advancedKeys.has(entry[0]) ? 'advanced' : 'primary'].push(entry);
      return groups;
    }, { primary: [], advanced: [] });
  }
  function settingFieldMarkup(key, value) {
    const label = settingLabel(key); const id = `setting-${key.replace(/[^a-z0-9_-]/gi, '-')}`; const isArray = Array.isArray(value); const long = /address|description/i.test(key);
    if (typeof value === 'boolean') return `<label class="field checkbox-field"><input id="${id}" type="checkbox" data-setting-field="${escapeHtml(key)}" ${value ? 'checked' : ''}> <span>${escapeHtml(label)}</span></label>`;
    const normalized = isArray ? value.join(', ') : String(value ?? '');
    return `<div class="field ${long ? 'full' : ''}"><label for="${id}">${escapeHtml(label)}</label>${long ? `<textarea id="${id}" class="textarea" data-setting-field="${escapeHtml(key)}">${escapeHtml(normalized)}</textarea>` : `<input id="${id}" class="input" type="${settingInputType(key, value)}" data-setting-field="${escapeHtml(key)}" value="${escapeHtml(normalized)}" ${typeof value === 'number' ? 'step="any"' : ''}>`}${isArray ? '<span class="field-hint">افصل القيم بفاصلة.</span>' : ''}</div>`;
  }

  async function renderSettings() {
    app.innerHTML = layout(`${pageHeader('إعدادات الموقع', 'حدّث بيانات العمل من حقول واضحة، من دون التعامل مع JSON تقني.')}${loadingMarkup('جارٍ تحميل الإعدادات…')}`);
    try {
      const settings = await client.list('site_settings', { order: 'setting_key.asc' });
      state.collections.settings = settings;
      const content = `${pageHeader('إعدادات الموقع', 'حدّث بيانات العمل من حقول واضحة، من دون التعامل مع JSON تقني.')}
        <section class="panel"><div class="panel-head"><div><h3 class="panel-title">إعدادات العمل</h3><p class="panel-subtitle">كل تعديل يبقى في مصدر البيانات المركزي للموقع.</p></div><span class="badge badge-active"><i class="fa-solid fa-database"></i> مصدر مركزي</span></div>
          ${settings.length ? `<div class="settings-business-grid">${settings.map((item) => { const presentation = settingPresentation(item); return `<article class="editor-card settings-business-card"><div class="panel-head"><div><h4 style="margin:0">${escapeHtml(presentation.title)}</h4><p class="panel-subtitle">${escapeHtml(presentation.description)}</p></div><button class="btn btn-small" data-action="edit-setting" data-key="${escapeHtml(item.setting_key)}"><i class="fa-solid fa-pen"></i> تعديل</button></div><div class="settings-business-summary">${settingSummary(item.value)}</div></article>`; }).join('')}</div>` : '<div class="empty-state"><div><i class="fa-solid fa-sliders"></i><h3>لا توجد إعدادات مسجلة</h3><p>لم يضف الموقع الحالي إعدادات قابلة للإدارة بعد.</p></div></div>'}
        </section>`;
      app.innerHTML = layout(content);
    } catch (error) { app.innerHTML = layout(`${pageHeader('إعدادات الموقع', '')}${errorMarkup(error.message)}`); }
  }

  function openSettingEditor(setting) {
    const fields = splitSettingFields(setting);
    const primary = fields.primary.map(([key, value]) => settingFieldMarkup(key, value)).join('');
    const advanced = fields.advanced.map(([key, value]) => settingFieldMarkup(key, value)).join('');
    const presentation = settingPresentation(setting);
    openDialog(`تعديل: ${presentation.title}`, presentation.description, `<form id="setting-editor" class="form-grid">${primary}${advanced ? advancedSection(advanced, 'إعدادات متقدمة') : ''}</form>`, `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn btn-primary" type="button" data-action="save-setting" data-key="${escapeHtml(setting.setting_key)}"><i class="fa-solid fa-floppy-disk"></i> حفظ التغييرات</button>`);
  }

  async function saveSetting(button) {
    const dialog = button.closest('dialog'); const form = dialog.querySelector('#setting-editor'); const setting = (state.collections.settings || []).find((item) => item.setting_key === button.dataset.key);
    if (!setting) return;
    const value = { ...(setting.value || {}) };
    form.querySelectorAll('[data-setting-field]').forEach((field) => { const key = field.dataset.settingField; const original = setting.value?.[key]; const raw = field.type === 'checkbox' ? field.checked : field.value.trim(); value[key] = Array.isArray(original) ? raw.split(',').map((item) => item.trim()).filter(Boolean) : typeof original === 'number' ? Number(raw) : typeof original === 'boolean' ? Boolean(raw) : raw; });
    if (Object.values(value).some((item) => typeof item === 'number' && !Number.isFinite(item))) { showToast('error', 'قيمة رقمية غير صحيحة', 'تحقق من الإحداثيات أو الحقول الرقمية ثم حاول مرة أخرى.'); return; }
    setButtonBusy(button, true);
    try { await client.updateSetting(button.dataset.key, { value }); dialog.close(); showToast('success', 'تم حفظ الإعداد', 'تم تحديث الإعداد المركزي.'); await renderSettings(); } catch (error) { showToast('error', 'تعذر حفظ الإعداد', error.message); setButtonBusy(button, false); }
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

  function openBlogEditor(post, options = {}) {
    const patch = options?.patch && typeof options.patch === 'object' && !Array.isArray(options.patch) ? options.patch : {};
    const current = { ...(post || { status: 'draft', is_featured: false, sort_order: 0, excerpt_ar: '', excerpt_en: '', content_ar: '', content_en: '', featured_image_url: '', featured_image_alt_ar: '', featured_image_alt_en: '', seo_title_ar: '', seo_title_en: '', seo_description_ar: '', seo_description_en: '' }), ...patch };
    const primary = `
      <div class="field"><label for="blog-category">التصنيف</label><select id="blog-category" name="category_id" class="select" required>${blogCategoryOptions(current.category_id)}</select></div>
      <div class="field"><label for="blog-title-ar">العنوان بالعربية</label><input id="blog-title-ar" name="title_ar" class="input" value="${escapeHtml(current.title_ar || '')}" required></div>
      <div class="field full"><label for="blog-excerpt-ar">ملخص قصير بالعربية</label><textarea id="blog-excerpt-ar" name="excerpt_ar" class="textarea" required>${escapeHtml(current.excerpt_ar || '')}</textarea></div>
      <div class="field full"><label for="blog-content-ar">المقال بالعربية</label><textarea id="blog-content-ar" name="content_ar" class="textarea" style="min-height:14rem" required>${escapeHtml(current.content_ar || '')}</textarea><span class="field-hint">يدعم Markdown الآمن للعناوين والفقرات والقوائم والروابط والاقتباسات.</span></div>
      ${imageUploadField('blog_image_file', 'featured_image_url', current.featured_image_url, 'blog', 'صورة غلاف المقال')}`;
    const advanced = `
      ${englishField('العنوان بالإنجليزية', 'title_en', current.title_en, 'title_ar')}
      ${englishField('الملخص بالإنجليزية', 'excerpt_en', current.excerpt_en, 'excerpt_ar', { textarea: true, full: true })}
      ${englishField('المقال بالإنجليزية', 'content_en', current.content_en, 'content_ar', { textarea: true, full: true, style: 'min-height:14rem' })}
      ${field('وصف الصورة بالعربية', 'featured_image_alt_ar', current.featured_image_alt_ar, { required: false })}
      ${englishField('وصف الصورة بالإنجليزية', 'featured_image_alt_en', current.featured_image_alt_en, 'featured_image_alt_ar')}
      ${field('عنوان SEO بالعربية', 'seo_title_ar', current.seo_title_ar, { required: false })}
      ${englishField('عنوان SEO بالإنجليزية', 'seo_title_en', current.seo_title_en, 'seo_title_ar')}
      ${field('وصف SEO بالعربية', 'seo_description_ar', current.seo_description_ar, { textarea: true, required: false })}
      ${englishField('وصف SEO بالإنجليزية', 'seo_description_en', current.seo_description_en, 'seo_description_ar', { textarea: true })}
      ${field('ترتيب الظهور', 'sort_order', Number(current.sort_order || 0), { type: 'number', required: false, step: '1' })}
      ${checkField('تعيين المقال كعنصر مميز عند النشر', 'is_featured', current.is_featured)}`;
    const editor = `<form id="blog-editor" class="form-grid" novalidate>${copilotPrefillNotice(Object.keys(patch))}<input type="hidden" name="slug" value="${escapeHtml(current.slug || '')}">${primary}<div class="full">${advancedSection(advanced)}</div></form>`;
    const dialog = openDialog(post ? 'تعديل المقال' : 'مقال جديد', 'احفظ مسودة في أي وقت. عند النشر فقط يلزم استكمال المحتوى الثنائي اللغة والصورة.', editor, `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn" type="button" data-action="save-blog" data-status="draft" data-id="${post?.id || ''}"><i class="fa-solid fa-floppy-disk"></i> حفظ مسودة</button><button class="btn btn-primary" type="button" data-action="save-blog" data-status="published" data-id="${post?.id || ''}"><i class="fa-solid fa-upload"></i> نشر</button>`);
    markCopilotPrefill(dialog, Object.keys(patch));
  }

  function blogPayload(form, status, existing) {
    const values = Object.fromEntries(new FormData(form).entries());
    const value = (field) => String(values[field] || '').trim();
    const slug = value('slug').toLowerCase() || autoSlug(value('title_en'), state.blog?.posts, 'article');
    const uploadedImageUrl = value('featured_image_url') || null;
    return { slug, title_ar: value('title_ar'), title_en: value('title_en'), excerpt_ar: value('excerpt_ar'), excerpt_en: value('excerpt_en'), content_ar: value('content_ar'), content_en: value('content_en'), featured_image_url: uploadedImageUrl, featured_image_alt_ar: value('featured_image_alt_ar') || null, featured_image_alt_en: value('featured_image_alt_en') || null, category_id: value('category_id') || null, status, is_featured: Boolean(form.querySelector('[name="is_featured"]')?.checked) && status === 'published', sort_order: Math.max(0, Number(value('sort_order') || 0)), seo_title_ar: value('seo_title_ar') || null, seo_title_en: value('seo_title_en') || null, seo_description_ar: value('seo_description_ar') || null, seo_description_en: value('seo_description_en') || null, og_image_url: uploadedImageUrl, author_id: existing?.author_id || state.auth.session?.user?.id || null, updated_by: state.auth.session?.user?.id || null, ...(status === 'published' ? { published_at: existing?.published_at || new Date().toISOString() } : {}) };
  }

  function blogPublishIssues(payload) {
    const fields = [
      ['category_id', 'التصنيف'], ['title_ar', 'العنوان بالعربية'], ['title_en', 'العنوان بالإنجليزية'],
      ['excerpt_ar', 'الملخص بالعربية'], ['excerpt_en', 'الملخص بالإنجليزية'], ['content_ar', 'المقال بالعربية'],
      ['content_en', 'المقال بالإنجليزية'], ['featured_image_url', 'صورة غلاف المقال']
    ];
    return fields.filter(([key]) => !String(payload[key] || '').trim()).map(([, label]) => label);
  }

  async function saveBlog(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#blog-editor');
    if (!form.reportValidity()) return;
    const existing = (state.blog?.posts || []).find((post) => post.id === button.dataset.id) || null;
    setButtonBusy(button, true);
    try {
      const imageFile = form.querySelector('[name="blog_image_file"]')?.files?.[0];
      if (imageFile) {
        button.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> جارٍ رفع الغلاف…';
        const upload = await client.uploadImage(imageFile, 'blog');
        form.querySelector('[name="featured_image_url"]').value = upload.publicUrl;
      }
      const payload = blogPayload(form, button.dataset.status, existing);
      if (button.dataset.status === 'published') {
        const issues = blogPublishIssues(payload);
        if (issues.length) throw new Error(`للنشر، أكمل: ${issues.join('، ')}.`);
      }
      if (existing) await client.update('blog_posts', existing.id, payload); else await client.create('blog_posts', payload);
      dialog.close();
      showToast('success', button.dataset.status === 'published' ? 'تم نشر المقال' : 'تم حفظ المسودة', 'تُعرض المقالات المنشورة فقط للزائر.');
      await renderBlog();
    } catch (error) {
      showToast('error', 'تعذر حفظ المقال', error.message);
      setButtonBusy(button, false);
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
    openDialog(category ? 'تعديل التصنيف' : 'تصنيف جديد', 'أبقِ التصنيف قصيرًا وواضحًا لتسهيل ربط المقالات ذات الصلة.', `<form id="blog-category-editor" class="form-grid"><input type="hidden" name="slug" value="${escapeHtml(current.slug || '')}"><div class="field"><label>الاسم بالعربية</label><input class="input" name="title_ar" value="${escapeHtml(current.title_ar || '')}" required></div><div class="field"><label>الاسم بالإنجليزية</label><input class="input" dir="ltr" name="title_en" value="${escapeHtml(current.title_en || '')}" required></div><div class="field"><label>الترتيب</label><input class="input" type="number" min="0" name="sort_order" value="${Number(current.sort_order || 0)}"></div><div class="field full"><label>وصف بالعربية</label><textarea class="textarea" name="description_ar">${escapeHtml(current.description_ar || '')}</textarea></div><div class="field full"><label>وصف بالإنجليزية</label><textarea class="textarea" dir="ltr" name="description_en">${escapeHtml(current.description_en || '')}</textarea></div></form>`, `<button class="btn" type="button" data-close-dialog>إلغاء</button><button class="btn btn-primary" type="button" data-action="save-blog-category" data-id="${category?.id || ''}"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>`);
  }

  async function saveBlogCategory(button) {
    const dialog = button.closest('dialog');
    const form = dialog.querySelector('#blog-category-editor');
    const values = Object.fromEntries(new FormData(form).entries());
    const slug = String(values.slug || '').trim().toLowerCase() || autoSlug(values.title_en, state.blog?.categories, 'category');
    const existing = (state.blog?.categories || []).find((category) => category.id === button.dataset.id);
    const payload = { slug, title_ar: values.title_ar.trim(), title_en: values.title_en.trim(), description_ar: values.description_ar.trim() || null, description_en: values.description_en.trim() || null, status: existing?.status || 'active', sort_order: Math.max(0, Number(values.sort_order || 0)) };
    setButtonBusy(button, true);
    try { if (existing) await client.update('blog_categories', existing.id, payload); else await client.create('blog_categories', payload); dialog.close(); showToast('success', 'تم حفظ التصنيف', 'يمكن الآن ربط المقالات بهذا التصنيف.'); await renderBlog(); } catch (error) { showToast('error', 'تعذر حفظ التصنيف', error.message); setButtonBusy(button, false); }
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

  function isCompactAdminViewport() {
    return window.matchMedia('(max-width: 1023px)').matches;
  }

  function syncMobileNavState(isOpen) {
    const sidebar = document.getElementById('admin-sidebar');
    const toggle = document.querySelector('[data-action="toggle-nav"]');
    const compact = isCompactAdminViewport();
    if (sidebar) sidebar.setAttribute('aria-hidden', String(compact && !isOpen));
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(compact && isOpen));
      toggle.setAttribute('aria-label', compact && isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
      toggle.classList.toggle('is-open', compact && isOpen);
    }
  }

  function applyTableAffordances() {
    document.querySelectorAll('.table-scroll').forEach((container) => {
      const refresh = () => {
        const scrollable = container.scrollWidth > container.clientWidth + 4;
        container.classList.toggle('is-scrollable', scrollable);
        container.classList.toggle('is-scrolled', !scrollable || Math.abs(container.scrollLeft) > 12);
        if (scrollable) container.dataset.scrollHint = 'اسحب لرؤية بقية الجدول';
      };
      if (!container.dataset.uxBound) {
        container.dataset.uxBound = 'true';
        container.addEventListener('scroll', refresh, { passive: true });
      }
      refresh();
    });
  }

  function consumeCopilotEditorPrefill() {
    let draft = null;
    try {
      const raw = sessionStorage.getItem(editorPrefillStorageKey);
      if (!raw) return;
      draft = JSON.parse(raw);
    } catch { sessionStorage.removeItem(editorPrefillStorageKey); return; }
    const entityToPage = { packages: 'packages', destinations: 'destinations', services: 'services', pricing_offers: 'pricing', blog_posts: 'blog' };
    const expectedPage = entityToPage[draft?.entity];
    if (!expectedPage || state.page !== expectedPage || !['create', 'update'].includes(draft?.operation) || !draft?.patch || typeof draft.patch !== 'object' || Array.isArray(draft.patch)) return;
    sessionStorage.removeItem(editorPrefillStorageKey);
    const allowedFields = {
      packages: ['category', 'title_ar', 'title_en', 'description_ar', 'description_en', 'image_url', 'image_alt_ar', 'image_alt_en', 'badge_ar', 'badge_en', 'rating', 'highlights', 'price_label_ar', 'price_label_en', 'sort_order', 'is_active', 'is_featured', 'status'],
      destinations: ['category', 'title_ar', 'title_en', 'description_ar', 'description_en', 'image_url', 'image_alt_ar', 'image_alt_en', 'badge_ar', 'badge_en', 'rating', 'highlights', 'price_label_ar', 'price_label_en', 'sort_order', 'is_active', 'is_featured', 'status'],
      services: ['title_ar', 'title_en', 'description_ar', 'description_en', 'icon_class', 'sort_order', 'is_active', 'status'],
      pricing_offers: ['package_id', 'service_id', 'destination_id', 'departure_month', 'min_travelers', 'max_travelers', 'price_amount', 'availability', 'price_mode', 'pricing_unit', 'currency', 'notes_ar', 'notes_en', 'sort_order', 'status'],
      blog_posts: ['category_id', 'title_ar', 'title_en', 'excerpt_ar', 'excerpt_en', 'content_ar', 'content_en', 'featured_image_url', 'featured_image_alt_ar', 'featured_image_alt_en', 'seo_title_ar', 'seo_title_en', 'seo_description_ar', 'seo_description_en', 'sort_order', 'is_featured', 'status']
    };
    const patch = Object.fromEntries(Object.entries(draft.patch).filter(([key]) => allowedFields[draft.entity].includes(key)));
    if (!Object.keys(patch).length) { showToast('error', 'مسودة غير صالحة', 'لم تحتوِ مسودة المساعد على حقول قابلة للمراجعة.'); return; }
    let record = null;
    if (draft.operation === 'update') {
      const recordId = String(draft.targetId || '');
      if (!recordId) { showToast('error', 'تعذر فتح التعديل', 'لا توجد هوية متحققة للسجل المطلوب.'); return; }
      if (collectionMeta[draft.entity]) record = (state.collections[draft.entity] || []).find((item) => item.id === recordId);
      if (draft.entity === 'pricing_offers') record = (state.pricing?.offers || []).find((item) => item.id === recordId);
      if (draft.entity === 'blog_posts') record = (state.blog?.posts || []).find((item) => item.id === recordId);
      if (!record) { showToast('error', 'تعذر فتح التعديل', 'لم يعد السجل المتحقق منه متاحًا في البيانات الحالية.'); return; }
    }
    const customLabels = draft.customLabels && typeof draft.customLabels === 'object' && !Array.isArray(draft.customLabels) ? draft.customLabels : {};
    if (collectionMeta[draft.entity]) openItemEditor(draft.entity, record, { patch, customLabels });
    else if (draft.entity === 'pricing_offers') openOfferEditor(record, { patch, customLabels });
    else if (draft.entity === 'blog_posts') openBlogEditor(record, { patch });
    showToast('success', 'مسودة المساعد جاهزة', 'راجع الحقول المميزة ثم احفظ المسودة أو انشر بنفسك.');
  }

  async function renderPage() {
    closeMobileNav();
    state.page = currentPage();
    state.search = '';
    document.title = `${routeLabels[state.page].title} | أمواج للسياحة`;
    if (state.page === 'dashboard') await renderDashboard();
    else if (collectionMeta[state.page]) await renderCollection(state.page);
    else if (state.page === 'pricing') await renderPricing();
    else if (state.page === 'blog') await renderBlog();
    else if (state.page === 'reviews') await renderReviews();
    else if (state.page === 'settings') await renderSettings();
    else await renderDashboard();
    syncMobileNavState(false);
    applyTableAffordances();
    consumeCopilotEditorPrefill();
  }

  function closeMobileNav({ restoreFocus = false } = {}) {
    document.getElementById('admin-sidebar')?.classList.remove('is-open');
    document.body.classList.remove('admin-nav-open');
    syncMobileNavState(false);
    if (restoreFocus && isCompactAdminViewport()) document.querySelector('[data-action="toggle-nav"]')?.focus({ preventScroll: true });
  }

  function toggleMobileNav() {
    const sidebar = document.getElementById('admin-sidebar');
    if (!sidebar || !isCompactAdminViewport()) return;
    const nextState = !sidebar.classList.contains('is-open');
    sidebar.classList.toggle('is-open', nextState);
    document.body.classList.toggle('admin-nav-open', nextState);
    syncMobileNavState(nextState);
    if (nextState) window.requestAnimationFrame(() => sidebar.querySelector('.nav-link.is-active, .nav-link')?.focus());
  }

  async function handleAction(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'toggle-nav') {
      event.preventDefault();
      toggleMobileNav();
      return;
    }
    if (action === 'close-nav' || action === 'navigate') closeMobileNav();
    if (action === 'reload-page') renderPage();
    if (action === 'export-pdf') { window.print(); }
    if (action === 'sign-out') { await client.signOut(); window.location.replace('/admin/login/'); }
    if (action === 'new-item') { await loadBusinessOptions(); openItemEditor(target.dataset.kind, null); }
    if (action === 'edit-item') { const row = (state.collections[target.dataset.kind] || []).find((item) => item.id === target.dataset.id); if (row) { await loadBusinessOptions(); openItemEditor(target.dataset.kind, row); } }
    if (action === 'preview') { const row = (state.collections[target.dataset.kind] || []).find((item) => item.id === target.dataset.id); if (row) openPreview(target.dataset.kind, row); }
    if (action === 'save-item') saveItem(target);
    if (action === 'generate-english') generateEnglish(target);
    if (action === 'generate-derived') generateDerivedFields(target);
    if (action === 'toggle-featured') updateItemAction(target.dataset.kind, target.dataset.id, 'featured');
    if (action === 'toggle-archive') { const row = (state.collections[target.dataset.kind] || []).find((item) => item.id === target.dataset.id); if (row) updateItemAction(target.dataset.kind, target.dataset.id, row.is_active ? 'archive' : 'restore'); }
    if (action === 'delete-item') deleteItem(target.dataset.kind, target.dataset.id);
    if (action === 'new-offer') { await loadBusinessOptions(); openOfferEditor(null); }
    if (action === 'edit-offer') { const row = (state.pricing?.offers || []).find((item) => item.id === target.dataset.id); if (row) { await loadBusinessOptions(); openOfferEditor(row); } }
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
    if (action === 'new-review') openReviewEditor(null);
    if (action === 'edit-review') { const review = (state.reviews || []).find((item) => item.id === target.dataset.id); if (review) openReviewEditor(review); }
    if (action === 'save-review') saveReview(target);
    if (action === 'approve-review') updateReviewStatus(target.dataset.id, 'approved');
    if (action === 'reject-review') updateReviewStatus(target.dataset.id, 'rejected');
    if (action === 'delete-review') deleteReview(target.dataset.id);
    if (action === 'close-dialog') target.closest('dialog')?.close();
  }

  async function initialize() {
    app.innerHTML = '<main class="loading-state" aria-label="جارٍ التحقق من صلاحية الوصول"><div class="spinner" aria-hidden="true"></div><p>جارٍ التحقق من صلاحية الوصول…</p></main>';
    state.auth = await client.requireAdmin();
    if (!state.auth.isAdmin) { window.location.replace('/admin/login/'); return; }
    await loadBusinessOptions();
    await renderPage();
  }

  document.addEventListener('click', (event) => { handleAction(event); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('admin-sidebar')?.classList.contains('is-open')) closeMobileNav({ restoreFocus: true });
  });
  window.addEventListener('resize', () => {
    if (!isCompactAdminViewport()) closeMobileNav();
    else syncMobileNavState(document.getElementById('admin-sidebar')?.classList.contains('is-open'));
    applyTableAffordances();
  }, { passive: true });
  window.addEventListener('amwaj:copilot-mutated', async (event) => {
    const result = event.detail || {};
    const verb = result.operation === 'delete' ? 'تم الحذف' : result.operation === 'create' ? 'تمت الإضافة' : 'تم الحفظ';
    showToast('success', verb, 'حدّث مساعد أمواج البيانات في المصدر المركزي بعد تأكيدك.');
    await renderPage();
  });
  initialize();
}());
