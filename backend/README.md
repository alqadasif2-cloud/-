# Personal Cloud Backup - Backend Server (Node.js + Express + Firebase Admin SDK)

خادم خلفي آمن ومستقل لإدارة وتخزين النسخ الاحتياطية لتطبيق الأندرويد، يعتمد على **Firebase Admin SDK (Service Account)** بدون أي اتصال مباشر بين تطبيق الأندرويد وFirebase وبدون استخدام Firebase Authentication للمستخدمين.

---

## المعمارية الفنية (Architecture)

```text
Android App (Pure White Screen)
      │
      │ HTTPS REST API + JWT Bearer
      ▼
Backend (Node.js + Express + TypeScript)
      │
      │ Firebase Admin SDK (Privileged Service Account)
      ▼
Google Cloud Firebase
 ├── Cloud Firestore (بيانات منظمة ومنع التكرار بـ SHA-256)
 └── Firebase Storage (ملفات JSON المقروءة للنسخ الكاملة)
```

---

## الميزات الأمنية والتشغيلية

1. **انعدام الاتصال المباشر بين الهاتف وFirebase:**
   - تطبيق الأندرويد يتصل حصراً بالـ Backend عبر بروتوكول HTTPS المشفر.
   - لا يحتوي تطبيق الأندرويد على أي ملف `google-services.json` أو مكتبات Firebase Client SDK.
2. **نظام حسابات مستقل خاص بالتطبيق:**
   - تسجيل دخول بـ **Username** و **Password**.
   - تشفير كلمات المرور باستخدام **bcrypt** مع Salt Rounds قبل حفظها في مجموعة `app_accounts`.
   - إصدار رمز وصول مشفر **JWT** يستخدمه التطبيق مع كل طلب.
3. **قواعد أمان مغلقة بالكامل أمام الجمهور:**
   - قواعد `firestore.rules` و `storage.rules` مضبوطة على `allow read, write: if false;` مما يمنع أي وصول خارجي غير مصرح به.
   - الوصول يتم حصراً عبر خادم الـ Backend باستخدام صلاحيات **Service Account**.
4. **منع التكرار الذكي (Deduplication):**
   - استخدام بصمة **SHA-256** كمعرّف لكل مستند مكالمة أو رسالة في Cloud Firestore.

---

## مسارات الـ REST API

| الطريقة | المسار | الوصف | التوثيق (Auth) |
|---|---|---|---|
| `POST` | `/api/register` | إنشاء حساب جديد للمستخدم وتشفير كلمة المرور بـ bcrypt | عام |
| `POST` | `/api/login` | التحقق من المستخدم وإصدار رمز JWT | عام |
| `GET` | `/api/health` | التحقق من عمل الخادم وصحته | عام |
| `POST` | `/api/upload/backup` | رفع حزمة النسخ الكاملة (المكالمات، الرسائل، البيانات الوصفية) | `Bearer <JWT>` |
| `POST` | `/api/upload/calllogs` | رفع سجلات المكالمات فقط | `Bearer <JWT>` |
| `POST` | `/api/upload/sms` | رفع رسائل SMS فقط | `Bearer <JWT>` |
| `GET` | `/api/backup/latest` | جلب أحدث ختم وقت للمزامنة | `Bearer <JWT>` |
| `GET` | `/api/backup/history` | جلب سجل جلسات النسخ الاحتياطي | `Bearer <JWT>` |

---

## خطوات التشغيل محلياً

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

---

## خطوات النشر والتشغيل (Deployment)

### 1. النشر على Google Cloud Run (موصى به)
```bash
gcloud builds submit --tag gcr.io/spry-iterator-486704-d0/backup-backend
gcloud run deploy backup-backend \
  --image gcr.io/spry-iterator-486704-d0/backup-backend \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated
```

### 2. النشر على أي VPS (عبر Docker)
```bash
docker build -t backup-backend .
docker run -d -p 8080:8080 --env-file .env backup-backend
```

### 3. النشر على Render أو Railway
- اربط مستودع GitHub الخاص بك.
- حدد المجلد الفرعي `backend/`.
- أضف متغيرات البيئة من ملف `.env.example`.
