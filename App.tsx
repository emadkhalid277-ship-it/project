
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  INITIAL_STUDENTS as INITIAL_STUDENTS_MOCK, 
  INITIAL_GROUPS, 
  INITIAL_TEACHERS, 
  generateHistory 
} from './mockData';
import { 
  Student, 
  DailyRecord, 
  FollowUpRecord,
  EvaluationGrade,
  Teacher,
  Badge,
  GroundingLocation
} from './types';
import { NAVIGATION_ITEMS, EVALUATION_COLORS, QURAN_SURAHS } from './constants';
import { 
  Users, 
  Award, 
  Calendar, 
  ChevronLeft, 
  Search, 
  BookOpen, 
  XCircle, 
  Clock, 
  History, 
  BrainCircuit, 
  Bell, 
  Star, 
  Trophy, 
  UserCheck, 
  Sparkles, 
  Medal, 
  Crown, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogOut, 
  X, 
  BookMarked, 
  Phone, 
  CalendarDays, 
  Target, 
  ChevronDown, 
  TrendingUp, 
  Activity, 
  Zap, 
  Camera, 
  Loader2, 
  Check, 
  Quote, 
  Copy, 
  Share2, 
  Download, 
  Flame, 
  Lightbulb, 
  MapPin, 
  ExternalLink,
  Info,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { analyzeStudentProgress, generateStarPraise, generateCertificate, findNearbyCenters } from './geminiService';
import { uploadStudentPhoto } from './firebaseService';

const ALLOWED_TEACHERS_FOR_FOLLOWUP = [
  'm_loki', 'm_alzubaidi', 'a_alamoudi', 'mustafa', 'a_baraja', 'm_baarama', 'm_alkhatib', 'a_marouf', 'n_alkathiri'
];

const EVALUATION_POINTS: Record<EvaluationGrade, number> = {
  'ممتاز': 10, 'جيد جدًا': 7, 'جيد': 5, 'يحتاج متابعة': 2
};

const BADGES: Badge[] = [
  { id: 'b1', name: 'المواظب', icon: '🔥', color: 'bg-orange-100 text-orange-600', description: 'حضور 5 أيام متتالية' },
  { id: 'b2', name: 'المتقن', icon: '💎', color: 'bg-emerald-100 text-emerald-600', description: 'تقييم ممتاز لـ 3 أيام' },
  { id: 'b3', name: 'نجم الحلقة', icon: '⭐', color: 'bg-amber-100 text-amber-600', description: 'اختياره نجم اليوم' },
];

const NOTIFICATION_ICONS = {
  system: <BrainCircuit size={24} />,
  reminder: <Clock size={24} />,
  achievement: <Trophy size={24} />
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS_MOCK.map(s => ({ ...s, points: Math.floor(Math.random() * 100), streak: Math.floor(Math.random() * 7) })));
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [selectedStudentForAi, setSelectedStudentForAi] = useState<Student | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [starPraise, setStarPraise] = useState<string | null>(null);
  const [isGeneratingPraise, setIsGeneratingPraise] = useState(false);
  const [generatedCertificateUrl, setGeneratedCertificateUrl] = useState<string | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [discoveryData, setDiscoveryData] = useState<{ text: string; locations: GroundingLocation[] } | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statDetailModal, setStatDetailModal] = useState<{ type: string; students: Student[]; color: string } | null>(null);
  const [pickerModal, setPickerModal] = useState<{ studentId: string; type: 'memorization' | 'revision'; target: 'surah' | 'from' | 'to'; } | null>(null);

  useEffect(() => {
    setRecords(generateHistory(students));
  }, []);

  const teacherGroup = useMemo(() => INITIAL_GROUPS.find(g => g.teacherId === currentUser?.id), [currentUser]);
  const teacherStudents = useMemo(() => students.filter(s => s.groupId === teacherGroup?.id), [teacherGroup, students]);
  const isFollowUpAllowed = useMemo(() => currentUser ? ALLOWED_TEACHERS_FOR_FOLLOWUP.includes(currentUser.username) : false, [currentUser]);

  const sortedLeaderboard = useMemo(() => [...students].sort((a, b) => b.points - a.points), [students]);

  const stats = useMemo(() => {
    const todayRecords = records.filter(r => r.date === selectedDate && teacherStudents.some(s => s.id === r.studentId));
    const attendedCount = todayRecords.filter(r => r.attendance !== 'غائب').length;
    return {
      completionRate: teacherStudents.length ? Math.round((todayRecords.length / teacherStudents.length) * 100) : 0,
      attendanceRate: teacherStudents.length ? Math.round((attendedCount / teacherStudents.length) * 100) : 0,
      recitationCount: todayRecords.filter(r => r.recitation === 'سمّع').length,
      absenceCount: todayRecords.filter(r => r.attendance === 'غائب').length,
      lateCount: todayRecords.filter(r => r.attendance === 'متأخر').length,
      lists: {
        attended: teacherStudents.filter(s => todayRecords.some(r => r.studentId === s.id && r.attendance !== 'غائب')),
        absent: teacherStudents.filter(s => todayRecords.some(r => r.studentId === s.id && r.attendance === 'غائب')),
        late: teacherStudents.filter(s => todayRecords.some(r => r.studentId === s.id && r.attendance === 'متأخر')),
        recitation: teacherStudents.filter(s => todayRecords.some(r => r.studentId === s.id && r.recitation === 'سمّع'))
      }
    };
  }, [records, selectedDate, teacherStudents]);

  const starOfTheDay = useMemo(() => {
    if (teacherStudents.length === 0) return null;
    const todayReciters = records.filter(r => r.date === selectedDate && r.recitation === 'سمّع' && r.evaluation === 'ممتاز' && teacherStudents.some(ts => ts.id === r.studentId));
    if (todayReciters.length > 0) return teacherStudents.find(s => s.id === todayReciters[0].studentId) || teacherStudents[0];
    return teacherStudents[0];
  }, [selectedDate, records, teacherStudents]);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const res = await findNearbyCenters(pos.coords.latitude, pos.coords.longitude);
          setDiscoveryData(res);
          setIsDiscovering(false);
        }, () => {
          findNearbyCenters(24.7136, 46.6753).then(res => { setDiscoveryData(res); setIsDiscovering(false); });
        });
      } else {
        findNearbyCenters(24.7136, 46.6753).then(res => { setDiscoveryData(res); setIsDiscovering(false); });
      }
    } catch (e) {
      console.error(e);
      setIsDiscovering(false);
    }
  };

  const handleGeneratePraise = async () => {
    if (!starOfTheDay) return;
    setIsGeneratingPraise(true);
    try {
      const praise = await generateStarPraise(starOfTheDay, teacherGroup?.name || 'الحلقة');
      setStarPraise(praise);
    } finally { setIsGeneratingPraise(false); }
  };

  const updateDailyRecord = (studentId: string, field: keyof DailyRecord, value: any) => {
    setRecords(prev => {
      const existingIdx = prev.findIndex(r => r.studentId === studentId && r.date === selectedDate);
      let updated = [...prev];
      if (existingIdx !== -1) {
        updated[existingIdx] = { ...updated[existingIdx], [field]: value };
      } else {
        updated.push({ id: `rec-${studentId}-${selectedDate}`, studentId, date: selectedDate, attendance: 'حاضر', recitation: 'لم يسمّع', evaluation: 'جيد', notes: '', [field]: value } as DailyRecord);
      }
      
      if (field === 'evaluation') {
        const pts = EVALUATION_POINTS[value as EvaluationGrade] || 0;
        setStudents(sPrev => sPrev.map(s => s.id === studentId ? { ...s, points: s.points + pts } : s));
      }
      return updated;
    });
  };

  const renderDashboard = () => (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-900 rounded-[3rem] p-8 md:p-12 shadow-2xl text-white">
           <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/10">لوحة المتابعة الرئيسية</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter">أداء حلقة {teacherGroup?.name}</h2>
                <p className="opacity-70 text-sm md:text-xl mb-10 max-w-xl">مرحباً بك مجدداً يا أستاذ {currentUser?.name}. إليك نظرة شاملة لليوم.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 flex items-center gap-5">
                   <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"><UserCheck size={28}/></div>
                   <div>
                      <p className="text-sm font-bold opacity-60 leading-none mb-2">الطلاب الحاضرون</p>
                      <p className="text-3xl font-black leading-none">{stats.lists.attended.length} <span className="text-sm opacity-40">/ {teacherStudents.length}</span></p>
                   </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/10 flex items-center gap-5">
                   <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg"><Trophy size={28}/></div>
                   <div>
                      <p className="text-sm font-bold opacity-60 leading-none mb-2">أعلى رصيد نقاط</p>
                      <p className="text-3xl font-black leading-none">{Math.max(...teacherStudents.map(s => s.points))}</p>
                   </div>
                </div>
              </div>
           </div>
        </section>

        <section className="bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Crown size={120} /></div>
           <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4"><Crown className="text-amber-500 animate-bounce" size={28} /> نجم الحلقة اليوم</h3>
           {starOfTheDay ? (
             <div className="flex flex-col items-center text-center flex-1">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full scale-125 animate-pulse"></div>
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center font-black border-2 border-white shadow-md overflow-hidden">
                     {starOfTheDay.photoURL ? <img src={starOfTheDay.photoURL} className="w-full h-full object-cover" /> : starOfTheDay.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-2.5 rounded-full border-4 border-white shadow-xl"><Star size={20} fill="currentColor"/></div>
                </div>
                <h4 className="font-black text-slate-800 text-2xl mb-1">{starOfTheDay.name}</h4>
                <div className="w-full space-y-4 mt-auto">
                   {starPraise ? (
                     <div className="p-6 bg-amber-50 rounded-[2.5rem] border-2 border-amber-100 text-right animate-in zoom-in duration-500 relative">
                        <Quote className="absolute -top-4 -right-4 text-amber-200/50" size={48} />
                        <p className="text-sm font-bold text-amber-900 leading-relaxed italic relative z-10">"{starPraise}"</p>
                     </div>
                   ) : (
                     <button onClick={handleGeneratePraise} disabled={isGeneratingPraise} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-base flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-2xl active:scale-95 group">
                        {isGeneratingPraise ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="text-amber-400 group-hover:rotate-12 transition-transform" />}
                        توليد ثناء بليغ (AI)
                     </button>
                   )}
                </div>
             </div>
           ) : <div className="flex-1 flex flex-col items-center justify-center opacity-30 grayscale"><Star size={64} /><p className="font-black mt-4">بانتظار المتميزين...</p></div>}
        </section>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'نسبة الحضور', value: `${stats.attendanceRate}%`, color: 'bg-emerald-50', text: 'text-emerald-600', icon: <Users size={28} />, list: stats.lists.attended },
          { label: 'المسمّعين اليوم', value: stats.recitationCount, color: 'bg-blue-50', text: 'text-blue-600', icon: <BookOpen size={28} />, list: stats.lists.recitation },
          { label: 'الغياب', value: stats.absenceCount, color: 'bg-red-50', text: 'text-red-600', icon: <XCircle size={28} />, list: stats.lists.absent },
          { label: 'المتأخرين', value: stats.lateCount, color: 'bg-amber-50', text: 'text-amber-600', icon: <Clock size={28} />, list: stats.lists.late },
        ].map((stat, i) => (
          <button key={i} onClick={() => setStatDetailModal({ type: stat.label, students: stat.list, color: stat.text.replace('text', 'bg') })} className={`${stat.color} p-8 md:p-10 rounded-[3rem] border-2 border-transparent shadow-xl transition-all text-right group relative overflow-hidden hover:scale-[1.03]`}>
            <div className={`mb-4 ${stat.text} opacity-40 group-hover:opacity-100 group-hover:-translate-y-1 transition-all`}>{stat.icon}</div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">{stat.label}</span>
            <h3 className={`text-3xl md:text-5xl font-black ${stat.text} tracking-tighter`}>{stat.value}</h3>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-12">
      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-2 border-slate-50 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-6 text-emerald-600 bg-emerald-50 px-8 py-5 rounded-[2rem] border border-emerald-100 w-full md:w-auto">
          <Calendar size={32} />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-none focus:ring-0 text-2xl font-black bg-transparent p-0 cursor-pointer" />
        </div>
        <div className="relative w-full md:flex-1 md:max-w-2xl">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input type="text" placeholder="ابحث عن اسم الطالب..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-16 pl-8 py-6 bg-slate-50 border-none rounded-[2.5rem] text-lg font-bold outline-none shadow-inner" />
        </div>
      </div>
      <div className="bg-white rounded-[4rem] shadow-2xl border-2 border-slate-50 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right min-w-[900px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
              <tr>
                <th className="px-12 py-10">هوية الطالب</th>
                <th className="px-12 py-10">حالة الحضور</th>
                <th className="px-12 py-10">التسميع</th>
                <th className="px-12 py-10 text-center">التقييم اليومي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teacherStudents.filter(s => s.name.includes(searchTerm)).map(student => {
                const record = records.find(r => r.studentId === student.id && r.date === selectedDate) || { attendance: 'حاضر', recitation: 'لم يسمّع', evaluation: 'جيد' };
                return (
                  <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-12 py-8">
                       <button onClick={() => setSelectedStudentForProfile(student)} className="flex items-center gap-6 text-right outline-none">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black overflow-hidden">{student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : student.name.charAt(0)}</div>
                          <div>
                            <span className="font-black text-slate-800 block text-lg group-hover:text-emerald-600">{student.name}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{student.age} سنة • {student.memorizedParts} أجزاء</span>
                          </div>
                       </button>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex gap-2">
                        {['حاضر', 'غائب', 'متأخر'].map(st => (
                          <button key={st} onClick={() => updateDailyRecord(student.id, 'attendance', st)} className={`px-5 py-3 rounded-2xl text-[11px] font-black transition-all ${record.attendance === st ? (st === 'حاضر' ? 'bg-emerald-600 text-white shadow-lg' : st === 'غائب' ? 'bg-red-600 text-white shadow-lg' : 'bg-amber-500 text-white shadow-lg') : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{st}</button>
                        ))}
                      </div>
                    </td>
                    <td className="px-12 py-8">
                      <button onClick={() => updateDailyRecord(student.id, 'recitation', record.recitation === 'سمّع' ? 'لم يسمّع' : 'سمّع')} className={`w-32 py-3 rounded-2xl text-[11px] font-black border-2 transition-all ${record.recitation === 'سمّع' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-300 border-slate-100 hover:border-blue-200 hover:text-blue-400'}`}>
                        {record.recitation}
                      </button>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex justify-center">
                        <select value={record.evaluation} onChange={(e) => updateDailyRecord(student.id, 'evaluation', e.target.value as EvaluationGrade)} className={`text-[11px] font-black px-6 py-3 rounded-2xl border-none shadow-md outline-none cursor-pointer appearance-none transition-all hover:scale-105 ${EVALUATION_COLORS[record.evaluation as keyof typeof EVALUATION_COLORS] || ''}`}>
                          {['ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFollowUp = () => (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="bg-slate-900 p-12 md:p-20 rounded-[4rem] text-center relative overflow-hidden text-white shadow-2xl">
        <h3 className="text-3xl md:text-5xl font-black mb-4">المساعد القرآني الذكي</h3>
        <p className="text-emerald-100/50 max-w-2xl mx-auto text-base md:text-xl font-bold mb-16">تتبع دقيق لمواضع الحفظ والمراجعة لجميع الطلاب.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 text-right">
           {teacherStudents.map(s => (
             <div key={s.id} className="p-8 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h4 className="font-black text-xl text-white">{s.name}</h4>
                    <BookMarked size={24} className="text-emerald-400" />
                </div>
                <div className="space-y-4">
                   <div className="p-5 bg-white/5 rounded-2xl flex justify-between items-center text-white cursor-pointer hover:bg-white/10">
                      <div className="flex flex-col"><span className="text-[9px] text-emerald-400">سورة الحفظ</span><span className="text-lg font-black">البقرة</span></div>
                      <ChevronDown size={20} />
                   </div>
                   <div className="p-5 bg-white/5 rounded-2xl flex justify-between items-center text-white cursor-pointer hover:bg-white/10">
                      <div className="flex flex-col"><span className="text-[9px] text-blue-400">سورة المراجعة</span><span className="text-lg font-black">آل عمران</span></div>
                      <ChevronDown size={20} />
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-10 animate-in slide-in-from-bottom-10">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-5xl font-black tracking-tighter mb-4">لوحة الصدارة</h2>
          <p className="text-amber-100 text-lg font-bold">فرسان الحلقة المتميزون وأصحاب أعلى النقاط لهذا الفصل.</p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20">
           <Trophy size={80} className="text-amber-200 animate-bounce" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {sortedLeaderboard.slice(0, 3).map((s, i) => (
          <div key={s.id} className={`p-10 rounded-[4rem] border-2 shadow-xl flex flex-col items-center text-center transition-all hover:scale-105 ${i === 0 ? 'bg-amber-50 border-amber-200' : i === 1 ? 'bg-slate-50 border-slate-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="relative mb-8">
              <div className="absolute -top-6 -right-6 w-14 h-14 bg-white rounded-full flex items-center justify-center font-black text-2xl shadow-xl">
                 {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </div>
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[3rem] p-2 shadow-2xl overflow-hidden flex items-center justify-center text-3xl font-black text-slate-400">
                   {s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover" /> : s.name.charAt(0)}
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{s.name}</h3>
            <div className="flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-md font-black text-amber-600 text-lg">
               <Zap size={20} fill="currentColor"/> {s.points} نقطة
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-[4rem] border-2 border-slate-50 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                  <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">الترتيب</th>
                  <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">الطالب</th>
                  <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">النقاط</th>
                  <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">سلسلة المواظبة</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {sortedLeaderboard.slice(3, 15).map((s, idx) => (
                 <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-12 py-8 font-black text-slate-400">#{idx + 4}</td>
                   <td className="px-12 py-8">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">{s.name.charAt(0)}</div>
                         <span className="font-black text-slate-800">{s.name}</span>
                      </div>
                   </td>
                   <td className="px-12 py-8 font-black text-emerald-600">{s.points}</td>
                   <td className="px-12 py-8">
                      <div className="flex items-center gap-2 text-orange-500 font-black">
                         <Flame size={18} fill="currentColor" /> {s.streak} يوم
                      </div>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => {
    const handleAiAnalysisForStudent = async (student: Student) => {
      setSelectedStudentForAi(student);
      setIsAnalyzing(true);
      try {
        const studentRecords = records.filter(r => r.studentId === student.id);
        const analysis = await analyzeStudentProgress(student, studentRecords);
        setAiAnalysis(analysis);
      } finally { setIsAnalyzing(false); }
    };

    return (
      <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in">
         <div className="w-full lg:w-96 space-y-4">
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-4"><BrainCircuit className="text-emerald-500" /> تحليل الطلاب</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {teacherStudents.map(s => (
                 <button key={s.id} onClick={() => handleAiAnalysisForStudent(s)} className={`w-full p-6 rounded-[2.5rem] text-right transition-all flex items-center justify-between ${selectedStudentForAi?.id === s.id ? 'bg-emerald-600 text-white shadow-2xl' : 'bg-white border-2 border-slate-50 hover:border-emerald-200'}`}>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 overflow-hidden">{s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover" /> : s.name.charAt(0)}</div>
                       <span className="font-black">{s.name}</span>
                    </div>
                    <ChevronLeft size={20} />
                 </button>
              ))}
            </div>
         </div>
         <div className="flex-1">
            {selectedStudentForAi ? (
              <div className="space-y-10">
                 <div className="bg-slate-900 p-12 rounded-[4rem] text-white">
                    <h4 className="text-3xl font-black mb-10 flex items-center gap-4"><Sparkles className="text-amber-400" /> توصية Gemini التربوية</h4>
                    {isAnalyzing ? <div className="flex items-center gap-4"><Loader2 className="animate-spin" /> جاري التحليل...</div> : (
                      <div className="text-xl leading-relaxed italic">{aiAnalysis}</div>
                    )}
                 </div>
                 <div className="bg-white p-12 rounded-[4rem] shadow-2xl h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={records.filter(r => r.studentId === selectedStudentForAi.id).slice(-10).map(r => ({ date: r.date, points: EVALUATION_POINTS[r.evaluation] }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip />
                          <Area type="monotone" dataKey="points" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={4} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            ) : <div className="h-full flex flex-col items-center justify-center p-20 text-slate-300 font-black"><BrainCircuit size={80} className="mb-6 opacity-20" /> اختر طالباً لبدء التحليل الذكي</div>}
         </div>
      </div>
    );
  };

  const renderDiscover = () => (
    <div className="space-y-10 animate-in fade-in">
       <div className="bg-slate-900 p-12 md:p-20 rounded-[4rem] text-white relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-10"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
             <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl animate-float"><MapPin size={48}/></div>
             <h2 className="text-5xl font-black tracking-tighter mb-6">اكتشف مراكز قرآنية</h2>
             <p className="text-xl text-slate-400 font-bold mb-12">بتقنيات الذكاء الاصطناعي، نساعدك في العثور على أقرب مراكز التحفيظ والمساجد المعتمدة في منطقتك.</p>
             <button 
               onClick={handleDiscover}
               disabled={isDiscovering}
               className="px-12 py-6 bg-emerald-600 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition-all shadow-2xl flex items-center gap-4 mx-auto disabled:opacity-50"
             >
                {isDiscovering ? <Loader2 className="animate-spin" size={28}/> : <Sparkles size={28} />}
                {isDiscovering ? 'جاري البحث في الخرائط...' : 'ابحث الآن'}
             </button>
          </div>
       </div>

       {discoveryData && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-10">
            <div className="bg-white p-12 rounded-[4rem] border-2 border-slate-50 shadow-2xl">
               <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4"><Info className="text-emerald-500" /> توصية Gemini</h3>
               <div className="text-xl leading-relaxed text-slate-600 font-medium">
                  {discoveryData.text}
               </div>
            </div>
            <div className="bg-white p-12 rounded-[4rem] border-2 border-slate-50 shadow-2xl">
               <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4"><MapPin className="text-blue-500" /> النتائج في الخرائط</h3>
               <div className="space-y-4">
                  {discoveryData.locations.map((loc, i) => (
                    <a key={i} href={loc.uri} target="_blank" rel="noreferrer" className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-50 flex items-center justify-between hover:border-blue-200 hover:bg-blue-50 transition-all group shadow-sm">
                       <div>
                          <h4 className="font-black text-slate-800 text-lg">{loc.title}</h4>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 block">فتح في الخرائط</span>
                       </div>
                       <ExternalLink className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </a>
                  ))}
               </div>
            </div>
         </div>
       )}
    </div>
  );

  const renderStudents = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10 animate-in fade-in">
      {teacherStudents.filter(s => s.name.includes(searchTerm)).map(s => (
        <div key={s.id} className="p-10 bg-white rounded-[4rem] border-2 border-slate-50 shadow-2xl hover:shadow-xl transition-all flex flex-col items-center group">
           <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[3rem] flex items-center justify-center text-4xl font-black mb-8 overflow-hidden">{s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover" /> : s.name.charAt(0)}</div>
           <h4 className="font-black text-2xl mb-2">{s.name}</h4>
           <p className="text-[10px] font-black text-slate-300 uppercase mb-10">منذ {s.joinDate}</p>
           <button onClick={() => setSelectedStudentForProfile(s)} className="w-full py-5 bg-slate-900 text-white rounded-[2.5rem] font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 shadow-xl"><Eye size={20} /> عرض الملف</button>
        </div>
      ))}
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-12 animate-in fade-in">
       <h3 className="text-4xl font-black text-slate-800 tracking-tighter">إحصائيات المجموعات</h3>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {INITIAL_GROUPS.map((group, i) => {
            const gStudents = students.filter(s => s.groupId === group.id);
            return (
              <div key={i} className="p-10 bg-white rounded-[4rem] border-2 border-slate-50 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute top-0 left-0 w-3 h-full bg-emerald-500"></div>
                <h4 className="text-2xl font-black mb-10 flex items-center gap-4"><Target className="text-emerald-500" /> {group.name}</h4>
                <div className="grid grid-cols-2 gap-6">
                   <div className="flex flex-col p-6 bg-blue-50 rounded-[2.5rem]"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">الطلاب</span><span className="text-4xl font-black text-blue-700">{gStudents.length}</span></div>
                   <div className="flex flex-col p-6 bg-orange-50 rounded-[2.5rem]"><span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">النقاط</span><span className="text-4xl font-black text-orange-700">{gStudents.reduce((acc, s) => acc + s.points, 0)}</span></div>
                </div>
              </div>
            );
          })}
       </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-top-12">
       <h3 className="text-3xl font-black text-slate-800 mb-10">الإشعارات</h3>
       {[
         { title: 'تحليل Gemini جاهز', message: `تم إصدار تقرير جديد للطالب ${teacherStudents[0]?.name}.`, type: 'system', time: 'منذ ساعتين', new: true },
         { title: 'تذكير بالاختبارات', message: 'يرجى إتمام مراجعة الطلاب قبل موعد الاختبار يوم الخميس القادم.', type: 'reminder', time: 'منذ يوم', new: false },
       ].map((n, i) => (
         <div key={i} className={`bg-white p-8 rounded-[3rem] border-2 shadow-xl flex items-center gap-8 group hover:scale-[1.02] transition-all relative overflow-hidden ${n.new ? 'border-emerald-200' : 'border-slate-50'}`}>
            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center ${n.new ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>{NOTIFICATION_ICONS[n.type as keyof typeof NOTIFICATION_ICONS]}</div>
            <div className="flex-1 text-right">
               <h4 className="font-black text-xl text-slate-800">{n.title}</h4>
               <p className="text-base text-slate-400 mt-2 font-medium">{n.message}</p>
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{n.time}</span>
         </div>
       ))}
    </div>
  );

  const renderStatDetailModal = () => {
    if (!statDetailModal) return null;
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-in fade-in">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setStatDetailModal(null)}></div>
        <div className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 text-right">
           <div className={`p-10 flex items-center justify-between ${statDetailModal.color} text-white`}>
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{statDetailModal.type}</h3>
                <p className="text-[10px] font-black opacity-70 mt-2 uppercase tracking-widest">إجمالي الحالات: {statDetailModal.students.length}</p>
              </div>
              <button onClick={() => setStatDetailModal(null)} className="p-5 bg-white/20 rounded-full hover:bg-white/30 transition-all"><X size={28} /></button>
           </div>
           <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              {statDetailModal.students.length > 0 ? statDetailModal.students.map(s => (
                <div key={s.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-50 flex items-center justify-between group hover:border-emerald-200 hover:bg-white transition-all shadow-sm">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black overflow-hidden">{s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover" /> : s.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg">{s.name}</h4>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.phone}</span>
                      </div>
                   </div>
                   <button onClick={() => { setStatDetailModal(null); setSelectedStudentForProfile(s); }} className="p-4 bg-white text-slate-300 rounded-2xl group-hover:text-emerald-600 group-hover:shadow-lg transition-all"><Eye size={24}/></button>
                </div>
              )) : <div className="text-center py-20 opacity-20 flex flex-col items-center gap-6 grayscale"><Trophy size={80} /><p className="text-2xl font-black">لا توجد بيانات حالياً</p></div>}
           </div>
        </div>
      </div>
    );
  };

  const renderStudentProfileModal = () => {
    if (!selectedStudentForProfile) return null;
    const s = selectedStudentForProfile;
    const studentRecords = records.filter(r => r.studentId === s.id).sort((a,b) => b.date.localeCompare(a.date));
    
    return (
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" onClick={() => setSelectedStudentForProfile(null)}></div>
        <div className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12 max-h-[95vh] overflow-y-auto custom-scrollbar">
           <div className="h-48 bg-emerald-600 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')]"></div>
           </div>
           <div className="px-10 md:px-20 -mt-24 md:-mt-32 relative z-10 pb-20 text-right">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-10 mb-16">
                 <div className="relative group">
                    <div className="w-40 h-40 md:w-60 md:h-60 bg-white p-3 rounded-[4rem] shadow-2xl border-4 border-white overflow-hidden flex items-center justify-center text-6xl font-black text-emerald-600">
                       {s.photoURL ? <img src={s.photoURL} className="w-full h-full object-cover rounded-[3rem]" /> : s.name.charAt(0)}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-4 left-4 p-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl hover:bg-emerald-600 transition-all border-4 border-white group/btn">
                       {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} className="group-hover/btn:scale-110 transition-transform" />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                       const file = e.target.files?.[0];
                       if (!file) return;
                       setIsUploading(true);
                       try {
                          const url = await uploadStudentPhoto(s.id, file);
                          setStudents(prev => prev.map(st => st.id === s.id ? { ...st, photoURL: url } : st));
                          setSelectedStudentForProfile({ ...s, photoURL: url });
                       } finally { setIsUploading(false); }
                    }} />
                 </div>
                 <div className="flex-1">
                    <h3 className="text-3xl md:text-6xl font-black text-slate-800 tracking-tighter mb-2">{s.name}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                       <span className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full font-black text-sm flex items-center gap-2 border border-emerald-100"><Target size={16}/> حلقة {teacherGroup?.name}</span>
                       <span className="px-6 py-2 bg-amber-50 text-amber-600 rounded-full font-black text-sm flex items-center gap-2 border border-amber-100"><Zap size={16}/> {s.points} نقطة</span>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setSelectedStudentForProfile(null)} className="p-5 md:p-8 bg-slate-100 text-slate-400 rounded-[2.5rem] hover:bg-red-50 hover:text-red-500 transition-all shadow-lg"><X size={24}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                 {[ 
                   { icon: <TrendingUp className="text-emerald-500" />, label: 'الأجزاء المحفوظة', value: `${s.memorizedParts} أجزاء` }, 
                   { icon: <CalendarDays className="text-amber-500" />, label: 'تاريخ الانضمام', value: s.joinDate }, 
                   { icon: <Phone className="text-blue-500" />, label: 'الجوال', value: s.phone }, 
                   { icon: <Flame className="text-orange-500" />, label: 'سلسلة المواظبة', value: `${s.streak} يوم` } 
                 ].map((box, i) => (
                    <div key={i} className="p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-50 text-center transition-all hover:border-emerald-200 hover:bg-white hover:shadow-xl">
                       <div className="flex justify-center mb-4">{box.icon}</div>
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">{box.label}</p>
                       <p className="text-xl font-black text-slate-800">{box.value}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = INITIAL_TEACHERS.find(t => t.username === loginForm.username && t.password === loginForm.password);
    if (user) { setIsLoggedIn(true); setCurrentUser(user); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Tajawal']" dir="rtl">
          <div className="bg-white rounded-[4rem] shadow-2xl p-12 md:p-24 relative animate-in zoom-in duration-1000 w-full max-w-xl border border-slate-100">
            <div className="w-32 h-32 bg-emerald-600 rounded-[3.5rem] flex items-center justify-center shadow-2xl mb-16 mx-auto group"><Award className="text-white group-hover:scale-110 transition-transform" size={80} /></div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter mb-2 text-center">أبا الحسن</h1>
            <p className="text-slate-400 font-black mb-20 text-center text-[10px] uppercase tracking-[0.4em] opacity-60">نظام إدارة حلقات التحفيظ المتكامل</p>
            <form onSubmit={handleLoginSubmit} className="space-y-10">
              <input type="text" required placeholder="اسم المستخدم" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full px-8 py-8 bg-slate-50 border-none rounded-[2.5rem] text-xl font-bold outline-none focus:ring-8 focus:ring-emerald-500/5 shadow-inner transition-all" />
              <div className="relative group">
                 <input type={showPassword ? "text" : "password"} required placeholder="كلمة المرور" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full px-8 py-8 bg-slate-50 border-none rounded-[2.5rem] text-xl font-bold outline-none focus:ring-8 focus:ring-emerald-500/5 shadow-inner transition-all" />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors">{showPassword ? <EyeOff size={24}/> : <Eye size={24}/>}</button>
              </div>
              <button type="submit" className="w-full py-8 md:py-10 bg-emerald-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all">دخول النظام</button>
            </form>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 flex-col lg:flex-row overflow-hidden font-['Tajawal']" dir="rtl">
      <header className="lg:hidden bg-white border-b-2 border-slate-50 p-6 sticky top-0 z-[100] flex items-center justify-between shadow-xl">
         <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Award size={28} /></div><h1 className="text-xl font-black text-slate-800 tracking-tighter">أبا الحسن</h1></div>
         <button onClick={() => setActiveTab('notifications')} className="p-3 bg-slate-50 rounded-2xl relative"><Bell size={24} /></button>
      </header>

      <aside className="w-96 bg-white border-l-2 border-slate-50 hidden lg:flex flex-col shrink-0 shadow-2xl z-[100]">
        <div className="p-12 h-full flex flex-col">
          <div className="flex items-center gap-6 mb-20"><div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl"><Award size={36}/></div><h1 className="text-4xl font-black text-slate-800 tracking-tighter">أبا الحسن</h1></div>
          <nav className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {NAVIGATION_ITEMS.map(item => {
              if (item.restricted && !isFollowUpAllowed) return null;
              const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-6 px-10 py-6 rounded-[2.5rem] transition-all text-right group relative overflow-hidden ${active ? 'bg-emerald-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                  <div className={`transition-transform duration-500 group-hover:scale-125 ${active ? 'text-white' : 'text-slate-300 group-hover:text-emerald-500'}`}>{item.icon}</div>
                  <span className="font-black text-lg">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto pt-10 border-t-2 border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-5"><div className="w-16 h-16 rounded-[2rem] bg-emerald-100 flex items-center justify-center font-black text-emerald-700 shadow-xl border-2 border-white">{currentUser?.name.charAt(0)}</div><div><p className="font-black text-slate-800 text-base">{currentUser?.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معلم الحلقة</p></div></div>
            <button onClick={() => setIsLoggedIn(false)} className="p-4 text-slate-300 hover:text-red-500 rounded-2xl transition-all"><LogOut size={28} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative pb-28 lg:pb-0">
        <header className="h-40 bg-white border-b-2 border-slate-50 px-20 items-center justify-between shrink-0 hidden lg:flex shadow-xl z-10">
          <h2 className="text-6xl font-black text-slate-800 tracking-tighter mb-1 uppercase">حلقة {teacherGroup?.name}</h2>
          <div className="flex items-center gap-10">
             <span className="text-xl font-black text-slate-800">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
             <button onClick={() => setActiveTab('notifications')} className="p-6 bg-slate-50 rounded-[2rem] text-slate-400 relative hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">
                <Bell size={32} />
                <span className="absolute top-5 right-5 w-4 h-4 bg-red-500 rounded-full border-4 border-white animate-pulse"></span>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-20 bg-slate-50/30 custom-scrollbar">
           <div className="max-w-[1600px] mx-auto h-full text-right">
             {activeTab === 'dashboard' && renderDashboard()}
             {activeTab === 'attendance' && renderAttendance()}
             {activeTab === 'followup' && renderFollowUp()}
             {activeTab === 'leaderboard' && renderLeaderboard()}
             {activeTab === 'students' && renderStudents()}
             {activeTab === 'insights' && renderInsights()}
             {activeTab === 'discover' && renderDiscover()}
             {activeTab === 'statistics' && renderStatistics()}
             {activeTab === 'notifications' && renderNotifications()}
           </div>
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-50 px-6 py-5 z-[100] flex justify-around items-center shadow-2xl rounded-t-[3rem]">
         {NAVIGATION_ITEMS.filter(item => !item.restricted || isFollowUpAllowed).slice(0, 5).map(item => (
           <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-2 transition-all duration-500 ${activeTab === item.id ? 'text-emerald-600 scale-125' : 'text-slate-300'}`}>
             <div className={`p-3 rounded-[1.5rem] transition-all ${activeTab === item.id ? 'bg-emerald-50' : ''}`}>{item.icon}</div>
           </button>
         ))}
      </nav>

      {renderStatDetailModal()}
      {renderStudentProfileModal()}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 40px; border: 4px solid transparent; background-clip: content-box; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
