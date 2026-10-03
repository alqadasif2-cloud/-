import express from 'express';
import http from 'http';
import app from './index';

async function testAllRestApis() {
  console.log('===============================================================');
  console.log('🧪 بدء اختبار جميع مسارات الـ REST API في خادم Backend');
  console.log('===============================================================');

  // تشغيل خادم محلي على منفذ اختبار عشوائي متاح
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(8089, resolve));
  const baseUrl = 'http://localhost:8089';

  const results: { test: string; status: 'PASSED' | 'FAILED'; details?: string }[] = [];

  try {
    // 1. اختبار GET /api/health
    console.log('\n[1/6] فحص GET /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    console.log('   استجابة /api/health:', JSON.stringify(healthJson, null, 2));
    if (healthJson.backend === 'online' && healthJson.projectId) {
      results.push({ test: 'GET /api/health', status: 'PASSED', details: `backend: online, firestore: ${healthJson.firestore}, database: ${healthJson.databaseId}` });
    } else {
      results.push({ test: 'GET /api/health', status: 'FAILED', details: 'استجابة غير مطابقة' });
    }

    // 2. اختبار فحص الرفض للطلبات غير المصرحة (Unauthorized 401)
    console.log('\n[2/6] فحص حماية المسارات المحمية بـ JWT...');
    const unauthRes = await fetch(`${baseUrl}/api/upload/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (unauthRes.status === 401) {
      results.push({ test: 'JWT Protection (401 Unauthorized)', status: 'PASSED', details: 'تم رفض الطلب غير المصرح بنجاح' });
      console.log('   ✅ تم التحقق من حماية المسار ورفض الطلب دون توكن.');
    } else {
      results.push({ test: 'JWT Protection (401 Unauthorized)', status: 'FAILED', details: `Status: ${unauthRes.status}` });
    }

    // 3. اختبار جلب آخر نسخة دون توكن
    console.log('\n[3/6] فحص GET /api/backup/latest دون توكن...');
    const unauthLatest = await fetch(`${baseUrl}/api/backup/latest`);
    if (unauthLatest.status === 401) {
      results.push({ test: 'GET /api/backup/latest Security', status: 'PASSED', details: 'المسار محمي بنجاح بـ JWT' });
      console.log('   ✅ مسار جلب النسخة محمي ومغلق أمام غير المصرح لهم.');
    } else {
      results.push({ test: 'GET /api/backup/latest Security', status: 'FAILED' });
    }

    // 4. اختبار تصدير النسخة من Firestore دون توكن
    console.log('\n[4/6] فحص GET /api/backup/export دون توكن...');
    const unauthExport = await fetch(`${baseUrl}/api/backup/export`);
    if (unauthExport.status === 401) {
      results.push({ test: 'GET /api/backup/export Security', status: 'PASSED', details: 'المسار محمي بنجاح بـ JWT' });
      console.log('   ✅ مسار تصدير بيانات Firestore محمي ومغلق أمام غير المصرح لهم.');
    } else {
      results.push({ test: 'GET /api/backup/export Security', status: 'FAILED' });
    }

    // 5. اختبار التحقق من البيانات المرسلة إلى /api/login بدون بيانات
    console.log('\n[5/6] فحص التحقق من صحة المدخلات في /api/login...');
    const emptyLoginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (emptyLoginRes.status === 400) {
      results.push({ test: 'Input Validation /api/login', status: 'PASSED', details: 'تم رفض البيانات الفارغة بنجاح' });
      console.log('   ✅ تم رفض طلب تسجيل الدخول الفارغ.');
    } else {
      results.push({ test: 'Input Validation /api/login', status: 'FAILED' });
    }

    // 6. اختبار التحقق من صحة المدخلات في /api/register بدون بيانات
    console.log('\n[6/6] فحص التحقق من صحة المدخلات في /api/register...');
    const emptyRegRes = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (emptyRegRes.status === 400) {
      results.push({ test: 'Input Validation /api/register', status: 'PASSED', details: 'تم رفض البيانات الفارغة بنجاح' });
      console.log('   ✅ تم رفض طلب التسجيل الفارغ.');
    } else {
      results.push({ test: 'Input Validation /api/register', status: 'FAILED' });
    }

  } finally {
    server.close();
  }

  console.log('\n===============================================================');
  console.log('📊 ملخص نتائج اختبار الـ REST APIs:');
  results.forEach(r => {
    console.log(`   ${r.status === 'PASSED' ? '✅' : '❌'} ${r.test}: ${r.details || ''}`);
  });
  console.log('===============================================================');
}

testAllRestApis()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('REST API test error:', err);
    process.exit(1);
  });
