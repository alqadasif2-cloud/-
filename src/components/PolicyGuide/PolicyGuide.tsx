import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Info, Lock, Terminal, Cpu, Smartphone, BookOpen } from 'lucide-react';

export const PolicyGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
          <BookOpen className="w-4 h-4" />
          <span>المرجع التقني والالتزام بسياسات أندرويد الرسمية</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          تحليل قيود النظام، صلاحيات SMS وسجل المكالمات، وسياسات Google Play
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          إجابة تفصيلية دقيقة على النقطة (15) والنقاط (4، 5، 7، 8) من طلبك لضمان عمل التطبيق بامتثال كامل وصفر تجاوزات أمنية.
        </p>
      </div>

      {/* Point 15 Core Analysis: Sideload vs Play Store */}
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              1. سياسة متجر Google Play مقابل تثبيت التطبيق الشخصي (Sideloading)
            </h3>
            <span className="text-xs text-slate-400">توضيح الفارق الجوهري بين سياسة المتجر التجاري وبين واجهات نظام Android الأصلية</span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-indigo-300 text-sm">أ. ما هي قيود Google Play Store؟</h4>
            <p>
              منذ تحديث سياسات الخصوصية لمتجر Google Play في أواخر 2018، حظرت جوجل رفع أي تطبيق يطلب صلاحيات
              <code className="text-amber-400 font-mono mx-1">READ_CALL_LOG</code> أو
              <code className="text-amber-400 font-mono mx-1">READ_SMS</code> إلا إذا كان التطبيق هو
              <strong> "المعالج الافتراضي للرسائل" (Default SMS Handler)</strong> أو
              <strong> "المعالج الافتراضي للمكالمات" (Default Dialer)</strong>، أو يمتلك استثناءً مؤسسياً نادراً.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm">ب. الحل الرسمي المعتمد للتطبيق الشخصي (الالتزام بالنظام بدون تجاوز)</h4>
            <p>
              نظام تشغيل <strong>Android OS نفسه (AOSP / Linux Framework)</strong> يدعم هذه الصلاحيات رسمياً بالكامل وبدون أي قيود عبر:
            </p>
            <ul className="list-disc list-inside space-y-1 pr-2 text-slate-300">
              <li>
                <strong>طلب الصلاحية التفاعلي (Runtime Permission):</strong> يظهر مربع حوار النظام الرسمي للمستخدم مرة واحدة فقط ليضغط "سماح" (Allow).
              </li>
              <li>
                <strong>إعدادات الهاتف:</strong> يمكن للمستخدم الدخول إلى (الإعدادات &gt; التطبيقات &gt; CloudBackup &gt; الصلاحيات &gt; تفعيل سجل المكالمات والرسائل).
              </li>
              <li>
                <strong>أمر ADB:</strong> بالنسبة لك كمالك الهاتف، يتيح لك أندرويد منح الصلاحية رسمياً عبر أمر:
                <code className="text-sky-300 font-mono mx-1">adb shell pm grant com.personal.cloudbackup android.permission.READ_CALL_LOG</code>.
              </li>
            </ul>
            <p className="text-emerald-400 font-semibold pt-1">
               النتيجة: تطبيقك الشخصي يعمل 100% بالواجهات الرسمية دون الحاجة إلى الروت (Root)، ودون أي تلاعب، وبأمان نظام أندرويد الأصلي.
            </p>
          </div>
        </div>
      </div>

      {/* Background Services & WorkManager vs Battery */}
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              2. قيود الخلفية واستهلاك البطارية (Android 8.0 إلى Android 15)
            </h3>
            <span className="text-xs text-slate-400">لماذا تم اختيار Jetpack WorkManager كبديل رسمي لخدمات Background Services التقليدية؟</span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            في إصدارات أندرويد الحديثة (من Oreo وحتى Android 15)، يُمنع التطبيق من تشغيل
            <code className="text-rose-400 font-mono mx-1">Background Service</code> مستمرة بلا نهاية، لأن النظام سيقوم بإيقافها فورياً للحفاظ على البطارية (Doze Mode).
          </p>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-indigo-300 text-sm">البديل الرسمي الموصى به من Google:</h4>
            <p>
              استخدام <strong>Jetpack WorkManager</strong> مع القيود الذكية (Constraints):
            </p>
            <ul className="list-disc list-inside space-y-1.5 pr-2">
              <li>
                <strong>اشتراط وجود شبكة (NetworkType.CONNECTED):</strong> لا يحاول التطبيق المزامنة إطلاقاً إذا كان الهاتف في وضع الطيران أو لا يوجد إنترنت.
              </li>
              <li>
                <strong>مراعاة البطارية (setRequiresBatteryNotLow):</strong> لا يستهلك طاقة المعالج إذا كانت البطارية منخفضة.
              </li>
              <li>
                <strong>التشغيل عند الإقلاع (RECEIVE_BOOT_COMPLETED):</strong> إعادة جدولة المهام تلقائياً عند فتح الهاتف دون حاجة لفتح التطبيق يدوياً.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* No Shortcuts & White Screen UI Compliance */}
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">
              3. شرط الشاشة البيضاء الفارغة وعدم إنشاء اختصارات
            </h3>
            <span className="text-xs text-slate-400">تطبيق متطلبات المظهر الهادئ والصامت تماماً</span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block text-xs">منع الاختصارات والـ Widgets:</span>
              <p className="text-slate-400">
                ملف <code className="text-indigo-300 font-mono">AndroidManifest.xml</code> لا يحتوي على أي مستقبلات بث لإضافة اختصارات تلقائية، ولا يسجل أي AppWidgetProvider، مما يضمن خلو شاشة الهاتف الرئيسية تماماً.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block text-xs">الشاشة البيضاء الناصعة:</span>
              <p className="text-slate-400">
                تم ضبط سمة <code className="text-indigo-300 font-mono">Theme.CloudBackup.WhiteScreen</code> مع خلفية بيضاء خالصة وبدون Action Bar أو عناصر رسومية، محققة طلبك بدقة 100%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
