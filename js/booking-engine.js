/**
 * Amwaj Travel & Tourism - Booking and live pricing search
 * Public requests use only the Supabase publishable key. RLS exposes published,
 * available offers only; all authoring remains inside the authenticated admin panel.
 */

let currentBookingStep = 1;
const TOTAL_BOOKING_STEPS = 3;
const AMWAJ_SEARCH_ENDPOINT = window.AMWAJ_CONFIG?.supabase?.url?.replace(/\/$/, '') || '';
const AMWAJ_SEARCH_KEY = window.AMWAJ_CONFIG?.supabase?.publishableKey || '';
const LEGACY_DESTINATION_VALUES = new Set(['all', 'egypt', 'international', 'umrah']);
const publicBusinessOptionCache = new Map();

async function fetchPublicBusinessOptions(fieldKey) {
    if (publicBusinessOptionCache.has(fieldKey)) return publicBusinessOptionCache.get(fieldKey);
    try {
        const options = await publicSupabaseRequest('business_option_values', {
            select: 'id,field_key,value_key,label_ar,label_en,is_active,sort_order',
            field_key: `eq.${fieldKey}`,
            is_active: 'eq.true',
            order: 'sort_order.asc,label_ar.asc'
        });
        const safeOptions = Array.isArray(options) ? options : [];
        publicBusinessOptionCache.set(fieldKey, safeOptions);
        return safeOptions;
    } catch {
        publicBusinessOptionCache.set(fieldKey, []);
        return [];
    }
}

function businessOptionLabel(option, lang = document.documentElement.getAttribute('lang') || 'ar') {
    if (!option) return '';
    return lang === 'en' ? (option.label_en || option.label_ar || option.value_key) : (option.label_ar || option.label_en || option.value_key);
}

function openBookingModal(destinationName = '') {
    if (destinationName) {
        const modalDestInput = document.getElementById('modalDestInput');
        if (modalDestInput) modalDestInput.value = destinationName;
    }
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    resetBookingSteps();
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.add('hidden');
}

function resetBookingSteps() {
    showBookingStep(1);
}

function showBookingStep(step) {
    currentBookingStep = step;
    for (let i = 1; i <= TOTAL_BOOKING_STEPS; i++) {
        const stepEl = document.getElementById(`bookingStep${i}`);
        const indicatorEl = document.getElementById(`stepIndicator${i}`);

        if (stepEl) stepEl.classList.toggle('hidden', i !== step);
        if (indicatorEl) {
            const isActive = i <= step;
            indicatorEl.classList.toggle('bg-brand-500', isActive);
            indicatorEl.classList.toggle('text-white', isActive);
            indicatorEl.classList.toggle('bg-slate-200', !isActive);
            indicatorEl.classList.toggle('text-slate-500', !isActive);
            indicatorEl.classList.toggle('dark:bg-slate-800', !isActive);
        }
    }
}

function nextBookingStep() {
    if (currentBookingStep < TOTAL_BOOKING_STEPS) showBookingStep(currentBookingStep + 1);
}

function prevBookingStep() {
    if (currentBookingStep > 1) showBookingStep(currentBookingStep - 1);
}

function handleBookingSubmit(e) {
    e.preventDefault();
    if (window.processWhatsAppBooking) {
        const success = window.processWhatsAppBooking(e.target);
        if (success) closeBookingModal();
    }
}

function escapeSearchHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[character]));
}

function safeSearchUrl(value) {
    try {
        const url = new URL(String(value || ''), window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function formatSearchMoney(value) {
    return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function resultSubject(offer) {
    return offer.packages || offer.services || { title_ar: 'عرض سفر أمواج', title_en: 'Amwaj travel offer' };
}

function resultDestination(offer) {
    return offer.destinations || { title_ar: 'وجهة أمواج', title_en: 'Amwaj destination', category: '' };
}

function priceMarkup(offer, travelers) {
    if (offer.price_mode === 'quote') {
        return '<p class="text-lg font-black text-brand-600 dark:text-brand-300 lang-ar">اطلب عرض سعر مخصص</p><p class="text-lg font-black text-brand-600 dark:text-brand-300 lang-en">Request a tailored quote</p>';
    }
    const unit = offer.price_mode === 'discount' ? offer.discounted_price_amount : offer.price_amount;
    const prefixAr = offer.price_mode === 'starting_from' ? 'يبدأ من ' : '';
    const prefixEn = offer.price_mode === 'starting_from' ? 'From ' : '';
    const original = offer.price_mode === 'discount'
        ? `<span class="text-xs line-through text-slate-400">${formatSearchMoney(offer.price_amount)} EGP</span>`
        : '';
    const total = Number(unit || 0) * Number(travelers || 1);
    return `<p class="text-xl font-black text-brand-600 dark:text-brand-300">${prefixAr}${formatSearchMoney(unit)} <span class="text-xs">ج.م. / للفرد</span> ${original}</p>
        <p class="text-lg font-black text-brand-600 dark:text-brand-300 lang-en">${prefixEn}${formatSearchMoney(unit)} <span class="text-xs">EGP / traveler</span> ${original}</p>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 lang-ar">الإجمالي التقديري لـ ${escapeSearchHtml(travelers)} مسافرين: ${formatSearchMoney(total)} ج.م.</p>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 lang-en">Estimated total for ${escapeSearchHtml(travelers)} travelers: ${formatSearchMoney(total)} EGP.</p>`;
}

function availabilityMarkup(offer) {
    if (offer.availability === 'limited') {
        return '<span class="inline-flex items-center gap-1 rounded-full bg-goldAccent-500/15 text-goldAccent-600 dark:text-goldAccent-400 px-2.5 py-1 text-[10px] font-extrabold"><i class="fa-solid fa-bolt"></i><span class="lang-ar">مقاعد محدودة</span><span class="lang-en">Limited seats</span></span>';
    }
    return '<span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-[10px] font-extrabold"><i class="fa-solid fa-circle-check"></i><span class="lang-ar">متاح للحجز</span><span class="lang-en">Available</span></span>';
}

function renderLiveSearchResults(offers, travelers, isError = false) {
    const section = document.getElementById('liveSearchResults');
    const content = document.getElementById('liveSearchResultsContent');
    if (!section || !content) return;

    section.classList.remove('hidden');
    if (isError) {
        content.innerHTML = `<div class="rounded-2xl border border-amber-400/30 bg-amber-50 dark:bg-amber-900/20 p-5 text-sm text-amber-900 dark:text-amber-100"><p class="font-extrabold lang-ar">تعذر تحميل الأسعار المباشرة الآن.</p><p class="font-extrabold lang-en">Live prices are temporarily unavailable.</p><p class="mt-1 text-xs lang-ar">يمكنك استعراض الوجهات والبرامج أدناه أو التواصل معنا لطلب عرض سعر.</p><p class="mt-1 text-xs lang-en">You can still browse destinations and packages below or contact us for a quote.</p></div>`;
        return;
    }

    if (!offers.length) {
        content.innerHTML = `<div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-brand-900/80 p-6 text-center shadow-lg"><i class="fa-solid fa-magnifying-glass text-brand-500 text-2xl mb-3"></i><h3 class="font-extrabold text-slate-900 dark:text-white lang-ar">لا توجد عروض منشورة مطابقة حاليًا</h3><h3 class="font-extrabold text-slate-900 dark:text-white lang-en">No published offers match these filters right now</h3><p class="mt-2 text-sm text-slate-500 dark:text-slate-400 lang-ar">غيّر الشهر أو عدد المسافرين أو نوع الرحلة، أو أرسل لنا طلبًا مخصصًا.</p><p class="mt-2 text-sm text-slate-500 dark:text-slate-400 lang-en">Try another month, traveler count, or trip style—or send us a tailored request.</p></div>`;
        return;
    }

    const cards = offers.map((offer) => {
        const subject = resultSubject(offer);
        const destination = resultDestination(offer);
        const image = safeSearchUrl(destination.image_url);
        const monthAr = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(new Date(`${offer.departure_month}T00:00:00`));
        const monthEn = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(`${offer.departure_month}T00:00:00`));
        const bookingName = `${destination.title_ar || destination.title_en} — ${subject.title_ar || subject.title_en}`;
        return `<article class="overflow-hidden rounded-2xl bg-white dark:bg-brand-900 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">
            ${image ? `<img src="${escapeSearchHtml(image)}" alt="${escapeSearchHtml(destination.title_ar || subject.title_ar)}" class="w-full h-36 object-cover" loading="lazy">` : ''}
            <div class="p-5 flex flex-col flex-1">
                <div class="flex items-center justify-between gap-3 mb-3"><span class="text-[10px] font-bold tracking-wider text-brand-600 dark:text-brand-300 uppercase">${escapeSearchHtml(destination.title_ar || '')}</span>${availabilityMarkup(offer)}</div>
                <h3 class="font-black text-slate-900 dark:text-white text-base lang-ar">${escapeSearchHtml(subject.title_ar)}</h3>
                <h3 class="font-black text-slate-900 dark:text-white text-base lang-en">${escapeSearchHtml(subject.title_en)}</h3>
                <p class="mt-2 text-xs text-slate-500 dark:text-slate-400 lang-ar"><i class="fa-regular fa-calendar text-brand-500 ml-1"></i>${escapeSearchHtml(monthAr)} · ${offer.min_travelers}–${offer.max_travelers} مسافرين</p>
                <p class="mt-2 text-xs text-slate-500 dark:text-slate-400 lang-en"><i class="fa-regular fa-calendar text-brand-500 mr-1"></i>${escapeSearchHtml(monthEn)} · ${offer.min_travelers}–${offer.max_travelers} travelers</p>
                <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">${priceMarkup(offer, travelers)}</div>
                ${offer.notes_ar ? `<p class="mt-3 text-[11px] text-slate-500 dark:text-slate-400 lang-ar">${escapeSearchHtml(offer.notes_ar)}</p>` : ''}
                ${offer.notes_en ? `<p class="mt-3 text-[11px] text-slate-500 dark:text-slate-400 lang-en">${escapeSearchHtml(offer.notes_en)}</p>` : ''}
                <button type="button" data-live-offer-book="${escapeSearchHtml(bookingName)}" class="mt-5 w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold transition-colors"><span class="lang-ar">اطلب هذا العرض</span><span class="lang-en">Request this offer</span></button>
            </div>
        </article>`;
    }).join('');

    content.innerHTML = `<div class="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 class="font-black text-slate-900 dark:text-white lang-ar">عروض وأسعار مباشرة مطابقة لبحثك</h2><h2 class="font-black text-slate-900 dark:text-white lang-en">Live offers and prices matching your search</h2><p class="mt-1 text-xs text-slate-500 dark:text-slate-400 lang-ar">السعر للفرد بالجنيه المصري. تظهر العروض المنشورة والمتاحة فقط.</p><p class="mt-1 text-xs text-slate-500 dark:text-slate-400 lang-en">Per-traveler price in EGP. Only published, available offers are shown.</p></div><span class="text-xs font-bold text-brand-600 dark:text-brand-300">${offers.length} <span class="lang-ar">عرض</span><span class="lang-en">offers</span></span></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">${cards}</div>`;
    content.querySelectorAll('[data-live-offer-book]').forEach((button) => {
        button.addEventListener('click', () => openBookingModal(button.dataset.liveOfferBook || ''));
    });
}

async function publicSupabaseRequest(table, params) {
    if (!AMWAJ_SEARCH_ENDPOINT || !AMWAJ_SEARCH_KEY) throw new Error('Live pricing is not configured.');
    const query = new URLSearchParams(params);
    const response = await fetch(`${AMWAJ_SEARCH_ENDPOINT}/rest/v1/${table}?${query.toString()}`, {
        headers: { apikey: AMWAJ_SEARCH_KEY, Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Public pricing request failed (${response.status}).`);
    return response.json();
}

async function fetchLiveOffers(filters) {
    const params = {
        select: 'id,package_id,service_id,destination_id,trip_style,trip_style_value_id,departure_month,min_travelers,max_travelers,price_mode,price_amount,discounted_price_amount,currency,availability,seats_available,notes_ar,notes_en,sort_order,packages(title_ar,title_en,slug),services(title_ar,title_en,slug),destinations(title_ar,title_en,slug,category,category_value_id,image_url)',
        order: 'sort_order.asc,departure_month.asc'
    };
    if (filters.month) params.departure_month = `eq.${filters.month}-01`;
    if (filters.travelers) {
        params.min_travelers = `lte.${filters.travelers}`;
        params.max_travelers = `gte.${filters.travelers}`;
    }
    if (filters.style !== 'all') params.trip_style = `eq.${filters.style}`;
    if (filters.destination?.startsWith('id:')) params.destination_id = `eq.${filters.destination.slice(3)}`;

    const offers = await publicSupabaseRequest('pricing_offers', params);
    const styleOptions = await fetchPublicBusinessOptions('pricing.trip_style');
    const styleById = new Map(styleOptions.map((option) => [option.id, option]));
    const enrichedOffers = offers.map((offer) => ({
        ...offer,
        tripStyleOption: styleById.get(offer.trip_style_value_id) || null
    }));
    if (LEGACY_DESTINATION_VALUES.has(filters.destination) && filters.destination !== 'all') {
        return enrichedOffers.filter((offer) => {
            const destination = resultDestination(offer);
            return destination.category === filters.destination || destination.slug === filters.destination;
        });
    }
    return enrichedOffers;
}

function syncSearchLanguage(lang = document.documentElement.getAttribute('lang') || 'ar') {
    document.querySelectorAll('#searchDestSelect option, #searchStyleSelect option, #plannerDestination option, #plannerStyle option').forEach((option) => {
        const label = lang === 'en' ? option.dataset.labelEn : option.dataset.labelAr;
        if (label) option.textContent = label;
    });
}

async function populateDynamicStyles() {
    const select = document.getElementById('searchStyleSelect');
    if (!select) return;
    const options = await fetchPublicBusinessOptions('pricing.trip_style');
    const existingValues = new Set(Array.from(select.options).map((option) => option.value));
    options.forEach((optionData) => {
        if (!optionData.value_key || existingValues.has(optionData.value_key)) return;
        const option = document.createElement('option');
        option.value = optionData.value_key;
        option.dataset.labelAr = optionData.label_ar || optionData.value_key;
        option.dataset.labelEn = optionData.label_en || optionData.label_ar || optionData.value_key;
        option.textContent = businessOptionLabel(optionData);
        select.append(option);
    });
    syncSearchLanguage();
}

async function populateDynamicDestinations() {
    const select = document.getElementById('searchDestSelect');
    if (!select || !AMWAJ_SEARCH_ENDPOINT || !AMWAJ_SEARCH_KEY) return;
    try {
        const destinations = await publicSupabaseRequest('destinations', { select: 'id,title_ar,title_en,slug,category', order: 'sort_order.asc' });
        const existingValues = new Set(Array.from(select.options).map((option) => option.value));
        destinations.forEach((destination) => {
            const legacyMatch = destination.category && existingValues.has(destination.category);
            if (legacyMatch || !destination.id) return;
            const option = document.createElement('option');
            option.value = `id:${destination.id}`;
            option.dataset.labelAr = destination.title_ar || destination.title_en || 'وجهة';
            option.dataset.labelEn = destination.title_en || destination.title_ar || 'Destination';
            option.textContent = (document.documentElement.getAttribute('lang') || 'ar') === 'en' ? option.dataset.labelEn : option.dataset.labelAr;
            select.append(option);
        });
    } catch {
        // The static destination options remain usable as an initial and offline fallback.
    }
}

/**
 * Searches published, available pricing offers. The original destination-card filter
 * remains as a progressive fallback if Supabase cannot be reached.
 */
async function handleTripSearch(e) {
    e.preventDefault();
    const destSelect = document.getElementById('searchDestSelect');
    const monthInput = document.getElementById('searchMonthInput');
    const travelersInput = document.getElementById('searchTravelersInput');
    const styleSelect = document.getElementById('searchStyleSelect');
    const submit = e.currentTarget?.querySelector('button[type="submit"]');
    const destination = destSelect?.value || 'all';
    const travelers = Math.min(50, Math.max(1, Number(travelersInput?.value || 2)));
    const style = styleSelect?.value || 'all';
    const month = monthInput?.value || '';

    if (submit) submit.disabled = true;
    try {
        const offers = await fetchLiveOffers({ destination, month, travelers, style });
        renderLiveSearchResults(offers, travelers);
        document.getElementById('liveSearchResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.warn('Live pricing search unavailable:', error.message);
        renderLiveSearchResults([], travelers, true);
        if (window.filterDestinations) window.filterDestinations(destination);
        document.getElementById('liveSearchResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
        if (submit) submit.disabled = false;
    }
}

window.AmwajSyncSearchLanguage = syncSearchLanguage;
document.addEventListener('DOMContentLoaded', () => {
    syncSearchLanguage();
    populateDynamicStyles();
    populateDynamicDestinations();
});
window.AmwajLivePricingSearch = Object.freeze({ fetchLiveOffers, handleTripSearch });
