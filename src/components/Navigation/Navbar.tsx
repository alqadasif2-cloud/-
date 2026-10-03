import React, { useState, useEffect } from 'react';
import {
  Database,
  Smartphone,
  Code2,
  ShieldCheck,
  Server,
  Download,
  RotateCcw,
  Sparkles,
  FileJson,
  LogIn,
  LogOut,
  CheckCircle2,
  Lock,
  User as UserIcon,
  X
} from 'lucide-react';
import {
  getCurrentAppUser,
  loginOrRegisterAppUser,
  logoutAppUser,
  testFirestoreConnection,
  AppAccount
} from '../../services/firebase';

export type ActiveTab = 'CLOUD_VIEWER' | 'ANDROID_SIMULATOR' | 'ANDROID_CODEBASE' | 'POLICY_GUIDE' | 'API_DOCS';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenRestore: () => void;
  onDownloadZip: () => void;
  onExportJson: () => void;
  totalSyncedItems: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRestore,
  onDownloadZip,
  onExportJson,
  totalSyncedItems
}) => {
  const [appUser, setAppUser] = useState<AppAccount | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<string | null>(null);

  useEffect(() => {
    const current = getCurrentAppUser();
    setAppUser(current);
    if (current) {
      testFirestoreConnection(current.username).then(res => {
        setFirestoreStatus(res.success ? 'قاعدة البيانات بالخلفية نشطة' : res.message);
      });
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    const res = await loginOrRegisterAppUser(usernameInput, passwordInput);
    setLoading(false);

    if (res.success && res.username) {
      setAppUser({ username: res.username, isLoggedIn: true });
      setFirestoreStatus('قاعدة البيانات بالخلفية نشطة');
      setShowLoginModal(false);
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setAuthError(res.message);
    }
  };

  const handleLogout = () => {
    logoutAppUser();
    setAppUser(null);
    setFirestoreStatus(null);
  };
  const tabs = [
    {
      id: 'CLOUD_VIEWER' as ActiveTab,
      label: 'مستعرض السحابة المباشر',
      icon: Database,
      badge: `${totalSyncedItems} عنصر`
    },
    {
      id: 'ANDROID_SIMULATOR' as ActiveTab,
      label: 'محاكي الأندرويد والشاشة البيضاء',
      icon: Smartphone
    },
    {
      id: 'ANDROID_CODEBASE' as ActiveTab,
      label: 'مشروع Kotlin و Android Studio',
      icon: Code2
    },
    {
      id: 'POLICY_GUIDE' as ActiveTab,
      label: 'السياسات والصلاحيات (نقطة 15)',
      icon: ShieldCheck
    },
    {
      id: 'API_DOCS' as ActiveTab,
      label: 'توثيق REST API السحابي',
      icon: Server
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">
                  سحابة النسخ الاحتياطي للأندرويد
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline-block">
                  AOSP Official APIs
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                مزامنة تلقائية لسجل المكالمات ورسائل SMS بدون تشفير حاجب مع شاشة بيضاء هادئة
              </p>
            </div>
          </div>

          {/* Quick Actions & App Account */}
          <div className="flex items-center gap-2">
            {/* App Custom Account Status (Firestore Background) */}
            {appUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-bold text-emerald-300 leading-tight flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-emerald-400" />
                    {appUser.username}
                  </span>
                  <span className="text-[9px] text-emerald-400/80 font-mono">
                    {firestoreStatus || 'Firestore بالخلفية: نشط'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400 transition-colors"
                  title="تسجيل الخروج من الحساب"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 rounded-xl text-xs font-bold transition-all"
                title="تسجيل الدخول بحساب التطبيق (اسم المستخدم وكلمة المرور)"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>حساب التطبيق</span>
              </button>
            )}

            <button
              onClick={onOpenRestore}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/80 rounded-xl text-xs font-semibold transition-colors"
              title="معاينة استعادة البيانات إلى الهاتف"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">استعادة للهاتف</span>
            </button>

            <button
              onClick={onExportJson}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/80 rounded-xl text-xs font-semibold transition-colors"
              title="تصدير السحابة كملف JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">تصدير JSON</span>
            </button>

            <button
              onClick={onDownloadZip}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل المشروع (.zip)</span>
            </button>
          </div>
        </div>

        {/* Custom App Login Modal (No Google / No Firebase UI) */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-right">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-100 p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    نظام تسجيل الدخول الخاص بالتطبيق
                  </h3>
                  <p className="text-xs text-slate-400">
                    بدون حساب Google وبدون شاشات Firebase - قاعدة البيانات تعمل بالخلفية
                  </p>
                </div>
              </div>

              {authError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {authError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    اسم المستخدم (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="مثال: personal_backup_user"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    كلمة المرور (Password)
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                  يتم حفظ اسم المستخدم وكلمة المرور المشفرة لربط مساحة النسخ الاحتياطي في Cloud Firestore بالخلفية تلقائياً دون أي تدخل مستقبلي.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {loading ? 'جارِ التحقق والربط...' : 'دخول وتفعيل المزامنة بالخلفية'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-900">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
