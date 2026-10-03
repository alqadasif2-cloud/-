import React, { useState, useEffect } from 'react';
import { CloudStorageService } from '../../services/cloudStorage';
import { CallLogRecord, SmsRecord } from '../../types/backup';
import { generateRecordHash } from '../../data/mockInitialData';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Play,
  RotateCw,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Power,
  RefreshCw,
  Sparkles,
  Layers,
  Phone,
  MessageSquare
} from 'lucide-react';

interface AndroidPhoneSimulatorProps {
  onDataChanged?: () => void;
}

export const AndroidPhoneSimulator: React.FC<AndroidPhoneSimulatorProps> = ({ onDataChanged }) => {
  const cloudService = CloudStorageService.getInstance();

  // Simulated Device States
  const [deviceScreenState, setDeviceScreenState] = useState<'APP_WHITE_SCREEN' | 'HOME_SCREEN' | 'PERMISSION_PROMPT'>('APP_WHITE_SCREEN');
  const [permissionsGranted, setPermissionsGranted] = useState(true);
  const [networkMode, setNetworkMode] = useState<'WIFI' | 'CELLULAR' | 'NONE'>('WIFI');
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging, setIsCharging] = useState(true);
  const [wifiOnlySetting, setWifiOnlySetting] = useState(false);

  // Phone Local Pending Queue (items on phone that haven't synced yet)
  const [pendingCalls, setPendingCalls] = useState<CallLogRecord[]>([]);
  const [pendingSms, setPendingSms] = useState<SmsRecord[]>([]);

  // Simulation Form Inputs
  const [newCallNumber, setNewCallNumber] = useState('+966550011223');
  const [newCallName, setNewCallName] = useState('سلمان الغامدي');
  const [newCallType, setNewCallType] = useState<'INCOMING' | 'OUTGOING' | 'MISSED'>('INCOMING');
  const [newCallDuration, setNewCallDuration] = useState('95');

  const [newSmsSender, setNewSmsSender] = useState('+966551122334');
  const [newSmsName, setNewSmsName] = useState('فهد (أخي)');
  const [newSmsBody, setNewSmsBody] = useState('أهلاً يا بو محمد، هل وصلت إلى المنزل؟');

  // WorkManager log
  const [workerLogs, setWorkerLogs] = useState<string[]>([
    'تم تسجيل WorkManager بمهمة دورية: PeriodicWorkRequest (كل ساعة)',
    'قيود المهمة: NetworkType.CONNECTED + BatteryNotLow',
    'الواجهة: شاشة بيضاء فارغة بنسبة 100% مطابقة لطلبك.'
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setWorkerLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 15));
  };

  // Add mock Call to device
  const handleSimulateNewCall = () => {
    const timestamp = Date.now();
    const duration = parseInt(newCallDuration) || 0;
    const callId = (1050 + Math.floor(Math.random() * 900)).toString();

    const newCall: CallLogRecord = {
      id: callId,
      phoneNumber: newCallNumber,
      contactName: newCallName || null,
      callType: newCallType,
      rawType: newCallType === 'INCOMING' ? 1 : newCallType === 'OUTGOING' ? 2 : 3,
      timestamp,
      dateFormatted: new Date(timestamp).toISOString().split('T')[0],
      timeFormatted: new Date(timestamp).toTimeString().split(' ')[0].substring(0, 5),
      durationSeconds: duration,
      durationFormatted: duration === 0 ? '0 ثانية (لم يُرد)' : `${Math.floor(duration / 60)} د ${duration % 60} ث`,
      geocodedLocation: 'الرياض، المملكة العربية السعودية',
      syncedAt: 0,
      hash: generateRecordHash('CALL', callId, timestamp)
    };

    setPendingCalls(prev => [newCall, ...prev]);
    addLog(`📞 تم تسجيل مكالمة جديدة على الهاتف من ${newCallName || newCallNumber} (ID: ${callId})`);
  };

  // Add mock SMS to device
  const handleSimulateNewSms = () => {
    const timestamp = Date.now();
    const smsId = (8150 + Math.floor(Math.random() * 900)).toString();
    const threadId = '102'; // Fahad thread or custom

    const newMsg: SmsRecord = {
      id: smsId,
      threadId,
      address: newSmsSender,
      contactName: newSmsName || null,
      body: newSmsBody,
      timestamp,
      dateFormatted: new Date(timestamp).toISOString().split('T')[0],
      timeFormatted: new Date(timestamp).toTimeString().split(' ')[0].substring(0, 5),
      direction: 'INBOX',
      rawType: 1,
      read: true,
      syncedAt: 0,
      hash: generateRecordHash('SMS', smsId, timestamp)
    };

    setPendingSms(prev => [newMsg, ...prev]);
    addLog(`✉️ تم استلام رسالة SMS جديدة على الهاتف: "${newSmsBody.substring(0, 25)}..."`);
  };

  // Trigger Background WorkManager Sync
  const handleTriggerWorkManager = () => {
    if (!permissionsGranted) {
      addLog('❌ فشلت المزامنة: لم يتم منح صلاحيات READ_CALL_LOG و READ_SMS بعد.');
      return;
    }

    if (networkMode === 'NONE') {
      addLog('⏸️ WorkManager معلق: انتظار اتصال بالإنترنت (NetworkConstraint not met).');
      return;
    }

    if (wifiOnlySetting && networkMode === 'CELLULAR') {
      addLog('⏸️ WorkManager معلق: مفعل خيار Wi-Fi فقط والشبكة الحالية بيانات خلوية.');
      return;
    }

    setIsSyncing(true);
    addLog('⚡ انطلاق BackupWorker في الخلفية عبر CoroutineWorker...');

    setTimeout(() => {
      // Execute incremental sync
      const result = cloudService.performIncrementalSync(
        pendingCalls,
        pendingSms,
        networkMode,
        batteryLevel
      );

      setIsSyncing(false);
      setPendingCalls([]);
      setPendingSms([]);

      if (result.totalNew === 0) {
        addLog('✅ فحص الذكاء التزايدي (Incremental Sync): لم توجد عناصر جديدة أو معدلة. لم يتم استهلاك بيانات إضافية!');
      } else {
        addLog(`✅ اكتملت المزامنة بنجاح! تم رفع: ${result.syncedCalls} مكالمة و ${result.syncedSms} رسالة SMS إلى سحابتك.`);
      }

      if (onDataChanged) {
        onDataChanged();
      }
    }, 1200);
  };

  // Simulate reboot
  const handleSimulateBootCompleted = () => {
    addLog('🔄 استقبال إشعار النظام: ACTION_BOOT_COMPLETED');
    addLog('🚀 تم تشغيل BootCompletedReceiver وإعادة جدولة مهام WorkManager تلقائياً!');
    setTimeout(() => {
      handleTriggerWorkManager();
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Left / Center Phone Mockup (xl:col-span-5) */}
      <div className="xl:col-span-5 flex flex-col items-center">
        <div className="text-center mb-3">
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/60">
            محاكي هاتف أندرويد الحقيقي
          </span>
          <p className="text-xs text-slate-400 mt-1">
            وفق طلبك: واجهة التطبيق بيضاء فارغة تماماً عند فتحها
          </p>
        </div>

        {/* Outer Phone Hardware Bezel */}
        <div className="relative w-[310px] sm:w-[340px] h-[670px] bg-slate-900 rounded-[50px] p-4 shadow-2xl border-[5px] border-slate-700/80 ring-1 ring-slate-800">
          {/* Top Speaker / Ear Piece & Camera */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
            <div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-800" />
          </div>

          {/* Side Buttons decoration */}
          <div className="absolute -left-[9px] top-28 w-[4px] h-12 bg-slate-600 rounded-l-md" />
          <div className="absolute -left-[9px] top-44 w-[4px] h-12 bg-slate-600 rounded-l-md" />
          <div className="absolute -right-[9px] top-32 w-[4px] h-16 bg-slate-600 rounded-r-md" />

          {/* Screen Container */}
          <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-white flex flex-col text-slate-900 select-none shadow-inner">
            {/* Android Status Bar */}
            <div className={`px-6 pt-3 pb-1 flex items-center justify-between text-xs z-20 ${
              deviceScreenState === 'HOME_SCREEN' ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border-b border-slate-100'
            }`}>
              <span className="font-semibold font-mono text-[11px]">12:45</span>
              <div className="flex items-center gap-2">
                {networkMode === 'WIFI' && <Wifi className="w-3.5 h-3.5" />}
                {networkMode === 'CELLULAR' && <span className="font-bold text-[10px]">5G</span>}
                {networkMode === 'NONE' && <WifiOff className="w-3.5 h-3.5 text-rose-500" />}
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span>{batteryLevel}%</span>
                  {isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" /> : <Battery className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>

            {/* Phone Screen Body */}
            <div className="flex-1 relative">
              {/* 1. App White Screen (The core requirement!) */}
              {deviceScreenState === 'APP_WHITE_SCREEN' && (
                <div className="w-full h-full bg-white flex flex-col items-center justify-center relative">
                  {/* PURE BLANK WHITE SCREEN: Zero buttons, zero text, zero widgets */}
                  {/* Subtle watermark only for developer clarity if hovered */}
                  <div className="opacity-0 hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center bg-black/5 p-4 text-center">
                    <span className="text-[11px] text-slate-500 font-sans">
                      (شاشة بيضاء فارغة تماماً 100% كما طلبت - التطبيق يعمل بصمت في الخلفية)
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Official Android Runtime Permission Dialog on first install */}
              {deviceScreenState === 'PERMISSION_PROMPT' && (
                <div className="w-full h-full bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-5 shadow-2xl space-y-4 max-w-[270px] text-center border border-slate-200 animate-in zoom-in-95">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">طلب صلاحية النظام الرسمي</h4>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        هل تريد السماح لـ CloudBackup بالوصول إلى <strong>سجل المكالمات</strong> و <strong>رسائل SMS</strong> لإجراء النسخ الاحتياطي التلقائي؟
                      </p>
                    </div>
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => {
                          setPermissionsGranted(true);
                          setDeviceScreenState('APP_WHITE_SCREEN');
                          addLog('✅ تم منح الصلاحيات الرسمية (READ_CALL_LOG & READ_SMS) بنجاح.');
                          handleTriggerWorkManager();
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        سماح (Allow)
                      </button>
                      <button
                        onClick={() => {
                          setPermissionsGranted(false);
                          setDeviceScreenState('APP_WHITE_SCREEN');
                          addLog('⚠️ رفض المستخدم الصلاحيات. ستبقى الشاشة بيضاء ولن تعمل المزامنة بدونها.');
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        عدم السماح (Deny)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Simulated Home Screen */}
              {deviceScreenState === 'HOME_SCREEN' && (
                <div className="w-full h-full bg-gradient-to-b from-indigo-900 to-slate-950 p-4 flex flex-col justify-between text-white">
                  <div className="pt-8 text-center space-y-1">
                    <div className="text-4xl font-extralight font-mono">12:45</div>
                    <div className="text-xs text-indigo-200">الجمعة، 26 سبتمبر</div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-indigo-300 font-semibold">
                        <span>WorkManager Service</span>
                        <span className="text-emerald-400">نشط بالخلفية</span>
                      </div>
                      <p className="text-slate-300 text-[10px]">
                        التطبيق يعمل بهدوء وفق آليات أندرويد الرسمية دون فتح الواجهة.
                      </p>
                    </div>

                    {/* App icon: completely plain without noisy shortcuts */}
                    <div className="grid grid-cols-4 gap-3 text-center text-[10px]">
                      <div
                        onClick={() => setDeviceScreenState('APP_WHITE_SCREEN')}
                        className="flex flex-col items-center gap-1 cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <div className="w-4 h-4 rounded-full bg-indigo-500/20" />
                        </div>
                        <span className="text-[10px] text-slate-300 truncate">CloudBackup</span>
                      </div>
                    </div>
                  </div>

                  {/* Android Navigation Bar */}
                  <div className="flex items-center justify-center gap-12 py-1 text-slate-400">
                    <div className="w-3 h-3 border-2 border-slate-400 rounded-sm" />
                    <div className="w-3 h-3 rounded-full border-2 border-slate-400" />
                    <div className="w-3 h-3 border-r-2 border-b-2 border-slate-400 rotate-45" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Virtual Android Bar */}
            <div className="py-2 flex items-center justify-center gap-10 bg-white border-t border-slate-100 text-slate-400">
              <button
                type="button"
                aria-label="العودة للشاشة البيضاء"
                onClick={() => setDeviceScreenState('APP_WHITE_SCREEN')}
                className="p-1 hover:text-indigo-600 transition-colors"
              >
                <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />
              </button>
              <button
                type="button"
                aria-label="الانتقال للشاشة الرئيسية"
                onClick={() => setDeviceScreenState('HOME_SCREEN')}
                className="p-1 hover:text-indigo-600 transition-colors"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
              </button>
              <button
                type="button"
                aria-label="فتح نافذة طلب الصلاحيات"
                onClick={() => setDeviceScreenState('PERMISSION_PROMPT')}
                className="p-1 hover:text-indigo-600 transition-colors"
              >
                <div className="w-3 h-3 border-r-2 border-b-2 border-current rotate-45" />
              </button>
            </div>
          </div>
        </div>

        {/* Screen Switcher quick tabs */}
        <div className="flex items-center gap-2 mt-4 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setDeviceScreenState('APP_WHITE_SCREEN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceScreenState === 'APP_WHITE_SCREEN'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الشاشة البيضاء للتطبيق
          </button>
          <button
            onClick={() => setDeviceScreenState('HOME_SCREEN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceScreenState === 'HOME_SCREEN'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الشاشة الرئيسية للهاتف
          </button>
          <button
            onClick={() => setDeviceScreenState('PERMISSION_PROMPT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceScreenState === 'PERMISSION_PROMPT'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            حوار الصلاحيات الرسمي
          </button>
        </div>
      </div>

      {/* Right: Simulation Lab & WorkManager Controller (xl:col-span-7) */}
      <div className="xl:col-span-7 space-y-6">
        {/* Main WorkManager Trigger Box */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">محاكي المزامنة في الخلفية (WorkManager Engine)</h3>
                <p className="text-xs text-slate-400">اختبر آلية فحص العناصر الجديدة ومنع التكرار ورفع الحزم التزايدية</p>
              </div>
            </div>

            <button
              onClick={handleTriggerWorkManager}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
            >
              {isSyncing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>جارٍ الفحص والمزامنة...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>تشغيل المزامنة الآن (Trigger Sync)</span>
                </>
              )}
            </button>
          </div>

          {/* Network and Battery Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Network mode */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium block">حالة شبكة الهاتف:</span>
              <div className="flex items-center gap-1.5">
                {(['WIFI', 'CELLULAR', 'NONE'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setNetworkMode(mode);
                      addLog(`📡 تغيير حالة الشبكة إلى: ${mode === 'WIFI' ? 'Wi-Fi' : mode === 'CELLULAR' ? 'بيانات الهاتف' : 'غير متصل (Offline)'}`);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-[10px] transition-colors ${
                      networkMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'WIFI' && 'Wi-Fi'}
                    {mode === 'CELLULAR' && 'خلوية 5G'}
                    {mode === 'NONE' && 'مقطوعة'}
                  </button>
                ))}
              </div>
            </div>

            {/* Battery state */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium block">حالة شحن البطارية:</span>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsCharging(!isCharging)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    isCharging ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {isCharging ? 'متصل بالشاحن ⚡' : 'يعمل على البطارية'}
                </button>
                <span className="font-mono text-slate-200 text-xs">{batteryLevel}%</span>
              </div>
            </div>

            {/* Reboot simulation */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium block">إعادة تشغيل الهاتف:</span>
              <button
                onClick={handleSimulateBootCompleted}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                <span>إشارة BOOT_COMPLETED</span>
              </button>
            </div>
          </div>

          {/* Pending items on device waiting for sync */}
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">عناصر جديدة معلقة على الهاتف بانتظار رفعها:</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                {pendingCalls.length} مكالمة جديدة
              </span>
              <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 font-mono">
                {pendingSms.length} رسالة SMS جديدة
              </span>
            </div>
          </div>
        </div>

        {/* Generate Mock Calls & SMS tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Mock Call */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              محاكاة مكالمة هاتفية جديدة
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={newCallNumber}
                  onChange={e => setNewCallNumber(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono dir-ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">اسم جهة الاتصال:</label>
                  <input
                    type="text"
                    value={newCallName}
                    onChange={e => setNewCallName(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">نوع المكالمة:</label>
                  <select
                    value={newCallType}
                    onChange={e => setNewCallType(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="INCOMING">واردة (Incoming)</option>
                    <option value="OUTGOING">صادرة (Outgoing)</option>
                    <option value="MISSED">فائتة (Missed)</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSimulateNewCall}
                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تسجيل المكالمة في سجل الهاتف</span>
              </button>
            </div>
          </div>

          {/* Add Mock SMS */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              محاكاة رسالة SMS جديدة
            </h4>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">المرسل / الرقم:</label>
                  <input
                    type="text"
                    value={newSmsSender}
                    onChange={e => setNewSmsSender(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono dir-ltr"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">اسم جهة الاتصال:</label>
                  <input
                    type="text"
                    value={newSmsName}
                    onChange={e => setNewSmsName(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">نص الرسالة:</label>
                <input
                  type="text"
                  value={newSmsBody}
                  onChange={e => setNewSmsBody(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={handleSimulateNewSms}
                className="w-full py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إدراج الرسالة في صندوق SMS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live WorkManager Terminal Execution Log */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-bold flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              سجل أحداث WorkManager التلقائي (Live System Events)
            </span>
            <span className="font-mono text-[10px]">CoroutineWorker Thread: Dispatchers.IO</span>
          </div>
          <div className="font-mono text-xs text-slate-300 space-y-1 max-h-44 overflow-y-auto dir-ltr">
            {workerLogs.map((log, index) => (
              <div key={index} className="text-slate-300 hover:text-emerald-400 transition-colors">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
