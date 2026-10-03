import { db, projectId, databaseId, credentialInfo } from './firebase';

/**
 * سكربت الاختبار الحي الفعلي للربط مع Cloud Firestore:
 * 1. محاولة إنشاء مستند تجريبي في Cloud Firestore
 * 2. قراءة المستند والتحقق من تطابق محتواه
 * 3. استعلام تجريبي على المجموعة الفرعية (Query Test)
 * 4. حذف المستند التجريبي لتنظيف السحابة
 * 5. طباعة تقرير مفصل بنتيجة فحص قاعدة البيانات السحابية (خطة Spark المجانية)
 */
async function runRealEndToEndFirebaseTest() {
  console.log('===============================================================');
  console.log('🧪 بدء اختبار الاتصال الحقيقي الفعلي بـ Cloud Firestore (خطة Spark المجانية)');
  console.log(`📌 Project ID: ${projectId}`);
  console.log(`🗄️ Database ID: ${databaseId}`);
  console.log(`🔑 Credential Source: ${credentialInfo.source} (Service Account: ${credentialInfo.isServiceAccount})`);
  console.log('===============================================================');

  const report: {
    firestoreWrite: boolean;
    firestoreRead: boolean;
    firestoreQuery: boolean;
    firestoreDelete: boolean;
    errors: string[];
  } = {
    firestoreWrite: false,
    firestoreRead: false,
    firestoreQuery: false,
    firestoreDelete: false,
    errors: []
  };

  const testId = `test_${Date.now()}`;

  // -------------------------------------------------------------
  // اختبار: Cloud Firestore (Write -> Read -> Query -> Delete)
  // -------------------------------------------------------------
  console.log('\n📝 جاري اختبار Cloud Firestore...');
  const testDocRef = db.collection('_integration_tests').doc(testId);
  const samplePayload = {
    testId,
    purpose: 'Pure Cloud Firestore Connectivity Verification (Spark Free Plan)',
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    status: 'ACTIVE_TEST'
  };

  try {
    // 1. كتابة مستند
    await testDocRef.set(samplePayload);
    report.firestoreWrite = true;
    console.log('   ✅ 1. إنشاء مستند تجريبي في Firestore: نجح');

    // 2. قراءة المستند
    const snapshot = await testDocRef.get();
    if (snapshot.exists && snapshot.data()?.testId === testId) {
      report.firestoreRead = true;
      console.log('   ✅ 2. قراءة المستند والتحقق من التطابق: نجح');
    } else {
      throw new Error('فشلت قراءة المستند التجريبي أو البيانات غير متطابقة');
    }

    // 3. استعلام وتصفية
    const querySnapshot = await db.collection('_integration_tests')
      .where('testId', '==', testId)
      .limit(1)
      .get();

    if (!querySnapshot.empty && querySnapshot.docs[0].data()?.testId === testId) {
      report.firestoreQuery = true;
      console.log('   ✅ 3. تنفيذ استعلام وتصفية في Firestore: نجح');
    } else {
      throw new Error('فشل الاستعلام على المستند التجريبي');
    }

    // 4. حذف المستند
    await testDocRef.delete();
    report.firestoreDelete = true;
    console.log('   ✅ 4. حذف المستند التجريبي لتنظيف قاعدة البيانات: نجح');
  } catch (fsError: any) {
    console.error('   ❌ فشل في اختبار Firestore:', fsError.message);
    report.errors.push(`Firestore: ${fsError.message}`);
  }

  console.log('\n===============================================================');
  console.log('📊 ملخص نتائج اختبار Cloud Firestore:');
  console.log(`   - Firestore Write:  ${report.firestoreWrite ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   - Firestore Read:   ${report.firestoreRead ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   - Firestore Query:  ${report.firestoreQuery ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   - Firestore Delete: ${report.firestoreDelete ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (report.errors.length > 0) {
    console.log('\n⚠️ أسباب الفشل الحقيقية القادمة من Firebase Admin SDK:');
    report.errors.forEach(e => console.log(`   • ${e}`));
    console.log('\n💡 الحل: ضع ملف serviceAccountKey.json الرسمي من Firebase Console داخل backend/credentials/serviceAccountKey.json');
  } else {
    console.log('\n🎉 جميع العمليات نجحت بنسبة 100%! الاتصال مع Cloud Firestore مكتمل وجاهز للإنتاج.');
  }
  console.log('===============================================================');

  return report;
}

runRealEndToEndFirebaseTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
