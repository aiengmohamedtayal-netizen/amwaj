export let knowledgeBase = null;

export async function initKnowledgeBase() {
    try {
        const res = await fetch('data/knowledge-base.json');
        if (res.ok) {
            knowledgeBase = await res.json();
            console.log("RAG Data Loaded successfully.");
        }
    } catch (e) {
        console.error("Failed to load knowledge base:", e);
    }
}

export function getCompanyContext() {
    if (!knowledgeBase || !knowledgeBase.company_info) return "Amwaj Travel & Tourism";
    const info = knowledgeBase.company_info;
    return `Company Name: ${info.name_ar}. License: ${info.license}. Phone: ${info.contact.phone}. Email: ${info.contact.email}.`;
}

export function getPackagesByDestination(destination) {
    if (!knowledgeBase || !knowledgeBase.packages) return [];
    return knowledgeBase.packages.filter(p => p.destination.includes(destination) || destination.includes(p.destination));
}

export function getFAQ() {
    if (!knowledgeBase || !knowledgeBase.faq) return [];
    return knowledgeBase.faq;
}
