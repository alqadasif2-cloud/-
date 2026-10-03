import React from 'react';
import { Folder, FolderOpen, FileText, ChevronLeft, ChevronDown, Database, Phone, MessageSquare, Info } from 'lucide-react';

export type DirectorySection = 'CALL_LOGS' | 'SMS_CONVERSATIONS' | 'SMS_METADATA' | 'BACKUP_METADATA' | 'RAW_TREE';

interface CloudDirectoryTreeProps {
  currentSection: DirectorySection;
  onSelectSection: (section: DirectorySection) => void;
  callCount: number;
  conversationCount: number;
  smsCount: number;
}

export const CloudDirectoryTree: React.FC<CloudDirectoryTreeProps> = ({
  currentSection,
  onSelectSection,
  callCount,
  conversationCount,
  smsCount
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-100">هيكلية مجلدات التخزين السحابي (Cloud Bucket)</h3>
        </div>
        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          غير مشفرة لحسابك (Plain JSON)
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        بناءً على طلبك: يتم تنظيم البيانات في السحابة بهيكلية مجلدات شجرية واضحة ومنظمة لتسهيل القراءة والتصفح المباشر:
      </p>

      {/* Directory items */}
      <div className="space-y-1 font-mono text-xs select-none">
        {/* Root: Backup/ */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 text-indigo-300 font-bold bg-indigo-950/30 rounded-lg">
          <FolderOpen className="w-4 h-4 text-indigo-400" />
          <span>Backup/</span>
        </div>

        <div className="pr-4 space-y-1 border-r-2 border-slate-800 mr-2.5 mt-1">
          {/* 1. CallLogs/ */}
          <button
            onClick={() => onSelectSection('CALL_LOGS')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-right transition-all ${
              currentSection === 'CALL_LOGS'
                ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40 shadow-sm'
                : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>├── CallLogs/</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-sans">
              {callCount} مكالمة
            </span>
          </button>

          {/* 2. SMS/ */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
              <Folder className="w-3.5 h-3.5 text-sky-400" />
              <span>├── SMS/</span>
            </div>

            <div className="pr-4 space-y-1 border-r-2 border-slate-800 mr-2.5">
              {/* Conversations */}
              <button
                onClick={() => onSelectSection('SMS_CONVERSATIONS')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-right transition-all ${
                  currentSection === 'SMS_CONVERSATIONS'
                    ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>├── Conversations/</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-sans">
                  {conversationCount} محادثة ({smsCount} رسالة)
                </span>
              </button>

              {/* SMS Metadata */}
              <button
                onClick={() => onSelectSection('SMS_METADATA')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-right transition-all ${
                  currentSection === 'SMS_METADATA'
                    ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>└── Metadata/threads.json</span>
                </div>
                <span className="text-[10px] text-slate-500 font-sans">فهرس</span>
              </button>
            </div>
          </div>

          {/* 3. BackupMetadata/ */}
          <button
            onClick={() => onSelectSection('BACKUP_METADATA')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-right transition-all ${
              currentSection === 'BACKUP_METADATA'
                ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-purple-400" />
              <span>└── BackupMetadata/</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-sans">
              إحصائيات وسجل
            </span>
          </button>

          {/* Raw Full JSON View */}
          <button
            onClick={() => onSelectSection('RAW_TREE')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-right transition-all ${
              currentSection === 'RAW_TREE'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'hover:bg-slate-800/80 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>[عرض الشجرة الخام الكاملة Raw JSON]</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
