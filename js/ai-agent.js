/**
 * Amwaj AI Assistant
 * Public business context is read from Supabase through RLS-safe queries.
 * Provider credentials and privileged database keys never reach the browser.
 */
(function () {
    const LIVE_DATA_TTL_MS = 5 * 60 * 1000;
    let liveDataCache = { value: null, expiresAt: 0 };

    const companyInfo = {
        name_ar: 'شركة أمواج للسياحة',
        name_en: 'Amwaj Travel & Tourism',
        license: 'ترخيص فئة أ رقم 1766',
        location: 'كفر الشيخ، مصر',
        contact: { phone: '+201070553080', whatsapp: '201070553080', email: 'amwajtravel@hotmail.com' }
    };

    const groqTools = [
        {
            type: 'function',
            function: {
                name: 'searchPackages',
                description: 'البحث في البرامج والوجهات والخدمات والعروض والأسعار المنشورة حالياً لدى شركة أمواج للسياحة. استخدمها قبل ذكر أي برنامج أو سعر أو توافر.',
                parameters: {
                    type: 'object',
                    properties: {
                        destination: { type: 'string', description: 'الوجهة المطلوبة مثل تركيا أو السعودية أو المالديف.' },
                        type: { type: 'string', description: 'نوع الرحلة مثل عمرة أو شهر عسل أو عائلية أو VIP.' },
                        travelers: { type: 'integer', description: 'عدد المسافرين إن ذكره العميل.' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'getCompanyContact',
                description: 'الحصول على بيانات التواصل الرسمية لشركة أمواج للسياحة في كفر الشيخ.',
                parameters: { type: 'object', properties: {} }
            }
        }
    ];

    function getSupabaseConfig() {
        const config = window.AMWAJ_CONFIG?.supabase || {};
        return { endpoint: String(config.url || '').replace(/\/$/, ''), key: String(config.publishableKey || '') };
    }

    async function publicSupabaseRequest(table, params) {
        const { endpoint, key } = getSupabaseConfig();
        if (!endpoint || !key) throw new Error('Live travel data is not configured.');
        const response = await fetch(`${endpoint}/rest/v1/${table}?${new URLSearchParams(params).toString()}`, {
            headers: { apikey: key, Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`Live travel data request failed (${response.status}).`);
        return response.json();
    }

    function compactText(value, max = 260) {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        return text.length > max ? `${text.slice(0, max - 1)}…` : text;
    }

    function currentOfferAmount(offer) {
        if (offer?.price_mode === 'discount') return offer.discounted_price_amount;
        return ['fixed', 'starting_from'].includes(offer?.price_mode) ? offer.price_amount : null;
    }

    function normalizeLiveData({ destinations, packages, services, offers }) {
        return {
            retrieved_at: new Date().toISOString(),
            destinations: (destinations || []).slice(0, 20).map((item) => ({
                id: item.id, slug: item.slug, category: item.category, title_ar: item.title_ar, title_en: item.title_en,
                description_ar: compactText(item.description_ar), description_en: compactText(item.description_en),
                highlights: Array.isArray(item.highlights) ? item.highlights.slice(0, 6) : [],
                price_label_ar: item.price_label_ar, price_label_en: item.price_label_en
            })),
            packages: (packages || []).slice(0, 25).map((item) => ({
                id: item.id, slug: item.slug, category: item.category, title_ar: item.title_ar, title_en: item.title_en,
                description_ar: compactText(item.description_ar), description_en: compactText(item.description_en),
                highlights: Array.isArray(item.highlights) ? item.highlights.slice(0, 8) : [],
                price_mode: item.price_mode, price_amount: item.price_amount,
                discounted_price_amount: item.discounted_price_amount, currency: item.currency
            })),
            services: (services || []).slice(0, 20).map((item) => ({
                id: item.id, slug: item.slug, title_ar: item.title_ar, title_en: item.title_en,
                description_ar: compactText(item.description_ar), description_en: compactText(item.description_en)
            })),
            pricing_offers: (offers || []).slice(0, 30).map((offer) => {
                const subject = offer.packages || offer.services;
                return {
                    id: offer.id,
                    destination: offer.destinations ? {
                        id: offer.destinations.id, title_ar: offer.destinations.title_ar,
                        title_en: offer.destinations.title_en, category: offer.destinations.category
                    } : null,
                    subject: subject ? { title_ar: subject.title_ar, title_en: subject.title_en, slug: subject.slug } : null,
                    trip_style: offer.trip_style, departure_month: offer.departure_month,
                    min_travelers: offer.min_travelers, max_travelers: offer.max_travelers,
                    price_mode: offer.price_mode, price_amount: offer.price_amount,
                    discounted_price_amount: offer.discounted_price_amount, current_price_amount: currentOfferAmount(offer),
                    currency: offer.currency, availability: offer.availability, seats_available: offer.seats_available,
                    notes_ar: compactText(offer.notes_ar, 180), notes_en: compactText(offer.notes_en, 180)
                };
            })
        };
    }

    async function getLiveTravelData(forceRefresh = false) {
        if (!forceRefresh && liveDataCache.value && Date.now() < liveDataCache.expiresAt) return liveDataCache.value;
        const [destinations, packages, services, offers] = await Promise.all([
            publicSupabaseRequest('destinations', {
                select: 'id,slug,category,title_ar,title_en,description_ar,description_en,highlights,price_label_ar,price_label_en', order: 'sort_order.asc'
            }),
            publicSupabaseRequest('packages', {
                select: 'id,slug,category,title_ar,title_en,description_ar,description_en,highlights,price_mode,price_amount,discounted_price_amount,currency', order: 'sort_order.asc'
            }),
            publicSupabaseRequest('services', {
                select: 'id,slug,title_ar,title_en,description_ar,description_en', order: 'sort_order.asc'
            }),
            publicSupabaseRequest('pricing_offers', {
                select: 'id,trip_style,departure_month,min_travelers,max_travelers,price_mode,price_amount,discounted_price_amount,currency,availability,seats_available,notes_ar,notes_en,packages(title_ar,title_en,slug),services(title_ar,title_en,slug),destinations(id,title_ar,title_en,category)',
                order: 'departure_month.asc,sort_order.asc'
            })
        ]);
        const normalized = normalizeLiveData({ destinations, packages, services, offers });
        liveDataCache = { value: normalized, expiresAt: Date.now() + LIVE_DATA_TTL_MS };
        return normalized;
    }

    function searchableText(item) {
        return Object.values(item || {}).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ').toLocaleLowerCase();
    }

    async function executeTool(name, args = {}) {
        if (name === 'getCompanyContact') return JSON.stringify(companyInfo);
        if (name !== 'searchPackages') return JSON.stringify({ error: 'أداة غير معروفة' });
        try {
            const liveData = await getLiveTravelData(true);
            const terms = [args.destination, args.type].filter(Boolean).map((value) => String(value).toLocaleLowerCase());
            const matches = (item) => !terms.length || terms.some((term) => searchableText(item).includes(term));
            const travelers = Number(args.travelers || 0);
            const relevantOffers = liveData.pricing_offers.filter((offer) => matches(offer) && (!travelers || (offer.min_travelers <= travelers && offer.max_travelers >= travelers)));
            const relevantPackages = liveData.packages.filter(matches);
            const relevantDestinations = liveData.destinations.filter(matches);
            const relevantServices = liveData.services.filter(matches);
            return JSON.stringify({
                data_source: 'Supabase public published content at request time', retrieved_at: liveData.retrieved_at,
                packages: (relevantPackages.length ? relevantPackages : liveData.packages).slice(0, 10),
                destinations: (relevantDestinations.length ? relevantDestinations : liveData.destinations).slice(0, 10),
                services: (relevantServices.length ? relevantServices : liveData.services).slice(0, 8),
                pricing_offers: relevantOffers.slice(0, 12),
                price_rule: 'Mention only prices listed in pricing_offers. If no matched offer is returned, say that a tailored quote is required.'
            });
        } catch (error) {
            console.warn('Live Supabase context unavailable for AI tool:', error.message);
            return JSON.stringify({ data_source: 'unavailable', rule: 'Do not state package price or availability. Invite the traveler to request a tailored quote from Amwaj.' });
        }
    }

    window.aiConversationHistory = window.aiConversationHistory || [];
    function optimizeHistory(history, maxMessages = 8) { return history.length <= maxMessages ? history : history.slice(-maxMessages); }

    function parseInlineToolCall(text) {
        const source = String(text || '');
        const nameMatch = source.match(/(?:<<?\s*)?function\s*=\s*([A-Za-z][A-Za-z0-9_-]*)/i);
        if (!nameMatch) return null;
        const allowed = new Set(groqTools.map((tool) => tool.function.name));
        if (!allowed.has(nameMatch[1])) return null;
        const argsMatch = source.match(/\{[\s\S]*\}/);
        let argumentsText = '{}';
        if (argsMatch) {
            try { JSON.parse(argsMatch[0]); argumentsText = argsMatch[0]; } catch (_) { /* wait for the complete streamed JSON */ }
        }
        return {
            id: `inline_${Date.now()}`,
            type: 'function',
            function: { name: nameMatch[1], arguments: argumentsText }
        };
    }

    function sanitizeAssistantText(text) {
        const source = String(text || '');
        const markerIndex = source.search(/(?:<<?\s*)?function\s*=/i);
        if (markerIndex >= 0) return source.slice(0, markerIndex).trim();
        return source.replace(/<<\s*\/?function[^>]*>>?/gi, '').trim();
    }

    async function executeServerlessStream(endpointUrl, messages, tools, onChunk) {
        const response = await fetch(endpointUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, tools, stream: true })
        });
        if (!response.ok) {
            let message = '';
            try { message = await response.text(); } catch (_) { /* no-op */ }
            throw new Error(`Server API error ${response.status}: ${message}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let toolCallData = null;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of decoder.decode(value, { stream: true }).split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data: ')) continue;
                try {
                    const delta = JSON.parse(trimmed.slice(6)).choices?.[0]?.delta;
                    if (delta?.reasoning_content && !fullText && onChunk) onChunk('<i class="fa-solid fa-brain fa-pulse text-brand-500 mr-1"></i> *(جاري التفكير والتخطيط...)*\n\n');
                    if (delta?.content) {
                        fullText += delta.content;
                        const inlineToolCall = parseInlineToolCall(fullText);
                        if (onChunk) onChunk(inlineToolCall ? '' : sanitizeAssistantText(fullText));
                    }
                    if (delta?.tool_calls?.[0]) {
                        if (!toolCallData) toolCallData = delta.tool_calls[0];
                        else if (delta.tool_calls[0].function?.arguments) toolCallData.function.arguments = `${toolCallData.function.arguments || ''}${delta.tool_calls[0].function.arguments}`;
                    }
                } catch (_) { /* Ignore incomplete SSE fragments. */ }
            }
        }
        const inlineToolCall = parseInlineToolCall(fullText);
        if (toolCallData) return { type: 'tool_call', tool: toolCallData };
        if (inlineToolCall) return { type: 'tool_call', tool: inlineToolCall };
        return { type: 'text', text: sanitizeAssistantText(fullText) };
    }

    async function callAiEndpoint(messages, tools, onChunk) {
        return executeServerlessStream(window.AMWAJ_CONFIG?.ai?.apiEndpoint || '/api/chat', messages, tools, onChunk);
    }

    const systemPrompt = `ROLE: You are "مساعد أمواج الذكي", the senior AI travel concierge for Amwaj Travel & Tourism (كفر الشيخ، مصر - ترخيص 1766).
RULES:
- Always be helpful, polite, professional, and natural in Arabic unless the customer writes in English.
- Ask one clarifying question at a time when necessary.
- Before mentioning any Amwaj package, destination description, price, availability, or service, use searchPackages to retrieve live published data.
- Never invent prices, packages, availability, inclusions, or discounts. If live data has no matching price, explain that a tailored quote is required.
- Always identify yourself only as "مساعد أمواج الذكي". Never mention internal AI provider brands.`;

    window.toggleAiDrawer = function () { document.getElementById('aiDrawer')?.classList.toggle('hidden'); };
    window.sendQuickChat = function (text) {
        const input = document.getElementById('aiChatInput');
        if (!input) return;
        input.value = text;
        window.handleAiChatSubmit(new Event('submit'));
    };

    function renderBusinessContinuationHtml() {
        return `<div class="space-y-3 p-3 bg-amber-50 dark:bg-slate-800/80 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200">
            <p class="font-bold text-amber-900 dark:text-amber-300"><i class="fa-solid fa-circle-info ml-1"></i> الخدمة التفاعلية غير متاحة حالياً. يسعدنا مساعدتك فوراً عبر قنوات التواصل المباشرة:</p>
            <div class="flex flex-wrap gap-2 pt-1">
                <a href="https://wa.me/201070553080" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-sm"><i class="fa-brands fa-whatsapp"></i> تواصل عبر الواتساب</a>
                <a href="tel:01070553080" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors shadow-sm"><i class="fa-solid fa-phone"></i> اتصل بنا الآن</a>
                <button onclick="openBookingModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm"><i class="fa-solid fa-calendar-check"></i> تقديم طلب حجز</button>
            </div>
        </div>`;
    }

    window.handleAiChatSubmit = async function (event) {
        event?.preventDefault?.();
        const input = document.getElementById('aiChatInput');
        const message = input?.value.trim() || '';
        if (!message) return;
        const container = document.getElementById('aiChatContainer');
        const sendButton = document.getElementById('aiSendBtn');
        if (!container) return;
        const isArabic = document.documentElement.getAttribute('lang') === 'ar';
        const userMessage = document.createElement('div');
        userMessage.className = 'p-3 rounded-2xl bg-brand-500 text-white ml-6 rtl:ml-0 rtl:mr-6 space-y-1 shadow-sm';
        userMessage.innerHTML = `<p class="font-bold text-[10px] text-brand-100">${isArabic ? 'أنت' : 'You'}</p><p>${escapeHtml(message)}</p>`;
        container.appendChild(userMessage);
        input.value = '';
        const assistantMessage = document.createElement('div');
        assistantMessage.className = 'p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-6 rtl:mr-0 rtl:ml-6 space-y-1 shadow-sm';
        assistantMessage.innerHTML = `<p class="font-bold text-[10px] text-brand-500 dark:text-tealCustom-400">${isArabic ? 'مساعد أمواج الذكي' : 'Amwaj AI'}</p><div class="bot-content"><i class="fa-solid fa-circle-notch fa-spin"></i></div>`;
        container.appendChild(assistantMessage);
        const content = assistantMessage.querySelector('.bot-content');
        container.scrollTop = container.scrollHeight;
        if (sendButton) sendButton.disabled = true;
        try {
            window.aiConversationHistory.push({ role: 'user', content: message });
            window.aiConversationHistory = optimizeHistory(window.aiConversationHistory);
            const messages = [{ role: 'system', content: systemPrompt }, ...window.aiConversationHistory];
            let result = await callAiEndpoint(messages, groqTools, (chunk) => {
                content.innerHTML = formatMarkdown(chunk);
                container.scrollTop = container.scrollHeight;
            });
            if (result.type === 'tool_call') {
                const toolCall = result.tool;
                let args = {};
                try { args = JSON.parse(toolCall.function.arguments || '{}'); } catch (_) { /* no-op */ }
                content.innerHTML = `<i class="fa-solid fa-compass fa-spin text-brand-500"></i> ${isArabic ? 'جاري الاستعلام عن البيانات المنشورة...' : 'Checking live travel data...'}`;
                const toolOutput = await executeTool(toolCall.function.name, args);
                messages.push({ role: 'assistant', tool_calls: [toolCall] });
                messages.push({ role: 'tool', tool_call_id: toolCall.id || 'call_1', name: toolCall.function.name, content: toolOutput });
                result = await callAiEndpoint(messages, null, (chunk) => {
                    content.innerHTML = formatMarkdown(chunk);
                    container.scrollTop = container.scrollHeight;
                });
            }
            const finalText = sanitizeAssistantText(result.text || '');
            if (result.type === 'text' && !finalText) {
                content.innerHTML = renderBusinessContinuationHtml();
            } else if (result.type === 'text') {
                content.innerHTML = formatMarkdown(finalText);
            }
            window.aiConversationHistory.push({ role: 'assistant', content: finalText });
        } catch (error) {
            console.error('AI assistant error:', error);
            content.innerHTML = renderBusinessContinuationHtml();
        } finally {
            if (sendButton) sendButton.disabled = false;
            container.scrollTop = container.scrollHeight;
        }
    };

    function plannerValue(id, fallback = '') { return document.getElementById(id)?.value?.trim() || fallback; }
    function normalizePlannerPayload() {
        return {
            destination: plannerValue('plannerDestination'),
            duration: Math.min(30, Math.max(1, Number(plannerValue('plannerDuration', '5')) || 5)),
            travelers: Math.min(50, Math.max(1, Number(plannerValue('plannerTravelers', '2')) || 2)),
            budget: Math.max(0, Number(plannerValue('plannerBudget', '0')) || 0),
            tripStyle: plannerValue('plannerStyle', 'custom'),
            notes: plannerValue('briefingInput').slice(0, 1200)
        };
    }
    function formatPlannerMoney(value) {
        if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return 'يُحدّد بعد تأكيد الخيارات';
        return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Number(value))} ج.م.`;
    }
    function plannerList(items) {
        const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
        return safeItems.length ? `<ul class="space-y-1 list-disc pr-5">${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="text-slate-500">تُحدّد حسب تفاصيل الرحلة.</p>';
    }
    function renderTripPlan(plan) {
        const itinerary = Array.isArray(plan.itinerary) ? plan.itinerary : [];
        const packing = plan.packing_list || {};
        const budget = plan.budget || {};
        const budgetItems = Array.isArray(budget.items) ? budget.items : [];
        const itineraryHtml = itinerary.length ? itinerary.map((day, index) => `<article class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-brand-900/70 p-4"><h4 class="font-black text-brand-600 dark:text-brand-300">اليوم ${escapeHtml(day.day || index + 1)}: ${escapeHtml(day.title || 'برنامج مقترح')}</h4>${plannerList(day.activities)}${day.note ? `<p class="mt-2 text-[11px] text-slate-500 dark:text-slate-400">${escapeHtml(day.note)}</p>` : ''}</article>`).join('') : '<p>لم يتم استلام برنامج يومي كامل. يرجى إعادة المحاولة.</p>';
        const packingHtml = [['المستندات', packing.documents], ['الملابس', packing.clothing], ['الصحة والعناية', packing.health], ['الأساسيات', packing.essentials]].map(([title, values]) => `<section class="rounded-xl bg-white/80 dark:bg-brand-900/70 border border-slate-200 dark:border-slate-800 p-4"><h4 class="font-black mb-2">${title}</h4>${plannerList(values)}</section>`).join('');
        const budgetRows = budgetItems.map((item) => `<tr class="border-b border-slate-200 dark:border-slate-800"><td class="py-2">${escapeHtml(item.label || 'بند')}</td><td class="py-2 font-bold text-left">${formatPlannerMoney(item.amount)}</td></tr>`).join('');
        return `<div class="space-y-6 text-right leading-7">
            <div class="rounded-xl bg-brand-500/10 border border-brand-500/20 p-4"><h3 class="font-black text-brand-700 dark:text-brand-200">ملخص الخطة</h3><p class="mt-1">${escapeHtml(plan.summary || 'خطة سفر مخصصة بناءً على بياناتك والبيانات المنشورة المتاحة.')}</p></div>
            <section><h3 class="font-black text-base mb-3"><i class="fa-solid fa-route text-brand-500 ml-1"></i> البرنامج اليومي</h3><div class="space-y-3">${itineraryHtml}</div></section>
            <section><h3 class="font-black text-base mb-3"><i class="fa-solid fa-suitcase-rolling text-brand-500 ml-1"></i> حقيبة الأمتعة المقترحة</h3><div class="grid sm:grid-cols-2 gap-3">${packingHtml}</div></section>
            <section><h3 class="font-black text-base mb-3"><i class="fa-solid fa-wallet text-brand-500 ml-1"></i> الميزانية الذكية</h3><div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-brand-900/70"><table class="w-full text-xs"><tbody>${budgetRows || '<tr><td class="p-3">لا توجد تفاصيل ميزانية كافية.</td></tr>'}</tbody><tfoot><tr class="font-black"><td class="p-3">الإجمالي التقديري</td><td class="p-3 text-left text-brand-600 dark:text-brand-300">${formatPlannerMoney(budget.total_estimated)}</td></tr></tfoot></table></div>${plannerList(budget.assumptions)}</section>
            ${budget.amwaj_offer_note ? `<p class="rounded-xl bg-goldAccent-500/10 border border-goldAccent-500/30 p-3 text-xs">${escapeHtml(budget.amwaj_offer_note)}</p>` : ''}
            <p class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(plan.booking_note || 'الخطة استرشادية. تواصل مع أمواج لتأكيد التوافر والسعر النهائي قبل الحجز.')}</p>
        </div>`;
    }

    async function populatePlannerDestinations() {
        const select = document.getElementById('plannerDestination');
        if (!select || select.dataset.loaded === 'true') return;
        try {
            const data = await getLiveTravelData();
            data.destinations.forEach((destination) => {
                const option = document.createElement('option');
                option.value = destination.title_ar || destination.title_en;
                option.dataset.labelAr = destination.title_ar || destination.title_en || 'وجهة';
                option.dataset.labelEn = destination.title_en || destination.title_ar || 'Destination';
                const lang = document.documentElement.getAttribute('lang') || 'ar';
                option.textContent = lang === 'en' ? option.dataset.labelEn : option.dataset.labelAr;
                select.append(option);
            });
            select.dataset.loaded = 'true';
            window.AmwajSyncSearchLanguage?.(document.documentElement.getAttribute('lang') || 'ar');
        } catch (_) { /* Manual details remain available as a fallback. */ }
    }

    window.generateTripPlan = async function () {
        const button = document.getElementById('briefingBtn');
        const resultContainer = document.getElementById('briefingResult');
        const content = document.getElementById('briefingContent');
        const payload = normalizePlannerPayload();
        if (!payload.destination && !payload.notes) { alert('يرجى اختيار وجهة أو كتابة تفاصيل الرحلة أولاً.'); return; }
        if (button) button.disabled = true;
        resultContainer?.classList.remove('hidden');
        if (content) content.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles fa-spin text-brand-500"></i> جاري قراءة العروض والبيانات المنشورة وإعداد الخطة...';
        try {
            const liveData = await getLiveTravelData(true);
            const response = await fetch('/api/trip-planner', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, business_context: liveData })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.plan) throw new Error(data.message || 'تعذّر إنشاء الخطة الآن.');
            if (content) content.innerHTML = renderTripPlan(data.plan);
        } catch (error) {
            console.error('Trip planner error:', error);
            if (content) content.innerHTML = renderBusinessContinuationHtml();
        } finally {
            if (button) button.disabled = false;
        }
    };
    window.generatePreConsultBriefing = window.generateTripPlan;
    window.copyBriefingText = function () {
        const content = document.getElementById('briefingContent');
        if (!content) return;
        navigator.clipboard?.writeText(content.innerText || content.textContent || '').then(() => alert('تم نسخ خطة السفر بنجاح!'));
    };
    window.printTripPlan = function () {
        const result = document.getElementById('briefingResult');
        if (result && !result.classList.contains('hidden')) window.print();
    };
    document.addEventListener('DOMContentLoaded', populatePlannerDestinations);

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
    }
    function formatMarkdown(text) {
        return text ? escapeHtml(text).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : '';
    }
})();
