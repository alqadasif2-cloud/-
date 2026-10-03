import React, { useState } from 'react';
import { CloudStorageStructure } from '../../types/backup';
import { Copy, Check, Download, FileCode, Search } from 'lucide-react';

interface JsonInspectorProps {
  data: CloudStorageStructure;
}

export const JsonInspector: React.FC<JsonInspectorProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState('');

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CloudBackup_FullTree_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="font-bold text-sm text-slate-100">سجل التخزين الخام بدون تشفير (Plaintext Cloud Backup)</h4>
            <span className="text-xs text-slate-400">تنسيق JSON قياسي متوافق مع كافة أدوات النسخ والاسترجاع وقواعد البيانات</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'تم النسخ!' : 'نسخ الكود'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل JSON
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto text-emerald-400/90 dir-ltr select-text">
          <pre>{jsonString}</pre>
        </div>
      </div>
    </div>
  );
};
