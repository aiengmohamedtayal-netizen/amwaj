# AMWAJ — Custom Values Preview Verification Report

**التاريخ:** 15 أغسطس 2026  
**Branch:** `feature/custom-values-preview`  
**Commit:** `c6bf1ec` — `feat: guard custom values on preview branch`  
**Preview deployment:** `dpl_FjmPKcKqQjXt6BneqqxFcyubJqXv`  
**Preview URL:** https://amwaj-git-feature-custom-values-preview-1942006.vercel.app/  
**Production migration:** لم تُنفذ.

## نطاق التحقق

تم التحقق من التغييرات المتوافقة مع Audit فقط. لم يتم تعديل Supabase Schema أو RLS أو constraints أو البيانات، ولم تُنشأ بيانات اختبار؛ لذلك لم توجد حاجة إلى تنظيف بيانات تحمل بادئة `UAT-DELETE`.

## النتائج

| Test | النتيجة | الدليل الفعلي |
|---|---|---|
| JavaScript syntax: `admin/js/admin-app.js` | PASS | `node --check` نجح. |
| JavaScript syntax: `api/admin-copilot.js` | PASS | `node --check` نجح. |
| Diff integrity | PASS | `git diff --check` نجح. |
| Custom Values policy registry | PASS | `test-custom-values-policy.mjs` أعاد `custom-values-policy: PASS`. |
| Public UAT source retest | PASS | اختبار ثابت تحقق من bilingual search labels، canonical، robots، sitemap، 404، review hooks، وAI sanitization وأعاد `public-uat-retest-source: PASS`. |
| Preview deployment build | PASS | Vercel deployment state = `READY`; Build Logs: `Build Completed in /vercel/output [1s]`. ظهر تحذير ESM/CommonJS فقط دون فشل build. |
| Preview homepage HTTP | PASS | HTTP `200 OK` من Vercel مع HTML الصفحة الرئيسية. |
| Preview Admin browser interaction | BLOCKED | deployment protection أعاد `302` إلى Vercel SSO عند طلب ملفات Admin؛ لم يتم تجاوز الحماية بتسجيل دخول أو تنفيذ عمليات CRUD. |
| Preview 404/robots direct fetch | BLOCKED | الطلبات المباشرة أعادت `302` إلى Vercel SSO بسبب حماية Preview؛ لا يجوز تسجيلها PASS اعتمادًا على المصدر المحلي فقط. |
| Package/Destination custom-value save | BLOCKED / NOT EXECUTED | لا توجد Migration أو resolver/RLS معتمدة؛ لم يتم إرسال قيمة مخصصة أو تعديل بيانات. |
| RLS, FK, backfill, duplicate, rollback tests | BLOCKED / NOT EXECUTED | تتطلب Data Model Migration وبيئة معزولة وموافقة صريحة. |

## قرارات السلامة

لم تتم إضافة خيار «أخرى» إلى Package أو Destination أو Pricing في مسار الحفظ الحالي، لأن القيود الحية لا تدعم القيمة المخصصة بعد. كما لم تُستخدم `other` أو `custom` أو `__other__` أو `__custom__` كسنتينل لقيمة أعمال جديدة. بقيت `pricing_offers.trip_style = custom` محفوظة باعتبارها قيمة Legacy نظامية.

تم تحديث Admin Copilot ليحمل `customLabels` كـmetadata مراجعة داخل `editorPrefill` فقط، مع دعم صيغة `customLabel` المفردة للتوافق. لا تُمرر هذه metadata إلى Mutation، ولا تُستخدم لاختراع IDs أو تنفيذ حفظ تلقائي. يظل الحفظ والنشر بيد الأدمن.

## ما لم يُنفذ عمدًا

لم يتم تشغيل أي DDL أو RLS أو FK أو backfill أو تغيير constraint على Supabase. ولم يتم خلط المهمة مع إصلاح المساعد العام أو حذف قسم Google Search؛ تلك المهمة ما زالت queued مستقلة.

## التوصية

الفرع والـPreview صالحان للمراجعة البرمجية الآمنة، لكن لا يجوز اعتماد Custom Business Values كميزة مكتملة، ولا تنفيذ Production Migration، قبل الموافقة الصريحة على Data Model وRLS وresolver واختبارها في بيئة معزولة. كما يلزم فتح حماية Preview أو توفير جلسة اختبار مصرح بها لإكمال Browser UAT للإدارة.

> Developer credit: **Developed by YOMNA ELHAMAMSY**
