import React, { useState } from 'react';
import { SmsConversation, SmsRecord } from '../../types/backup';
import { MessageSquare, ArrowDownLeft, ArrowUpRight, Search, Clock, Calendar, Hash, CheckCheck, User, Code2 } from 'lucide-react';

interface SmsConversationsViewProps {
  conversations: SmsConversation[];
}

export const SmsConversationsView: React.FC<SmsConversationsViewProps> = ({ conversations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    conversations.length > 0 ? conversations[0].threadId : ''
  );
  const [showJsonModal, setShowJsonModal] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch =
      conv.participantAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.participantName && conv.participantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      conv.messages.some(m => m.body.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const activeConversation = conversations.find(c => c.threadId === selectedThreadId) || filteredConversations[0];

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في محتوى الرسائل، الأرقام أو جهات الاتصال..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <span>{conversations.length} محادثة منظمة</span>
          <span className="text-slate-600">•</span>
          <span>{conversations.reduce((acc, c) => acc + c.messageCount, 0)} رسالة SMS</span>
        </div>
      </div>

      {/* Main Two-Pane Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px] bg-slate-900/30 rounded-2xl border border-slate-800/80 overflow-hidden">
        {/* Left Side: Threads List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-l border-slate-800 flex flex-col h-[280px] lg:h-full bg-slate-950/40">
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              محادثات SMS (خيوط Threads)
            </span>
            <span className="text-[11px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">
              Backup/SMS/Conversations/
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                لا توجد محادثات تطابق البحث
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeConversation?.threadId === conv.threadId;
                return (
                  <div
                    key={conv.threadId}
                    onClick={() => setSelectedThreadId(conv.threadId)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-r-4 border-r-indigo-500 text-slate-100'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {conv.participantName ? conv.participantName[0] : '#'}
                        </div>
                        <span className="font-semibold text-sm truncate">
                          {conv.participantName || conv.participantAddress}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                        {conv.messages[conv.messages.length - 1]?.timeFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <p className="truncate line-clamp-1 flex-1">
                        {conv.lastMessageSnippet}
                      </p>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 shrink-0">
                        {conv.messageCount}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Messages Viewer */}
        <div className="lg:col-span-8 flex flex-col h-[370px] lg:h-full bg-slate-950/20">
          {activeConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      {activeConversation.participantName || activeConversation.participantAddress}
                      <span className="text-xs font-normal text-slate-400 font-mono dir-ltr">
                        ({activeConversation.participantAddress})
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Thread ID: <span className="text-indigo-400 font-mono">{activeConversation.threadId}</span></span>
                      <span>•</span>
                      <span>{activeConversation.messageCount} رسائل مرتبة زمنياً</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowJsonModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>عرض الـ JSON السحابي</span>
                </button>
              </div>

              {/* Message Bubbles Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="text-center my-2">
                  <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] text-slate-400">
                    بداية سجل المحادثة المشفر بسحابتك
                  </span>
                </div>

                {activeConversation.messages.map(msg => {
                  const isSent = msg.direction === 'SENT';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSent ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-sm text-sm space-y-1.5 ${
                          isSent
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap select-text">
                          {msg.body}
                        </p>

                        <div className={`flex items-center gap-2 text-[10px] ${
                          isSent ? 'text-indigo-200 justify-start' : 'text-slate-400 justify-end'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {msg.timeFormatted}
                          </span>
                          <span>•</span>
                          <span>{msg.dateFormatted}</span>
                          <span className="font-mono text-[9px] opacity-75">ID: {msg.id}</span>
                          {isSent && <CheckCheck className="w-3.5 h-3.5 text-indigo-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Info Bar */}
              <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500">
                هذه الرسائل محفوظة بصيغة نصية غير مشفرة بمفتاح حاجب، بحيث يمكنك مطالعتها وقراءتها مباشرة من حسابك في أي وقت.
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              اختر محادثة لعرض تفاصيلها
            </div>
          )}
        </div>
      </div>

      {/* JSON Viewer Modal for Thread */}
      {showJsonModal && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                سجل المحادثة الخام كما هو مخزن في Backup/SMS/Conversations/{activeConversation.threadId}
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm px-2.5 py-1 bg-slate-800 rounded-lg"
              >
                إغلاق
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                يتم رفع الرسائل بهذه الصيغة الشجرية النظيفة دون تشفير يمنعك من قراءتها، مع الاحتفاظ بكافة حقول Android Telephony API:
              </p>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 max-h-96 overflow-y-auto dir-ltr">
                {JSON.stringify(activeConversation, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
