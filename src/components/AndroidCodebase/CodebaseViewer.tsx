import React, { useState } from 'react';
import { ANDROID_SOURCE_FILES, SourceFile } from '../../data/androidSourceFiles';
import { generateAndDownloadProjectZip } from '../../utils/zipExporter';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FolderTree,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const CodebaseViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SourceFile>(ANDROID_SOURCE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      await generateAndDownloadProjectZip();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingZip(false);
    }
  };

  const filteredFiles = ANDROID_SOURCE_FILES.filter(file => {
    if (activeCategory === 'ALL') return true;
    return file.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with 1-Click ZIP Download */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
              Android Studio Ladybug / Meerkat / Hedgehog Ready
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              قابل للبناء كـ APK فورياً
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">
            مشروع تطبيق أندرويد متكامل بلغة Kotlin و Jetpack
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            كود برمجي نقي ومقسم بمعمارية Clean Architecture: قارئ سجل المكالمات والرسائل عبر واجهات النظام الرسمية، قاعدة بيانات Room لمنع التكرار، وجدولة WorkManager موفرة للطاقة مع شاشة بيضاء فارغة 100%.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isExportingZip}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          {isExportingZip ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>جارٍ تحزيم ملف الـ ZIP...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>تحميل مشروع Android Studio كاملاً (.zip)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Code Explorer (File tree + Code viewer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-900/60 rounded-3xl border border-slate-800 p-4 overflow-hidden">
        {/* File List Drawer (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              ملفات المشروع ({ANDROID_SOURCE_FILES.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">com.personal.cloudbackup</span>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'ui', label: 'الشاشة البيضاء' },
              { id: 'reader', label: 'قراءة البيانات' },
              { id: 'worker', label: 'الخلفية والمزامنة' },
              { id: 'database', label: 'Room لمنع التكرار' },
              { id: 'manifest', label: 'البيان والإعدادات' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Files List */}
          <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
            {filteredFiles.map(file => {
              const isSelected = selectedFile.path === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3 rounded-xl cursor-pointer transition-all text-right ${
                    isSelected
                      ? 'bg-indigo-950/60 border border-indigo-500/50 text-indigo-200 shadow-sm'
                      : 'bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold font-mono text-xs truncate">
                      {file.filename}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {file.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                    {file.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Content View (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-mono text-xs text-slate-200 truncate dir-ltr">
                {selectedFile.path}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>
          </div>

          {/* Description line */}
          <div className="px-4 py-2 bg-indigo-950/20 border-b border-slate-800/80 text-xs text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{selectedFile.description}</span>
          </div>

          {/* Code text container */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[580px] font-mono text-xs leading-relaxed text-slate-200 dir-ltr select-text">
            <pre className="whitespace-pre">{selectedFile.content}</pre>
          </div>
        </div>
      </div>

      {/* Build and Install quick reference */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
        <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          خطوات البناء والتثبيت السريع عبر موجه الأوامر (Terminal / ADB)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">1. بناء ملف الـ APK عبر Gradle:</span>
            <code className="text-emerald-400 block font-mono bg-slate-900 p-2 rounded dir-ltr text-[11px]">
              ./gradlew assembleDebug
            </code>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">2. تثبيت ومنح الصلاحيات الرسمية دفعة واحدة عبر ADB:</span>
            <code className="text-sky-300 block font-mono bg-slate-900 p-2 rounded dir-ltr text-[11px]">
              adb install -r app/build/outputs/apk/debug/app-debug.apk
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
