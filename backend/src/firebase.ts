import { initializeApp, cert, applicationDefault, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * إعدادات مشروع Firebase
 */
function getFirebaseAppletConfig(): any {
  try {
    const configPath = path.resolve(process.cwd(), '../firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    const rootConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(rootConfigPath)) {
      return JSON.parse(fs.readFileSync(rootConfigPath, 'utf8'));
    }
  } catch (e) {}
  return null;
}

const appletConfig = getFirebaseAppletConfig();

export const projectId = process.env.FIREBASE_PROJECT_ID || appletConfig?.projectId || 'gen-lang-client-0469226875';
export const databaseId = process.env.FIREBASE_DATABASE_ID || appletConfig?.firestoreDatabaseId || 'ai-studio-androidpersonalc-7fbcb919-2591-476b-836e-da6ad9eb5e0b';

export interface CredentialResolution {
  credential: any;
  isServiceAccount: boolean;
  source: 'serviceAccountKey.json' | 'GOOGLE_APPLICATION_CREDENTIALS' | 'FIREBASE_SERVICE_ACCOUNT_JSON' | 'ApplicationDefaultCredentials';
  filePath?: string;
}

/**
 * فحص وتحديد مصدر بيانات اعتماد الخدمة (Service Account)
 */
export function resolveCredential(): CredentialResolution {
  // 1. فحص مجلد credentials/serviceAccountKey.json المباشر
  const directKeyPath = path.resolve(process.cwd(), 'credentials/serviceAccountKey.json');
  if (fs.existsSync(directKeyPath)) {
    try {
      const raw = fs.readFileSync(directKeyPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.type === 'service_account' && parsed.private_key) {
        return {
          credential: cert(parsed),
          isServiceAccount: true,
          source: 'serviceAccountKey.json',
          filePath: directKeyPath
        };
      }
    } catch (err: any) {
      console.warn(`[Firebase Admin] تعذر تحليل ملف ${directKeyPath}:`, err.message);
    }
  }

  // 2. فحص متغير البيئة GOOGLE_APPLICATION_CREDENTIALS
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    const resolvedPath = path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(resolvedPath)) {
      try {
        const raw = fs.readFileSync(resolvedPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.type === 'service_account' && parsed.private_key) {
          return {
            credential: cert(parsed),
            isServiceAccount: true,
            source: 'GOOGLE_APPLICATION_CREDENTIALS',
            filePath: resolvedPath
          };
        }
      } catch (err: any) {
        console.warn(`[Firebase Admin] تعذر تحليل ملف ${resolvedPath}:`, err.message);
      }
    }
  }

  // 3. فحص متغير بيئة يحتوي على JSON المفتاح مباشرة (مفيد في Cloud Run و Render و Docker)
  const envRawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (envRawJson) {
    try {
      const parsed = JSON.parse(envRawJson);
      if (parsed.type === 'service_account' && parsed.private_key) {
        return {
          credential: cert(parsed),
          isServiceAccount: true,
          source: 'FIREBASE_SERVICE_ACCOUNT_JSON'
        };
      }
    } catch (err: any) {
      console.warn('[Firebase Admin] تعذر تحليل FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  }

  // 4. الاعتماد الافتراضي للبيئة (Application Default Credentials - ADC)
  return {
    credential: applicationDefault(),
    isServiceAccount: false,
    source: 'ApplicationDefaultCredentials'
  };
}

export const credentialInfo = resolveCredential();

let app: App;

if (getApps().length === 0) {
  try {
    app = initializeApp({
      credential: credentialInfo.credential,
      projectId
    });
    console.log(`[Firebase Admin] تم تهيئة Firebase Admin SDK بنجاح.`);
    console.log(`[Firebase Admin] مصدر بيانات الاعتماد: ${credentialInfo.source} (Service Account: ${credentialInfo.isServiceAccount})`);
  } catch (error: any) {
    console.error('[Firebase Admin] خطأ أثناء التهيئة الأولية:', error.message);
    app = getApp();
  }
} else {
  app = getApp();
}

/**
 * كائن الاتصال الحقيقي بـ Cloud Firestore
 */
export const db: Firestore = (databaseId && databaseId !== '(default)') ? getFirestore(app, databaseId) : getFirestore(app);
export const adminFirestore = db;
export const isServiceAccountLoaded = credentialInfo.isServiceAccount;

/**
 * اختبار الاتصال الحقيقي الفعلي بـ Cloud Firestore
 * يقوم بعملية كتابة وقراءة وحذف لمستند تجريبي داخل Firestore
 */
export async function runRealHealthCheck(): Promise<{
  backend: 'online';
  firestore: 'connected' | string;
  projectId: string;
  databaseId: string;
  serviceAccount: boolean;
  credentialSource: string;
  details?: string;
}> {
  let firestoreResult = 'unknown';
  let failureDetails: string | undefined;

  // 1. اختبار Firestore الحقيقي (إنشاء مستند تجريبي وقراءته ثم حذفه)
  try {
    const healthDocRef = db.collection('_health_checks').doc('connectivity_test');
    const testData = {
      timestamp: Date.now(),
      initiatedBy: 'HealthCheckEndpoint',
      testStatus: 'OK'
    };
    await healthDocRef.set(testData);
    const snap = await healthDocRef.get();

    if (snap.exists && snap.data()?.testStatus === 'OK') {
      firestoreResult = 'connected';
      // تنظيف المستند التجريبي
      await healthDocRef.delete();
    } else {
      firestoreResult = 'error: لم يتم استرجاع المستند بعد كتابته';
    }
  } catch (fsErr: any) {
    firestoreResult = `error: ${fsErr.message || fsErr.code || String(fsErr)}`;
    failureDetails = fsErr.message;
  }

  return {
    backend: 'online',
    firestore: firestoreResult,
    projectId,
    databaseId,
    serviceAccount: credentialInfo.isServiceAccount,
    credentialSource: credentialInfo.source,
    details: failureDetails
  };
}
