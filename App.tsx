
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  INITIAL_STUDENTS, 
  INITIAL_GROUPS, 
  INITIAL_TEACHERS, 
  generateHistory 
} from './mockData';
import { 
  Student, 
  Group, 
  Teacher, 
  DailyRecord, 
  FollowUpRecord,
  AttendanceStatus, 
  RecitationStatus, 
  EvaluationGrade,
  Notification
} from './types';
import { NAVIGATION_ITEMS, EVALUATION_COLORS, NOTIFICATION_ICONS, QURAN_SURAHS } from './constants';
import { 
  Users, 
  Award, 
  Calendar, 
  ChevronLeft, 
  Search, 
  Save, 
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
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Target,
  ChevronDown,
  ChevronRight,
  Check,
  TrendingUp,
  MapPin,
  CalendarCheck,
  Menu,
  Activity,
  Zap
} from 'lucide-react';
import { analyzeStudentProgress, generateStarPraise } from './geminiService';

const ALLOWED_TEACHERS_FOR_FOLLOWUP = [
  'm_loki', 
  'm_alzubaidi', 
  'a_alamoudi', 
  'mustafa', 
  'a_baraja', 
  'm_baarama', 
  'm_alkhatib',
  'a_marouf',
  'n_alkathiri'
];

const EVALUATION_POINTS: Record<EvaluationGrade, number> = {
  'ممتاز': 4,
  'جيد جدًا': 3,
  'جيد': 2,
  'يحتاج متابعة': 1
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [selectedStudentForAi, setSelectedStudentForAi] = useState<Student | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [statDetailModal, setStatDetailModal] = useState<{ type: string; students: Student[]; color: string } | null>(null);
  const [pickerModal, setPickerModal] = useState<{
    studentId: string;
    type: 'memorization' | 'revision';
    target: 'surah' | 'from' | 'to';
  } | null>(null);

  useEffect(() => {
    setRecords(generateHistory(INITIAL_STUDENTS));
  }, []);

  const teacherGroup = useMemo(() => 
    INITIAL_GROUPS.find(g => g.teacherId === currentUser?.id), 
  [currentUser]);

  const teacherStudents = useMemo(() => 
    INITIAL_STUDENTS.filter(s => s.groupId === teacherGroup?.id), 
  [teacherGroup]);

  const isFollowUpAllowed = useMemo(() => 
    currentUser ? ALLOWED_TEACHERS_FOR_FOLLOWUP.includes(currentUser.username) : false
  , [currentUser]);

  const topStudents = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const studentScores = teacherStudents.map(student => {
      const studentRecords = records.filter(r => r.studentId === student.id && last7Days.includes(r.date));
      if (studentRecords.length === 0) return { student, avgScore: 0 };
      
      const totalPoints = studentRecords.reduce((acc, r) => acc + (EVALUATION_POINTS[r.evaluation] || 0), 0);
      const avgScore = totalPoints / studentRecords.length;
      return { student, avgScore };
    });

    return [...studentScores].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  }, [records, teacherStudents]);

  const stats = useMemo(() => {
    const todayRecords = records.filter(r => r.date === selectedDate && teacherStudents.some(s => s.id === r.studentId));
    
    const attendedIds = todayRecords.filter(r => r.attendance === 'حاضر').map(r => r.studentId);
    const absentIds = todayRecords.filter(r => r.attendance === 'غائب').map(r => r.studentId);
    const lateIds = todayRecords.filter(r => r.attendance === 'متأخر').map(r => r.studentId);
    const recitationIds = todayRecords.filter(r => r.recitation === 'سمّع').map(r => r.studentId);

    const attendedStudents = teacherStudents.filter(s => attendedIds.includes(s.id));
    const absentStudents = teacherStudents.filter(s => absentIds.includes(s.id));
    const lateStudents = teacherStudents.filter(s => lateIds.includes(s.id));
    const recitationStudents = teacherStudents.filter(s => recitationIds.includes(s.id));

    const attendanceCount = attendedStudents.length + lateStudents.length;
    
    return {
      completionRate: teacherStudents.length ? Math.round((todayRecords.length / teacherStudents.length) * 100) : 0,
      attendanceRate: teacherStudents.length ? Math.round((attendanceCount / teacherStudents.length) * 100) : 0,
      attendanceCount,
      recitationCount: recitationStudents.length,
      absenceCount: absentStudents.length,
      lateCount: lateStudents.length,
      lists: { attended: attendedStudents, absent: absentStudents, late: lateStudents, recitation: recitationStudents }
    };
  }, [records, selectedDate, teacherStudents]);

  const globalStats = useMemo(() => {
    const allStats = INITIAL_GROUPS.map(group => {
      const gStudents = INITIAL_STUDENTS.filter(s => s.groupId === group.id);
      const gTodayRecords = records.filter(r => r.date === selectedDate && gStudents.some(s => s.id === r.studentId));
      const todayAtt = gTodayRecords.filter(r => r.attendance === 'حاضر' || r.attendance === 'متأخر').length;
      const todayRec = gTodayRecords.filter(r => r.recitation === 'سمّع').length;
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      });
      const weeklyRecords = records.filter(r => last7Days.includes(r.date) && gStudents.some(s => s.id === r.studentId));
      const weeklyAttRate = weeklyRecords.length ? (weeklyRecords.filter(r => r.attendance !== 'غائب').length / weeklyRecords.length) * 100 : 0;
      const weeklyRecRate = weeklyRecords.length ? (weeklyRecords.filter(r => r.recitation === 'سمّع').length / weeklyRecords.length) * 100 : 0;
      const weeklyScore = (weeklyAttRate * 0.4) + (weeklyRecRate * 0.6);
      return { group, todayAttRate: gStudents.length ? Math.round((todayAtt / gStudents.length) * 100) : 0, todayRecCount: todayRec, weeklyScore, weeklyAttRate: Math.round(weeklyAttRate), weeklyRecRate: Math.round(weeklyRecRate), studentCount: gStudents.length };
    });
    const bestGroup = [...allStats].sort((a, b) => b.weeklyScore - a.weeklyScore)[0];
    return { allGroups: allStats, bestWeeklyGroup: bestGroup };
  }, [records, selectedDate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = INITIAL_TEACHERS.find(t => t.username === loginForm.username && t.password === loginForm.password);
    if (user) { setIsLoggedIn(true); setCurrentUser(user); setLoginError(''); }
    else { setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة'); }
  };

  const handleLogout = () => { setIsLoggedIn(false); setCurrentUser(null); setActiveTab('dashboard'); };

  const updateDailyRecord = (studentId: string, field: keyof DailyRecord, value: any) => {
    setRecords(prev => {
      const date = selectedDate;
      const existingIdx = prev.findIndex(r => r.studentId === studentId && r.date === date);
      const newRecords = [...prev];
      if (existingIdx >= 0) newRecords[existingIdx] = { ...newRecords[existingIdx], [field]: value };
      else newRecords.push({ id: `${studentId}-${date}`, studentId, date, attendance: 'حاضر', recitation: 'لم يسمّع', evaluation: 'جيد', notes: '', [field]: value });
      return newRecords;
    });
  };

  const getFollowUpForStudent = (studentId: string): FollowUpRecord => {
    return followUpRecords.find(r => r.studentId === studentId && r.date === selectedDate) || {
      id: `${studentId}-${selectedDate}`,
      studentId,
      date: selectedDate,
      memorization: { surah: 'الفاتحة', fromVerse: '1', toVerse: '1' },
      revision: { surah: 'الفاتحة', fromVerse: '1', toVerse: '1' }
    };
  };

  const updateFollowUp = (studentId: string, type: 'memorization' | 'revision', field: string, value: string) => {
    setFollowUpRecords(prev => {
      const existingIdx = prev.findIndex(r => r.studentId === studentId && r.date === selectedDate);
      const newRecords = [...prev];
      let record: FollowUpRecord;
      
      if (existingIdx >= 0) {
        record = { ...newRecords[existingIdx] };
      } else {
        record = {
          id: `${studentId}-${selectedDate}`,
          studentId,
          date: selectedDate,
          memorization: { surah: 'الفاتحة', fromVerse: '1', toVerse: '1' },
          revision: { surah: 'الفاتحة', fromVerse: '1', toVerse: '1' }
        };
      }

      if (type === 'memorization') {
        record.memorization = { ...record.memorization, [field as keyof FollowUpRecord['memorization']]: value };
      } else {
        record.revision = { ...record.revision, [field as keyof FollowUpRecord['revision']]: value };
      }

      if (existingIdx >= 0) newRecords[existingIdx] = record;
      else newRecords.push(record);
      return newRecords;
    });
  };

  const handleAiAnalysis = async (student: Student) => {
    setSelectedStudentForAi(student);
    setIsAnalyzing(true);
    const studentRecords = records.filter(r => r.studentId === student.id);
    const result = await analyzeStudentProgress(student, studentRecords);
    setAiAnalysis(result || "عذراً، تعذر تحليل البيانات حالياً.");
    setIsAnalyzing(false);
  };

  const renderStatDetailModal = () => {
    if (!statDetailModal) return null;
    const { type, students, color } = statDetailModal;

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setStatDetailModal(null)}></div>
        <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
           <div className={`p-6 md:p-10 flex items-center justify-between ${color}`}>
              <div>
                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter">{type}</h3>
                <p className="text-white/80 text-xs md:text-sm font-bold mt-1">ليوم {selectedDate} ({students.length} طلاب)</p>
              </div>
              <button onClick={() => setStatDetailModal(null)} className="p-2 md:p-4 bg-white/20 hover:bg-white/40 rounded-full transition-colors text-white">
                <X size={20} />
              </button>
           </div>
           
           <div className="p-4 md:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {students.length > 0 ? (
                <div className="space-y-3">
                  {students.map(s => (
                    <div key={s.id} className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-emerald-200 transition-all">
                       <div className="flex items-center gap-3 md:gap-5">
                          <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-xl">{s.name.charAt(0)}</div>
                          <div>
                            <h4 className="font-black text-slate-800 text-sm md:text-lg leading-tight mb-1">{s.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs font-bold text-slate-400">
                               <span className="flex items-center gap-1"><Phone size={10}/> {s.phone}</span>
                               <span className="flex items-center gap-1"><BookMarked size={10}/> {s.memorizedParts} أجزاء</span>
                            </div>
                          </div>
                       </div>
                       <button onClick={() => { setStatDetailModal(null); setSelectedStudentForProfile(s); }} className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl text-slate-300 group-hover:text-emerald-500 shadow-sm border border-slate-50 transition-colors">
                          <Eye size={18} />
                       </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 md:py-20 text-center opacity-30 flex flex-col items-center gap-4">
                   <Users size={64} />
                   <p className="text-lg md:text-2xl font-black">لا يوجد طلاب في هذه القائمة</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const renderStudentProfileModal = () => {
    if (!selectedStudentForProfile) return null;
    const s = selectedStudentForProfile;
    const studentRecords = records.filter(r => r.studentId === s.id).sort((a,b) => b.date.localeCompare(a.date));
    const attRate = Math.round((studentRecords.filter(r => r.attendance !== 'غائب').length / studentRecords.length) * 100) || 0;

    return (
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" onClick={() => setSelectedStudentForProfile(null)}></div>
        <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] md:rounded-[5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
           <div className="h-32 md:h-48 bg-emerald-600 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-20 flex flex-wrap gap-4 p-4">
                 {Array.from({length: 40}).map((_,i) => <Sparkles key={i} size={16} className="text-white" />)}
              </div>
              <div className="absolute -bottom-1 left-0 w-full h-16 md:h-24 bg-gradient-to-t from-white to-transparent"></div>
           </div>
           
           <div className="px-6 md:px-12 -mt-12 md:-mt-20 relative z-10 pb-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 mb-8 md:mb-12">
                 <div className="w-24 h-24 md:w-40 md:h-40 bg-white p-2 md:p-3 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border-4 border-white">
                    <div className="w-full h-full bg-emerald-50 rounded-[1.6rem] md:rounded-[2.8rem] flex items-center justify-center text-emerald-600 text-3xl md:text-6xl font-black">{s.name.charAt(0)}</div>
                 </div>
                 <div className="flex-1 text-center md:text-right pb-2">
                    <h3 className="text-2xl md:text-5xl font-black text-slate-800 tracking-tighter mb-1">{s.name}</h3>
                    <p className="text-emerald-600 font-bold flex items-center justify-center md:justify-start gap-2 text-sm md:text-xl"><Target size={18}/> حلقة {teacherGroup?.name}</p>
                 </div>
                 <div className="flex gap-2 md:gap-4 pb-2">
                    <button onClick={() => { setSelectedStudentForProfile(null); handleAiAnalysis(s); setActiveTab('insights'); }} className="p-3 md:p-6 bg-slate-900 text-white rounded-xl md:rounded-[2rem] hover:bg-slate-800 transition-all flex items-center gap-2 md:gap-3 shadow-xl text-xs md:text-base"><BrainCircuit size={18}/> تحليل</button>
                    <button onClick={() => setSelectedStudentForProfile(null)} className="p-3 md:p-6 bg-slate-100 text-slate-400 rounded-xl md:rounded-[2rem] hover:bg-red-50 hover:text-red-500 transition-all"><X size={18}/></button>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
                 {[
                   { icon: <TrendingUp className="text-emerald-500" size={24}/>, label: 'نسبة الحضور', value: `${attRate}%` },
                   { icon: <BookMarked className="text-blue-500" size={24}/>, label: 'الأجزاء', value: s.memorizedParts },
                   { icon: <CalendarCheck className="text-amber-500" size={24}/>, label: 'العمر', value: s.age },
                   { icon: <Clock className="text-slate-400" size={24}/>, label: 'منذ', value: '2024' },
                 ].map((box, i) => (
                    <div key={i} className="p-4 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 text-center">
                        <div className="flex justify-center mb-2">{box.icon}</div>
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{box.label}</p>
                        <p className="text-lg md:text-3xl font-black text-slate-800">{box.value}</p>
                    </div>
                 ))}
              </div>

              <div className="bg-white border-2 border-slate-50 rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-sm">
                 <div className="p-5 md:p-8 bg-slate-50/50 border-b-2 border-slate-50 flex justify-between items-center"><h4 className="font-black text-lg md:text-2xl text-slate-800">آخر السجلات</h4><History size={18} className="text-slate-300" /></div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[400px]">
                       <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50"><tr><th className="p-4">التاريخ</th><th className="p-4">الحضور</th><th className="p-4">التسميع</th><th className="p-4">التقييم</th></tr></thead>
                       <tbody className="divide-y divide-slate-50">
                          {studentRecords.slice(0, 5).map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4 text-xs md:text-sm font-bold text-slate-600">{r.date}</td>
                               <td className="p-4"><span className={`px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-black ${r.attendance === 'حاضر' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.attendance}</span></td>
                               <td className="p-4 text-xs md:text-sm font-black text-slate-700">{r.recitation}</td>
                               <td className="p-4"><span className={`px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-black ${EVALUATION_COLORS[r.evaluation as keyof typeof EVALUATION_COLORS] || ''}`}>{r.evaluation}</span></td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <section className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl text-white">
           <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tighter">أداء حلقة {teacherGroup?.name}</h2>
              <p className="opacity-80 text-sm md:text-lg mb-6 md:mb-8">إليك ملخص الإنجاز اليومي لطلابك ليوم {selectedDate}.</p>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/20">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                   <span className="text-xs md:text-base font-bold">نسبة اكتمال السجل</span>
                   <span className="font-black text-lg md:text-2xl">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-white/20 h-2 md:h-4 rounded-full overflow-hidden">
                   <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${stats.completionRate}%` }}></div>
                </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </section>
        
        <section className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-xl border border-slate-100 flex flex-col">
           <h3 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-3"><Bell className="text-amber-500" size={20} /> التنبيهات</h3>
           <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {notifications.filter(n => !n.isRead).length > 0 ? (
                notifications.filter(n => !n.isRead).slice(0, 3).map(n => (
                  <div key={n.id} className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 animate-in slide-in-from-right">
                    <AlertTriangle className="text-amber-600 shrink-0" size={16} />
                    <p className="text-xs font-bold text-amber-900">{n.message}</p>
                  </div>
                ))
              ) : <div className="text-center py-6 opacity-30 text-slate-400 font-bold h-full flex flex-col justify-center items-center"><CheckCircle2 size={32} className="mb-2" /> لا توجد تنبيهات</div>}
           </div>
        </section>
      </div>

      <section className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 shadow-sm border-2 border-slate-50 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
           <div>
              <h3 className="text-xl md:text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3 md:gap-4">
                <Medal className="text-amber-500" size={24} />
                فرسان الأسبوع
              </h3>
              <p className="text-slate-400 text-xs md:text-sm font-bold mt-1">أفضل الطلاب المتميزين خلال آخر 7 أيام</p>
           </div>
           <div className="hidden md:flex gap-2">
              <Sparkles className="text-amber-300 animate-pulse" />
              <Sparkles className="text-emerald-300 animate-bounce delay-75" />
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 relative z-10">
           {topStudents.map((item, index) => {
             const colors = [
               { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: <Crown size={24} className="text-amber-500" /> },
               { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: <Medal size={24} className="text-slate-400" /> },
               { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', icon: <Medal size={24} className="text-orange-500" /> }
             ];
             const style = colors[index] || colors[1];
             
             return (
               <div key={item.student.id} className={`${style.bg} ${style.border} border-2 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 flex flex-col items-center text-center group hover:scale-[1.02] md:hover:scale-[1.05] transition-all duration-500 shadow-sm hover:shadow-2xl cursor-pointer`} onClick={() => setSelectedStudentForProfile(item.student)}>
                 <div className="relative mb-4 md:mb-6">
                    <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-[1.5rem] md:rounded-[3rem] flex items-center justify-center font-black text-2xl md:text-4xl shadow-xl border-4 border-white group-hover:rotate-6 transition-transform">
                      {item.student.name.charAt(0)}
                    </div>
                    <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-white p-2 md:p-3 rounded-full shadow-lg border border-slate-50">
                      {style.icon}
                    </div>
                 </div>
                 <h4 className="text-base md:text-2xl font-black text-slate-800 mb-2 md:mb-3 truncate w-full tracking-tighter">{item.student.name}</h4>
                 <div className="flex items-center gap-2">
                    <div className="bg-white/70 px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-white flex items-center gap-1 md:gap-2">
                       <Star size={12} className="text-amber-400 fill-amber-400" />
                       <span className={`font-black text-sm md:text-xl ${style.text}`}>{item.avgScore.toFixed(1)}</span>
                       <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">نقاط</span>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 opacity-30"></div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'حضور الحلقة', value: `${stats.attendanceRate}%`, color: 'bg-emerald-50', headerColor: 'bg-emerald-600', text: 'text-emerald-600', icon: <Users size={24} />, students: [...stats.lists.attended, ...stats.lists.late] },
          { label: 'المسمّعين اليوم', value: stats.recitationCount, color: 'bg-blue-50', headerColor: 'bg-blue-600', text: 'text-blue-600', icon: <BookOpen size={24} />, students: stats.lists.recitation },
          { label: 'الغيابات', value: stats.absenceCount, color: 'bg-red-50', headerColor: 'bg-red-600', text: 'text-red-600', icon: <XCircle size={24} />, students: stats.lists.absent },
          { label: 'المتأخرين', value: stats.lateCount, color: 'bg-amber-50', headerColor: 'bg-amber-600', text: 'text-amber-600', icon: <Clock size={24} />, students: stats.lists.late },
        ].map((stat, i) => (
          <button key={i} onClick={() => setStatDetailModal({ type: stat.label, students: stat.students, color: stat.headerColor })} className={`${stat.color} p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border-2 border-transparent shadow-sm text-right hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden`}>
            <div className={`mb-3 md:mb-4 ${stat.text} opacity-50`}>{stat.icon}</div>
            <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">{stat.label}</span>
            <h3 className={`text-3xl md:text-5xl font-black ${stat.text}`}>{stat.value}</h3>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-10">
      <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="flex items-center gap-4 md:gap-6 text-emerald-600 w-full md:w-auto">
          <Calendar size={28} />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-none focus:ring-0 text-xl md:text-3xl font-black bg-transparent p-0 cursor-pointer tracking-tighter" />
        </div>
        <div className="relative w-full md:flex-1 md:w-96">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="ابحث عن طالب..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-6 py-4 md:py-5 bg-slate-50 border-none rounded-2xl md:rounded-[2rem] text-sm md:text-base font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-inner" />
        </div>
      </div>
      <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl border-2 border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[700px]">
          <thead className="bg-slate-50 text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest border-b border-slate-100">
            <tr><th className="px-6 md:px-12 py-6 md:py-8">الطالب</th><th className="px-6 md:px-12 py-6 md:py-8">الحضور</th><th className="px-6 md:px-12 py-6 md:py-8">التسميع</th><th className="px-6 md:px-12 py-6 md:py-8">التقييم</th><th className="px-6 md:px-12 py-6 md:py-8 text-center">تميز</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {teacherStudents.filter(s => s.name.includes(searchTerm)).map(student => {
              const record = records.find(r => r.studentId === student.id && r.date === selectedDate) || { attendance: 'حاضر', recitation: 'لم يسمّع', evaluation: 'جيد' };
              return (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 md:px-12 py-6 md:py-8">
                     <button onClick={() => setSelectedStudentForProfile(student)} className="text-right hover:text-emerald-600 transition-colors">
                        <span className="font-black text-slate-800 block text-sm md:text-lg">{student.name}</span>
                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">عرض الملف</span>
                     </button>
                  </td>
                  <td className="px-6 md:px-12 py-6 md:py-8">
                    <div className="flex gap-1 md:gap-2">
                      {['حاضر', 'غائب', 'متأخر'].map(st => (
                        <button key={st} onClick={() => updateDailyRecord(student.id, 'attendance', st)} className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black transition-all ${record.attendance === st ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{st}</button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 md:px-12 py-6 md:py-8"><button onClick={() => updateDailyRecord(student.id, 'recitation', record.recitation === 'سمّع' ? 'لم يسمّع' : 'سمّع')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black border-2 transition-all ${record.recitation === 'سمّع' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-300 border-slate-100'}`}>{record.recitation}</button></td>
                  <td className="px-6 md:px-12 py-6 md:py-8"><select value={record.evaluation} onChange={(e) => updateDailyRecord(student.id, 'evaluation', e.target.value as EvaluationGrade)} className={`text-[8px] md:text-[10px] font-black px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border-none focus:ring-0 cursor-pointer shadow-sm ${EVALUATION_COLORS[record.evaluation as keyof typeof EVALUATION_COLORS] || ''}`}>{['ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة'].map(g => <option key={g} value={g}>{g}</option>)}</select></td>
                  <td className="px-6 md:px-12 py-6 md:py-8 text-center"><Star size={20} className={`${record.evaluation === 'ممتاز' ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFollowUp = () => (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700">
      <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[5rem] shadow-2xl border-2 border-slate-100 text-center flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="w-20 h-20 md:w-32 md:h-32 bg-emerald-100 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center mb-6 md:mb-8 shadow-inner z-10 text-emerald-600">
           <BrainCircuit size={48} md:size={70} />
        </div>
        <h3 className="text-2xl md:text-4xl font-black text-slate-800 mb-2 md:mb-4 z-10 tracking-tighter">المساعد القرآني الذكي</h3>
        <p className="text-slate-400 max-w-2xl text-sm md:text-lg font-bold opacity-80 mb-8 md:mb-12 z-10">اختر السورة والآيات بنقرة واحدة لتسجيل الإنجاز اليومي.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full max-w-7xl text-right">
           {teacherStudents.map(s => {
             const follow = getFollowUpForStudent(s.id);
             return (
               <div key={s.id} className="p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[4rem] border-2 border-slate-100 flex flex-col gap-6 md:gap-8 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                 <div className="flex items-center justify-between border-b-2 border-slate-50 pb-4 md:pb-6">
                    <div className="flex items-center gap-3 md:gap-5">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-600 text-white rounded-xl md:rounded-[1.75rem] flex items-center justify-center font-black text-xl md:text-2xl shadow-lg">{s.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-black text-lg md:text-2xl text-slate-800 leading-none mb-1">{s.name}</h4>
                        <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">إنجاز الطالب</p>
                      </div>
                    </div>
                 </div>
                 
                 <div className="space-y-6 md:space-y-8">
                    {/* Memorization */}
                    <div className="space-y-3">
                       <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] md:text-xs uppercase bg-emerald-50 w-fit px-3 py-1.5 rounded-full border border-emerald-100">
                         <Star size={14} fill="currentColor" />
                         <span>مقدار الحفظ الجديد</span>
                       </div>
                       <div className="grid grid-cols-1 gap-3">
                          <button 
                            onClick={() => setPickerModal({ studentId: s.id, type: 'memorization', target: 'surah' })}
                            className="w-full p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-[2rem] flex justify-between items-center transition-all text-right"
                          >
                            <div className="flex flex-col">
                               <span className="text-[8px] md:text-[10px] font-black text-slate-400">اسم السورة</span>
                               <span className="text-base md:text-lg font-black text-slate-800">{follow.memorization.surah || 'اختر...'}</span>
                            </div>
                            <ChevronDown size={18} className="text-emerald-600" />
                          </button>
                          <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => setPickerModal({ studentId: s.id, type: 'memorization', target: 'from' })} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex justify-between items-center text-right">
                               <div className="flex flex-col"><span className="text-[8px] text-slate-400">من</span><span className="font-black">{follow.memorization.fromVerse}</span></div>
                               <ChevronDown size={14} className="text-slate-300" />
                             </button>
                             <button onClick={() => setPickerModal({ studentId: s.id, type: 'memorization', target: 'to' })} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex justify-between items-center text-right">
                               <div className="flex flex-col"><span className="text-[8px] text-slate-400">إلى</span><span className="font-black">{follow.memorization.toVerse}</span></div>
                               <ChevronDown size={14} className="text-slate-300" />
                             </button>
                          </div>
                       </div>
                    </div>

                    {/* Revision */}
                    <div className="space-y-3">
                       <div className="flex items-center gap-2 text-blue-700 font-black text-[10px] md:text-xs uppercase bg-blue-50 w-fit px-3 py-1.5 rounded-full border border-blue-100">
                         <History size={14} />
                         <span>مقدار المراجعة</span>
                       </div>
                       <div className="grid grid-cols-1 gap-3">
                          <button 
                            onClick={() => setPickerModal({ studentId: s.id, type: 'revision', target: 'surah' })}
                            className="w-full p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-[2rem] flex justify-between items-center transition-all text-right"
                          >
                            <div className="flex flex-col">
                               <span className="text-[8px] md:text-[10px] font-black text-slate-400">اسم السورة</span>
                               <span className="text-base md:text-lg font-black text-slate-800">{follow.revision.surah || 'اختر...'}</span>
                            </div>
                            <ChevronDown size={18} className="text-blue-600" />
                          </button>
                       </div>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => {
    // Generate data for the chart based on student records
    const chartData = useMemo(() => {
      if (!selectedStudentForAi) return [];
      const studentRecords = records
        .filter(r => r.studentId === selectedStudentForAi.id)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-10); // Last 10 days
      
      return studentRecords.map(r => ({
        date: r.date.split('-').slice(1).join('/'),
        score: EVALUATION_POINTS[r.evaluation] || 0,
        fullDate: r.date,
        evaluation: r.evaluation
      }));
    }, [selectedStudentForAi, records]);

    const studentStats = useMemo(() => {
        if (!selectedStudentForAi) return null;
        const studentRecords = records.filter(r => r.studentId === selectedStudentForAi.id);
        const bestGrade = [...studentRecords].sort((a,b) => EVALUATION_POINTS[b.evaluation] - EVALUATION_POINTS[a.evaluation])[0];
        const attendanceCount = studentRecords.filter(r => r.attendance !== 'غائب').length;
        const recitationCount = studentRecords.filter(r => r.recitation === 'سمّع').length;
        
        return {
            totalDays: studentRecords.length,
            bestEvaluation: bestGrade?.evaluation || 'جيد',
            commitmentRate: studentRecords.length ? Math.round((attendanceCount / studentRecords.length) * 100) : 0,
            recitationPower: studentRecords.length ? Math.round((recitationCount / studentRecords.length) * 100) : 0
        };
    }, [selectedStudentForAi, records]);

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 md:gap-8 animate-in fade-in duration-1000">
          <aside className="w-full md:w-80 lg:w-96 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col shrink-0">
            <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100"><h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3"><BrainCircuit className="text-emerald-500" /> تتبع ذكي</h3></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
               {teacherStudents.map(s => (
                 <button key={s.id} onClick={() => handleAiAnalysis(s)} className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl text-right transition-all flex items-center justify-between group ${selectedStudentForAi?.id === s.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border-2 border-slate-50 hover:border-emerald-200'}`}>
                    <span className="font-black text-sm md:text-base">{s.name}</span>
                    <ChevronLeft className={`transition-transform ${selectedStudentForAi?.id === s.id ? 'translate-x-0' : 'translate-x-4 opacity-0 group-hover:opacity-100'}`} />
                 </button>
               ))}
            </div>
          </aside>
          
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
             {!selectedStudentForAi ? (
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 shadow-xl p-10 flex flex-col items-center justify-center text-center opacity-50 flex-1">
                   <div className="p-8 bg-emerald-50 rounded-full mb-6"><Activity size={64} className="text-emerald-300" /></div>
                   <h4 className="text-xl md:text-3xl font-black text-slate-400">لوحة المتابعة البصرية</h4>
                   <p className="font-bold text-sm md:text-lg mt-2">اختر طالباً لمشاهدة منحنى التطور وتقرير الذكاء الاصطناعي.</p>
                </div>
             ) : (
                <>
                  {/* Quick Dashboard Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                        { label: 'أعلى تقييم', value: studentStats?.bestEvaluation, icon: <Trophy size={18} className="text-amber-500"/>, color: 'bg-amber-50' },
                        { label: 'نسبة الالتزام', value: `${studentStats?.commitmentRate}%`, icon: <CheckCircle2 size={18} className="text-emerald-500"/>, color: 'bg-emerald-50' },
                        { label: 'قوة التسميع', value: `${studentStats?.recitationPower}%`, icon: <Zap size={18} className="text-blue-500"/>, color: 'bg-blue-50' },
                        { label: 'إجمالي الأيام', value: studentStats?.totalDays, icon: <Calendar size={18} className="text-slate-500"/>, color: 'bg-slate-50' },
                     ].map((card, idx) => (
                        <div key={idx} className={`${card.color} p-4 rounded-[1.5rem] border border-white/50 flex items-center gap-3`}>
                           <div className="bg-white/80 p-2 rounded-xl shadow-sm">{card.icon}</div>
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                              <p className="text-sm md:text-base font-black text-slate-800 leading-none">{card.value}</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Main Progress Chart */}
                  <div className="bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 shadow-xl p-6 md:p-8 flex-1 flex flex-col min-h-[400px]">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h4 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">منحنى التطور البياني</h4>
                           <p className="text-xs font-bold text-slate-400 mt-1">مستوى التقييم اليومي لـ {selectedStudentForAi.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستوى الفني</span>
                        </div>
                     </div>
                     
                     <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                 <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                 dataKey="date" 
                                 axisLine={false} 
                                 tickLine={false} 
                                 tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                                 dy={10}
                              />
                              <YAxis 
                                 domain={[0, 4]} 
                                 ticks={[1, 2, 3, 4]} 
                                 axisLine={false} 
                                 tickLine={false} 
                                 tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                 tickFormatter={(val) => {
                                    if (val === 4) return 'ممتاز';
                                    if (val === 3) return 'جيد ج';
                                    if (val === 2) return 'جيد';
                                    if (val === 1) return 'متابعة';
                                    return '';
                                 }}
                              />
                              <Tooltip 
                                 contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                 labelStyle={{ fontWeight: 'black', marginBottom: '5px' }}
                                 cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                                 formatter={(value, name, props) => [props.payload.evaluation, 'التقييم']}
                              />
                              <Area 
                                 type="monotone" 
                                 dataKey="score" 
                                 stroke="#10b981" 
                                 strokeWidth={4} 
                                 fillOpacity={1} 
                                 fill="url(#colorScore)" 
                                 animationDuration={2000}
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* AI Focused Feedback */}
                  <div className="bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-8 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400"><BrainCircuit size={24}/></div>
                           <h5 className="text-xl font-black tracking-tighter">خلاصة التحليل الذكي</h5>
                        </div>
                        {isAnalyzing ? (
                           <div className="flex items-center gap-4 animate-pulse">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                              <p className="text-emerald-400 font-bold">جاري استنتاج النصائح...</p>
                           </div>
                        ) : (
                           <div className="text-emerald-50/80 text-sm md:text-lg leading-relaxed font-medium">
                              {aiAnalysis || "اضغط على الطالب في القائمة اليمنى لعرض النصائح المخصصة."}
                           </div>
                        )}
                     </div>
                  </div>
                </>
             )}
          </div>
        </div>
    );
  };

  const renderStatistics = () => (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-1000">
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12 group">
        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform duration-1000"></div>
        <div className="relative z-10 p-6 md:p-8 bg-white/20 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] border border-white/30 shadow-2xl"><Trophy size={60} md:size={100} className="text-white animate-bounce" /></div>
        <div className="relative z-10 flex-1 text-center md:text-right">
           <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
              <span className="px-4 py-1.5 bg-white/20 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.2em] border border-white/20">تتويج الأسبوع</span>
           </div>
           <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">حلقة الأسبوع المثالية</h2>
           <p className="text-xl md:text-3xl font-bold text-amber-100 mb-6">{globalStats.bestWeeklyGroup?.group.name || 'جاري التحميل...'}</p>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10"><p className="text-[8px] md:text-[10px] opacity-60">الحضور</p><p className="text-lg md:text-2xl font-black">{globalStats.bestWeeklyGroup?.weeklyAttRate}%</p></div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10"><p className="text-[8px] md:text-[10px] opacity-60">التسميع</p><p className="text-lg md:text-2xl font-black">{globalStats.bestWeeklyGroup?.weeklyRecRate}%</p></div>
           </div>
        </div>
      </section>

      <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-2xl border-2 border-slate-100">
        <h3 className="text-xl md:text-4xl font-black text-slate-800 tracking-tighter mb-8 md:mb-12">إحصائيات جميع الحلقات</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
           {globalStats.allGroups.map(gs => (
             <div key={gs.group.id} className="p-6 md:p-8 bg-slate-50 rounded-2xl md:rounded-[3rem] border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-xl group">
               <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div><h4 className="text-base md:text-xl font-black text-slate-800">{gs.group.name}</h4><p className="text-[10px] md:text-xs text-slate-400">الطلاب: {gs.studentCount}</p></div>
                  <Target size={20} className="text-emerald-600" />
               </div>
               <div className="space-y-4 md:space-y-6">
                 <div><div className="flex justify-between text-[10px] md:text-xs font-black mb-2 uppercase tracking-widest"><span className="text-slate-500">اليوم</span><span className="text-emerald-600">{gs.todayAttRate}%</span></div><div className="w-full bg-slate-200 h-1.5 md:h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{ width: `${gs.todayAttRate}%` }}></div></div></div>
                 <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl border border-slate-100"><div className="flex items-center gap-2 md:gap-3"><BookOpen size={16} className="text-blue-500" /><span className="text-[10px] md:text-xs font-black text-slate-600">المسمّعين</span></div><span className="text-base md:text-lg font-black text-blue-600">{gs.todayRecCount}</span></div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-2xl border-2 border-slate-100 animate-in fade-in">
       <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-12 gap-4">
          <h3 className="text-2xl md:text-3xl font-black tracking-tighter">أرشيف السجلات اليومية</h3>
          <div className="bg-slate-50 px-6 py-3 rounded-full text-slate-500 font-bold text-sm">سجل طلاب حلقة {teacherGroup?.name}</div>
       </div>
       <div className="space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
         {records.filter(r => teacherStudents.some(s => s.id === r.studentId)).sort((a,b) => b.date.localeCompare(a.date)).map(r => (
           <div key={r.id} className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 font-black text-sm">{r.date.split('-')[2]}</div>
                <div>
                   <p className="font-black text-slate-800 text-sm md:text-base">{teacherStudents.find(s => s.id === r.studentId)?.name}</p>
                   <p className="text-[10px] md:text-xs text-slate-400 font-bold">{r.date}</p>
                </div>
             </div>
             <div className="flex gap-2 w-full md:w-auto justify-end">
               <span className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black ${r.attendance === 'حاضر' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.attendance}</span>
               <span className="px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black bg-blue-100 text-blue-700">{r.recitation}</span>
               <span className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black ${EVALUATION_COLORS[r.evaluation as keyof typeof EVALUATION_COLORS] || ''}`}>{r.evaluation}</span>
             </div>
           </div>
         ))}
       </div>
    </div>
  );

  const renderMobileHeader = () => (
    <header className="lg:hidden bg-white border-b-2 border-slate-100 p-4 sticky top-0 z-[100] flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Award size={24} /></div>
          <div>
            <h1 className="text-base font-black text-slate-800 leading-none">أبا الحسن</h1>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{teacherGroup?.name}</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('dashboard')} className="p-2 text-slate-400 relative">
             <Bell size={20} />
             <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600">{currentUser?.name.charAt(0)}</div>
       </div>
    </header>
  );

  const renderBottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-100 px-4 py-3 z-[100] flex justify-around items-center shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
       {NAVIGATION_ITEMS.filter(item => !item.restricted || isFollowUpAllowed).slice(0, 5).map(item => (
         <button 
           key={item.id} 
           onClick={() => setActiveTab(item.id)}
           className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-300'}`}
         >
           <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-50' : ''}`}>
             {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
           </div>
           <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
         </button>
       ))}
    </nav>
  );

  const renderPickerModal = () => {
    if (!pickerModal) return null;
    const { studentId, type, target } = pickerModal;
    const follow = getFollowUpForStudent(studentId);
    const selectedSurahName = type === 'memorization' ? follow.memorization.surah : follow.revision.surah;
    const surahData = QURAN_SURAHS.find(s => s.name === selectedSurahName) || QURAN_SURAHS[0];

    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPickerModal(null)}></div>
        <div className="relative w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
           <div className="p-6 md:p-10 border-b-2 border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div><h3 className="text-xl md:text-3xl font-black text-slate-800 tracking-tighter">{target === 'surah' ? 'اختر السورة' : `اختر الآية`}</h3><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{type === 'memorization' ? 'قسم الحفظ الجديد' : 'قسم المراجعة'}</p></div>
              <button onClick={() => setPickerModal(null)} className="p-2 md:p-4 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-red-500"><X size={24} /></button>
           </div>
           <div className="p-6 md:p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {target === 'surah' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                   {QURAN_SURAHS.map(s => (
                     <button key={s.id} onClick={() => { updateFollowUp(studentId, type, 'surah', s.name); setPickerModal(null); }} className={`p-4 md:p-6 rounded-2xl border-2 font-black text-sm md:text-lg transition-all text-center flex flex-col items-center justify-center gap-1 group ${selectedSurahName === s.name ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                        <span className="text-[8px] font-black opacity-50">{s.id}</span>
                        <span>{s.name}</span>
                        <span className="text-[7px] font-bold opacity-40">{s.verses} آية</span>
                     </button>
                   ))}
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8">
                   <div className="bg-emerald-50 p-4 md:p-6 rounded-2xl border border-emerald-100 flex items-center justify-between"><span className="font-black text-emerald-800">السورة:</span><span className="text-xl md:text-2xl font-black text-emerald-600">{surahData.name}</span></div>
                   <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 md:gap-3">
                      {Array.from({ length: surahData.verses }, (_, i) => i + 1).map(v => (
                        <button key={v} onClick={() => { updateFollowUp(studentId, type, target === 'from' ? 'fromVerse' : 'toVerse', v.toString()); setPickerModal(null); }} className={`p-3 md:p-4 rounded-xl font-black text-xs md:text-sm border-2 transition-all ${((target === 'from' && follow[type].fromVerse === v.toString()) || (target === 'to' && follow[type].toVerse === v.toString())) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200'}`}>{v}</button>
                      ))}
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col items-center p-8 md:p-20 relative animate-in fade-in zoom-in duration-700">
            <div className="absolute top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-600"></div>
            <div className="w-20 h-20 md:w-32 md:h-32 bg-emerald-600 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-600/40 mb-8 md:mb-12"><Award className="text-white" size={40} /></div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter mb-1">أبا الحسن</h1>
            <p className="text-slate-400 font-bold mb-10 md:mb-16 uppercase tracking-[0.2em] text-[9px] md:text-[11px]">نظام إدارة الحلقات المتقدم</p>
            <form onSubmit={handleLogin} className="w-full space-y-6 md:space-y-8">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم المستخدم</label><div className="relative group"><User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} /><input type="text" required placeholder="أدخل اسم المستخدم..." value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full pr-12 pl-4 py-4 md:py-6 bg-slate-50 border-none rounded-2xl md:rounded-[2rem] text-sm md:text-base font-bold outline-none shadow-inner" /></div></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">كلمة المرور</label><div className="relative group"><Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} /><input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full pr-12 pl-12 py-4 md:py-6 bg-slate-50 border-none rounded-2xl md:rounded-[2rem] text-sm md:text-base font-bold outline-none shadow-inner" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>
              {loginError && <div className="text-red-500 text-[10px] md:text-xs font-black text-center animate-bounce">{loginError}</div>}
              <button type="submit" className="w-full py-5 md:py-8 bg-emerald-600 text-white rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl shadow-2xl hover:bg-emerald-700 transition-all active:scale-95">تسجيل الدخول</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 flex-col lg:flex-row overflow-hidden font-['Tajawal']" dir="rtl">
      {renderMobileHeader()}
      
      <aside className="w-80 md:w-96 bg-white border-l-2 border-slate-100 flex flex-col hidden lg:flex shrink-0 shadow-2xl z-[100]">
        <div className="p-10 md:p-12 h-full flex flex-col">
          <div className="flex flex-col mb-12 md:mb-16 gap-4 md:gap-6">
            <div className="flex items-center gap-4 md:gap-6 group">
              <div className="w-14 h-14 md:w-18 md:h-18 bg-emerald-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl text-white group-hover:scale-110 transition-transform">
                <Award size={32} md:size={42} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter leading-none">أبا الحسن</h1>
                <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">جامع أبا الحسن</p>
              </div>
            </div>
          </div>
          <nav className="space-y-3 md:space-y-4 flex-1">
            {NAVIGATION_ITEMS.map(item => {
              if (item.restricted && !isFollowUpAllowed) return null;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-between px-6 md:px-8 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] transition-all group ${isActive ? 'bg-emerald-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-emerald-50'}`}>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div>{item.icon}</div>
                    <span className="font-black text-sm md:text-base">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto pt-6 md:pt-10 border-t-2 border-slate-50">
            <div className="flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] bg-slate-50 shadow-inner">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-3xl bg-emerald-100 flex items-center justify-center font-black text-emerald-700">{currentUser?.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-base font-black text-slate-800 truncate">{currentUser?.name}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-colors"><LogOut size={20} md:size={24} /></button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative pb-20 lg:pb-0">
        <header className="h-24 md:h-32 bg-white border-b-2 border-slate-100 px-10 md:px-20 items-center justify-between shrink-0 z-40 hidden lg:flex">
          <div className="animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter mb-1">أهلاً بك، {currentUser?.name.split(' ')[1]} 👋</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-emerald-50 text-emerald-700 px-6 py-4 md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] border-2 border-emerald-100 font-black text-xs md:text-sm flex items-center gap-2 md:gap-3 shadow-sm">
              <UserCheck size={18} md:size={20}/> {teacherGroup?.name}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-20 bg-slate-50/50 custom-scrollbar">
           <div className="max-w-[1500px] mx-auto h-full">
             {activeTab === 'dashboard' && renderDashboard()}
             {activeTab === 'attendance' && renderAttendance()}
             {activeTab === 'followup' && renderFollowUp()}
             {activeTab === 'insights' && renderInsights()}
             {activeTab === 'statistics' && renderStatistics()}
             {activeTab === 'history' && renderHistoryTab()}
             {activeTab === 'students' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                 {teacherStudents.map(s => (
                   <div key={s.id} className="p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 shadow-xl hover:shadow-2xl transition-all">
                      <div className="flex items-center gap-4 md:gap-5 mb-6">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl">{s.name.charAt(0)}</div>
                        <h4 className="font-black text-base md:text-xl">{s.name}</h4>
                      </div>
                      <button onClick={() => setSelectedStudentForProfile(s)} className="w-full py-3 md:py-4 bg-slate-50 text-slate-500 rounded-xl md:rounded-2xl font-black hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 text-xs md:text-base">
                        <Eye size={16} md:size={18} /> عرض الملف الكامل
                      </button>
                   </div>
                 ))}
               </div>
             )}
             {activeTab === 'notifications' && (
                <div className="bg-white p-8 rounded-[3rem] shadow-xl max-w-2xl mx-auto border-2 border-slate-50">
                   <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Bell className="text-amber-500" /> مركز الإشعارات</h3>
                   <div className="space-y-4">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                           {NOTIFICATION_ICONS[n.type] || <Star className="text-amber-500" />}
                           <div><p className="font-bold text-slate-800">{n.title}</p><p className="text-sm text-slate-500 mt-1">{n.message}</p></div>
                        </div>
                      )) : <p className="text-center py-10 text-slate-400 font-bold">لا توجد إشعارات جديدة</p>}
                   </div>
                </div>
             )}
           </div>
        </div>
      </main>
      
      {renderBottomNav()}
      {renderStatDetailModal()}
      {renderStudentProfileModal()}
      {renderPickerModal()}
      
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }`}</style>
    </div>
  );
};

export default App;
