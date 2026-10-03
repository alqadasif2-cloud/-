import React, { useState } from 'react';
import { CallLogRecord, CallType } from '../../types/backup';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock, Calendar, MapPin, Search, Filter, Hash, Eye } from 'lucide-react';

interface CallLogsViewProps {
  calls: CallLogRecord[];
}

export const CallLogsView: React.FC<CallLogsViewProps> = ({ calls }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedCall, setSelectedCall] = useState<CallLogRecord | null>(null);

  const filteredCalls = calls.filter(call => {
    const matchesSearch =
      call.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (call.contactName && call.contactName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'ALL' || call.callType === filterType;
    return matchesSearch && matchesType;
  });

  const getCallTypeBadge = (type: CallType) => {
    switch (type) {
      case 'INCOMING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PhoneIncoming className="w-3.5 h-3.5" />
            مكالمة واردة
          </span>
        );
      case 'OUTGOING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <PhoneOutgoing className="w-3.5 h-3.5" />
            مكالمة صادرة
          </span>
        );
      case 'MISSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <PhoneMissed className="w-3.5 h-3.5" />
            مكالمة فائتة
          </span>
        );
      case 'REJECTED':
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <PhoneOff className="w-3.5 h-3.5" />
            مرفوضة / محظورة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400">
            <Phone className="w-3.5 h-3.5" />
            أخرى
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الهاتف أو اسم جهة الاتصال..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {(['ALL', 'INCOMING', 'OUTGOING', 'MISSED', 'REJECTED'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' && 'الكل'}
              {type === 'INCOMING' && 'واردة'}
              {type === 'OUTGOING' && 'صادرة'}
              {type === 'MISSED' && 'فائتة'}
              {type === 'REJECTED' && 'مرفوضة'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>عرض {filteredCalls.length} من أصل {calls.length} مكالمة مسجلة بالسحابة</span>
        <span className="text-emerald-400">مرتبة زمنياً (الأحدث أولاً) وفق Android SDK</span>
      </div>

      {/* Call List */}
      <div className="space-y-2">
        {filteredCalls.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
            <Phone className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-slate-400 text-sm">لا توجد مكالمات مطابقة لخيارات البحث</p>
          </div>
        ) : (
          filteredCalls.map(call => (
            <div
              key={call.id}
              onClick={() => setSelectedCall(call)}
              className="group p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  call.callType === 'INCOMING' ? 'bg-emerald-500/10 text-emerald-400' :
                  call.callType === 'OUTGOING' ? 'bg-sky-500/10 text-sky-400' :
                  call.callType === 'MISSED' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {call.callType === 'INCOMING' && <PhoneIncoming className="w-5 h-5" />}
                  {call.callType === 'OUTGOING' && <PhoneOutgoing className="w-5 h-5" />}
                  {call.callType === 'MISSED' && <PhoneMissed className="w-5 h-5" />}
                  {call.callType === 'REJECTED' && <PhoneOff className="w-5 h-5" />}
                  {call.callType === 'BLOCKED' && <PhoneOff className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-base">
                      {call.contactName || call.phoneNumber}
                    </span>
                    {call.contactName && (
                      <span className="text-xs text-slate-400 font-mono dir-ltr">
                        ({call.phoneNumber})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {call.dateFormatted}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {call.timeFormatted}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      المدة: {call.durationFormatted}
                    </span>
                    {call.geocodedLocation && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {call.geocodedLocation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                {getCallTypeBadge(call.callType)}
                <button
                  type="button"
                  aria-label="عرض التفاصيل التقنية للمكالمة"
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-400" />
                تفاصيل المكالمة المخزنة في السحابة
              </h3>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 bg-slate-800 rounded-lg"
              >
                إغلاق
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 block">جهة الاتصال:</span>
                  <span className="font-semibold text-slate-200">{selectedCall.contactName || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">رقم الهاتف:</span>
                  <span className="font-mono text-slate-200 dir-ltr block text-right">{selectedCall.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">نوع المكالمة:</span>
                  <div className="mt-1">{getCallTypeBadge(selectedCall.callType)}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">مدة المكالمة:</span>
                  <span className="text-slate-200 font-medium">{selectedCall.durationFormatted} ({selectedCall.durationSeconds} ثانية)</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">التاريخ والوقت:</span>
                  <span className="font-mono text-slate-300">{selectedCall.dateFormatted} - {selectedCall.timeFormatted}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">معرف أندرويد الرسمي (_ID):</span>
                  <span className="font-mono text-indigo-400">{selectedCall.id}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">بصمة التجزئة لمنع التكرار (Deduplication Hash):</span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 break-all flex items-center gap-2">
                  <Hash className="w-4 h-4 shrink-0 text-slate-500" />
                  {selectedCall.hash}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">هيكلية السجل في السحابة (Plain JSON):</span>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto dir-ltr">
                  {JSON.stringify(selectedCall, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
