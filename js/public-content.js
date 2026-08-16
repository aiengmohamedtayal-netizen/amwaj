/*
 * Amwaj public content enhancement.
 * Server-rendered HTML remains the SEO/offline fallback. When Supabase is reachable,
 * published and active records progressively refresh the matching public sections.
 */
(function () {
    'use strict';

    const config = window.AMWAJ_CONFIG && window.AMWAJ_CONFIG.supabase;
    const grids = {
        destinations: document.getElementById('destinationsGrid'),
        packages: document.getElementById('packagesGrid'),
        services: document.getElementById('servicesGrid')
    };
    if (!config || !config.url || !config.publishableKey) return;

    const fallbackImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
    const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const safeIcon = (value, fallback) => String(value || fallback).split(/\s+/).filter((token) => /^[a-z0-9-]+$/i.test(token)).join(' ') || fallback;
    const title = (item, language) => language === 'ar' ? (item.title_ar || item.title_en || '') : (item.title_en || item.title_ar || '');
    const description = (item, language) => language === 'ar' ? (item.description_ar || item.description_en || '') : (item.description_en || item.description_ar || '');

    const destinationMeta = {
        egypt: { ar: 'رحلات مصر', en: 'Egypt Tours', color: 'bg-brand-500 text-white' },
        international: { ar: 'السياحة الخارجية', en: 'International', color: 'bg-tealCustom-500 text-white' },
        umrah: { ar: 'برامج العمرة', en: 'Umrah & Religious', color: 'bg-goldAccent-500 text-brand-900' }
    };
    const packageMeta = {
        vip: { ar: 'فخامة VIP', en: 'VIP Luxury', color: 'bg-goldAccent-500 text-brand-900', icon: 'fa-crown', button: 'bg-goldAccent-500 hover:bg-goldAccent-600 text-brand-900', actionAr: 'احجز VIP', actionEn: 'Book VIP' },
        family: { ar: 'العروض العائلية', en: 'Family Package', color: 'bg-brand-500 text-white', icon: 'fa-people-group', button: 'bg-brand-500 hover:bg-brand-600 text-white', actionAr: 'احجز للعائلة', actionEn: 'Book Family' },
        honeymoon: { ar: 'شهر العسل', en: 'Honeymoon', color: 'bg-tealCustom-500 text-white', icon: 'fa-heart', button: 'bg-tealCustom-500 hover:bg-tealCustom-600 text-white', actionAr: 'احجز شهر العسل', actionEn: 'Book Honeymoon' }
    };
    const businessOptionCache = new Map();
    const customDestinationMeta = { color: 'bg-tealCustom-500 text-white' };
    const customPackageMeta = { color: 'bg-brand-500 text-white', icon: 'fa-suitcase', button: 'bg-brand-500 hover:bg-brand-600 text-white', actionAr: 'احجز البرنامج', actionEn: 'Book Now' };

    function bilingual(ar, en) {
        return `<span class="lang-en">${escapeHtml(en)}</span><span class="lang-ar">${escapeHtml(ar)}</span>`;
    }

    async function fetchBusinessOptions(fieldKey) {
        if (businessOptionCache.has(fieldKey)) return businessOptionCache.get(fieldKey);
        try {
            const query = new URLSearchParams({ select: 'id,field_key,value_key,label_ar,label_en,is_active,sort_order', field_key: `eq.${fieldKey}`, is_active: 'eq.true', order: 'sort_order.asc,label_ar.asc' });
            const response = await fetch(`${config.url}/rest/v1/business_option_values?${query.toString()}`, { headers: { apikey: config.publishableKey, Accept: 'application/json' } });
            if (!response.ok) throw new Error(`Public business options request failed (${response.status})`);
            const options = await response.json();
            const safeOptions = Array.isArray(options) ? options : [];
            businessOptionCache.set(fieldKey, safeOptions);
            return safeOptions;
        } catch (error) {
            console.warn('Amwaj business options enhancement unavailable; fallback labels remain visible.', error);
            businessOptionCache.set(fieldKey, []);
            return [];
        }
    }

    function customLabelMeta(item, fallback, defaults) {
        const option = item._businessOption;
        if (!option) return fallback;
        return { ...defaults, ar: option.label_ar || option.value_key, en: option.label_en || option.label_ar || option.value_key };
    }

    function priceLabel(item) {
        const amount = item.discounted_price_amount ?? item.price_amount;
        if (amount !== null && amount !== undefined && amount !== '' && !Number.isNaN(Number(amount))) {
            return {
                ar: `يبدأ من ${new Intl.NumberFormat('ar-EG').format(Number(amount))} ${item.currency || 'EGP'}`,
                en: `From ${new Intl.NumberFormat('en-US').format(Number(amount))} ${item.currency || 'EGP'}`
            };
        }
        return { ar: item.price_label_ar || 'تواصل لمعرفة السعر', en: item.price_label_en || 'Contact for Quote' };
    }

    function highlights(item, compact) {
        const values = Array.isArray(item.highlights) ? item.highlights.slice(0, 2) : [];
        if (!values.length) return '';
        const padding = compact ? 'px-2.5 py-1' : 'px-3 py-1';
        return `<div class="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 pt-2">${values.map((entry) => {
            const ar = typeof entry === 'object' ? (entry.ar || entry.title_ar || entry.en || entry.title_en || '') : entry;
            const en = typeof entry === 'object' ? (entry.en || entry.title_en || entry.ar || entry.title_ar || '') : entry;
            return `<span class="${padding} rounded-lg bg-slate-100 dark:bg-brand-900 border border-slate-200 dark:border-slate-800"><i class="fa-solid fa-check text-tealCustom-500 mr-1"></i>${bilingual(ar, en)}</span>`;
        }).join('')}</div>`;
    }

    function imageMarkup(item) {
        const source = item.image_url || fallbackImage;
        const alt = item.image_alt_ar || item.image_alt_en || title(item, 'ar') || title(item, 'en') || 'Amwaj Travel';
        return `<img src="${escapeHtml(source)}" onerror="this.onerror=null;this.src='${fallbackImage}'" alt="${escapeHtml(alt)}" width="800" height="500" class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500 card-img-zoom" loading="lazy">`;
    }

    function actionButton(item, meta) {
        const bookingName = `${title(item, 'ar')} / ${title(item, 'en')}`.replace(/^\s*\/\s*|\s*\/\s*$/g, '');
        return `<button type="button" data-public-book="${escapeHtml(bookingName)}" class="px-5 py-2.5 rounded-xl ${meta.button || 'bg-brand-500 hover:bg-brand-600 text-white'} text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 shrink-0 btn-magnetic"><i class="fa-solid ${safeIcon(meta.icon, 'fa-paper-plane')} text-xs"></i>${bilingual(meta.actionAr || 'احجز البرنامج', meta.actionEn || 'Book Now')}</button>`;
    }

    function destinationCard(item, index) {
        const meta = customLabelMeta(item, destinationMeta[item.category] || destinationMeta.international, customDestinationMeta);
        const delay = index % 3 === 1 ? ' reveal-d1' : index % 3 === 2 ? ' reveal-d2' : '';
        const rating = Number(item.rating);
        const ratingMarkup = Number.isFinite(rating) ? `<div class="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-2.5 py-1 rounded-lg bg-black/60 text-goldAccent-400 font-bold text-xs backdrop-blur border border-white/10 flex items-center gap-1"><i class="fa-solid fa-star text-goldAccent-500"></i>${escapeHtml(rating.toFixed(1))}</div>` : '';
        const price = priceLabel(item);
        return `<article class="dest-card surface-layer overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-full border border-slate-200 dark:border-slate-800 rounded-3xl reveal${delay}" data-dest="${escapeHtml(item.category || 'international')}">
            <div class="flex flex-col flex-1"><div class="relative h-60 w-full overflow-hidden bg-slate-900">${imageMarkup(item)}<div class="absolute top-4 left-4 rtl:left-auto rtl:right-4 px-3 py-1 rounded-full ${meta.color} font-bold text-xs uppercase shadow tracking-wider">${bilingual(item.badge_ar || meta.ar, item.badge_en || meta.en)}</div>${ratingMarkup}</div>
            <div class="p-6 flex flex-col flex-1 justify-between space-y-4"><div><h3 class="text-lg font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[3rem]">${bilingual(title(item, 'ar'), title(item, 'en'))}</h3><p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2 min-h-[2.5rem]">${bilingual(description(item, 'ar'), description(item, 'en'))}</p></div>${highlights(item, false)}</div></div>
            <div class="p-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-brand-950/40"><div class="flex flex-col"><span class="text-[10px] text-slate-400 font-bold uppercase">${bilingual('الأسعار', 'Pricing')}</span><span class="text-xs font-extrabold text-brand-600 dark:text-tealCustom-400 flex items-center gap-1 mt-0.5"><i class="fa-solid fa-tag text-goldAccent-500"></i>${bilingual(price.ar, price.en)}</span></div>${actionButton(item, { icon: 'fa-paper-plane', actionAr: 'احجز البرنامج', actionEn: 'Book Now' })}</div></article>`;
    }

    function packageCard(item, index) {
        const meta = customLabelMeta(item, packageMeta[item.category] || packageMeta.vip, customPackageMeta);
        const delay = index % 3 === 1 ? ' reveal-d1' : index % 3 === 2 ? ' reveal-d2' : '';
        const rating = Number(item.rating);
        const ratingMarkup = Number.isFinite(rating) ? `<div class="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-2.5 py-1 rounded-lg bg-black/60 text-goldAccent-400 font-bold text-xs backdrop-blur border border-white/10 flex items-center gap-1"><i class="fa-solid fa-star text-goldAccent-500"></i>${escapeHtml(rating.toFixed(1))}</div>` : '';
        const price = priceLabel(item);
        return `<article class="surface-layer overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 travel-card-hover flex flex-col justify-between h-full reveal${delay}"><div class="flex flex-col flex-1"><div class="relative aspect-[16/10] overflow-hidden bg-slate-900">${imageMarkup(item)}<div class="absolute top-4 left-4 rtl:left-auto rtl:right-4 px-3 py-1 rounded-full ${meta.color} font-extrabold text-xs uppercase shadow tracking-wider">${bilingual(item.badge_ar || meta.ar, item.badge_en || meta.en)}</div>${ratingMarkup}</div>
            <div class="p-6 flex flex-col flex-1 justify-between space-y-4"><div><h3 class="text-lg font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[3.25rem]">${bilingual(title(item, 'ar'), title(item, 'en'))}</h3><p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2 min-h-[2.25rem]">${bilingual(description(item, 'ar'), description(item, 'en'))}</p></div>${highlights(item, true)}</div></div>
            <div class="p-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-auto flex items-center justify-between gap-3"><div class="flex flex-col"><span class="text-[10px] text-slate-400 font-bold uppercase">${bilingual('الأسعار', 'Pricing')}</span><span class="text-xs font-extrabold text-brand-600 dark:text-tealCustom-400 flex items-center gap-1 mt-0.5"><i class="fa-solid fa-tag text-goldAccent-500"></i>${bilingual(price.ar, price.en)}</span></div>${actionButton(item, meta)}</div></article>`;
    }

    function serviceCard(item, index) {
        const colors = [['bg-brand-500/10', 'text-brand-500'], ['bg-tealCustom-500/10', 'text-tealCustom-500'], ['bg-goldAccent-500/10', 'text-goldAccent-500'], ['bg-blue-500/10', 'text-blue-500'], ['bg-emerald-500/10', 'text-emerald-500'], ['bg-purple-500/10', 'text-purple-500']][index % 6];
        const delay = index % 3 === 1 ? ' reveal-d1' : index % 3 === 2 ? ' reveal-d2' : '';
        return `<article class="surface-layer p-8 hover:shadow-xl transition-all travel-card-hover reveal${delay}"><div class="w-12 h-12 rounded-2xl ${colors[0]} ${colors[1]} flex items-center justify-center text-xl mb-4"><i class="fa-solid ${safeIcon(item.icon_class, 'fa-suitcase')}"></i></div><h3 class="text-lg font-bold mb-2 text-slate-900 dark:text-white">${bilingual(title(item, 'ar'), title(item, 'en'))}</h3><p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${bilingual(description(item, 'ar'), description(item, 'en'))}</p></article>`;
    }

    async function fetchPublished(table, select) {
        const query = new URLSearchParams({ select, order: 'sort_order.asc,created_at.desc' });
        const response = await fetch(`${config.url}/rest/v1/${table}?${query.toString()}`, { headers: { apikey: config.publishableKey, Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Public ${table} request failed (${response.status})`);
        return response.json();
    }

    function attachBookingListeners(grid) {
        grid.querySelectorAll('[data-public-book]').forEach((button) => button.addEventListener('click', () => {
            if (typeof window.openBookingModal === 'function') window.openBookingModal(button.dataset.publicBook || '');
        }));
    }

    async function hydrate(grid, table, select, render, optionFieldKey, optionColumn) {
        if (!grid) return;
        try {
            let records = await fetchPublished(table, select);
            if (!Array.isArray(records) || !records.length) return;
            if (optionFieldKey && optionColumn) {
                const options = await fetchBusinessOptions(optionFieldKey);
                const byId = new Map(options.map((option) => [option.id, option]));
                records = records.map((record) => ({ ...record, _businessOption: byId.get(record[optionColumn]) || null }));
            }
            grid.innerHTML = records.map(render).join('');
            grid.dataset.source = 'supabase';
            attachBookingListeners(grid);
            grid.querySelectorAll('.reveal').forEach((card) => card.classList.add('in-view'));
        } catch (error) {
            // Do not remove the meaningful server-rendered fallback on a failed request.
            console.warn(`Amwaj ${table} enhancement unavailable; fallback content remains visible.`, error);
        }
    }

    function hydratePublicContent() {
        const cardSelect = 'id,slug,category,category_value_id,title_ar,title_en,description_ar,description_en,image_url,image_alt_ar,image_alt_en,badge_ar,badge_en,rating,highlights,price_label_ar,price_label_en,sort_order,created_at';
        const packageSelect = `${cardSelect},price_amount,discounted_price_amount,currency`;
        hydrate(grids.destinations, 'destinations', cardSelect, destinationCard, 'destination.category', 'category_value_id');
        hydrate(grids.packages, 'packages', packageSelect, packageCard, 'package.category', 'category_value_id');
        hydrate(grids.services, 'services', 'id,slug,icon_class,title_ar,title_en,description_ar,description_en,sort_order,created_at', serviceCard);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hydratePublicContent, { once: true });
    else hydratePublicContent();
}());
