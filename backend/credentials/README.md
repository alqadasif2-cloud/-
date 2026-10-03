# مجلد بيانات اعتماد الخدمة (Service Account Credentials)

ضع ملف المفتاح الخاص الرسمي هنا باسم:
`serviceAccountKey.json`

### كيفية الحصول على الملف من Firebase Console:
1. افتح مشروعك في **[Firebase Console](https://console.firebase.google.com/)**.
2. اضغط على رمز الإعدادات (ترس الإعدادات) بجوار "نظرة عامة على المشروع" ثم اختر **إعدادات المشروع (Project Settings)**.
3. انتقل إلى تبويب **حسابات الخدمة (Service accounts)**.
4. اضغط على الزر الأزرق **توليد مفتاح خاص جديد (Generate new private key)**.
5. سيتم تنزيل ملف بتنسيق `.json`.
6. قم بإعادة تسمية الملف المنزّل إلى `serviceAccountKey.json` وضعه داخل هذا المجلد (`backend/credentials/`).

> **تنبيه أمني هام:**
> لا تقم برفع هذا الملف إلى GitHub أو أي مستودع عام؛ هذا الملف يحتوي على صلاحيات الإدارة الكاملة لـ Firebase Admin SDK في خادمك.
