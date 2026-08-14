# Amwaj Notion Admin Center

## الهدف

يجعل هذا التكامل قاعدة **Amwaj Admin** في Notion واجهة تشغيل للمحتوى. تبقى Supabase هي مصدر الحقيقة للتشغيل العام، بينما تطلب Notion عمليات محددة ومتحققاً منها عبر وظيفة Vercel. لا يحمل المتصفح ولا Notion أي مفتاح Supabase بصلاحية `service_role`.

```text
Notion page action
    -> Notion webhook
    -> /api/notion-admin
    -> validate signature, action, and record
    -> Supabase Auth / REST with service role
    -> write outcome back to the Notion page
```

Notion يرسل بيانات وصفية للحدث فقط؛ لذلك تسترجع الوظيفة صفحة Notion كاملة بالـID الوارد في الحدث قبل اتخاذ أي إجراء. التوقيع هو HMAC-SHA256 لجسم طلب webhook باستخدام `verification_token` الذي يرسله Notion عند الاشتراك.[1]

## الحدود الأمنية

| القرار | التطبيق |
|---|---|
| مفاتيح الخادم | تحفظ `NOTION_API_TOKEN` و`NOTION_WEBHOOK_VERIFICATION_TOKEN` و`SUPABASE_SERVICE_ROLE_KEY` في متغيرات Vercel فقط. |
| مصادقة webhook | لا تنفذ أي عملية قبل مطابقة `X-Notion-Signature` مع HMAC-SHA256 للجسم الخام. |
| عزل قاعدة Notion | يجب أن يطابق `parent.data_source_id` القيمة `NOTION_ADMIN_DATA_SOURCE_ID`. |
| قائمة بيضاء | تقبل الوظيفة كيانات وإجراءات وخصائص Notion معرفة مسبقاً فقط. |
| منع التكرار | يسجّل الخادم معرف حدث Notion في `notion_admin_operation_logs` بمفتاح فريد قبل تنفيذ أي تعديل؛ ويُعرض `Action Request ID` في Notion للتتبع. |
| العمليات المدمرة | لا تقبل `Delete` ما لم تكن قيمة `Confirm Delete` صحيحة؛ ثم تُؤرشف صفحة Notion بعد نجاح الحذف. |
| حسابات المديرين | ترسل دعوة بريدية فقط ولا تنشئ أو تخزن كلمة مرور. إجراءات التعطيل وإعادة التنشيط منفصلة. |
| التتبع | تكتب النتيجة والوقت والـID الخارجي ورسالة الفشل إلى صفحة Notion، مع سجل JSON آمن في Vercel. |

## دورة تشغيل السجل

| `Action` | الشرط | نتيجة Supabase | نتيجة Notion |
|---|---|---|---|
| `Create` | لا يوجد `External ID` | إضافة صف جديد | `External ID` جديد و`Process Status = Completed` |
| `Update` | يوجد `External ID` | تحديث الحقول المسموحة فقط | `Completed` |
| `Publish` | سجل محتوى موجود | `status = published` | `Status = Published` و`Completed` |
| `Archive` | سجل محتوى موجود | حالة أرشفة أو `is_active = false` حسب الكيان | `Status = Archived` و`Completed` |
| `Delete` | `Confirm Delete = true` | حذف الصف المستهدف | أرشفة صفحة Notion و`Completed` |
| `Invite Admin` | بريد صالح ولا يوجد `Auth User ID` | دعوة Supabase Auth ثم `profiles.is_admin = true` | `Auth User ID` و`Completed` |
| `Disable Admin` | `Auth User ID` موجود | حظر الحساب لفترة طويلة و`is_admin = false` | `Process Status = Completed` |
| `Reactivate Admin` | `Auth User ID` موجود | إزالة الحظر و`is_admin = true` | `Process Status = Completed` |
| `Sync` | إداري فقط | لا يغير Supabase | تحديث نسخة السجل في Notion من Supabase |

## مطابقة الكيانات

| Notion `Entity` | جدول Supabase | المعرّف الخارجي | ملاحظات |
|---|---|---|---|
| `Package` | `packages` | `id` | يتطلب التصنيف والعناوين والوصفين والصورة وتسميات السعر عند الإنشاء. |
| `Destination` | `destinations` | `id` | يتطلب التصنيف والعناوين والوصفين والصورة وتسميات السعر عند الإنشاء. |
| `Service` | `services` | `id` | يتطلب `Icon Class` والعناوين والوصفين عند الإنشاء. |
| `Pricing Offer` | `pricing_offers` | `id` | يرتبط ببرنامج **أو** خدمة واحدة وبوجهة؛ السعر بالجنيه المصري. |
| `Blog Category` | `blog_categories` | `id` | يتطلب عنوانين وSlug. |
| `Blog Post` | `blog_posts` | `id` | يعتمد على `Category ID` ويحوّل جسم صفحة Notion إلى محتوى Markdown. |
| `Review` | `customer_reviews` | `id` | لا يُنشأ من Notion؛ يسمح بالاعتماد والرفض والإبراز والأرشفة والحذف فقط. |
| `Setting` | `site_settings` | `setting_key` | يقبل JSON object في `Setting Value JSON`. |
| `Admin User` | `auth.users` + `profiles` | `Auth User ID` | يستخدم الدعوات ولا ينقل كلمات مرور إلى Notion. |

## خصائص قاعدة Notion

الخصائص المعيارية الحالية (`Name` و`Entity` و`External ID` و`Title AR` و`Title EN` و`Status` وغيرها) تبقى موجودة. تضيف عملية الإعداد خصائص التشغيل التالية:

| الخاصية | النوع | الاستخدام |
|---|---|---|
| `Action` | Select | الإجراء المطلوب. القيمة الافتراضية `No Action`. |
| `Process Status` | Select | `Ready` أو`Processing` أو`Completed` أو`Failed` أو`Needs Review` أو`Ignored`. |
| `Action Request ID` | Text | مفتاح تنفيذ وحيد لكل محاولة. |
| `Result Message` | Text | ملخص آمن للنتيجة أو سبب الفشل. |
| `Processed At` | Date | وقت آخر عملية مكتملة. |
| `Confirm Delete` | Checkbox | تأكيد صريح للحذف النهائي. |
| `Slug` | Text | Slug المحتوى؛ يولد تلقائياً إن لم يُقدّم عند الإنشاء. |
| `Highlights JSON` | Text | مصفوفة JSON للنقاط المميزة. |
| `Email` | Email | بريد دعوة المدير فقط. |
| `Auth User ID` | Text | معرف Supabase Auth بعد الدعوة. |
| `Icon Class` | Text | رمز الخدمة. |
| `Category ID` | Text | معرف تصنيف مقال المدونة. |
| `Package ID` و`Service ID` و`Destination ID` | Text | علاقات عرض السعر. |
| `Price Mode` و`Price Amount` و`Discounted Price Amount` | Select/Number | تسعير البرامج والعروض. |
| `Departure Month` و`Trip Style` و`Availability` | Date/Select/Select | خصائص عرض السعر. |
| `Setting Key` و`Setting Value JSON` | Text | إعدادات الموقع. |

## محتوى مقالات المدونة

لتجنب سقف النص في خصائص Notion، يؤخذ النص الطويل من جسم صفحة المقال. يجب أن يحتوي جسم الصفحة على العنوانين التاليين تماماً:

```markdown
## المحتوى العربي

اكتب محتوى المقال العربي هنا.

## English Content

Write the English article content here.
```

تحوّل الوظيفة الفقرات والعناوين والقوائم والاقتباسات والأسطر البرمجية إلى Markdown خام قبل حفظها في `content_ar` و`content_en`. لا يفسر الموقع هذا المحتوى كـHTML موثوق.

## متغيرات Vercel المطلوبة

| المتغير | مطلوب | الغرض |
|---|---:|---|
| `SUPABASE_URL` | نعم | رابط مشروع Amwaj في Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | نعم | عمليات الخادم فقط على Supabase. |
| `NOTION_API_TOKEN` | نعم | اتصال Notion الذي يملك حق الوصول إلى قاعدة Amwaj Admin. |
| `NOTION_ADMIN_DATA_SOURCE_ID` | نعم | معرف data source لقاعدة Amwaj Admin. |
| `NOTION_WEBHOOK_VERIFICATION_TOKEN` | نعم بعد التحقق | توقيع أحداث Notion. |
| `NOTION_API_VERSION` | لا | الافتراضي `2025-09-03`. |

## إعداد الاتصال مرة واحدة

ينشئ المسؤول Notion connection بقدرات قراءة وتحديث المحتوى، ويشارك معها قاعدة **Amwaj Admin**. ثم يطبق ملف migration `supabase/migrations/202608140001_notion_admin_operation_logs.sql` قبل تفعيل webhooks؛ وهو محفوظ ومطبق بالفعل على مشروع Amwaj الحالي. بعد نشر Vercel، ينشئ اشتراك Webhook إلى:

```text
https://amwaj-virid.vercel.app/api/notion-admin
```

ويختار أحداث الصفحة `page.created` و`page.properties_updated` و`page.content_updated`. يسجل الخادم رمز التحقق الأولي في سجلات Vercel فقط؛ ينقل المسؤول الرمز إلى متغير `NOTION_WEBHOOK_VERIFICATION_TOKEN` ثم يضغط Verify داخل إعدادات Notion. لا يبدأ تنفيذ الإجراءات قبل ضبط هذا المتغير.

## المراجع

[1]: https://developers.notion.com/reference/webhooks "Notion Webhooks"
[2]: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail "Supabase: inviteUserByEmail"
[3]: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid "Supabase: updateUserById"

[1] [2] [3]
