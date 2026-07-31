/**
 * Amwaj AI Agent Engine
 * Production Architecture: Server-side API Proxy (/api/chat), Tool Execution & Business Continuation
 * Official Category A License No. 1766 | Kafr El Sheikh, Egypt
 */

(function () {
    // 1. Data Store / Knowledge Base (RAG)
    let knowledgeBase = {
        company_info: {
            name_ar: "شركة أمواج للسياحة",
            name_en: "Amwaj Travel & Tourism",
            license: "ترخيص فئة أ رقم 1766",
            location: "كفر الشيخ، مصر",
            contact: {
                phone: "+201070553080",
                whatsapp: "201070553080",
                email: "amwajtravel@hotmail.com"
            }
        },
        packages: [
            {
                id: "p_umrah_vip",
                destination: "السعودية",
                type: "عمرة",
                title: "عمرة VIP - 5 نجوم",
                duration: "10 أيام",
                price: "تواصل لمعرفة التفاصيل والأسعار",
                hotels: ["فندق سويس أوتيل المقام (مكة)", "فندق دار التقوى (المدينة)"],
                includes: ["طيران مباشر", "إفطار", "تنقلات بقطار الحرمين", "فيزا"]
            },
            {
                id: "p_turkey_standard",
                destination: "تركيا",
                type: "سياحة خارجية",
                title: "رحلة إسطنبول الساحرة",
                duration: "7 أيام / 6 ليالي",
                price: "تواصل لمعرفة التفاصيل والأسعار",
                hotels: ["فندق 4 نجوم بساحة تقسيم"],
                includes: ["طيران", "إفطار", "جولة مضيق البوسفور", "رحلة جزر الأميرات"]
            },
            {
                id: "p_maldives_honeymoon",
                destination: "المالديف",
                type: "شهر عسل",
                title: "عروض المالديف لشهر العسل",
                duration: "5 أيام / 4 ليالي",
                price: "تواصل لمعرفة التفاصيل والأسعار",
                hotels: ["خيارات متعددة من منتجعات 5 نجوم مع فيلا فوق الماء"],
                includes: ["طيران", "إقامة شاملة All Inclusive", "تنقل بالطائرة المائية"]
            }
        ]
    };

    // 2. Tools Schema
    const groqTools = [
        {
            type: "function",
            function: {
                name: "searchPackages",
                description: "البحث في برامج ورحلات شركة أمواج للسياحة المتاحة",
                parameters: {
                    type: "object",
                    properties: {
                        destination: { type: "string", description: "الوجهة مثل تركيا، السعودية، المالديف" },
                        type: { type: "string", description: "نوع الرحلة مثل عمرة، سياحة خارجية، شهر عسل" }
                    }
                }
            }
        },
        {
            type: "function",
            function: {
                name: "getCompanyContact",
                description: "الحصول على بيانات الاتصال الرسمية لشركة أمواج للسياحة بكفر الشيخ",
                parameters: { type: "object", properties: {} }
            }
        }
    ];

    // 3. Tool Implementations
    function executeTool(name, args) {
        if (name === "searchPackages") {
            const dest = (args.destination || "").toLowerCase();
            const type = (args.type || "").toLowerCase();
            let results = knowledgeBase.packages.filter(p => {
                const mDest = !dest || p.destination.toLowerCase().includes(dest);
                const mType = !type || p.type.toLowerCase().includes(type);
                return mDest && mType;
            });
            if (results.length === 0) results = knowledgeBase.packages;
            return JSON.stringify(results, null, 2);
        } else if (name === "getCompanyContact") {
            return JSON.stringify(knowledgeBase.company_info, null, 2);
        }
        return JSON.stringify({ error: "أداة غير معروفة" });
    }

    // 4. Memory Optimization
    window.aiConversationHistory = window.aiConversationHistory || [];
    function optimizeHistory(history, maxMessages = 8) {
        if (history.length <= maxMessages) return history;
        return history.slice(-maxMessages);
    }

    // 5. Serverless Proxy Endpoint Stream Caller (/api/chat)
    async function executeServerlessStream(endpointUrl, messages, tools, onChunk) {
        const payload = {
            messages: messages,
            tools: tools,
            stream: true
        };

        const res = await fetch(endpointUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            let errorText = "";
            try { errorText = await res.text(); } catch (e) {}
            throw new Error(`Server API Error ${res.status}: ${errorText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";
        let toolCallData = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split("\n");

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") continue;
                if (trimmed.startsWith("data: ")) {
                    try {
                        const json = JSON.parse(trimmed.substring(6));
                        const delta = json.choices[0]?.delta;

                        if (delta?.reasoning_content && !fullText) {
                            if (onChunk) onChunk("<i class='fa-solid fa-brain fa-pulse text-brand-500 mr-1'></i> *(جاري التفكير والتخطيط...)*\n\n");
                        }

                        if (delta?.content) {
                            fullText += delta.content;
                            if (onChunk) onChunk(fullText);
                        }

                        if (delta?.tool_calls) {
                            if (!toolCallData) {
                                toolCallData = delta.tool_calls[0];
                            } else if (delta.tool_calls[0].function?.arguments) {
                                toolCallData.function.arguments += delta.tool_calls[0].function.arguments;
                            }
                        }
                    } catch (e) {
                        // Ignore partial JSON chunk
                    }
                }
            }
        }

        if (toolCallData) {
            return { type: "tool_call", tool: toolCallData };
        }

        return { type: "text", text: fullText };
    }

    async function callAiEndpoint(messages, tools, onChunk) {
        const aiConfig = (window.AMWAJ_CONFIG && window.AMWAJ_CONFIG.ai) ? window.AMWAJ_CONFIG.ai : {};
        const apiEndpoint = aiConfig.apiEndpoint || "/api/chat";
        return await executeServerlessStream(apiEndpoint, messages, tools, onChunk);
    }

    // 6. UI Controller & Handlers
    const systemPrompt = `ROLE: You are "مساعد أمواج الذكي", the senior AI travel concierge for Amwaj Travel & Tourism (كفر الشيخ، مصر - ترخيص 1766).
RULES:
- Always be helpful, polite, professional, and natural in Arabic.
- Ask one clarifying question at a time.
- If you need package details or company info, USE THE TOOLS provided.
- NEVER invent prices or fake packages.
- Always identify yourself ONLY as "مساعد أمواج الذكي". Never mention internal AI provider brand names.`;

    window.toggleAiDrawer = function () {
        const drawer = document.getElementById('aiDrawer');
        if (drawer) {
            drawer.classList.toggle('hidden');
        }
    };

    window.sendQuickChat = function (text) {
        const input = document.getElementById('aiChatInput');
        if (input) {
            input.value = text;
            window.handleAiChatSubmit(new Event('submit'));
        }
    };

    function renderBusinessContinuationHtml() {
        return `
            <div class="space-y-3 p-3 bg-amber-50 dark:bg-slate-800/80 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200">
                <p class="font-bold text-amber-900 dark:text-amber-300">
                    <i class="fa-solid fa-circle-info ml-1"></i> الخدمة التفاعلية غير متاحة حالياً. يسعدنا مساعدتك فوراً عبر قنوات التواصل المباشرة:
                </p>
                <div class="flex flex-wrap gap-2 pt-1">
                    <a href="https://wa.me/201070553080" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                        <i class="fa-brands fa-whatsapp"></i> تواصل عبر الواتساب
                    </a>
                    <a href="tel:01070553080" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors shadow-sm">
                        <i class="fa-solid fa-phone"></i> اتصل بنا الآن
                    </a>
                    <button onclick="openBookingModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm">
                        <i class="fa-solid fa-calendar-check"></i> تقديم طلب حجز
                    </button>
                </div>
            </div>
        `;
    }

    window.handleAiChatSubmit = async function (e) {
        if (e && e.preventDefault) e.preventDefault();
        const input = document.getElementById('aiChatInput');
        const message = input ? input.value.trim() : '';
        if (!message) return;

        const chatContainer = document.getElementById('aiChatContainer');
        const sendBtn = document.getElementById('aiSendBtn');
        const isArabic = document.documentElement.getAttribute('lang') === 'ar';

        // 1. User Message UI
        const userDiv = document.createElement('div');
        userDiv.className = 'p-3 rounded-2xl bg-brand-500 text-white ml-6 rtl:ml-0 rtl:mr-6 space-y-1 shadow-sm';
        userDiv.innerHTML = `<p class="font-bold text-[10px] text-brand-100">${isArabic ? 'أنت' : 'You'}</p><p>${escapeHtml(message)}</p>`;
        chatContainer.appendChild(userDiv);
        input.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // 2. Bot Message UI
        const botDiv = document.createElement('div');
        botDiv.className = 'p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-6 rtl:mr-0 rtl:ml-6 space-y-1 shadow-sm';
        botDiv.innerHTML = `<p class="font-bold text-[10px] text-brand-500 dark:text-tealCustom-400">${isArabic ? 'مساعد أمواج الذكي' : 'Amwaj AI'}</p><div class="bot-content"><i class="fa-solid fa-circle-notch fa-spin"></i></div>`;
        chatContainer.appendChild(botDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        const botContent = botDiv.querySelector('.bot-content');

        if (sendBtn) sendBtn.disabled = true;

        try {
            window.aiConversationHistory.push({ role: "user", content: message });
            window.aiConversationHistory = optimizeHistory(window.aiConversationHistory);

            let messages = [
                { role: "system", content: systemPrompt },
                ...window.aiConversationHistory
            ];

            let result = await callAiEndpoint(messages, groqTools, (chunkText) => {
                botContent.innerHTML = formatMarkdown(chunkText);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });

            // Handle Tool Call
            if (result.type === "tool_call") {
                const toolCall = result.tool;
                const fnName = toolCall.function.name;
                let fnArgs = {};
                try { fnArgs = JSON.parse(toolCall.function.arguments || "{}"); } catch (e) {}

                botContent.innerHTML = `<i class="fa-solid fa-compass fa-spin text-brand-500"></i> ${isArabic ? 'جاري الاستعلام...' : 'Searching info...'}`;

                const toolOutput = executeTool(fnName, fnArgs);

                messages.push({ role: "assistant", tool_calls: [toolCall] });
                messages.push({ role: "tool", tool_call_id: toolCall.id || "call_1", name: fnName, content: toolOutput });

                result = await callAiEndpoint(messages, null, (chunkText) => {
                    botContent.innerHTML = formatMarkdown(chunkText);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                });
            }

            window.aiConversationHistory.push({ role: "assistant", content: result.text || "" });

        } catch (err) {
            console.error("AI Assistant Error:", err);
            botContent.innerHTML = renderBusinessContinuationHtml();
        } finally {
            if (sendBtn) sendBtn.disabled = false;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    };

    // AI Itinerary Plan Generator
    window.generatePreConsultBriefing = async function() {
        const input = document.getElementById('briefingInput');
        const btn = document.getElementById('briefingBtn');
        const resultContainer = document.getElementById('briefingResult');
        const resultContent = document.getElementById('briefingContent');
        const text = input ? input.value.trim() : '';

        if (!text) {
            alert('يرجى كتابة تفاصيل الرحلة أو الوجهة أولاً');
            return;
        }

        if (btn) btn.disabled = true;
        if (resultContainer) resultContainer.classList.remove('hidden');
        if (resultContent) resultContent.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles fa-spin text-brand-500"></i> جاري إعداد خطة السفر المخصصة بواسطة مساعد أمواج الذكي...';

        try {
            const prompt = `اصنع خطة سفر مخصصة وتفصيلية بناءً على تفاصيل الرحلة التالية: "${text}".
قم بتشمل:
1. برنامج رحلة مقترح يوم بيوم.
2. تقديرات الميزانية والنصائح.
3. التوصيات بالفنادق والأنشطة.
4. ختاماً دعوة للعميل للتواصل مع شركة أمواج للسياحة (كفر الشيخ) لتأكيد الحجز.`;

            let messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ];

            let result = await callAiEndpoint(messages, groqTools, (chunkText) => {
                if (resultContent) resultContent.innerHTML = formatMarkdown(chunkText);
            });

            if (result.type === "tool_call") {
                const toolCall = result.tool;
                const fnName = toolCall.function.name;
                let fnArgs = {};
                try { fnArgs = JSON.parse(toolCall.function.arguments || "{}"); } catch (e) {}

                const toolOutput = executeTool(fnName, fnArgs);
                messages.push({ role: "assistant", tool_calls: [toolCall] });
                messages.push({ role: "tool", tool_call_id: toolCall.id || "call_1", name: fnName, content: toolOutput });

                await callAiEndpoint(messages, null, (chunkText) => {
                    if (resultContent) resultContent.innerHTML = formatMarkdown(chunkText);
                });
            }
        } catch (err) {
            console.error("Briefing Error:", err);
            if (resultContent) resultContent.innerHTML = renderBusinessContinuationHtml();
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    window.copyBriefingText = function() {
        const resultContent = document.getElementById('briefingContent');
        if (!resultContent) return;
        navigator.clipboard.writeText(resultContent.innerText || resultContent.textContent);
        alert('تم نسخ خطة السفر بنجاح!');
    };

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }

    function formatMarkdown(text) {
        if (!text) return "";
        return escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

})();
