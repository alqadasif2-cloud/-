#!/bin/bash
# ==============================================================================
# سكربت التشغيل التلقائي لخادم الـ Backend (Node.js + Firebase Admin SDK)
# ==============================================================================

set -e

echo "=================================================================="
echo "🚀 بدء تشغيل خادم النسخ الاحتياطي السحابي (Personal Cloud Backup)"
echo "=================================================================="

# 1. تثبيت الاعتماديات
echo "📦 [1/4] التحقق من تثبيت مكتبات Node.js..."
npm install

# 2. إعداد ملف متغيرات البيئة تلقائياً إذا لم يكن موجوداً
echo "⚙️  [2/4] فحص ملف متغيرات البيئة (.env)..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "   ✅ تم نسخ ملف .env.example إلى .env بنجاح."
  else
    echo "   ⚠️ تحذير: ملف .env.example غير موجود!"
  fi
else
  echo "   ✅ ملف .env موجود مسبقاً."
fi

# 3. بناء وترجمة المشروع عبر TypeScript
echo "🔨 [3/4] بناء وترجمة الكود المصدري (TypeScript Build)..."
npm run build
echo "   ✅ اكتمل البناء بنجاح في مجلد dist/."

# 4. فحص وجود ملف Service Account
echo "🔑 [4/4] فحص ملف بيانات الاعتماد (serviceAccountKey.json)..."
if [ -f credentials/serviceAccountKey.json ]; then
  echo "   ✅ تم العثور على ملف serviceAccountKey.json؛ الاتصال بـ Firebase سيكون مفعلاً بالكامل."
else
  echo "   ℹ️  تنبيه: لم يتم العثور على credentials/serviceAccountKey.json بعد."
  echo "       يمكنك تنزيله من Firebase Console وضعه في backend/credentials/serviceAccountKey.json."
  echo "       الخادم سيعمل وسيعرض إرشادات الإعداد عند طلب /api/health."
fi

echo "=================================================================="
echo "🌟 جاري بدء تشغيل الخادم الآن..."
echo "📡 سيصبح الخادم متاحاً على المنفذ المحدد في .env (الافتراضي: 3000)"
echo "🔗 يمكنك فحص الصحة عبر: GET http://localhost:3000/api/health"
echo "=================================================================="

# بدء تشغيل الخادم
npm run dev
