# AMWAJ — Final Retest & Client Delivery Report

**المشروع:** Amwaj Travel & Tourism  
**النطاق الحي:** [https://amwaj-virid.vercel.app/](https://amwaj-virid.vercel.app/)  
**تاريخ إعادة الاختبار:** 16 أغسطس 2026  
**الإصدار:** `03cc2d2` — `fix: show full developer credit in public footer`  
**Production Deployment:** `dpl_9nyWB7E6bxtYCz1aiDMWGUMQqjL1` — `READY`  
**Developer credit:** `Developed by YOMNA ELHAMAMSY`

> هذا التقرير مبني على اختبارات فعلية بعد Production Deploy، وعلى اختبارات Supabase وRLS وCRUD التي نفذت ببيانات مؤقتة تحمل بادئة `UAT-DELETE`. لا تُعتبر اختبارات Admin Browser PASS؛ فهي موثقة صراحةً كـBLOCKED بسبب Vercel Deployment Protection.

## Executive Summary

تم دفع الإصدار النهائي إلى `main` ونشره على Production بنجاح. اجتاز الموقع العام 24 من 24 فحصًا آليًا حيًا شملت HTTP، الائتمان، إزالة قسم Google Search Grounding، 404 المخصصة، canonical، robots، sitemap، Security Headers، CORS، القراءة العامة لـBusiness Options، المساعد الذكي، وTrip Planner. كما اجتازت اختبارات Production الخاصة بـCustom Values إنشاء القيم المخصصة وإعادة استخدامها والتعديل والرفض المكرر وحماية RLS وحفظ Package/Destination/Pricing مع التنظيف التلقائي للبيانات التجريبية. المساعد العام يعمل فعليًا عبر Groq fallback، ولم تعد رسالة «الخدمة التفاعلية غير متاحة حالياً» تظهر في اختبار الاستدعاء. مع ذلك، لا يمكن إصدار قبول نهائي GO للمشروع كله لأن Admin Browser UAT ما زال BLOCKED؛ Deployment Protection يعيد توجيه Preview إلى تسجيل دخول Vercel، ولذلك لم يتم إثبات Login/Logout وAdmin CRUD وAdmin Copilot وAI Pre-fill وUploads وDirect Actions وResponsive Admin في Browser بعد النشر. النتيجة الحالية هي **NO-GO للقبول الرسمي، مع جاهزية Production العامة تقنيًا**.

## UAT Summary

| المؤشر | النتيجة |
|---|---:|
| Historical UAT Round 1 | 163 حالة |
| Historical Round 1: PASS | 30 |
| Historical Round 1: FAIL | 9 |
| Historical Round 1: BLOCKED | 122 |
| Historical Round 1: N/A | 2 |
| Final Production Smoke checks | 24 |
| Final Production Smoke: PASS | 24 |
| Final Production Smoke: FAIL | 0 |
| Custom Values production suites | 2 |
| Custom Values suites: PASS | 2 |
| Final Retest FAIL | 0 |
| Final Retest BLOCKED | Admin Browser UAT |

**ملاحظة النسبة:** لا توجد نسبة موحدة صادقة لكل حالات UAT لأن 122 حالة تاريخية لم تُنفذ بسبب crash loop/Deployment Protection. أما Smoke Test النهائي فكانت نتيجته **100%: 24/24 PASS**.

## Release Decision

### NO-GO — Formal Client Acceptance

قرار القبول الرسمي **NO-GO مؤقتًا**، ليس بسبب فشل Production Smoke أو Custom Values، بل لأن مجموعة Admin Browser UAT الأساسية لم تُنفذ فعليًا. لا يجوز تحويل BLOCKED إلى PASS أو اعتبار لوحة الإدارة جاهزة للمستخدم غير التقني دون جلسة Browser مصرح بها ومستقرة.

### Production Public Readiness

النسخة العامة على Production **READY تقنيًا وفق نطاق الاختبارات المنفذة**. تم تنفيذ deploy من `main` بعد نجاح اختبارات Custom Values السابقة، ثم أُعيد اختبار Smoke وRLS/CRUD بعد النشر.

## Detailed Final Retest Results

| Test ID | Area | Expected | Actual | Result |
|---|---|---|---|---|
| RT-DEP-001 | Production Deploy | `main` ينشر الإصدار المعتمد | Vercel deployment `dpl_9nyWB7E6bxtYCz1aiDMWGUMQqjL1` أصبح `READY` على Production | PASS |
| RT-PUB-001 | Public Website | الصفحة الرئيسية HTTP 200 | HTTP 200 | PASS |
| RT-PUB-002 | Developer Credit | ظهور النص الكامل المطلوب | `Developed by YOMNA ELHAMAMSY` موجود في HTML الأولي | PASS |
| RT-PUB-003 | AI Drawer | عدم ظهور Google Search Grounding | القسم والـtoggle غير موجودين في HTML الحي | PASS |
| RT-SEO-001 | Robots | منع `/admin/` والإشارة إلى sitemap الحي | `Disallow: /admin/` و`/admin`، وSitemap على نطاق Vercel الحي | PASS |
| RT-SEO-002 | Sitemap | XML صالح بلا fragments أو نطاق قديم | HTTP 200، بلا fragments، وبروابط `amwaj-virid.vercel.app` | PASS |
| RT-SEO-003 | Canonical | canonical متسق مع Production الحالي | `https://amwaj-virid.vercel.app/` | PASS |
| RT-PUB-004 | 404 | صفحة Amwaj مخصصة مع عودة واضحة | HTTP 404 وصفحة تحمل branding وروابط عودة | PASS |
| RT-SEC-001 | Security Headers | headers أساسية مفعلة | `nosniff`، Referrer-Policy، X-Frame-Options، Permissions-Policy، CSP موجودة | PASS |
| RT-SEC-002 | CORS | Origin غير موثوق مرفوض | OPTIONS من `https://evil.example` أعاد 403 بلا Allow-Origin | PASS |
| RT-SEC-003 | CORS | Production origin مسموح | Chat وTrip Planner أعادا 204 مع Allow-Origin الصحيح | PASS |
| RT-DATA-001 | Public Data | قراءة Business Options المنشورة | Supabase REST أعاد 12 خيارًا فعالًا تغطي الحقول الثلاثة | PASS |
| RT-CV-001 | Custom Values / RLS | create/reuse/duplicate rejection/anonymous denial | `test-custom-values-production.mjs` نجح ونظف UAT-DELETE | PASS |
| RT-CV-002 | Custom Values CRUD | Package/Destination/Pricing save/edit/reuse/filter/write denial | `test-custom-values-crud-production.mjs` نجح بكل checks الثمانية ونظف البيانات | PASS |
| RT-AI-001 | Public AI Assistant | استجابة مفيدة دون رسالة unavailable | HTTP 200؛ الاستجابة جاءت عبر Groq fallback ولم تظهر الرسالة القديمة | PASS |
| RT-AI-002 | Trip Planner | خطة JSON صالحة | HTTP 200 مع plan منظّمة للوجهة والمدة والميزانية | PASS |
| RT-ADMIN-001 | Admin Browser | Login/Logout/Session/Permissions في Browser | BLOCKED بسبب Vercel Deployment Protection على Preview | BLOCKED |
| RT-ADMIN-002 | Admin Custom Values UI | Other → custom label → Save → Reuse من Browser | لم يمكن فتح Admin Browser على Preview؛ اختبارات REST/CRUD PASS فقط | BLOCKED |
| RT-ADMIN-003 | Admin Copilot | AI Pre-fill ومراجعة editor في Browser | لم يمكن تنفيذ Browser UAT بسبب الحماية | BLOCKED |
| RT-ADMIN-004 | Admin Operations | CRUD، Uploads، Draft/Publish، Reviews، Settings، Direct Actions | لم يمكن إثبات السلوك الكامل في Browser | BLOCKED |
| RT-RESP-001 | Responsive Admin | Mobile/Tablet/Desktop Admin فعليًا | لم يمكن الفحص بسبب الحماية | BLOCKED |

## Confirmed Fixes Retested

| Issue | Final status | Evidence |
|---|---|---|
| Custom Values data model and save flows | Fixed and PASS | Production DB migration, RLS/CRUD suites، 12 public options، package/destination/pricing checks |
| Public AI unavailable message | Operationally fixed via fallback | Live `/api/chat` returned HTTP 200; active model in response was Groq fallback |
| Google Search Grounding UI | Fixed | Live HTML contains no `searchGroundingToggle` or Google Search Grounding section |
| 404 page | Fixed | Unknown route returned HTTP 404 with Amwaj branding and return links |
| SEO robots/sitemap | Fixed | Live robots and sitemap checks PASS |
| Canonical | Fixed for current Vercel Production host | Live canonical is `https://amwaj-virid.vercel.app/` |
| CORS wildcard | Fixed | Trusted Production origin allowed; untrusted origin denied |
| Security headers | Fixed | All configured headers observed on live homepage |
| Developer credit | Fixed | Full required text present in public footer and Admin footer |
| English dynamic labels | Code path fixed and public bilingual attributes deployed | Public smoke and source checks PASS; full Admin browser language UAT remains BLOCKED |
| Empty image source | No empty `<img src="">` in live initial HTML | Live HTML check PASS; full gallery interaction remains part of blocked Browser UAT |

## Critical / High Issues Remaining

### ADM-UAT-001 — High — Admin Browser UAT blocked

**Expected:** اختبار فعلي لـAdmin Login، Sessions، CRUD، Custom Values، AI Copilot، Pre-fill، Uploads، Draft/Publish، Reviews، Settings، Permissions، Responsive behavior.  
**Actual:** Preview/Admin session محجوبة بواسطة Vercel Deployment Protection وتحوّل إلى Vercel login؛ لم يتم الحصول على جلسة Browser مصرح بها.  
**Severity:** High for formal client acceptance.  
**Root cause:** حماية Deployment في Preview، وليس فشلًا مثبتًا في الكود أو Supabase.  
**Recommended fix:** توفير Preview URL مصرح به للاختبار أو تعطيل الحماية مؤقتًا وفق قرار مالك المشروع، ثم إعادة كل حالات Admin Browser UAT. لا تُسجل هذه الحالات PASS قبل التنفيذ الفعلي.

### AI-PRIMARY-001 — Medium — Primary provider health not independently confirmed

**Expected:** SovereignEG primary يعمل قبل fallback عند توفر مفتاح صالح.  
**Actual:** الاستدعاء الحي نجح عبر Groq fallback؛ لا يوجد في Smoke Test دليل على نجاح SovereignEG primary.  
**Impact:** لا توجد حالة unavailable في الاختبار، لكن primary provider يحتاج تدوير/تأكيد المفتاح من Vercel Environment Variables إذا كان `key_revoked` ما زال ظاهرًا في runtime logs.  
**Recommendation:** فحص runtime logs بعد تدوير المفتاح في Vercel فقط، مع إبقاء Groq fallback. لا توجد مفاتيح API في frontend.

## Security / Data Integrity Notes

لم تُنفذ أي Migration جديدة أثناء مرحلة Finish؛ الـProduction Data Model وRLS وgrants والـbackfill كانت مطبقة ومتحققًا منها قبل deploy. اختبارات UAT أنشأت فقط سجلات ببادئة `UAT-DELETE` ثم حذفتها تلقائيًا. اختبار anonymous write denial نجح، وanonymous rendering filter لم يُظهر draft/inactive/rejected content في اختبار CRUD. لم يُستخدم `service_role` في Browser أو في frontend.

## Passed Areas

اجتاز الموقع العام والفحوص الخلفية الحية: الصفحة الرئيسية، 404، SEO الحالي، Security Headers، CORS، Business Options public read، AI chat عبر fallback، Trip Planner، وCustom Values Production RLS/CRUD. كما أن commit التسليم موجود في GitHub على `main` و`feature/custom-values-preview`، وكلاهما عند `03cc2d2`.

## Blocked Tests and What Is Needed

الاختبارات المحجوبة هي كل ما يتطلب جلسة Admin Browser مصرحًا بها: login/logout/session، التنقل الكامل، Package/Destination/Service/Blog/Pricing/Reviews/Settings editors، Uploads، Draft/Publish validation، Admin Copilot، AI Pre-fill، Direct Actions، permissions، responsive admin، ومراجعة mixed-language في واجهة الإدارة. المطلوب لإغلاقها هو Preview/Admin access قابل للاختبار، ثم إعادة الحالات المتأثرة فعليًا وعدم الاكتفاء بـREST أو source inspection.

## Evidence Index

| Evidence | Location |
|---|---|
| Final Smoke output | `ops/production-smoke-final.txt` |
| Production RLS test | `ops/test-custom-values-production.mjs` |
| Production CRUD test | `ops/test-custom-values-crud-production.mjs` |
| Production migration | `ops/20260815_custom_values_production.sql` |
| Constraints repair | `ops/20260815_custom_values_constraints_repair.sql` |
| Grants | `ops/20260815_custom_values_grants.sql` |
| Preview blocker | `ops/preview-admin-browser-blocker.md` |
| Previous detailed UAT evidence | `uat-live-evidence.md`, `uat-results.json`, `UAT-cases.tsv` |
| Live Production URL | [amwaj-virid.vercel.app](https://amwaj-virid.vercel.app/) |
| Admin URL | [amwaj-virid.vercel.app/admin/](https://amwaj-virid.vercel.app/admin/) |

## Final Recommendation

النسخة العامة **جاهزة تقنيًا للتشغيل العام ضمن الاختبارات المنفذة**، وCustom Values مكتملة فعليًا في Production Database وRLS وPublic rendering وCRUD integration. أما **التسليم الرسمي للعميل والقبول النهائي فليس GO بعد**؛ يجب أولًا إزالة سبب BLOCKED أو توفير طريقة مصرح بها لاختبار Admin Browser، ثم إعادة UAT للحالات المحجوبة. لا توجد توصية بإعادة بناء المشروع أو تغيير Schema/RLS في هذه المرحلة.
