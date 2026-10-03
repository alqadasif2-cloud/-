# مشروع تطبيق النسخ الاحتياطي التلقائي الشخصي للأندرويد (Personal Cloud Backup)

تطبيق أندرويد أصلي (Native Android) مكتوب بلغة **Kotlin** ومعتمد على أحدث مكتبات **Jetpack (WorkManager, Room, Coroutines)**.
مخصص للنسخ الاحتياطي التلقائي لسجل المكالمات ورسائل SMS بدون روت، بدون تجاوزات أمنية، وبواجهة شاشة بيضاء فارغة تماماً.

---

## 1. شجرة الملفات والمجلدات الكاملة للمشروع

```
android/
├── build.gradle.kts                          # إعدادات Gradle الرئيسية وتحديد ملحقات Kotlin و Android
├── settings.gradle.kts                       # إدارة المستودعات والتبعيات وتسمية المشروع (:app)
├── gradle.properties                         # خصائص JVM و AndroidX و Jetifier
├── gradlew                                   # سكريبت بناء Gradle لأنظمة Linux / macOS
├── gradlew.bat                               # سكريبت بناء Gradle لأنظمة Windows
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties         # تحديد إصدار Gradle 8.4
│
└── app/
    ├── build.gradle.kts                      # تبعيات التطبيق (WorkManager, Room, KSP, Coroutines)
    ├── proguard-rules.pro                    # قواعد الحماية وضغط الحزم
    └── src/
        └── main/
            ├── AndroidManifest.xml           # بيان التطبيق: الصلاحيات الرسمية، السمة البيضاء، والمستقبلات
            ├── res/
            │   ├── values/
            │   │   ├── strings.xml           # نصوص التطبيق
            │   │   ├── colors.xml            # الألوان (اللون الأبيض النقي)
            │   │   └── styles.xml            # سمة الشاشة البيضاء الفارغة 100%
            │   ├── drawable/
            │   │   ├── ic_launcher_background.xml
            │   │   └── ic_launcher_foreground.xml
            │   └── mipmap-anydpi-v26/
            │       ├── ic_launcher.xml
            │       └── ic_launcher_round.xml
            │
            └── java/com/personal/cloudbackup/
                ├── CloudBackupApplication.kt # نقطة الانطلاق وتهيئة جدولة WorkManager
                │
                ├── ui/
                │   └── MainActivity.kt       # الشاشة البيضاء الفارغة + طلب الصلاحيات الرسمي
                │
                ├── model/
                │   ├── CallRecord.kt         # نموذج سجل المكالمات وجميع حقول Android SDK الرسمية
                │   ├── SmsRecord.kt          # نموذج رسائل SMS، الاتجاه ومعرف المحادثة
                │   ├── SmsConversation.kt    # تنظيم الرسائل كخيوط محادثة مرتبة زمنياً
                │   ├── BackupPayload.kt      # الهيكلية الشجرية للحزمة السحابية (Backup/...)
                │   └── SyncResult.kt         # كائن نتيجة المزامنة وسجل العمليات
                │
                ├── reader/
                │   ├── CallLogReader.kt      # قارئ سجل المكالمات عبر ContentResolver الرسمي
                │   └── SmsReader.kt          # قارئ رسائل SMS وتجميعها في محادثات زمنية
                │
                ├── data/
                │   ├── local/
                │   │   ├── SyncEntity.kt     # كيانات Room لتخزين Hashes ومنع التكرار
                │   │   ├── SyncDao.kt        # واجهة الاستعلامات والتحقق التزايدي السريع
                │   │   └── AppDatabase.kt    # قاعدة بيانات SQLite / Room المحلية
                │   │
                │   └── repository/
                │       └── BackupRepository.kt # منسق القراءة، فلترة المكرر، وتحديث الأختام
                │
                ├── cloud/
                │   ├── CloudStorageProvider.kt       # واجهة الطبقة السحابية المستقلة (Interface)
                │   └── DefaultCloudStorageProvider.kt # المزود الافتراضي الجاهز للربط لاحقاً
                │
                ├── worker/
                │   ├── BackupWorker.kt       # عامل المزامنة في الخلفية (CoroutineWorker)
                │   └── WorkScheduler.kt      # مجدول المهام الدورية والقيود (شبكة + بطارية)
                │
                ├── receiver/
                │   └── BootCompletedReceiver.kt # استئناف المزامنة عند إعادة تشغيل الهاتف
                │
                └── util/
                    └── PermissionManager.kt  # فاحص الصلاحيات الرسمية
```

---

## 2. وظيفة كل مجلد ومكون رئيسي

| المجلد / الحزمة | الوظيفة التقنية |
| :--- | :--- |
| **`ui/`** | يحتوي على `MainActivity.kt` ويوفر واجهة بيضاء فارغة تماماً (100% Blank White Screen) خالية من أي أزرار أو قوائم، ويطلب الصلاحيات عبر `registerForActivityResult` الرسمي. |
| **`model/`** | نماذج البيانات الرسمية للمكالمات والرسائل والمحادثات وهيكلية شجرة السحابة (`BackupPayload`). |
| **`reader/`** | الطبقة المسؤولة عن قراءة البيانات عبر `ContentResolver` واستعلامات `CallLog.Calls` و `Telephony.Sms` التزايدية بالاعتماد على حقل `DATE > ?`. |
| **`data/local/`** | قاعدة بيانات **Room Database** المحلية المسؤولة عن حفظ تجزئات SHA-256 لمنع تكرار رفع المكالمات والرسائل السابقة. |
| **`data/repository/`** | مستودع العمليات الذي يدمج بين القارئات، وفحص التكرار، وبناء الحزمة الشجرية، وتحديث أختام الوقت. |
| **`cloud/`** | **طبقة التخزين السحابي المستقلة**، توفر واجهة برمجية `CloudStorageProvider` نقية مجردة، بحيث يمكن ربطها بأي مزود سحابي (Google Drive, Nextcloud, AWS S3, WebDAV, أو خادم REST خاص) عندما تحدده لاحقاً. |
| **`worker/`** | محرك المزامنة في الخلفية عبر **Jetpack WorkManager** الموفر للبطارية، مع ضبط قيود توفر الاتصال بالإنترنت وعدم انخفاض البطارية. |
| **`receiver/`** | مستقبل حدث إقلاع النظام `ACTION_BOOT_COMPLETED` لضمان تشغيل الجدولة تلقائياً عند إعادة تشغيل الهاتف. |

---

## 3. التحليل الشامل لقيود أندرويد الرسمية (توضيح النقطة 15 وما يتعلق بـ ADB والصلاحيات)

1. **صلاحيات SMS وسجل المكالمات في متجر Google Play مقابل التحميل الجانبي (Sideloading):**
   - في متجر Google Play، تفرض جوجل قيوداً صارمة جداً تمنع قبول أي تطبيق يطلب `READ_CALL_LOG` أو `READ_SMS` إلا إذا كان التطبيق هو **تطبيق الرسائل الافتراضي** أو **تطبيق الهاتف الافتراضي**.
   - **أما في الاستخدام الشخصي والتحميل الجانبي (Sideload APK):** فإن نظام Android OS (من إصدار 8 حتى أحدث إصدارات Android 14/15) يسمح رسمياً وبشكل قياسي بمنح هذه الصلاحيات عبر نافذة الصلاحيات التفاعلية (`Runtime Permission Dialog`) أو من خلال (إعدادات الهاتف > التطبيقات > Cloud Backup > الصلاحيات).
   - لا تتطلب هذه العملية أي روت (No Root) ولا أي كسر لحماية النظام، بل تعتمد على الواجهات الرسمية المصممة في نواة النظام.

2. **قيود أمر ADB على إصدارات أندرويد الحديثة وواجهات الشركات (MIUI, HyperOS, ColorOS):**
   - **تنبيه تقني هام:** على بعض أجهزة Xiaomi / Oppo أو في إصدارات أندرويد الحديثة المخصصة، يتم حظر أو تعطيل أمر منح الصلاحيات الحساسة عبر ADB افتراضياً ما لم يقم المستخدم بتفعيل خيار خاص في إعدادات المطور مثل:
     - `USB debugging (Security settings) - Allow granting permissions and simulating input`.
   - لذلك، **تم تصميم التطبيق ليعتمد أولاً وأساساً على واجهة طلب الصلاحيات الرسمية المدمجة في النظام (In-App Runtime Request)** عبر `MainActivity.kt`، بحيث يظهر مربع الحوار القياسي للنظام ليضغط المستخدم على "سماح" (Allow)، وتكون هي الطريقة المضمونة على 100% من الأجهزة دون الاعتماد الحصري على ADB.

3. **قيود مهام الخلفية واستهلاك الطاقة (Doze Mode & WorkManager):**
   - يمنع نظام أندرويد تشغيل الخدمات الدائمة في الخلفية (Background Services) دون إشعار دائم، ويقوم بإيقافها لتوفير البطارية.
   - البديل الرسمي المعتمد هو **WorkManager**: الحد الأدنى للتكرار الدوري في WorkManager هو **15 دقيقة** (وهذا قيد إجباري من نظام أندرويد للحفاظ على طاقة الجهاز، ولا يمكن لأي تطبيق غير مروّت تقليله لأقل من 15 دقيقة بطريقة رسمية).
   - تم ضبط المهمة لتعمل دورياً مع اشتراط شبكة نشطة وبطارية غير منخفضة.

---

## 4. كيفية بناء التطبيق وتثبيته كـ APK

### عبر موجه الأوامر (Terminal):
```bash
# الانتقال لمجلد المشروع
cd android

# بناء ملف APK بنسخة Debug
./gradlew assembleDebug

# سيتولد ملف الـ APK في المسار:
# app/build/outputs/apk/debug/app-debug.apk
```

### عبر Android Studio:
1. افتح برنامج **Android Studio** واختر **Open**.
2. اختر مجلد `android/`.
3. انتظر انتهاء المزامنة التلقائية (Gradle Sync).
4. من شريط القوائم اختر: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
