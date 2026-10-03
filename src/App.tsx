import React, { useState, useEffect } from 'react';
import { CloudStorageService } from './services/cloudStorage';
import { CloudStorageStructure } from './types/backup';
import { Navbar, ActiveTab } from './components/Navigation/Navbar';
import { CloudDirectoryTree, DirectorySection } from './components/CloudViewer/CloudDirectoryTree';
import { CallLogsView } from './components/CloudViewer/CallLogsView';
import { SmsConversationsView } from './components/CloudViewer/SmsConversationsView';
import { MetadataView } from './components/CloudViewer/MetadataView';
import { JsonInspector } from './components/CloudViewer/JsonInspector';
import { RestoreModal } from './components/CloudViewer/RestoreModal';
import { AndroidPhoneSimulator } from './components/AndroidSimulator/AndroidPhoneSimulator';
import { CodebaseViewer } from './components/AndroidCodebase/CodebaseViewer';
import { PolicyGuide } from './components/PolicyGuide/PolicyGuide';
import { ApiDocs } from './components/ApiDocumentation/ApiDocs';
import { generateAndDownloadProjectZip } from './utils/zipExporter';
import {
  Folder,
  Layers,
  Database,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  FileCode,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const cloudService = CloudStorageService.getInstance();
  const [cloudState, setCloudState] = useState<CloudStorageStructure>(cloudService.getState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('CLOUD_VIEWER');
  const [directorySection, setDirectorySection] = useState<DirectorySection>('CALL_LOGS');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = cloudService.subscribe(() => {
      setCloudState({ ...cloudService.getState() });
    });
    return unsubscribe;
  }, []);

  const totalSyncedItems =
    cloudState.Backup.CallLogs.length +
    cloudState.Backup.SMS.Metadata.totalMessages;

  const handleDownloadZip = async () => {
    try {
      await generateAndDownloadProjectZip();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJson = () => {
    cloudService.exportBackupJson();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRestore={() => setIsRestoreModalOpen(true)}
        onDownloadZip={handleDownloadZip}
        onExportJson={handleExportJson}
        totalSyncedItems={totalSyncedItems}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: Live Cloud Storage Explorer */}
        {activeTab === 'CLOUD_VIEWER' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Context Header banner */}
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  أنت تتصفح الآن مساحة التخزين السحابية الخاصة بك: البيانات واضحة ومنظمة بهيكلية المجلدات التي حددتها، بدون تشفير يمنعك من قراءتها.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('ANDROID_SIMULATOR')}
                className="text-indigo-400 hover:text-indigo-300 font-bold whitespace-nowrap"
              >
                ← تجربة محاكي الأندرويد وإضافة بيانات جديدة
              </button>
            </div>

            {/* Tree Navigation + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Directory Tree Sidebar (lg:col-span-4) */}
              <div className="lg:col-span-4 sticky top-28">
                <CloudDirectoryTree
                  currentSection={directorySection}
                  onSelectSection={setDirectorySection}
                  callCount={cloudState.Backup.CallLogs.length}
                  conversationCount={cloudState.Backup.SMS.Conversations.length}
                  smsCount={cloudState.Backup.SMS.Metadata.totalMessages}
                />
              </div>

              {/* Viewer Content (lg:col-span-8) */}
              <div className="lg:col-span-8">
                {directorySection === 'CALL_LOGS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-emerald-400" />
                        مسار: Backup/CallLogs/
                      </h3>
                      <span className="text-xs text-slate-400">سجل المكالمات الصادرة والواردة والفائتة</span>
                    </div>
                    <CallLogsView calls={cloudState.Backup.CallLogs} />
                  </div>
                )}

                {directorySection === 'SMS_CONVERSATIONS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-sky-400" />
                        مسار: Backup/SMS/Conversations/
                      </h3>
                      <span className="text-xs text-slate-400">المحادثات مجمعة وفق thread_id ومرتبة زمنياً</span>
                    </div>
                    <SmsConversationsView conversations={cloudState.Backup.SMS.Conversations} />
                  </div>
                )}

                {directorySection === 'SMS_METADATA' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-sky-400" />
                        مسار: Backup/SMS/Metadata/
                      </h3>
                      <span className="text-xs text-slate-400">فهرس المحادثات والإحصائيات</span>
                    </div>
                    <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                      <p className="text-slate-300 font-sans">
                        فهرس رقمي سريع يتيح للمستعرض وتطبيقات الاسترجاع معرفة خيوط المحادثات دون قراءة محتوى الرسائل بالكامل:
                      </p>
                      <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sky-300 dir-ltr">
                        {JSON.stringify(
                          {
                            totalThreads: cloudState.Backup.SMS.Metadata.totalThreads,
                            totalMessages: cloudState.Backup.SMS.Metadata.totalMessages,
                            lastUpdated: cloudState.Backup.SMS.Metadata.lastUpdated,
                            threadsSummary: cloudState.Backup.SMS.Conversations.map(c => ({
                              threadId: c.threadId,
                              participant: c.participantName || c.participantAddress,
                              count: c.messageCount,
                              lastTimestamp: c.lastMessageTimestamp
                            }))
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                )}

                {directorySection === 'BACKUP_METADATA' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-purple-400" />
                        مسار: Backup/BackupMetadata/
                      </h3>
                      <span className="text-xs text-slate-400">تاريخ آخر مزامنة وعدد العناصر وسجلات الأحداث</span>
                    </div>
                    <MetadataView metadata={cloudState.Backup.BackupMetadata} />
                  </div>
                )}

                {directorySection === 'RAW_TREE' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-amber-400" />
                        الشجرة الكاملة بدون تشفير (Raw Cloud JSON Tree)
                      </h3>
                      <span className="text-xs text-amber-400">مباشرة من مساحة التخزين الخاصة بك</span>
                    </div>
                    <JsonInspector data={cloudState} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Android Phone Simulator & White Screen */}
        {activeTab === 'ANDROID_SIMULATOR' && (
          <div className="animate-in fade-in duration-150">
            <AndroidPhoneSimulator onDataChanged={() => setCloudState({ ...cloudService.getState() })} />
          </div>
        )}

        {/* TAB 3: Android Studio & Kotlin Project Codebase */}
        {activeTab === 'ANDROID_CODEBASE' && (
          <div className="animate-in fade-in duration-150">
            <CodebaseViewer />
          </div>
        )}

        {/* TAB 4: Official Android Permissions & Google Play Policy Guide */}
        {activeTab === 'POLICY_GUIDE' && (
          <div className="animate-in fade-in duration-150">
            <PolicyGuide />
          </div>
        )}

        {/* TAB 5: Cloud REST API Docs */}
        {activeTab === 'API_DOCS' && (
          <div className="animate-in fade-in duration-150">
            <ApiDocs />
          </div>
        )}
      </main>

      {/* Restore Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        data={cloudState}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>تطبيق النسخ الاحتياطي التلقائي الشخصي للأندرويد - مبني وفق واجهات Android SDK الرسمية</p>
        <p className="text-slate-600 font-mono">WorkManager • Room Database • ContentResolver • Coroutines</p>
      </footer>
    </div>
  );
}
