import { getPackagesByDestination, getFAQ, getCompanyContext } from './context-builder.js';

export const groqTools = [
    {
        type: "function",
        function: {
            name: "searchPackages",
            description: "Search for available travel packages by destination (e.g. Turkey, Umrah, Maldives).",
            parameters: {
                type: "object",
                properties: {
                    destination: {
                        type: "string",
                        description: "The name of the destination in Arabic or English."
                    }
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
            description: "Get Amwaj Travel company contact information, license, and address.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    }
];

export function executeTool(toolName, args) {
    console.log(`Executed Tool: ${toolName}`, args);
    switch (toolName) {
        case "searchPackages":
            return JSON.stringify(getPackagesByDestination(args.destination || ""));
        case "searchFAQ":
            return JSON.stringify(getFAQ());
        case "getCompanyInfo":
            return getCompanyContext();
        default:
            return JSON.stringify({ error: "Tool not found." });
    }
}
