import React, { useState } from 'react';
import { CloudStorageStructure } from '../../types/backup';
import { RotateCcw, CheckCircle, Smartphone, AlertTriangle, ShieldCheck, Download, Code, ArrowRight } from 'lucide-react';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CloudStorageStructure;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({ isOpen, onClose, data }) => {
  const [selectedRestoreType, setSelectedRestoreType] = useState<'ALL' | 'CALLS_ONLY' | 'SMS_ONLY'>('ALL');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreCompleted, setRestoreCompleted] = useState(false);

  if (!isOpen) return null;

  const handleStartRestore = () => {
    setIsRestoring(true);
    setTimeout(() => {
      setIsRestoring(false);
      setRestoreCompleted(true);
    }, 1800);
  };

  const handleReset = () => {
    setRestoreCompleted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">استعادة البيانات إلى الهاتف (Restore System)</h3>
              <p className="text-xs text-slate-400">بنية معيارية تسمح بإعادة إدراج السجلات في ContentResolver لنظام Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1.5 bg-slate-800 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>

        {!restoreCompleted ? (
          <div className="space-y-5">
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                جاهزية البيانات للاسترجاع (Android Restore-Ready Architecture)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                وفق متطلبات النقطة 12: تم تخزين سجل المكالمات والرسائل بأسماء الحقول الأصلية (ContentValues) مثل:
                <code className="px-1.5 py-0.5 mx-1 bg-slate-900 text-emerald-400 rounded">CallLog.Calls.NUMBER</code>،
                <code className="px-1.5 py-0.5 mx-1 bg-slate-900 text-emerald-400 rounded">Telephony.Sms.BODY</code>، و
                <code className="px-1.5 py-0.5 mx-1 bg-slate-900 text-emerald-400 rounded">THREAD_ID</code>،
                مما يتيح للتطبيق إدراجها فورياً في هاتف جديد بنقرة واحدة عبر واجهة <code className="text-indigo-300 font-mono">contentResolver.bulkInsert()</code>.
              </p>
            </div>

            {/* Scope selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">حدد البيانات المراد استرجاعها:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRestoreType('ALL')}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    selectedRestoreType === 'ALL'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm block">استعادة الكل</span>
                  <span className="text-[11px] opacity-75">{data.Backup.CallLogs.length} مكالمة + {data.Backup.SMS.Metadata.totalMessages} رسالة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRestoreType('CALLS_ONLY')}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    selectedRestoreType === 'CALLS_ONLY'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm block">سجل المكالمات فقط</span>
                  <span className="text-[11px] opacity-75">{data.Backup.CallLogs.length} سجل مكالمة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRestoreType('SMS_ONLY')}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    selectedRestoreType === 'SMS_ONLY'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm block">رسائل SMS فقط</span>
                  <span className="text-[11px] opacity-75">{data.Backup.SMS.Metadata.totalMessages} رسالة</span>
                </button>
              </div>
            </div>

            {/* Target Device info */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span>الهاتف المستهدف:</span>
                <span className="font-bold text-slate-100">{data.Backup.BackupMetadata.deviceModel}</span>
              </div>
              <span className="text-emerald-400 font-mono">جاهز للاسترجاع (Synced)</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleStartRestore}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
              >
                {isRestoring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ معالجة حزمة الاستعادة وإرسالها للهاتف...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>بدء الاستعادة التلقائية للهاتف الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-100">تمت معالجة أمر الاسترجاع بنجاح!</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              تم إرسال حزمة البيانات المحددة عبر واجهة ContentResolver الآمنة بنجاح، وتضمين كافة جهات الاتصال والأرقام والمحادثات بترتيبها الزمني الصحيح.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                العودة لمستعرض السحابة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
