# AMWAJ — Custom Values Preview Implementation

**الفرع:** `feature/custom-values-preview`  
**الحالة:** Code-only Preview preparation؛ لا توجد أي تغييرات على Supabase Schema أو RLS أو Production data.

## المنفذ

أضيفت سياسة مركزية في Admin Panel تميز بين الحقول ذات القيمة المخصصة والحقول ذات القيم النظامية. تظل `packages.category` و`destinations.category` و`pricing_offers.trip_style` مقيدة بالقيم المدعومة حاليًا، مع الحفاظ على `pricing_offers.trip_style = custom` كقيمة Legacy نظامية وليست sentinel لقيمة نصية جديدة. يظل `services.icon_class` هو الحقل القابل للإدخال المخصص ضمن الـabstraction الحالية.

أصبح اختيار الحقول المقفلة يحافظ على أي قيمة حالية غير معروفة في واجهة التحرير بدل استبدالها صامتًا بقيمة أخرى. وفي المقابل يمنع حارس الحفظ إرسال قيمة غير مدعومة إلى Supabase، بما يحمي البيانات من الفشل أو التحويل غير المقصود. لا يتم تخزين `other` أو `__other__` أو `custom` كسنتينل جديد.

تم تحديث Admin Copilot ليقبل `customLabels` كـmetadata مراجعة في `editorPrefill` فقط. لا تُعد هذه metadata عمودًا في قاعدة البيانات، ولا تُرسل إلى مسار Mutation، ولا تسمح باختراع category ID أو بالحفظ والنشر التلقائي. يظهر للمشرف تنبيه تجاري واضح بأن القيمة تحتاج مراجعة، وأن دعم حفظها فعليًا يتطلب Migration وRLS معتمدين.

## التحقق المنفذ

تم اجتياز فحص syntax لملفات JavaScript، وفحص `git diff --check`، واختبار ثابت يراجع registry والسياسات وحارس الحفظ وعقد Copilot.

## المؤجل عمدًا

لم تُطبق أي DDL أو RLS أو FK أو backfill أو استبدال constraints، ولم تُنشأ بيانات اختبار أو Business Data جديدة. إنشاء جدول `business_option_values`، وresolver الخادمي، وتحويل الفئات إلى reference IDs، واختبارات RLS وtransaction وrollback تظل محجوبة حتى موافقة صريحة مستقلة وبيئة معزولة.

## نطاق منفصل

لم يتم تعديل المساعد العام أو حذف قسم Google Search؛ ذلك محفوظ في المهمة queued المنفصلة كما طلب صاحب المشروع.

> Developer credit: **Developed by YOMNA ELHAMAMSY**
