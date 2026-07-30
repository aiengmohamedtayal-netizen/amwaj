أهلاً بك. بصفتي المستشار الاستراتيجي التقني للمشروع، قمت بتحليل الخطط والمواصفات الطموحة لموقع **Aivora** الرقمي. التصور الحالي يمزج بين موقع تعريفي لوكالة تقنية (Agency Website) وبين تطبيق SaaS تفاعلي عالي الأداء يعتمد على التقنيات الحديثة لعام 2026 (مثل Next.js 15 وReact 19 وTailwind v4).

المشروع ممتاز وطموح، ولكن لضمان عدم الغرق في تفاصيل الرسوميات المتحركة والأبعاد الثلاثية (Overengineering) على حساب الأداء والقيمة التجارية، إليك التقرير التخطيطي الشامل والجاهز للتنفيذ المباشر.

---

## 1. Executive Summary

موقع **Aivora** هو منصة رقمية تفاعلية متكاملة لوكالة برمجيات وحلول ذكاء اصطناعي. الهدف ليس مجرد استعراض خدمات، بل تقديم تجربة مستخدم (UX) غامرة تُثبت كفاءة الفريق هندسياً قبل التواصل معهم. يركز المشروع على الجمع بين الأداء الاستثنائي (Lighthouse +95) والجماليات البصرية المتقدمة (3D & Motion) مع دعم كامل للغتين (العربية والإنجليزية) ونظام إدارة محتوى (CMS) مرن.

## 2. Problem Statement

تواجه شركات برمجيات الذكاء الاصطناعي والـ SaaS مشكلة "ضعف المصداقية البصرية والهندسية" على مواقعها؛ حيث تبدو معظم مواقع الوكالات متشابهة، تقليدية، وتعتمد على نصوص إنشائية دون إثبات فعلي للمهارة. يفتقر العميل المستهدف إلى تجربة حية تلمس قدرات الوكالة في بناء واجهات تفاعلية معقدة، وتطبيقات ذكاء اصطناعي حقيقية، وصفحات دراسة حالة (Case Studies) تشرح العمق الهندسي للحلول.

## 3. Target Users

* **مؤسسو الشركات الناشئة (SaaS Founders):** يبحثون عن شريك تقني يبني منتجاتهم بأعلى جودة وأسرع وقت.
* **المدراء التنفيذيون ومدراء التقنية (CTOs / CEOs):** في الشركات المتوسطة والكبيرة (الرعاية الصحية، التمويل، العقارات) الساعين لأتمتة عملياتهم أو دمج الذكاء الاصطناعي.
* **مدراء التسويق والمحتوى:** المهتمين بمتابعة المدونة وبناء شراكات استراتيجية.

## 4. Product Scope

* **داخل النطاق (In-Scope):**
* موقع تعريفي كامل بـ 23 صفحة وشاشات ديناميكية.
* لوحة تحكم (Dashboard / CMS) لإدارة المدونة، المحفظة (Portfolio)، الوظائف، والطلبات.
* تجارب تفاعلية حية (Interactive AI Demos): شات بوت، واجهة رؤية حاسوبية (Vision AI)، مخطط أتمتة.
* دعم كامل للـ RTL والـ i18n (عربي/إنجليزي) من اليوم الأول.
* أنظمة تفاعلية (3D Particle Background, Lenis Smooth Scroll, Mouse Glow).


* **خارج النطاق (Out-of-Scope) للمرحلة الأولى:**
* بناء نظام فوترة أو دفع بداخل الموقع (الاعتماد على روابط خارجية أو فواتير يدوية).
* تطوير نماذج ذكاء اصطناعي خاصة (Proprietary Models)؛ سيتم الاعتماد بالكامل على APIs جاهزة.



## 5. MVP Definition

لتفادي "مخاطر تأخر الإطلاق" بسبب ضخامة حجم المؤثرات البصرية وعدد الصفحات، يتم تعريف الحد الأدنى للمنتج (MVP) كالتالي:

1. **الصفحات الأساسية:** الرئيسية (Home)، الخدمات العامة، دراسات الحالة (Case Studies)، اتصل بنا (Contact).
2. **الميزات التقنية:** دعم اللغتين (EN/AR)، الأداء السريع، التصميم المتجاوب.
3. **العناصر التفاعلية:** دمج نموذج ثلاثي أبعاد مبسط (3D Hero) وتجربة ذكاء اصطناعي واحدة (Chatbot Demo).
4. **إدارة المحتوى:** ربط Supabase كـ Headless CMS للمدونة والأعمال فقط.

## 6. Feature Prioritization (MoSCoW)

* **Must Have (إلزامي):** هيكلية Next.js 15 الموزعة، تدشين اللغتين (i18n)، نموذج الاتصال وجدولة المواعيد، صفحات الخدمات الست الرئيسية، متوافقة مع الـ SEO تماماً.
* **Should Have (ينبغي وجوده):** لوحة تحكم الـ CMS، تجارب الـ AI Showcase الأربعة، تأثيرات GSAP وFramer Motion الأساسية، تقارير أداء +95.
* **Could Have (يمكن إضافته):** خلفية جزيئات ثلاثية الأبعاد معقدة (Interactive 3D Particle Cloud)، نظام فلترة متقدم جداً في المحفظة يعتمد على الذكاء الاصطناعي.
* **Won't Have (مؤجل):** نظام حجز غرف اجتماعات خاص مدفوع (بدلاً من Calendly/Resend)، وبوابات الدفع الإلكتروني.

## 7. User Flows

1. **رحلة العميل المحتمل (Lead Generation Flow):**
الصفحة الرئيسية $\rightarrow$ التفاعل مع استعراض الذكاء الاصطناعي (AI Showcase) $\rightarrow$ الانبهار بالأداء $\rightarrow$ الانتقال لصفحة الخدمات أو دراسة حالة $\rightarrow$ صفحة اتصل بنا $\rightarrow$ ملء النموذج الديناميكي أو حجز موعد مباشر.
2. **رحلة تصفح المحتوى (Content Consumption Flow):**
المدونة أو المحفظة $\rightarrow$ الفلترة بحسب التكنولوجيا أو المجال $\rightarrow$ قراءة المقال/دراسة الحالة $\rightarrow$ تفعيل شريط الاشتراك في النشرة البريدية (Newsletter).

## 8. System Architecture

نظام موزع ومعماري يعتمد على **Jamstack / Serverless Micro-frontend architecture** مدعوماً بـ Next.js App Router.

* **العرض والمعالجة:** Next.js 15 (توليد ثابت هجين SSG لصفحات المقالات، وSSR لصفحات الديناميكية، وISR لتحديث بيانات الـ CMS).
* **قاعدة البيانات والمحرر الخلفي:** Supabase (PostgreSQL) يعمل كـ Headless Backend يوفر مصادقة آمنة، وتخزين للمفاتيح والمقالات.
* **معالجة الـ AI:** خادم مصغر (Microservice) بـ FastAPI وPython للتعامل مع معالجة الصور (Vision AI) والأتمتة لتفادي الضغط على Edge functions الخاصة بـ Vercel ولتقليل زمن الاستجابة.

## 9. Frontend Plan

* **هيكلية الواجهة:** استخدام تجميعة المكونات من Radix UI المتمثلة في `shadcn/ui` لضمان إتاحة الوصول (Accessibility 100).
* **إدارة الحركة (Motion Layout):**
* استخدام **Lenis** لإلغاء القفزات وتنعيم التمرير (Smooth Scrolling).
* **GSAP** للحركات المرتبطة بالتمرير المعقد (Scroll-triggered animations).
* **Framer Motion** لحركات دخول العناصر والتنقل بين الصفحات (Page Transitions).


* **التعامل مع الـ 3D:** استخدام React Three Fiber (R3F) مع Drei. يتم عزل الـ Canvas في مكونات منفصلة واستخدام الـ `Suspense` لتجنب حظر المعالجة الأساسية (Main Thread Block).
* **الحالات (State Management):** الاعتماد بالكامل على تفريعات روابط الـ URL للحالات العامة (مثل الفلاتر والبحث) و`Zustand` للحالات الشاملة الخفيفة (مثل الوضع الداكن/الفاتح، بيانات الـ Chatbot).

## 10. Backend Plan

* **بنية الـ API:** نقاط نهاية (Endpoints) مدمجة في Next.js Route Handlers للعمليات الخفيفة (إرسال بريد عبر Resend، حفظ طلبات اتصل بنا).
* **خادم الذكاء الاصطناعي:** تنصيب تطبيق FastAPI على Docker للتكامل مع OpenAI API ومكتبات الـ Computer Vision.
* **الأمان والحد من الاستهلاك (Rate Limiting):** دمج حزم مثل `upstash/ratelimit` لمنع استنزاف موارد الـ AI Demos من قبل البوتات والمخربين.

## 11. AI Plan

* **النماذج المستخدمة:** `gpt-4o-mini` للاستخدام العام في الشات بوت (توفيراً للتكلفة والسرعة).
* **الذاكرة والسياق:** استخدام ذاكرة جلسة قصيرة المدى (In-memory session context) تنتهي بإغلاق المتصفح لتقليل تكاليف التخزين.
* **إدارة المخاطر (Hallucination & Injection):** وضع قواعد صارمة للنظام (System Prompts) تمنع الروبوت من الإجابة على مواضيع خارج نطاق خدمات شركة Aivora. استخدام فلاتر لتنقية النصوص المدخلة من المستخدم (Prompt Shield).

## 12. Data Model

تصميم مفاهيمي للعلاقات الأساسية في Supabase (PostgreSQL):

```
[Clients/Leads] 1 ------ N [Projects/Case Studies]
[Categories/Tags] 1 ---- N [Blog Posts]
[Admins/Users] 1 ------- N [Audit Logs]

```

* **constraints مهمة:** يجب أن تحتوي جداول المحتوى (Posts, Projects) على حقول تدعم اللغتين مثل (`title_en`, `title_ar`) لضمان سلاسة جلب البيانات بناءً على الـ Locale النشط.

## 13. Security Considerations

* تطبيق سياسات حماية صارمة على مستوى الصفوف (Row Level Security - RLS) في Supabase لمنع أي وصول غير مصرح به لبيانات لوحة التحكم.
* تأمين مدخلات النماذج (Forms) بالكامل باستخدام مكتبة `Zod` للتحقق من البيانات مدخلةً على العميل والخادم معاً.
* تخزين مفاتيح الـ API (OpenAI, Resend) في بيئة Server-only البيئية المباشرة لمنع تسريبها للـ Client-side bundle.

## 14. Performance Considerations

* **تحسين الـ 3D:** ضغط ملفات الـ 3D (GLTF/GLB) باستخدام أدوات مثل `gltf-pipeline` وتحويلها إلى مكونات React عبر `gltfjsx`.
* **تقنيات الخطوط والصور:** استضافة الخطوط محلياً عبر `next/font` وتحسين جودة وحجم الصور ديناميكياً بواسطة `next/image`.
* **استراتيجية الحركات:** استبدال حركات الـ CSS التي تستهلك المعالج (مثل `top`, `left`, `margin`) بحركات تعتمد على كارت الشاشة (GPU-accelerated) مثل `transform: translate3d()`.

## 15. Risks and Trade-offs

* **تأثير الحركات على الأداء (Motion vs. Performance):** كثرة الـ Canvas والمؤثرات قد تسقط معدل الإطارات (FPS) على الأجهزة الضعيفة. *التسوية المستهدفة:* إيقاف تشغيل الـ 3D والجسيمات المعقدة تلقائياً إذا كان الجهاز يدعم خاصية `prefers-reduced-motion` أو إذا كان هاتفاً محمولاً.
* **تعقيد التحديث:** استخدام Next.js 15 وReact 19 (بما يحتويه من معماريات معالجة وتحديثات للـ Compiler) يتطلب التأكد من توافقية مكتبات الطرف الثالث تماماً (خاصة مكتبات الـ 3D).

## 16. Assumptions

* العميل يمتلك حسابات مفعّلة وجاهزة لـ OpenAI API, Supabase, وResend.
* تصاميم الواجهات (UI/UX) على Figma مكتملة وجاهزة للتحويل إلى أكواد وتدعم الـ Responsive والـ RTL.

## 17. Open Questions

1. هل سيتم الاعتماد على نظام إدارة محتوى خارجي بالكامل (مثل Sanity أو Strapi) أم الاعتماد بالكامل على جداول مخصصة داخل Supabase وبناء واجهة لوحة تحكم مخصصة (Custom Dashboard CMS) كما هو مقترح بالصفحات؟ *(التوصية: الاعتماد على لوحة تحكم مخصصة بداخل التطبيق لتوحيد الهوية).*
2. ما هي الميزانية الشهرية المحددة للـ AI Consumption للاستعراضات الحية؟

## 18. Recommended Tech Stack

* **Framework:** Next.js 15 (App Router) & React 19.
* **Styling:** Tailwind CSS v4 (تستفيد من سرعة معالجة مجمّع Rust وبنية التصميم البرمجية الجديدة).
* **Animations:** Framer Motion (للواجهات) + GSAP (للتمرير) + React Three Fiber & Drei (للأبعاد الثلاثية).
* **Backend & Database:** Supabase (Auth, Database, Storage) + FastAPI (Python) لمعالجة الـ AI المعقد.
* **Deployment:** Vercel (للـ Frontend والـ Edge Functions) + AWS App Runner أو Docker على VPS (لخادم الـ FastAPI).

## 19. Implementation Sequence

1. **المرحلة 1: التجهيز والهيكل:** إعداد مشروع Next.js 15 مع Tailwind v4 وتكوين الـ i18n للغتين.
2. **المرحلة 2: البنية التحتية والبيانات:** ربط Supabase وإعداد جداول البيانات والـ RLS.
3. **المرحلة 3: الواجهات الثابتة والديناميكية:** بناء الهيكل الأساسي للصفحات والـ Layouts بدون الحركات الصعبة لضمان سرعة الهيكلة.
4. **المرحلة 4: دمج الـ AI وخادم FastAPI:** بناء الـ Demos التفاعلية وربطها بالخادم الخلفي.
5. **المرحلة 5: الطبقة البصرية (3D & Motion):** إضافة Lenis وGSAP والـ 3D مع الفحص المستمر للأداء عبر Lighthouse للتأكد من عدم الهبوط عن 95.
6. **المرحلة 6: لوحة التحكم والاختبارات:** إنهاء الـ CMS وإجراء اختبارات الاختراق والأمان المتوافقة.

---

## 20. Final Handoff Report for Vibe Coding

* **Product Name:** Aivora Official Platform
* **One-line Description:** An immersive, high-performance, bilingual interactive agency platform showcasing advanced AI and Full-Stack capabilities using cutting-edge 2026 tech.
* **Confirmed Scope:** 23 core pages, bilingual routing (EN/AR), Supabase backend, Next.js 15 server actions, 4 interactive AI demos, custom CMS dashboard, performance score >95.
* **Assumed Scope:** Figma layouts are fully documented for RTL transitions; local content assets (images/3D models) are optimized beforehand.
* **Architecture Summary:** Next.js 15 App Router + Vercel deployment for static/server-rendered frontend. Supabase handles database/authentication, while a secondary Dockerized FastAPI microservice processes AI and Vision payloads.
* **Key Entities:** `Leads`, `CaseStudies`, `BlogPosts`, `Careers`, `Users/Admins`.
* **Key User Flows:** Interactive AI Demo Engagement $\rightarrow$ Lead capture via dynamic forms/scheduler.
* **Critical Constraints:** Zero blocking on the main thread from React Three Fiber components. Strictly conditional animation initialization based on device capability to secure Lighthouse metrics.
* **Implementation Order:** Global i18n Layout Setup $\rightarrow$ Core Page Scaffolding $\rightarrow$ Supabase Schema Integration $\rightarrow$ AI Microservice Deployment $\rightarrow$ Animation Overlay & Optimization.
* **Risks to Watch:** Hydration mismatches caused by localized layout engines or dark mode theme flash.
* **Exact Next Step for Vibe Coding:**
> "Initialize the Next.js 15 repository utilizing React 19 and Tailwind CSS v4. Set up the dynamic language routing parameters within the App Router (`/[locale]/`) ensuring full compatibility for both `en` and `ar` layouts with proper document direction handling (`dir="ltr"` and `dir="rtl"`)."



---

الخطة الآن مكتملة، محددة المعالم، وجاهزة للتمرير مباشرة إلى عميل أو مهندس برمجيات للبدء في كتابة الكود الفعلي دون تشتت وبأعلى درجات الكفاءة الهندسية. هل تود مناقشة تفاصيل خادم الـ FastAPI وتأمين الـ AI Demos بشكل أعمق؟