export async function callGroqChat(messages, tools, onChunk) {
    const config = window.AMWAJ_CONFIG.ai;
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    const payload = {
        model: config.defaultModel,
        messages: messages,
        temperature: 0.8,
        stream: true
    };
    
    if (tools && tools.length > 0) {
        payload.tools = tools;
        // Tool calling in Groq works better without streaming in some cases, 
        // but we'll try streaming first since the user requested it.
    }

    console.log("Groq Payload:", payload);

    let delay = 1000;
    for (let i = 0; i < 3; i++) {
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.groqKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                if (res.status === 429 || res.status >= 500) {
                    throw new Error(`Groq API Error: ${res.status}`);
                }
                // If it's a model issue, fallback
                if (res.status === 404 || res.status === 400) {
                    console.warn(`Falling back to ${config.fallbackModel}`);
                    payload.model = config.fallbackModel;
                    throw new Error("Model issue");
                }
            }

            // Stream reading
            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = "";
            let functionCallData = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const delta = data.choices[0]?.delta;
                            
                            if (delta?.content) {
                                fullText += delta.content;
                                if (onChunk) onChunk(fullText, false);
                            }
                            
                            // Handle tool calls in stream
                            if (delta?.tool_calls) {
                                if (!functionCallData) functionCallData = delta.tool_calls[0];
                                else {
                                    if (delta.tool_calls[0].function?.arguments) {
                                        functionCallData.function.arguments += delta.tool_calls[0].function.arguments;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Stream parse error:", err);
                        }
                    }
                }
            }
            
            if (functionCallData) {
                return { type: "tool_call", tool: functionCallData };
            }

            if (onChunk) onChunk(fullText, true);
            console.log("Groq Response Complete");
            return { type: "text", text: fullText };

        } catch (error) {
            console.warn(`Attempt ${i+1} failed:`, error);
            if (i === 2) throw error;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
}
