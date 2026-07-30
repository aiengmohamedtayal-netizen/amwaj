/**
 * Amwaj AI Agent Engine
 * Integrated RAG, Intent Classification, Tool Execution, SSE Streaming & Groq API
 * Compatible with file:// local execution and standard web servers.
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
                price: "ابتداءً من 45,000 جنيه مصري",
                hotels: ["فندق سويس أوتيل المقام (مكة)", "فندق دار التقوى (المدينة)"],
                includes: ["طيران مباشر", "إفطار", "تنقلات بقطار الحرمين", "فيزا"]
            },
            {
                id: "p_turkey_standard",
                destination: "تركيا",
                type: "سياحة خارجية",
                title: "رحلة إسطنبول الساحرة",
                duration: "7 أيام / 6 ليالي",
                price: "ابتداءً من 690 دولار",
                hotels: ["فندق 4 نجوم بساحة تقسيم"],
                includes: ["طيران", "إفطار", "جولة مضيق البوسفور", "رحلة جزر الأميرات"]
            },
            {
                id: "p_maldives_honeymoon",
                destination: "المالديف",
                type: "شهر عسل",
                title: "عروض المالديف لشهر العسل",
                duration: "5 أيام / 4 ليالي",
                price: "يحدد حسب المنتجع",
                hotels: ["خيارات متعددة من منتجعات 5 نجوم مع فيلا فوق الماء"],
                includes: ["طيران", "إقامة شاملة All Inclusive", "تنقل بالطائرة المائية"]
            }
        ],
        faq: [
            {
                question: "ما هي الأوراق المطلوبة لفيزا الشنغن؟",
                answer: "جواز سفر ساري، كشف حساب بنكي لآخر 6 أشهر، شهادة تحركات، تأمين طبي، وحجوزات فندقية وطيران (نقوم بتجهيزها في أمواج)."
            },
            {
                question: "هل يوجد تقسيط للرحلات؟",
                answer: "نعم، نقدم أنظمة تقسيط متعددة لرحلات العمرة والسياحة عبر كروت الائتمان لعدة بنوك مصرية."
            }
        ]
    };

    // Attempt dynamic fetch if served over HTTP/S
    if (window.location.protocol.startsWith('http')) {
        fetch('data/knowledge-base.json')
            .then(res => res.json())
            .then(data => {
                knowledgeBase = data;
                console.log("Amwaj AI: Dynamic Knowledge Base Loaded.");
            })
            .catch(err => console.log("Amwaj AI: Using built-in Knowledge Base."));
    }

    // Global conversation state
    window.aiConversationHistory = [];

    // 2. Intent Classifier & History Truncator
    function optimizeHistory(history, maxMessages = 10) {
        if (history.length > maxMessages) {
            return history.slice(history.length - maxMessages);
        }
        return history;
    }

    function detectIntent(message) {
        const q = message.toLowerCase();
        let intent = "general";
        if (q.includes("باقة") || q.includes("عرض") || q.includes("رحلة") || q.includes("سعر") || q.includes("عمرة") || q.includes("حج")) {
            intent = "searchPackages";
        } else if (q.includes("فيزا") || q.includes("تقسيط") || q.includes("ورق") || q.includes("مطلوب")) {
            intent = "searchFAQ";
        } else if (q.includes("مكان") || q.includes("عنوان") || q.includes("تليفون") || q.includes("واتس") || q.includes("تواصل")) {
            intent = "getCompanyInfo";
        }
        console.log("Amwaj AI Intent:", intent);
        return intent;
    }

    // 3. Tools Definitions & Execution Layer
    const groqTools = [
        {
            type: "function",
            function: {
                name: "searchPackages",
                description: "Search for available travel packages by destination (e.g. Turkey, Umrah, Maldives).",
                parameters: {
                    type: "object",
                    properties: {
                        destination: { type: "string" }
                    },
                    required: ["destination"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "searchFAQ",
                description: "Get answers to frequently asked questions about visas, installments, and general travel.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string" }
                    },
                    required: ["query"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "getCompanyInfo",
                description: "Get Amwaj Travel contact information, license, and office location.",
                parameters: { type: "object", properties: {} }
            }
        }
    ];

    function executeTool(toolName, args) {
        console.log("Executing Tool:", toolName, args);
        if (toolName === "searchPackages") {
            const dest = (args.destination || "").toLowerCase();
            const results = knowledgeBase.packages.filter(p => 
                p.destination.toLowerCase().includes(dest) || 
                p.title.toLowerCase().includes(dest) || 
                p.type.toLowerCase().includes(dest) ||
                dest === ""
            );
            return JSON.stringify(results.length > 0 ? results : knowledgeBase.packages);
        }
        if (toolName === "searchFAQ") {
            return JSON.stringify(knowledgeBase.faq);
        }
        if (toolName === "getCompanyInfo") {
            return JSON.stringify(knowledgeBase.company_info);
        }
        return JSON.stringify({ status: "ok" });
    }

    // 4. OpenAI-Compatible API Client (TokenRouter Primary -> Groq Fallback)
    async function executeProviderStream(url, key, model, messages, tools, onChunk) {
        const payload = {
            model: model,
            messages: messages,
            temperature: 0.7,
            stream: true
        };
        if (tools && tools.length > 0) {
            payload.tools = tools;
        }

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`API Error ${res.status} from ${url}`);
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
                        // Partial JSON chunk ignored
                    }
                }
            }
        }

        if (toolCallData) {
            return { type: "tool_call", tool: toolCallData };
        }

        return { type: "text", text: fullText };
    }

    async function callGroqAPI(messages, tools, onChunk) {
        const aiConfig = (window.AMWAJ_CONFIG && window.AMWAJ_CONFIG.ai) ? window.AMWAJ_CONFIG.ai : {};
        const primary = aiConfig.primary || {
            url: "https://api.tokenrouter.com/v1/chat/completions",
            key: window.TOKENROUTER_API_KEY || "YOUR_TOKENROUTER_API_KEY",
            model: "moonshotai/kimi-k3-free"
        };
        const fallback = aiConfig.fallback || {
            url: "https://api.groq.com/openai/v1/chat/completions",
            key: window.GROQ_API_KEY || "YOUR_GROQ_API_KEY",
            model: "llama-3.3-70b-versatile",
            fallbackModel: "llama-3.1-8b-instant"
        };

        // Try 1: TokenRouter Primary
        try {
            console.log("Amwaj AI: Calling Primary Provider TokenRouter (moonshotai/kimi-k3-free)...");
            return await executeProviderStream(primary.url, primary.key, primary.model, messages, tools, onChunk);
        } catch (err1) {
            console.warn("TokenRouter Primary failed, switching to Fallback Groq 70B:", err1);
        }

        // Try 2: Groq 70B Fallback
        try {
            console.log("Amwaj AI: Calling Fallback Groq (llama-3.3-70b-versatile)...");
            return await executeProviderStream(fallback.url, fallback.key, fallback.model, messages, tools, onChunk);
        } catch (err2) {
            console.warn("Groq 70B failed, switching to Groq 8B:", err2);
        }

        // Try 3: Groq 8B Fallback
        console.log("Amwaj AI: Calling Fallback Groq 8B (llama-3.1-8b-instant)...");
        return await executeProviderStream(fallback.url, fallback.key, fallback.fallbackModel || "llama-3.1-8b-instant", messages, tools, onChunk);
    }

    // 5. UI Controller & Handlers
    const systemPrompt = `ROLE: You are "Amwaj AI", the senior travel consultant for Amwaj Travel & Tourism (كفر الشيخ، مصر - ترخيص 1766).
RULES:
- Always be helpful, polite, professional, and natural in Arabic.
- Ask one clarifying question at a time.
- If you need package details or company info, USE THE TOOLS provided.
- NEVER invent prices or fake packages.
- Keep responses concise and engaging.`;

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

            let result = await callGroqAPI(messages, groqTools, (chunkText) => {
                botContent.innerHTML = formatMarkdown(chunkText);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });

            // Handle Tool Call if requested by Groq
            if (result.type === "tool_call") {
                const toolCall = result.tool;
                const fnName = toolCall.function.name;
                let fnArgs = {};
                try { fnArgs = JSON.parse(toolCall.function.arguments || "{}"); } catch (e) {}

                botContent.innerHTML = `<i class="fa-solid fa-compass fa-spin text-brand-500"></i> ${isArabic ? 'جاري الاستعلام...' : 'Searching info...'}`;

                const toolOutput = executeTool(fnName, fnArgs);

                messages.push({
                    role: "assistant",
                    tool_calls: [toolCall]
                });
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id || "call_1",
                    name: fnName,
                    content: toolOutput
                });

                result = await callGroqAPI(messages, null, (chunkText) => {
                    botContent.innerHTML = formatMarkdown(chunkText);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                });
            }

            window.aiConversationHistory.push({ role: "assistant", content: result.text || "" });

        } catch (err) {
            console.error("AI Error:", err);
            botContent.innerHTML = isArabic 
                ? "أهلاً بك! يمكنك التواصل مع شركة أمواج للسياحة عبر الواتساب المباشر: 01070553080 للحصول على الخدمة الفورية."
                : "Welcome! You can contact Amwaj Travel directly via WhatsApp: +201070553080.";
        } finally {
            if (sendBtn) sendBtn.disabled = false;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    };

    // AI Itinerary Plan Generator (Connected to Groq AI Agent)
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
        if (resultContent) resultContent.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles fa-spin text-brand-500"></i> جاري إعداد خطة السفر المخصصة والميزانية بواسطة مساعد أمواج الذكي...';

        try {
            const prompt = `اصنع خطة سفر مخصصة وتفصيلية جداً بناءً على تفاصيل الرحلة التالية: "${text}".
قم بتشمل:
1. برنامج رحلة مقترح يوم بيوم.
2. تقديرات الميزانية والنصائح.
3. التوصيات بالفنادق والأنشطة.
4. ختاماً دعوة للعميل للتواصل مع شركة أمواج للسياحة (كفر الشيخ) لتأكيد الحجز.`;

            let messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ];

            let result = await callGroqAPI(messages, groqTools, (chunkText) => {
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

                await callGroqAPI(messages, null, (chunkText) => {
                    if (resultContent) resultContent.innerHTML = formatMarkdown(chunkText);
                });
            }
        } catch (err) {
            console.error("Briefing Error:", err);
            if (resultContent) resultContent.innerHTML = "عذراً، حدث خطأ أثناء إعداد خطة السفر. يرجى المحاولة مرة أخرى.";
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    window.copyBriefingText = function() {
        const resultContent = document.getElementById('briefingContent');
        if (resultContent) {
            navigator.clipboard.writeText(resultContent.innerText || resultContent.textContent);
            alert('تم نسخ خطة السفر بنجاح!');
        }
    };

    window.generateDestinationImage = async function() {};
    window.setSamplePrompt = function() {};

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
