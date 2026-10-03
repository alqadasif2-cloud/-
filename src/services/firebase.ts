import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface AppAccount {
  username: string;
  isLoggedIn: boolean;
}

const STORAGE_KEY = 'personal_cloud_app_username';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getCurrentAppUser(): AppAccount | null {
  const username = localStorage.getItem(STORAGE_KEY);
  if (!username) return null;
  return { username, isLoggedIn: true };
}

export async function loginOrRegisterAppUser(username: string, password: string): Promise<{ success: boolean; message: string; username?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return { success: false, message: 'اسم المستخدم يجب ألا يقل عن 3 أحرف' };
  }
  if (password.length < 4) {
    return { success: false, message: 'كلمة المرور يجب ألا تقل عن 4 خانات' };
  }

  try {
    // الاتصال بالـ Backend REST API الرسمي
    const loginRes = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password, deviceId: 'WEB_DASHBOARD' })
    });

    const loginData = await loginRes.json().catch(() => null);

    if (loginRes.ok && loginData?.success) {
      localStorage.setItem(STORAGE_KEY, cleanUsername);
      if (loginData.token) {
        localStorage.setItem('personal_cloud_app_jwt', loginData.token);
      }
      return { success: true, message: 'تم تسجيل الدخول بنجاح عبر خادم الـ Backend', username: cleanUsername };
    }

    if (loginRes.status === 404 || loginRes.status === 400) {
      // محاولة تسجيل حساب جديد تلقائياً
      const regRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password, deviceId: 'WEB_DASHBOARD' })
      });
      const regData = await regRes.json().catch(() => null);

      if (regRes.ok && regData?.success) {
        localStorage.setItem(STORAGE_KEY, cleanUsername);
        if (regData.token) {
          localStorage.setItem('personal_cloud_app_jwt', regData.token);
        }
        return { success: true, message: 'تم إنشاء الحساب وتسجيل الدخول بنجاح عبر خادم الـ Backend', username: cleanUsername };
      }

      return { success: false, message: regData?.error || 'تعذر إنشاء الحساب' };
    }

    return { success: false, message: loginData?.error || `فشل تسجيل الدخول (رمز ${loginRes.status})` };
  } catch (error: any) {
    return { success: false, message: error?.message || 'حدث خطأ في الاتصال بخادم الـ Backend' };
  }
}

export function logoutAppUser(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('personal_cloud_app_jwt');
}

export async function testFirestoreConnection(username: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json().catch(() => null);
    if (!data) {
      return { success: false, message: 'تعذر تحليل استجابة خادم الـ Backend' };
    }
    if (data.firestore === 'connected') {
      return { success: true, message: 'Cloud Firestore متصل بنجاح عبر خادم الـ Backend' };
    }
    return {
      success: false,
      message: data.message || data.error || 'بانتظار تفعيل خدمة Firestore أو تزويد serviceAccountKey.json'
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'خطأ في الاتصال بخادم الـ Backend' };
  }
}
