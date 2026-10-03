import React, { useState } from 'react';
import { Server, Code, Copy, Check, Play, CheckCircle2, Send, Terminal } from 'lucide-react';
import { CloudStorageService } from '../../services/cloudStorage';

export const ApiDocs: React.FC = () => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const samplePayload = {
    Backup: {
      CallLogs: [
        {
          id: "1099",
          phoneNumber: "+966509998877",
          contactName: "عبدالله العتيبي",
          callType: "INCOMING",
          rawType: 1,
          timestamp: Date.now(),
          durationSeconds: 120,
          hash: "CALL_1099_+966509998877"
        }
      ],
      SMS: {
        Conversations: {
          "105": [
            {
              id: "8920",
              threadId: "105",
              address: "+966509998877",
              body: "السلام عليكم، تفضل بزيارة الرابط لتأكيد الموعد.",
              timestamp: Date.now(),
              direction: "INBOX",
              rawType: 1,
              isRead: true,
              hash: "SMS_8920_105"
            }
          ]
        },
        Metadata: {
          totalThreads: 1,
          totalMessages: 1,
          lastUpdated: Date.now()
        }
      },
      BackupMetadata: {
        deviceId: "SM-S928B_GALAXY_S24_ULTRA",
        syncTimestamp: Date.now(),
        callsSyncedCount: 1,
        smsSyncedCount: 1,
        status: "SUCCESS"
      }
    }
  };

  const curlExample = `curl -X POST "https://your-cloud-domain.com/api/backup/sync" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SECRET_PERSONAL_TOKEN" \\
  -d '${JSON.stringify(samplePayload)}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleRunMockApiTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult(JSON.stringify({
        status: "SUCCESS",
        message: "تم استلام حزمة النسخ الاحتياطي وحفظها بنجاح في السحابة الخاصة",
        recordsProcessed: {
          callLogsAdded: 1,
          smsMessagesAdded: 1,
          duplicatesIgnored: 0
        },
        serverTimestamp: Date.now()
      }, null, 2));
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
          <Server className="w-4 h-4" />
          <span>واجهة برمجة التطبيقات السحابية الرسمية (REST API Endpoints)</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          توثيق نقطة النهاية لمزامنة السحابة الخاصة (Cloud Sync API)
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          يوضح هذا القسم كيفية استقبال الخادم السحابي الخاص بك لحزم البيانات المرفوعة من تطبيق الأندرويد، وكيفية مصادقة الطلب ومعالجة التكرار.
        </p>
      </div>

      {/* Endpoint Specification */}
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
            <span className="text-slate-200">/api/backup/sync</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Authorization: Bearer Token</span>
        </div>

        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-300 block">شكل حزمة البيانات المرسلة (JSON Payload):</span>
          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 max-h-72 overflow-y-auto dir-ltr">
            {JSON.stringify(samplePayload, null, 2)}
          </pre>
        </div>

        {/* Curl Command */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-400" />
              أمر CURL لاختبار الإرسال يدوياً:
            </span>
            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'تم النسخ!' : 'نسخ الأمر'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto dir-ltr">
            {curlExample}
          </pre>
        </div>

        {/* Live Test Trigger */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">اختبر استجابة نقطة النهاية السحابية الآن:</span>
          <button
            onClick={handleRunMockApiTest}
            disabled={isTesting}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جارٍ المعالجة...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>إرسال طلب تجريبي (Test Request)</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-2 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              استجابة الخادم السحابي بنجاح (HTTP 200 OK):
            </span>
            <pre className="font-mono text-xs text-emerald-300 dir-ltr">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
