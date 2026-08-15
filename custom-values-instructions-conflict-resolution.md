# AMWAJ — Custom Values Instructions Conflict Resolution

**التاريخ:** 15 أغسطس 2026

**النطاق:** مقارنة التعليمات الجديدة في `pasted_content.txt` مع تقرير `AMWAJ Custom Values Audit & Data Model Proposal`، وتحديد ما يمكن تنفيذه على فرع Preview وما يجب تأجيله.

**القرار التنفيذي المختصر:** التعليمات الجديدة متوافقة في معظمها مع الـAudit، لكنها توسّع حالة الاعتماد من «تصميم مقترح» إلى «تنفيذ Migration وRLS الآن». هذا الجزء لا يمكن تنفيذه في هذه المرحلة لأن متطلبات المهمة الحالية تمنع تعديل Supabase Schema/RLS أو تنفيذ Production Migration دون موافقة صريحة. لذلك سيتم تنفيذ التغييرات البرمجية الآمنة فقط على فرع Preview، مع إعداد خطة/DDL مراجعة غير مطبقة عند الحاجة، ولن تُفتح UX توحي بحفظ قيمة مخصصة فعليًا ما لم يكن مسار الحفظ الآمن متاحًا.

## 1. مصادر المقارنة

| المرجع | دوره في القرار |
|---|---|
| [`custom-values-audit-report.md`](./custom-values-audit-report.md) | المرجع المعتمد للتصنيف، Data Model المقترح، RLS boundaries، وحدود التنفيذ الأصلية. |
| [`pasted_content.txt`](../upload/pasted_content.txt) | التعليمات التنفيذية الجديدة، بما فيها resolver، UX، Migration strategy، الاختبارات، وحدود Production Safety. |
| متطلبات المهمة الحالية في سياق AMWAJ | تمنع تعديل Schema/RLS دون موافقة صريحة، وتلزم بفرع آمن وPreview وعدم خلط مهمة المساعد العام المؤجلة. |

## 2. ما يتطابق مباشرةً مع الـAudit

التعليمات الجديدة تؤكد نفس الفصل بين Business Custom Values وSystem-controlled Values. وتشمل الحقول القابلة للتخصيص: `packages.category` و`destinations.category` و`pricing_offers.trip_style`، مع إبقاء Service Icons كنص Font Awesome مُتحقق منه، والإبقاء على Blog Categories كسجلات حقيقية في جدول `blog_categories` بدل استخدام sentinel داخل `blog_posts.category_id`. كما تؤكد عدم تخزين `other` أو `__other__` أو `custom` كسنتينل للقيمة نفسها، وعدم اختراع AI لمعرّف غير موجود، والإبقاء على Human Review قبل الحفظ أو النشر. هذه النقاط متوافقة مع أقسام التصنيف وUX وData Model وAI في الـAudit [1] [2].

| التعليم الجديد | الحكم |
|---|---|
| استخدام `business_option_values` للـPackage Category وDestination Category وPricing Trip Style | متوافق مع التوصية المعتمدة. |
| إبقاء statuses وpermissions وbooleans وratings وforeign keys ثابتة | متوافق بالكامل. |
| resolver خادمي يحدد الحقول المسموح تخصيصها ولا يثق في `customizable` من المتصفح | متوافق مع Security/RLS boundary. |
| استخدام custom label في AI Pre-fill بدل invented ID | متوافق بالكامل. |
| Blog Category حقيقي مع الحفاظ على FK و`ON DELETE RESTRICT` | متوافق بالكامل. |
| إبقاء Public Trip Planner style نصًا مستقلًا | متوافق بالكامل. |
| عدم إعادة تصميم الموقع العام وعدم خلط إصلاح المساعد العام | متوافق مع نطاق المهمة الحالية. |
| اختبارات عدم فقدان البيانات وRLS وXSS والتكرار والتوافق الخلفي | متوافق، مع تأجيل الاختبارات التي تتطلب Migration غير معتمدة. |

## 3. التعارضات وقرارات الأولوية

### التعارض الأول — تنفيذ Migration وRLS الآن مقابل قيد عدم تعديل Schema/RLS دون موافقة

التعليمات الجديدة تقول إن الـAudit «معتمد للتنفيذ الآن»، وتطلب إنشاء جدول `business_option_values`، وإضافة أعمدة FK nullable، وBackfill، وتعديل RLS، ثم إزالة/استبدال القيود القديمة بعد التحقق. لكن الـAudit نفسه يصف تلك الخطوات بأنها Proposal Only، كما أن متطلبات المهمة الحالية تنص صراحةً على عدم تعديل Supabase Schema/RLS دون موافقة صريحة وعلى عدم تنفيذ Production Migration قبل التحقق [1] [2].

**القرار:** أولوية Security/RLS وعدم فقدان البيانات تتغلب على أولوية UX والتنفيذ الفوري. لن يتم تطبيق أي DDL أو RLS policy أو backfill أو تغيير constraint على Supabase، لا في Production ولا في Preview المشترك، خلال هذه الدورة. يمكن إعداد migration script أو خطة مراجعة غير مطبقة، لكن لا تُنفذ ولا تُدفع إلى قاعدة البيانات.

### التعارض الثاني — عرض «أخرى» مع بقاء قيود Packages/Destinations الحالية

التعليمات تطلب أن تظهر «أخرى» وتُحفظ قيمة حقيقية قابلة لإعادة الاستخدام، بينما القيود الحالية `packages_category_check` و`destinations_category_check` لا تقبل إلا القيم المعروفة. إضافة الخيار إلى UI وحدها ستنتج فشل حفظ أو workaround يخالف Business Rules، كما أن تخزين النص الخام لا يحقق Data Model المرجعي.

**القرار:** لن نعيد فتح «أخرى» في Package/Destination على مسار الحفظ الحالي قبل وجود resolver/transaction مدعومين بجدول مرجعي وRLS معتمدين. سنحافظ على القيم الثلاث الحالية، ونمنع أي sentinel أو raw workaround. سيتم تجهيز نقاط التكامل البرمجية والتحقق من unknown-value preservation دون الادعاء بأن إنشاء taxonomy أصبح متاحًا قبل الموافقة على Migration.

### التعارض الثالث — RLS جديدة تسمح للأدمن بإنشاء/تعطيل القيم مقابل عدم تعديل RLS حاليًا

التعليمات تحدد سياسات Anonymous وAuthenticated non-admin وAdmin لجدول القيم الجديد. هذا صحيح أمنيًا من حيث التصميم، لكنه يتطلب جدولًا وRLS وسياسة خادمية جديدة، وهي تغييرات خارج حدود التنفيذ المسموح حاليًا.

**القرار:** نعتمد هذا كـSecurity design target فقط. لا توجد سياسة جديدة مطبقة في Supabase الآن. أي تنفيذ لاحق يجب أن يستخدم `private.is_admin()` و`SECURITY DEFINER` و`search_path` الآمن، ويُراجع في بيئة معزولة قبل أي Production Migration.

### التعارض الرابع — `pricing_offers.trip_style = custom`

التعليمات الجديدة تمنع استخدام `custom` كسنتينل للقيمة المخصصة، لكنها في الوقت نفسه تطلب الحفاظ على القيمة الحالية `custom`. والـAudit يثبت أن `custom` قيمة Legacy/System behavior موجودة في البيانات الحالية، وليست بالضرورة سجل Custom Business Value.

**القرار:** لا نعيد تسمية أو نحذف أو نحول القيمة الحالية تلقائيًا. سيظل `custom` legacy value محفوظًا كما هو، ويجب فصل دلالته عن أي Custom Value جديد. لا يُسمح باستخدام `custom` لتمثيل label مخصص جديد.

### التعارض الخامس — Service Icon Catalog Governance

التعليمات تطلب دعم Custom Font Awesome class الآن مع allowlist وvalidation، بينما الـAudit يصنف سياسة توسيع كتالوج الأيقونات كمسألة تحتاج قرار Business مستقل، مع قبول إبقاء الحقل نصيًا بعد validator متخصص.

**القرار:** المسموح هو تشديد التحقق الأمني على قيمة `icon_class` وفق allowlist/pattern ثابت وعدم قبول HTML أو CSS injection أو classes عشوائية. لا يتم إنشاء كتالوج إداري جديد أو فتح سياسة توسعة عامة للأيقونات في هذه الدورة.

### التعارض السادس — Public Filters وإظهار القيم المخصصة تلقائيًا

التعليمات تطلب جعل الفلاتر data-driven إذا تم اعتماد ظهور Custom Categories للزوار، بينما الـAudit يصنف قرار الظهور التلقائي في الفلاتر ضمن Class C، ويشترط visibility والترجمة والترتيب.

**القرار:** لا نضيف فئات مخصصة تلقائيًا إلى الفلاتر العامة قبل اعتماد سياسة ظهورها. يمكن إصلاح fallback الذي يضلل المستخدم، والحفاظ على `all` كعنصر تحكم، لكن لا نُنشئ مصدرًا عامًا للقيم أو صفحات SEO جديدة دون قرار مستقل.

## 4. مصفوفة التنفيذ على Preview

| المجال | ما سيتم تنفيذه الآن | ما سيتم تأجيله |
|---|---|---|
| Admin custom-select | تطوير abstraction الحالية وmetadata registry بحيث لا تُضاف «أخرى» إلى System-controlled fields، مع الحفاظ على unknown current value UX. | حفظ Custom Value فعلي في Taxonomy جديدة قبل resolver/Schema المعتمد. |
| Packages/Destinations | الحفاظ على الخيارات المدعومة والقيم الحالية، وإزالة أي مسار sentinel أو raw workaround. إعداد تكامل واضح ينتظر resolver المعتمد. | إزالة constraints أو إضافة FK أو Backfill أو إنشاء قيم مخصصة في قاعدة البيانات. |
| Pricing | الحفاظ على القيم الحالية، وخاصة legacy `custom`، وفصلها برمجيًا عن مفهوم Custom Value الجديد. | تحويل `custom` أو إضافة reference FK قبل اعتماد Migration. |
| Services | validator خادمي/مسار تحقق آمن للـFont Awesome class إن كان متاحًا دون Schema، مع allowlist ثابتة وعدم قبول HTML/CSS. | كتالوج أيقونات إداري قابل للتوسيع كقرار Business مستقل. |
| Blog | الحفاظ على `blog_categories` وFK وعدم قبول sentinel أو raw category string داخل post. | أي تغيير Schema غير لازم. |
| Admin Copilot | تحديث proposal contract ليستخدم `customLabel` عند الحاجة، مع إبقاء Human Review وعدم اختراع IDs أو Direct Publish. | إنشاء taxonomy تلقائي من AI أو تجاوز صلاحيات الحفظ. |
| Public Website | إزالة افتراضات fallback المضللة، وإظهار label فعلي عند توفره دون إعادة تصميم. | إظهار Taxonomy جديدة في الفلاتر العامة أو SEO قبل اعتماد visibility/source. |
| Trip Planner | عدم ربط style النصي بتصنيفات الإدارة، مع الإبقاء على validation الحالي. | لا تغيير غير لازم في هذا المسار. |
| Notion | عدم كتابة `other` كسنتينل؛ مراجعة mapping عند اعتماد reference IDs. | ترحيل Notion إلى taxonomy IDs قبل وجود النموذج المعتمد. |
| Schema/RLS | لا تنفيذ. | كل DDL، policies، FK، backfill، constraint replacement، transaction resolver. |
| Public AI assistant | خارج النطاق؛ المهمة queued مستقلة. | إصلاح رسالة «الخدمة التفاعلية غير متاحة» وحذف Google Search section. |

## 5. التغييرات التي تُعتبر «متوافقة» دون Migration

يمكن تنفيذ تغييرات frontend/serverless لا تغيّر قاعدة البيانات ولا تتجاوز RLS، ومنها: registry ثابت يعرّف `customizable` من الخادم لا من المتصفح؛ تنظيف مدخلات custom labels وإظهار رسائل تجارية؛ تحديث Copilot schema ليحمل `customLabel` بدل invented IDs؛ تشديد التحقق من Service Icon class؛ الحفاظ على القيم الحالية وعدم تخزين sentinels؛ وإصلاح renderer العام كي لا يحول قيمة مجهولة إلى `international` أو `vip` بشكل مضلل.

هذه التغييرات لا تعني أن Custom Business Values أصبحت قابلة للحفظ في Supabase. أي حفظ جديد يحتاج مسارًا مرجعيًا آمنًا، ولذلك يجب أن يبقى disabled أو guarded حتى اعتماد Migration/RLS واختبارها في بيئة معزولة.

## 6. اختبارات القبول والبيانات التجريبية

سيتم تنفيذ اختبارات القراءة والتحقق وعدم الانحدار دون إنشاء Business Data حقيقية. إذا تطلب اختبار لاحق إنشاء سجل، فسيستخدم اسمًا يبدأ بـ`UAT-DELETE` وسيُنظف بعد الاختبار. اختبارات إنشاء taxonomy، anonymous/non-admin RLS، backfill، orphan detection، وresolver transaction ستظل **BLOCKED/Not Executed** إلى أن تُعتمد Migration وبيئة اختبار معزولة.

لن يتم اعتبار إزالة «أخرى» من Package Editor فشلًا في هذه المرحلة إذا كان مسار الحفظ الحالي لا يدعمها؛ لكن لن نُسمي الميزة مكتملة قبل تفعيل resolver وData Model المعتمدين. هذا يحافظ على Security/RLS وعدم فقدان البيانات وBusiness Rules قبل UX.

## 7. شروط فتح Production Migration لاحقًا

لا يجوز فتح Migration Production إلا بعد موافقة صريحة مستقلة على DDL وRLS، ونسخة احتياطية، وبيئة Preview/isolated، ومقارنة record counts وorphaned records وunknown categories وbroken FKs، واختبار Admin/Public/AI، ثم خطة rollback ومراجعة نهائية. حتى ذلك الحين يظل هذا الفرع code-only/Preview ولا يغيّر قاعدة البيانات.

## 8. المراجع

[1]: ./custom-values-audit-report.md "AMWAJ Custom Values Audit & Data Model Proposal"
[2]: ../upload/pasted_content.txt "New Custom Business Values execution instructions"
