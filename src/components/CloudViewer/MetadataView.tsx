import React from 'react';
import { CloudBackupMetadata } from '../../types/backup';
import { Database, Clock, Smartphone, CheckCircle2, Wifi, BatteryCharging, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface MetadataViewProps {
  metadata: CloudBackupMetadata;
}

export const MetadataView: React.FC<MetadataViewProps> = ({ metadata }) => {
  const formatEpoch = (epoch: number) => {
    if (!epoch) return 'لم تتم أي مزامنة بعد';
    const d = new Date(epoch);
    return `${d.toLocaleDateString('ar-EG')} - ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">سجل المكالمات المخزن</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{metadata.totalCallLogsStored}</p>
          <span className="text-[11px] text-emerald-400 block">جميع المكالمات مفهرسة زمنياً</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">إجمالي رسائل SMS</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{metadata.totalSmsStored}</p>
          <span className="text-[11px] text-sky-400 block">داخل {metadata.totalConversationsStored} خيط محادثة</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">آخر مزامنة ناجحة</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">
            {formatEpoch(metadata.lastSuccessfulSyncTimestamp)}
          </p>
          <span className="text-[11px] text-slate-500 block">WorkManager Periodic Sync</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">الجهاز المصدر</span>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">{metadata.deviceModel}</p>
          <span className="text-[11px] text-purple-400 block">{metadata.androidVersion}</span>
        </div>
      </div>

      {/* BackupMetadata Directory Structure JSON */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            بنية ملف البيانات الوصفية (Backup/BackupMetadata/metadata.json)
          </h4>
          <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            Read-Only Public Access to Account Owner
          </span>
        </div>
        <p className="text-xs text-slate-400">
          يتم تخزين هذه البيانات في سحابتك الخاصة لتتبع أوقات الفحص، النسخ التزايدي، وضمان عدم تكرار الرفع:
        </p>
        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto dir-ltr">
          {JSON.stringify(
            {
              deviceId: metadata.deviceId,
              deviceModel: metadata.deviceModel,
              androidVersion: metadata.androidVersion,
              appVersion: metadata.appVersion,
              lastSuccessfulSyncTimestamp: metadata.lastSuccessfulSyncTimestamp,
              lastAttemptTimestamp: metadata.lastAttemptTimestamp,
              totalCallLogsStored: metadata.totalCallLogsStored,
              totalSmsStored: metadata.totalSmsStored,
              totalConversationsStored: metadata.totalConversationsStored
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Sync Execution History (Requirement 11) */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          سجل عمليات النسخ الاحتياطي التلقائي (Sync History Log)
        </h4>
        <p className="text-xs text-slate-400">
          وفق متطلباتك: يتم الاحتفاظ ببيانات داخلية عن كل عملية مزامنة في الخلفية، وقت المحاولة، عدد الرسائل والمكالمات المكتشفة، وحالة الشبكة.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-2.5 font-medium">وقت العملية</th>
                <th className="p-2.5 font-medium">الحالة</th>
                <th className="p-2.5 font-medium">المكالمات الجديدة</th>
                <th className="p-2.5 font-medium">الرسائل الجديدة</th>
                <th className="p-2.5 font-medium">نوع الشبكة</th>
                <th className="p-2.5 font-medium">البطارية</th>
                <th className="p-2.5 font-medium">زمن التنفيذ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metadata.syncHistory.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-900/50">
                  <td className="p-2.5 font-mono text-slate-300">
                    {formatEpoch(evt.timestamp)}
                  </td>
                  <td className="p-2.5">
                    {evt.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ناجحة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        فشلت
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 font-mono text-slate-200">
                    +{evt.newCallLogsCount}
                  </td>
                  <td className="p-2.5 font-mono text-slate-200">
                    +{evt.newSmsCount}
                  </td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Wifi className="w-3 h-3 text-sky-400" />
                      {evt.networkType}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      {evt.batteryLevel}%
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-slate-400">
                    {evt.durationMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
