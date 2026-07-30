/**
 * Amwaj Travel & Tourism - System Configuration & Meta Information
 * Official Category A License No. 1766 (Kafr El Sheikh, Egypt)
 * Single Source of Truth (SSOT) Architecture
 */
window.AMWAJ_CONFIG = {
    company: {
        nameEn: "Amwaj Travel & Tourism",
        nameAr: "أمواج للسياحة - Amwaj Travel",
        categoryEn: "Category A Licensed Travel Agency",
        categoryAr: "شركة سياحة مصرية مرخصة فئة (أ)",
        licenseNo: "1766",
        etaaRef: "https://www.etaa-egypt.org/SitePages/CompanyDetails.aspx?licc=1766",
        facebookUrl: "https://www.facebook.com/amwaj.egy/",
        founded: "2009-04-01",
        postalCode: "33511",
        chairman: "مسعد صلاح عبد العزيز حسن",
        manager: "أسامة عصام الحمامصي",
        website: "www.amwajtravel.com",
        email: "amwajtravel@hotmail.com",
        hq: {
            addressAr: "ش أبو بكر الصديق - بجوار بنك القاهرة - أمام صيدلية الشعب (تقاطع شارع الخلفاء الراشدين)، كفر الشيخ 33511",
            addressEn: "Abu Bakr El-Siddiq St, Next to Banque du Caire, Opposite El-Shaab Pharmacy, Kafr El Sheikh 33511",
            cityEn: "Kafr El Sheikh",
            cityAr: "كفر الشيخ",
            governorateAr: "محافظة كفر الشيخ",
            countryEn: "Egypt",
            countryAr: "مصر"
        },
        contact: {
            landline: "0473226111",
            phoneFormatted: "+20 (047) 3226111",
            mobile1: "01070553080",
            mobile2: "01070553082",
            whatsapp: "201070553080",
            email: "amwajtravel@hotmail.com"
        }
    },
    tokens: {
        primary: "#0099D8",
        secondary: "#00C2A8",
        accent: "#FDBA21",
        darkBg: "#081826"
    },
    ai: {
        primary: {
            name: "TokenRouter",
            url: "https://api.tokenrouter.com/v1/chat/completions",
            key: window.TOKENROUTER_API_KEY || "YOUR_TOKENROUTER_API_KEY",
            model: "moonshotai/kimi-k3-free"
        },
        fallback: {
            name: "Groq",
            url: "https://api.groq.com/openai/v1/chat/completions",
            key: window.GROQ_API_KEY || "YOUR_GROQ_API_KEY",
            model: "llama-3.3-70b-versatile",
            fallbackModel: "llama-3.1-8b-instant"
        }
    }
};
