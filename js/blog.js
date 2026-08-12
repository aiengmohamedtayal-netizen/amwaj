/* Amwaj public blog runtime. Reads only published data under Supabase RLS. */
(function () {
  'use strict';

  const config = window.AMWAJ_CONFIG?.supabase;
  const state = { lang: localStorage.lang || 'ar', posts: [], categories: [] };
  const ui = {
    ar: {
      siteName: 'أمواج للسياحة', home: 'الرئيسية', blog: 'المدونة', theme: 'تبديل المظهر', language: 'English',
      read: 'اقرأ المقال', count: 'مقال منشور', empty: 'لا توجد مقالات منشورة في هذا القسم حاليًا.',
      error: 'تعذر تحميل المقالات الآن. يرجى المحاولة لاحقًا.', loading: 'جارٍ تحميل المقالات…', all: 'كل المقالات',
      related: 'مقالات ذات صلة', notFound: 'لم نعثر على هذا المقال', back: 'العودة إلى المدونة', published: 'نُشر في', print: 'طباعة / حفظ PDF'
    },
    en: {
      siteName: 'Amwaj Travel', home: 'Home', blog: 'Journal', theme: 'Toggle theme', language: 'العربية',
      read: 'Read article', count: 'published articles', empty: 'There are no published articles in this category yet.',
      error: 'We could not load articles right now. Please try again later.', loading: 'Loading articles…', all: 'All articles',
      related: 'Related articles', notFound: 'We could not find this article', back: 'Back to journal', published: 'Published', print: 'Print / Save PDF'
    }
  };

  function words() { return ui[state.lang] || ui.ar; }
  function currentLang() { return document.documentElement.lang === 'en' ? 'en' : 'ar'; }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
  function localized(row, field) { return row?.[`${field}_${state.lang}`] || row?.[`${field}_ar`] || row?.[`${field}_en`] || ''; }
  function apiUrl(table, parameters) {
    const params = new URLSearchParams(parameters || {});
    return `${config.url.replace(/\/$/, '')}/rest/v1/${table}?${params.toString()}`;
  }
  async function get(table, parameters) {
    if (!config?.url || !config?.publishableKey) throw new Error('Blog configuration is unavailable.');
    const response = await fetch(apiUrl(table, parameters), { headers: { apikey: config.publishableKey, Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Blog data request failed (${response.status})`);
    return response.json();
  }
  function postUrl(slug) { return `/blog/${encodeURIComponent(slug)}`; }
  function categoryUrl(slug) { return `/blog/?category=${encodeURIComponent(slug)}`; }
  function prettyDate(value) {
    if (!value) return '';
    try { return new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value)); }
    catch { return ''; }
  }
  function setDocumentTitle(customTitle) {
    const fallback = state.lang === 'ar' ? 'مدونة أمواج للسياحة' : 'Amwaj Travel Journal';
    document.title = customTitle ? `${customTitle} | ${fallback}` : fallback;
  }
  function upsertHeadTag(selector, tagName, attributes) {
    let node = document.head.querySelector(selector);
    if (!node) { node = document.createElement(tagName); document.head.appendChild(node); }
    Object.entries(attributes).forEach(([name, value]) => {
      if (value === null || value === undefined || value === '') node.removeAttribute(name);
      else node.setAttribute(name, String(value));
    });
    return node;
  }
  function injectPostSeo(post) {
    const title = localized(post, 'seo_title') || localized(post, 'title');
    const description = localized(post, 'seo_description') || localized(post, 'excerpt') || localized(post, 'title');
    const canonical = `${location.origin}${postUrl(post.slug)}`;
    const image = post.og_image_url || post.featured_image_url || '';
    setDocumentTitle(title);
    upsertHeadTag('meta[name="description"]', 'meta', { name: 'description', content: description });
    upsertHeadTag('link[rel="canonical"]', 'link', { rel: 'canonical', href: canonical });
    upsertHeadTag('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'article' });
    upsertHeadTag('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
    upsertHeadTag('meta[property="og:description"]', 'meta', { property: 'og:description', content: description });
    upsertHeadTag('meta[property="og:url"]', 'meta', { property: 'og:url', content: canonical });
    if (image) upsertHeadTag('meta[property="og:image"]', 'meta', { property: 'og:image', content: image });
    upsertHeadTag('meta[property="article:published_time"]', 'meta', { property: 'article:published_time', content: post.published_at || '' });
    upsertHeadTag('meta[name="twitter:card"]', 'meta', { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' });
    upsertHeadTag('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: title });
    upsertHeadTag('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: description });
    if (image) upsertHeadTag('meta[name="twitter:image"]', 'meta', { name: 'twitter:image', content: image });
  }
  function applyLanguage(lang) {
    state.lang = lang === 'en' ? 'en' : 'ar';
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = words()[node.dataset.i18n] || ''; });
    document.querySelectorAll('[data-i18n-aria]').forEach(node => { node.setAttribute('aria-label', words()[node.dataset.i18nAria] || ''); });
    const detailTitle = document.body.dataset.pageTitleAr && document.body.dataset.pageTitleEn
      ? (state.lang === 'ar' ? document.body.dataset.pageTitleAr : document.body.dataset.pageTitleEn) : '';
    setDocumentTitle(detailTitle);
    window.dispatchEvent(new CustomEvent('amwajbloglanguagechange', { detail: { lang: state.lang } }));
  }
  window.toggleLanguage = function () { applyLanguage(currentLang() === 'ar' ? 'en' : 'ar'); };
  window.setLanguage = applyLanguage;

  function initTheme() {
    const root = document.documentElement;
    const saved = localStorage.theme;
    const dark = saved === 'dark' || (!saved && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', dark);
    const button = document.querySelector('[data-theme-toggle]');
    button?.addEventListener('click', () => {
      const isDark = !root.classList.contains('dark');
      root.classList.toggle('dark', isDark);
      localStorage.theme = isDark ? 'dark' : 'light';
    });
  }

  function inlineMarkdown(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return safe;
  }
  function renderMarkdown(source) {
    const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    const output = []; let list = null;
    const closeList = () => { if (list) { output.push(`</${list}>`); list = null; } };
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (!line) { closeList(); continue; }
      if (heading) { closeList(); const level = heading[1].length + 1; output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
      if (line.startsWith('> ')) { closeList(); output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`); continue; }
      if (unordered || ordered) {
        const desired = unordered ? 'ul' : 'ol';
        if (list !== desired) { closeList(); output.push(`<${desired}>`); list = desired; }
        output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`); continue;
      }
      closeList();
      output.push(`<p>${inlineMarkdown(line)}</p>`);
    }
    closeList();
    return output.join('\n');
  }
  function imageMarkup(post, className) {
    const image = post.featured_image_url;
    const alt = localized(post, 'featured_image_alt') || localized(post, 'title');
    return image
      ? `<img class="${className}" src="${escapeAttr(image)}" alt="${escapeAttr(alt)}" loading="lazy">`
      : `<div class="blog-card-placeholder" aria-hidden="true"><i class="fa-solid fa-compass"></i></div>`;
  }
  function card(post) {
    const category = post.blog_categories || {};
    return `<article class="blog-card">
      ${imageMarkup(post, 'blog-card-image')}
      <div class="blog-card-body">
        <div class="blog-card-meta"><span class="blog-card-category">${escapeHtml(localized(category, 'title'))}</span><span>${escapeHtml(prettyDate(post.published_at))}</span></div>
        <h2 class="blog-card-title"><a href="${postUrl(post.slug)}">${escapeHtml(localized(post, 'title'))}</a></h2>
        <p class="blog-card-excerpt">${escapeHtml(localized(post, 'excerpt'))}</p>
        <a class="blog-card-read" href="${postUrl(post.slug)}">${escapeHtml(words().read)} <i class="fa-solid fa-arrow-left-long"></i></a>
      </div>
    </article>`;
  }
  function loading(target, count) { target.innerHTML = Array.from({ length: count || 3 }, () => '<div class="blog-skeleton" aria-hidden="true"></div>').join(''); }
  function empty(target, type) {
    const message = type === 'error' ? words().error : words().empty;
    const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-book-open';
    target.innerHTML = `<div class="blog-${type === 'error' ? 'error' : 'empty'}"><i class="fa-solid ${icon}"></i><p>${escapeHtml(message)}</p></div>`;
  }

  async function bootListing() {
    const grid = document.querySelector('#blog-post-grid');
    const categoriesTarget = document.querySelector('#blog-category-list');
    const countTarget = document.querySelector('#blog-result-count');
    if (!grid || !categoriesTarget) return;
    loading(grid, 3);
    const selectedSlug = new URLSearchParams(location.search).get('category') || '';
    try {
      const [categories, posts] = await Promise.all([
        get('blog_categories', { select: 'id,slug,title_ar,title_en,sort_order', status: 'eq.active', order: 'sort_order.asc,title_en.asc' }),
        get('blog_posts', { select: 'id,slug,title_ar,title_en,excerpt_ar,excerpt_en,featured_image_url,featured_image_alt_ar,featured_image_alt_en,published_at,is_featured,blog_categories!inner(id,slug,title_ar,title_en)', status: 'eq.published', order: 'is_featured.desc,published_at.desc,sort_order.asc' })
      ]);
      state.categories = categories; state.posts = posts;
      const selected = categories.find(category => category.slug === selectedSlug);
      const filtered = selected ? posts.filter(post => post.blog_categories?.slug === selected.slug) : posts;
      categoriesTarget.innerHTML = [`<a class="blog-category" href="/blog/" ${selected ? '' : 'aria-current="page"'}>${escapeHtml(words().all)}</a>`, ...categories.map(category => `<a class="blog-category" href="${categoryUrl(category.slug)}" ${selected?.slug === category.slug ? 'aria-current="page"' : ''}>${escapeHtml(localized(category, 'title'))}</a>`)].join('');
      countTarget.textContent = `${filtered.length} ${words().count}`;
      if (!filtered.length) empty(grid, 'empty'); else grid.innerHTML = filtered.map(card).join('');
    } catch (error) { console.error('Blog listing error:', error); empty(grid, 'error'); }
  }

  async function bootPost() {
    const target = document.querySelector('#blog-post-view');
    if (!target) return;
    const querySlug = new URLSearchParams(location.search).get('slug');
    const pathParts = location.pathname.split('/').filter(Boolean);
    const pathSlug = pathParts[pathParts.length - 1] === 'post' ? '' : pathParts[pathParts.length - 1];
    const slug = querySlug || pathSlug;
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { renderNotFound(target); return; }
    target.innerHTML = '<div class="blog-loading">جارٍ تحميل المقال…</div>';
    try {
      const rows = await get('blog_posts', { select: 'id,slug,title_ar,title_en,excerpt_ar,excerpt_en,content_ar,content_en,featured_image_url,og_image_url,featured_image_alt_ar,featured_image_alt_en,published_at,seo_title_ar,seo_title_en,seo_description_ar,seo_description_en,blog_categories!inner(id,slug,title_ar,title_en)', slug: `eq.${slug}`, status: 'eq.published', limit: '1' });
      const post = rows[0];
      if (!post) { renderNotFound(target); return; }
      document.body.dataset.pageTitleAr = post.seo_title_ar || post.title_ar;
      document.body.dataset.pageTitleEn = post.seo_title_en || post.title_en;
      injectPostSeo(post);
      const category = post.blog_categories || {};
      target.innerHTML = `<nav class="blog-breadcrumb" aria-label="Breadcrumb"><a href="/">${escapeHtml(words().home)}</a> <span>/</span> <a href="/blog/">${escapeHtml(words().blog)}</a> <span>/</span> <a href="${categoryUrl(category.slug || '')}">${escapeHtml(localized(category, 'title'))}</a></nav>
        <article class="blog-article">
          <header class="blog-article-header">
            <div class="blog-card-meta"><a class="blog-card-category" href="${categoryUrl(category.slug || '')}">${escapeHtml(localized(category, 'title'))}</a><span>${escapeHtml(words().published)} ${escapeHtml(prettyDate(post.published_at))}</span></div>
            <h1>${escapeHtml(localized(post, 'title'))}</h1>
            <p class="blog-article-excerpt">${escapeHtml(localized(post, 'excerpt'))}</p>
          </header>
          <figure class="blog-article-hero">${imageMarkup(post, '')}</figure>
          <div class="blog-prose">${renderMarkdown(localized(post, 'content'))}</div>
          <div class="blog-hide-print" style="margin-top:2.2rem"><button class="blog-control" type="button" onclick="window.print()"><i class="fa-solid fa-file-pdf"></i> ${escapeHtml(words().print)}</button></div>
          <section class="blog-related" aria-labelledby="related-title"><h2 id="related-title">${escapeHtml(words().related)}</h2><div id="blog-related-grid" class="blog-grid"></div></section>
        </article>`;
      loadRelated(post);
      injectArticleSchema(post);
    } catch (error) { console.error('Blog post error:', error); renderNotFound(target); }
  }
  async function loadRelated(post) {
    const target = document.querySelector('#blog-related-grid');
    if (!target) return;
    try {
      const rows = await get('blog_posts', { select: 'id,slug,title_ar,title_en,excerpt_ar,excerpt_en,featured_image_url,featured_image_alt_ar,featured_image_alt_en,published_at,blog_categories!inner(id,slug,title_ar,title_en)', status: 'eq.published', category_id: `eq.${post.blog_categories?.id}`, order: 'published_at.desc', limit: '4' });
      const related = rows.filter(row => row.id !== post.id).slice(0, 3);
      if (!related.length) { target.parentElement.hidden = true; return; }
      target.innerHTML = related.map(card).join('');
    } catch { target.parentElement.hidden = true; }
  }
  function renderNotFound(target) {
    target.innerHTML = `<section class="blog-article"><div class="blog-empty"><i class="fa-solid fa-map-location-dot"></i><h1>${escapeHtml(words().notFound)}</h1><p><a class="blog-button" href="/blog/">${escapeHtml(words().back)}</a></p></div></section>`;
  }
  function injectArticleSchema(post) {
    let script = document.getElementById('amwaj-blog-article-schema');
    if (!script) { script = document.createElement('script'); script.id = 'amwaj-blog-article-schema'; script.type = 'application/ld+json'; document.head.appendChild(script); }
    const image = post.og_image_url || post.featured_image_url;
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: localized(post, 'title'), description: localized(post, 'seo_description') || localized(post, 'excerpt'), image: image ? [image] : undefined, datePublished: post.published_at, dateModified: post.published_at, mainEntityOfPage: { '@type': 'WebPage', '@id': `${location.origin}${postUrl(post.slug)}` }, publisher: { '@type': 'Organization', name: 'Amwaj Travel & Tourism', url: location.origin } });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    applyLanguage(state.lang);
    const view = document.body.dataset.blogView;
    if (view === 'listing') bootListing();
    if (view === 'post') bootPost();
    window.addEventListener('amwajbloglanguagechange', () => {
      if (view === 'listing') bootListing();
      if (view === 'post') bootPost();
    });
  });
}());
