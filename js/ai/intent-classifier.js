export function optimizeConversationHistory(history, maxTokens = 15) {
    // A simple truncation to keep the context window small while preserving recent turns
    // In a real tokenizer, this would count tokens. Here we just keep the last 15 messages
    if (history.length > maxTokens) {
        return history.slice(history.length - maxTokens);
    }
    return history;
}

export function detectIntent(message) {
    const q = message.toLowerCase();
    
    // Simple heuristic routing (the LLM handles the complex stuff, this just flags tools)
    let intent = "general";
    if (q.includes("باقة") || q.includes("عروض") || q.includes("رحلة") || q.includes("package")) intent = "searchPackages";
    if (q.includes("عمرة") || q.includes("حج") || q.includes("مكة")) intent = "searchPackages";
    if (q.includes("حجز") || q.includes("book")) intent = "createBooking";
    if (q.includes("فيزا") || q.includes("تأشيرة") || q.includes("سؤال") || q.includes("استفسار")) intent = "searchFAQ";

    console.log("Detected Intent:", intent);
    return intent;
}
