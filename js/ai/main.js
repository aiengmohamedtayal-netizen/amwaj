import { initKnowledgeBase } from './context-builder.js';
import { optimizeConversationHistory, detectIntent } from './intent-classifier.js';
import { groqTools, executeTool } from './tool-executor.js';
import { callGroqChat } from './groq-api.js';

window.aiConversationHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    initKnowledgeBase();
});

const systemPrompt = `ROLE
You are "Amwaj AI", the official intelligent travel consultant for Amwaj Travel & Tourism.
You are not a generic chatbot. You behave exactly like an experienced senior travel consultant working inside the company.
Your objective is to help the customer choose the best trip and convert conversations into bookings.

RULES
- If you need data (prices, packages, company info), YOU MUST USE THE PROVIDED TOOLS.
- Never invent prices, hotels, availability, or offers.
- Guide the customer step by step. Ask one relevant question at a time.
- Professional, friendly, confident, helpful.
- Short answers. Natural Arabic (or English if requested). No robotic wording.
- Never mention AI unless asked.
- Keep conversation interactive. Never produce long paragraphs.`;

export async function handleAiChatSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('aiChatInput');
    const message = input ? input.value.trim() : '';
    if (!message) return;

    const chatContainer = document.getElementById('aiChatContainer');
    const sendBtn = document.getElementById('aiSendBtn');
    const isArabic = document.documentElement.getAttribute('lang') === 'ar';

    // Append User Bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'p-3 rounded-2xl bg-brand-500 text-white ml-6 rtl:ml-0 rtl:mr-6 space-y-1 shadow-sm';
    userBubble.innerHTML = `<p class="font-bold text-[10px] text-brand-100">${isArabic ? 'أنت' : 'You'}</p><p>${escapeHtml(message)}</p>`;
    chatContainer.appendChild(userBubble);
    input.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Detect Intent
    const intent = detectIntent(message);

    // Append Bot Bubble
    const botBubble = document.createElement('div');
    botBubble.className = 'p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-6 rtl:mr-0 rtl:ml-6 space-y-1 shadow-sm';
    botBubble.innerHTML = `<p class="font-bold text-[10px] text-brand-500 dark:text-tealCustom-400">${isArabic ? 'مساعد أمواج الذكي' : 'Amwaj Travel AI'}</p><div class="bot-content"><i class="fa-solid fa-circle-notch fa-spin"></i></div>`;
    chatContainer.appendChild(botBubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    const botContent = botBubble.querySelector('.bot-content');

    if (sendBtn) sendBtn.disabled = true;

    try {
        window.aiConversationHistory.push({ role: "user", content: message });
        window.aiConversationHistory = optimizeConversationHistory(window.aiConversationHistory);

        let messages = [
            { role: "system", content: systemPrompt },
            ...window.aiConversationHistory
        ];

        let result = await callGroqChat(messages, groqTools, (chunk, isDone) => {
            botContent.innerHTML = formatMarkdownText(chunk);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });

        // Handle Tool Calling
        if (result.type === "tool_call") {
            const toolCall = result.tool;
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            botContent.innerHTML = `<i class="fa-solid fa-search fa-fade"></i> ${isArabic ? 'جاري البحث في قاعدة البيانات...' : 'Searching database...'}`;
            
            const toolResult = executeTool(functionName, functionArgs);
            
            // Append the tool interaction to the messages array to send back to Groq
            messages.push({
                role: "assistant",
                tool_calls: [toolCall]
            });
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: functionName,
                content: toolResult
            });

            // Call Groq again to get final answer
            result = await callGroqChat(messages, null, (chunk, isDone) => {
                botContent.innerHTML = formatMarkdownText(chunk);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });
        }

        window.aiConversationHistory.push({ role: "assistant", content: result.text });

    } catch (err) {
        console.error("AI Pipeline Error:", err);
        const errorText = isArabic 
            ? "عذراً، أواجه ضغطاً في الوقت الحالي. يرجى المحاولة بعد قليل أو التواصل معنا عبر واتساب للمساعدة الفورية."
            : "Apologies, I am experiencing high traffic right now. Please try again in a moment or contact us via WhatsApp for immediate assistance.";
        botContent.innerHTML = formatMarkdownText(errorText);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Ensure globally accessible for inline HTML handlers
window.handleAiChatSubmit = handleAiChatSubmit;
window.toggleAiDrawer = function() {
    const drawer = document.getElementById('aiDrawer');
    if (drawer) drawer.classList.toggle('hidden');
};
window.sendQuickChat = function(promptText) {
    const chatInput = document.getElementById('aiChatInput');
    if (chatInput) {
        chatInput.value = promptText;
        window.handleAiChatSubmit(new Event('submit'));
    }
};
window.generatePreConsultBriefing = async function() {
    // Basic fallback for UI function since we removed Gemini
    if (window.showToast) window.showToast('AI Briefing generated by Groq...');
};
window.generateDestinationImage = async function() {
    // Groq doesn't generate images. Provide a curated fallback.
    const imgEl = document.getElementById('generatedImage');
    const container = document.getElementById('imageResultContainer');
    if (imgEl) {
        imgEl.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
        imgEl.classList.remove('hidden');
    }
    if (container) container.classList.remove('hidden');
};
window.copyBriefingText = function() {};
window.setSamplePrompt = function(t) {
    const input = document.getElementById('imagePromptInput');
    if (input) input.value = t;
};

// Utilities
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}
function formatMarkdownText(text) {
    return escapeHtml(text).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
