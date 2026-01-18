
import React, { useState, useMemo, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  INITIAL_STUDENTS as INITIAL_STUDENTS_MOCK, 
  INITIAL_GROUPS as INITIAL_GROUPS_MOCK, 
  INITIAL_TEACHERS, 
  generateHistory 
} from './mockData';
import { 
  Student, 
  DailyRecord, 
  Teacher,
  Group,
  AttendanceStatus,
  EvaluationGrade
} from './types';
import { TEACHER_NAV, ADMIN_NAV, EVALUATION_COLORS } from './constants';
import { 
  Users, 
  Award, 
  Calendar, 
  ChevronLeft, 
  Search, 
  BookOpen, 
  Clock, 
  Bell, 
  Trophy, 
  UserCheck, 
  LogOut, 
  Activity, 
  Zap, 
  BarChart3, 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  Layers, 
  Eye, 
  EyeOff, 
  UserPlus, 
  ChevronRight, 
  GraduationCap, 
  Globe, 
  Briefcase, 
  X,
  LayoutDashboard,
  Star,
  MapPin,
  ExternalLink,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Phone,
  User,
  Flag,
  ShieldCheck,
  Menu,
  FileBarChart,
  BrainCircuit,
  BookMarked,
  ClipboardList,
  CheckCircle,
  MessageSquare,
  Sparkle
} from 'lucide-react';
import { analyzeStudentProgress } from './geminiService';

type AuthStage = 'selecting' | 'staff-login' | 'student-login' | 'guest-view' | 'authenticated-staff' | 'authenticated-student';

const App: React.FC = () => {
  const [authStage, setAuthStage] = useState<AuthStage>('selecting');
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subForm, setSubForm] = useState({ name: '', nationality: '', age: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  const MANAGER_PHONE = "0501234567"; 

  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS_MOCK);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [records, setRecords] = useState<DailyRecord[]>([]);

  useEffect(() => {
    setStudents(INITIAL_STUDENTS_MOCK);
    setRecords(generateHistory(INITIAL_STUDENTS_MOCK));
  }, []);

  const navigation = useMemo(() => {
    if (authStage === 'authenticated-staff' && currentUser) {
      return currentUser.role === 'admin' ? ADMIN_NAV : TEACHER_NAV;
    }
    if (authStage === 'authenticated-student') {
      return [
        { id: 'student_profile', label: 'ملفي الشخصي', icon: <LayoutDashboard size={20} /> },
        { id: 'student_progress', label: 'سجلي اليومي', icon: <ClipboardList size={20} /> },
        { id: 'student_badges', label: 'أوسمتي', icon: <Award size={20} /> }
      ];
    }
    return [];
  }, [authStage, currentUser]);

  useEffect(() => {
    if (authStage === 'authenticated-staff' && currentUser && !activeTab) {
      setActiveTab(currentUser.role === 'admin' ? 'admin_dashboard' : 'dashboard');
    }
    if (authStage === 'authenticated-student' && !activeTab) {
      setActiveTab('student_profile');
    }
  }, [authStage, currentUser]);

  const teacherGroup = useMemo(() => groups.find(g => g.teacherId === currentUser?.id), [currentUser, groups]);
  const teacherStudents = useMemo(() => students.filter(s => s.groupId === teacherGroup?.id), [teacherGroup, students]);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = teachers.find(t => t.name === loginForm.username && loginForm.password === '1234');
    if (user) {
      setCurrentUser(user);
      setAuthStage('authenticated-staff');
    } else {
      alert("البيانات غير صحيحة. استخدم الرمز الموحد 1234.");
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.name === loginForm.username && loginForm.password === '1234');
    if (student) {
      setCurrentStudent(student);
      setAuthStage('authenticated-student');
    } else {
      alert("الرمز غير صحيح. الرمز الموحد هو 1234.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentStudent(null);
    setAuthStage('selecting');
    setActiveTab('');
    setLoginForm({ username: '', password: '' });
  };

  const handleSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSuccess(true);
    setIsSubmitting(false);
  };

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => 
      r.studentId === studentId ? { ...r, attendance: status } : r
    ));
  };

  const runAiAnalysis = async (student: Student) => {
    setAnalyzingId(student.id);
    const studentRecords = records.filter(r => r.studentId === student.id);
    const advice = await analyzeStudentProgress(student, studentRecords);
    setAiAnalysis(prev => ({ ...prev, [student.id]: advice || "لا توجد بيانات كافية للتحليل حالياً." }));
    setAnalyzingId(null);
  };

  const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 ${className}`}>
      {children}
    </div>
  );

  const StatBox = ({ label, value, icon, color }: any) => (
    <Card className="flex items-center gap-6 hover:translate-y-[-5px] transition-all cursor-pointer">
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 mb-1">{label}</p>
        <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
      </div>
    </Card>
  );

  // Added missing renderPlaceholder function to fix the ReferenceError on line 592
  const renderPlaceholder = (title: string, icon: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in py-10">
      <div className="text-slate-200">
        {icon}
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-slate-800">{title}</h3>
        <p className="text-slate-400 font-bold text-lg">هذا القسم متاح قريباً في التحديث القادم.</p>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black text-slate-800">رصد الحضور اليومي</h3>
          <p className="text-slate-400 font-bold mt-1">تاريخ اليوم: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 font-black text-slate-500">الطالب</th>
              <th className="px-8 py-6 font-black text-slate-500 text-center">الحالة</th>
              <th className="px-8 py-6 font-black text-slate-500">ملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {teacherStudents.map(s => {
              const record = records.find(r => r.studentId === s.id);
              return (
                <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">{s.name.charAt(0)}</div>
                    <span className="font-black text-slate-700">{s.name}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-3">
                      {(['حاضر', 'غائب', 'متأخر'] as AttendanceStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => updateAttendance(s.id, status)}
                          className={`px-6 py-2 rounded-xl font-black text-sm transition-all ${record?.attendance === status ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <input type="text" placeholder="أضف ملاحظة..." className="w-full bg-slate-50 px-4 py-2 rounded-lg text-sm border border-transparent focus:border-emerald-200 outline-none" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const renderFollowUp = () => (
    <div className="space-y-8 animate-in fade-in">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 space-y-6">
             <h4 className="text-xl font-black">اختيار الطالب</h4>
             <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {teacherStudents.map(s => (
                  <button key={s.id} className="w-full text-right p-4 rounded-2xl hover:bg-emerald-50 border border-slate-50 flex items-center gap-4 group transition-all">
                     <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">{s.name.charAt(0)}</div>
                     <span className="font-bold text-slate-700 group-hover:text-emerald-700">{s.name}</span>
                  </button>
                ))}
             </div>
          </Card>
          <Card className="lg:col-span-2 space-y-10">
             <h4 className="text-2xl font-black">تسجيل تسميع ومراجعة</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h5 className="font-black text-emerald-600 flex items-center gap-2"><BookOpen size={18}/> الحفظ الجديد</h5>
                   <input type="text" placeholder="اسم السورة" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-emerald-100" />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="من آية" className="w-full p-4 bg-slate-50 rounded-2xl border-none" />
                      <input type="text" placeholder="إلى آية" className="w-full p-4 bg-slate-50 rounded-2xl border-none" />
                   </div>
                </div>
                <div className="space-y-4">
                   <h5 className="font-black text-blue-600 flex items-center gap-2"><Activity size={18}/> المراجعة</h5>
                   <input type="text" placeholder="اسم السورة" className="w-full p-4 bg-slate-50 rounded-2xl border-none" />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="من" className="w-full p-4 bg-slate-50 rounded-2xl border-none" />
                      <input type="text" placeholder="إلى" className="w-full p-4 bg-slate-50 rounded-2xl border-none" />
                   </div>
                </div>
             </div>
             <div className="space-y-4">
                <h5 className="font-black text-slate-800">التقييم اليومي</h5>
                <div className="flex flex-wrap gap-4">
                   {(['ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة'] as EvaluationGrade[]).map(grade => (
                     <button key={grade} className={`px-8 py-3 rounded-2xl font-black text-sm border-2 ${EVALUATION_COLORS[grade]} border-transparent hover:border-emerald-200 transition-all`}>
                        {grade}
                     </button>
                   ))}
                </div>
             </div>
             <button className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-emerald-100">حفظ السجل</button>
          </Card>
       </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-8 animate-in zoom-in-95">
      <div className="flex items-center gap-4 mb-10">
         <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-blue-100"><BrainCircuit size={32}/></div>
         <div>
            <h3 className="text-3xl font-black text-slate-800">ذكاء تربوي (AI)</h3>
            <p className="text-slate-400 font-bold">استخدم الذكاء الاصطناعي لتحليل أداء طلابك وتقديم نصائح مخصصة.</p>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {teacherStudents.map(s => (
          <Card key={s.id} className="relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">{s.name.charAt(0)}</div>
                  <h4 className="text-xl font-black text-slate-800">{s.name}</h4>
               </div>
               <button 
                 onClick={() => runAiAnalysis(s)}
                 disabled={analyzingId === s.id}
                 className={`p-4 rounded-2xl ${analyzingId === s.id ? 'bg-slate-100 text-slate-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'} transition-all`}
               >
                 {analyzingId === s.id ? <Clock size={24} className="animate-spin"/> : <Sparkles size={24}/>}
               </button>
            </div>
            {aiAnalysis[s.id] ? (
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in slide-in-from-top-2">
                 <p className="text-emerald-900 font-bold leading-relaxed">{aiAnalysis[s.id]}</p>
              </div>
            ) : (
              <div className="h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 font-bold italic">انقر على أيقونة التحليل للبدء</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLeaderboard = () => {
    const sorted = [...students].sort((a, b) => b.points - a.points).slice(0, 10);
    return (
      <div className="space-y-10 animate-in fade-in">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
           <Trophy size={80} className="mx-auto text-amber-500 animate-bounce" />
           <h3 className="text-5xl font-black text-slate-800 tracking-tighter">لوحة الصدارة والتميز</h3>
           <p className="text-slate-400 font-bold text-lg">أفضل الطلاب تفاعلاً وإنجازاً في مجمع أبا الحسن</p>
        </div>
        <div className="max-w-4xl mx-auto space-y-4">
          {sorted.map((s, idx) => (
            <Card key={s.id} className={`p-6 flex items-center justify-between transition-all ${idx === 0 ? 'border-amber-400 ring-4 ring-amber-50' : ''}`}>
              <div className="flex items-center gap-8">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-300 text-slate-800' : 'bg-slate-50 text-slate-400'}`}>
                   {idx + 1}
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400">{s.name.charAt(0)}</div>
                    <div>
                       <h4 className="text-xl font-black text-slate-800">{s.name}</h4>
                       <p className="text-sm font-bold text-slate-400">حلقة: {groups.find(g => g.id === s.groupId)?.name}</p>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-10">
                 <div className="text-center">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">النقاط</p>
                    <p className="text-3xl font-black text-emerald-600">{s.points}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">المستوى</p>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500" style={{ width: `${(s.points / 200) * 100}%` }}></div>
                    </div>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderStudentRecords = () => {
    const studentRecords = records.filter(r => r.studentId === currentStudent?.id).sort((a,b) => b.date.localeCompare(a.date));
    return (
      <div className="space-y-8 animate-in slide-in-from-right-10">
        <h3 className="text-3xl font-black text-slate-800">سجلي اليومي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {studentRecords.map(r => (
             <Card key={r.id} className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-2 h-full ${r.attendance === 'حاضر' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-slate-300"/>
                      <span className="font-black text-slate-800 text-lg">{r.date}</span>
                   </div>
                   <span className={`px-4 py-1.5 rounded-full font-black text-xs ${r.attendance === 'حاضر' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{r.attendance}</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400">التسميع</p>
                      <p className="font-black text-slate-700">{r.recitation}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400">التقييم</p>
                      <span className={`px-3 py-1 rounded-lg font-black text-sm ${EVALUATION_COLORS[r.evaluation]}`}>{r.evaluation}</span>
                   </div>
                </div>
                {r.notes && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                     <MessageSquare size={16} className="text-slate-300 shrink-0"/>
                     <p className="text-sm font-bold text-slate-500 italic">{r.notes}</p>
                  </div>
                )}
             </Card>
           ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'admin_dashboard':
        return (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatBox label="إجمالي الطلاب" value={students.length} icon={<Users size={28}/>} color="bg-emerald-50 text-emerald-600" />
              <StatBox label="إجمالي الحلقات" value={groups.length} icon={<Layers size={28}/>} color="bg-amber-50 text-amber-600" />
              <StatBox label="المعلمون" value={teachers.length - 1} icon={<UserPlus size={28}/>} color="bg-blue-50 text-blue-600" />
              <StatBox label="نسبة الحضور" value="96%" icon={<Activity size={28}/>} color="bg-purple-50 text-purple-600" />
            </div>
            <Card className="p-12">
              <h3 className="text-2xl font-black mb-8">إحصائيات المجمع</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groups.map(g => ({ name: g.name, students: students.filter(s => s.groupId === g.id).length }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="students" fill="#059669" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        );
      case 'dashboard':
        return (
          <div className="space-y-10 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatBox label="طلاب حلقتك" value={teacherStudents.length} icon={<Users size={28}/>} color="bg-emerald-50 text-emerald-600" />
                <StatBox label="الحضور اليومي" value={`${teacherStudents.length}/${teacherStudents.length}`} icon={<UserCheck size={28}/>} color="bg-blue-50 text-blue-600" />
                <StatBox label="أوسمة موزعة" value="12" icon={<Award size={28}/>} color="bg-amber-50 text-amber-600" />
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-10">
                   <h3 className="text-2xl font-black mb-8">طلاب متميزون هذا الأسبوع</h3>
                   <div className="space-y-6">
                      {teacherStudents.slice(0, 4).map(s => (
                        <div key={s.id} className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center font-black">{s.name.charAt(0)}</div>
                              <span className="font-bold text-slate-700">{s.name}</span>
                           </div>
                           <div className="flex gap-1 text-amber-400"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                        </div>
                      ))}
                   </div>
                </Card>
                <Card className="p-10 bg-emerald-600 text-white border-none">
                   <h3 className="text-2xl font-black mb-4">رسالة المربي</h3>
                   <p className="text-emerald-50 font-bold leading-relaxed opacity-80 mb-8 italic">"إن هذا القرآن مأدبة الله، فتعلموا من مأدبته ما استطعتم. وفقكم الله لتربية جيل قرآني فريد."</p>
                   <button onClick={() => setActiveTab('insights')} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border border-white/20">تفعيل المساعد الذكي <Sparkles size={18}/></button>
                </Card>
             </div>
          </div>
        );
      case 'attendance': return renderAttendance();
      case 'followup': return renderFollowUp();
      case 'insights': return renderInsights();
      case 'leaderboard': return renderLeaderboard();
      case 'students':
      case 'manage_students':
        return (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h3 className="text-3xl font-black">قائمة الطلاب ({students.length})</h3>
              <div className="relative w-full md:w-80">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input type="text" placeholder="ابحث عن طالب..." className="w-full pr-12 pl-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 ring-emerald-100" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(currentUser?.role === 'admin' ? students : teacherStudents).map(s => (
                <Card key={s.id} className="p-6 flex items-center gap-6 group hover:border-emerald-200 transition-all cursor-pointer">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-3xl shadow-inner">{s.name.charAt(0)}</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{s.name}</h4>
                    <p className="text-sm font-bold text-slate-400 mt-1">المحفوظ: {s.memorizedParts} أجزاء</p>
                    <div className="flex gap-3 mt-4">
                       <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{s.points} نقطة</div>
                       <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{s.streak} يوم</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'manage_teachers':
        return (
          <div className="space-y-10 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
               <h3 className="text-3xl font-black">إدارة الكادر التعليمي</h3>
               <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">إضافة معلم جديد</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teachers.map(t => (
                <Card key={t.id} className="text-center group p-10">
                  <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${t.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>
                    <User size={48} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 mb-2">{t.name}</h4>
                  <p className="text-slate-400 font-bold mb-6">@{t.username}</p>
                  <div className="flex justify-center gap-4">
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all"><Edit size={20}/></button>
                     <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'student_profile':
        return (
          <div className="space-y-10 animate-in fade-in duration-700">
            <Card className="relative overflow-hidden bg-emerald-600 text-white p-12 lg:p-16">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="w-48 h-48 rounded-[4rem] bg-white text-emerald-600 flex items-center justify-center text-7xl font-black shadow-2xl animate-in zoom-in-50 duration-500">
                  {currentStudent?.name.charAt(0)}
                </div>
                <div className="text-center md:text-right space-y-4">
                  <h2 className="text-5xl font-black tracking-tighter">{currentStudent?.name}</h2>
                  <p className="text-emerald-100 font-bold text-xl opacity-80">عضو نشط في {groups.find(g => g.id === currentStudent?.groupId)?.name}</p>
                  <div className="flex flex-wrap gap-6 justify-center md:justify-start pt-4">
                     <div className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-[1.5rem] font-black flex items-center gap-3 border border-white/20">
                       <Star size={24} fill="currentColor" className="text-amber-400" /> {currentStudent?.points} نقطة إنجاز
                     </div>
                     <div className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-[1.5rem] font-black flex items-center gap-3 border border-white/20">
                       <Zap size={24} fill="currentColor" className="text-orange-400" /> {currentStudent?.streak} يوم متواصل
                     </div>
                  </div>
                </div>
              </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatBox label="الأجزاء المتمة" value={currentStudent?.memorizedParts} icon={<BookOpen size={28}/>} color="bg-blue-50 text-blue-600" />
              <StatBox label="الترتيب العام" value="#1" icon={<Trophy size={28}/>} color="bg-amber-50 text-amber-600" />
              <StatBox label="تاريخ الانضمام" value="2024" icon={<Calendar size={28}/>} color="bg-purple-50 text-purple-600" />
            </div>
          </div>
        );
      case 'student_progress': return renderStudentRecords();
      case 'student_badges':
        return (
          <div className="space-y-8 animate-in zoom-in-95">
             <h3 className="text-3xl font-black text-slate-800">أوسمتي المكتسبة</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {[
                  { icon: <Zap size={32}/>, name: "المواظب", color: "bg-blue-50 text-blue-600", desc: "لحضور 7 أيام متواصلة" },
                  { icon: <Star size={32}/>, name: "النجم", color: "bg-amber-50 text-amber-600", desc: "للحصول على تقييم ممتاز" },
                  { icon: <BookOpen size={32}/>, name: "الحافظ", color: "bg-emerald-50 text-emerald-600", desc: "لإتمام جزء كامل" },
                  { icon: <Sparkle size={32}/>, name: "المجتهد", color: "bg-purple-50 text-purple-600", desc: "لتحسين الأداء الملحوظ" }
                ].map((b, i) => (
                  <Card key={i} className="p-8 text-center flex flex-col items-center gap-4 hover:translate-y-[-10px] transition-all cursor-help border-slate-50 group">
                     <div className={`w-20 h-20 rounded-[2rem] ${b.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>{b.icon}</div>
                     <h5 className="font-black text-slate-800 text-lg">{b.name}</h5>
                     <p className="text-[10px] font-bold text-slate-400 leading-tight">{b.desc}</p>
                  </Card>
                ))}
             </div>
          </div>
        );
      default:
        return renderPlaceholder("القسم قيد التجهيز", <Settings size={100}/>);
    }
  };

  if (authStage === 'selecting') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 font-['Tajawal']" dir="rtl">
        <div className="max-w-6xl w-full text-center space-y-20">
          <div className="space-y-8 animate-in slide-in-from-top-10 duration-700">
             <div className="w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto text-white shadow-emerald-200">
                <Award size={56} />
             </div>
             <div className="space-y-4">
                <h1 className="text-6xl font-black text-slate-800 tracking-tighter leading-tight">مركز أبا الحسن المتطور</h1>
                <p className="text-2xl text-slate-400 font-bold max-w-3xl mx-auto leading-relaxed">بوابتك الرقمية لمتابعة حفظ وتلاوة القرآن الكريم بأحدث التقنيات.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <button onClick={() => setAuthStage('staff-login')} className="group p-12 bg-white rounded-[3.5rem] shadow-xl hover:shadow-2xl hover:translate-y-[-12px] transition-all border border-slate-100 flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                   <Briefcase size={44} />
                </div>
                <div><h3 className="text-3xl font-black text-slate-800 mb-3">الموظفين</h3><p className="text-base font-bold text-slate-400">إدارة الحلقات والطلاب ومتابعة الإنجاز.</p></div>
                <div className="pt-4 text-emerald-600 font-black flex items-center gap-2 group-hover:gap-4 transition-all">دخول <ChevronLeft size={20} /></div>
             </button>

             <button onClick={() => setAuthStage('student-login')} className="group p-12 bg-white rounded-[3.5rem] shadow-xl hover:shadow-2xl hover:translate-y-[-12px] transition-all border border-slate-100 flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                   <GraduationCap size={44} />
                </div>
                <div><h3 className="text-3xl font-black text-slate-800 mb-3">الطلاب</h3><p className="text-base font-bold text-slate-400">مشاهدة التقدم، النقاط، والأوسمة.</p></div>
                <div className="pt-4 text-blue-600 font-black flex items-center gap-2 group-hover:gap-4 transition-all">دخول <ChevronLeft size={20} /></div>
             </button>

             <button onClick={() => setAuthStage('guest-view')} className="group p-12 bg-white rounded-[3.5rem] shadow-xl hover:shadow-2xl hover:translate-y-[-12px] transition-all border border-slate-100 flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                   <Globe size={44} />
                </div>
                <div><h3 className="text-3xl font-black text-slate-800 mb-3">الزوار</h3><p className="text-base font-bold text-slate-400">تصفح الإحصائيات، المعلمين، والاشتراك.</p></div>
                <div className="pt-4 text-amber-600 font-black flex items-center gap-2 group-hover:gap-4 transition-all">تصفح <ChevronLeft size={20} /></div>
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (authStage === 'staff-login' || authStage === 'student-login') {
    const isStaff = authStage === 'staff-login';
    const sortedList = isStaff ? teachers : [...students].sort((a,b) => a.name.localeCompare(b.name, 'ar'));
    
    return (
      <div className="min-h-screen bg-slate-900/10 backdrop-blur-md flex items-center justify-center p-6 font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-xl bg-white rounded-[4rem] shadow-2xl p-12 md:p-20 relative overflow-hidden animate-in zoom-in duration-500">
          <button onClick={() => setAuthStage('selecting')} className="absolute top-10 left-10 p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all shadow-sm"><X size={24}/></button>
          <div className={`w-28 h-28 ${isStaff ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'} rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-12 text-white`}>
             {isStaff ? <Briefcase size={56} /> : <GraduationCap size={56} />}
          </div>
          <h1 className="text-4xl font-black text-center text-slate-800 mb-2 tracking-tighter">{isStaff ? 'بوابة الموظفين' : 'بوابة الطلاب'}</h1>
          <p className="text-center text-slate-400 font-bold mb-10">اختر اسمك واستخدم الرمز الموحد 1234</p>
          <form onSubmit={isStaff ? handleStaffLogin : handleStudentLogin} className="space-y-8">
             <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 mr-4 uppercase tracking-widest">الاسم الكامل</label>
                <div className="relative">
                  <select required value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-10 py-7 bg-slate-50 border-2 border-transparent rounded-[2rem] text-xl font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all appearance-none">
                    <option value="">-- اختر اسمك --</option>
                    {sortedList.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                  <ChevronLeft className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none -rotate-90" size={24}/>
                </div>
             </div>
             <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 mr-4 uppercase tracking-widest">رمز الدخول</label>
                <input type="password" required placeholder="1234" value={loginForm.password} 
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} 
                  className="w-full px-10 py-7 bg-slate-50 border-2 border-transparent rounded-[2rem] text-xl font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner" />
             </div>
             <button type="submit" className={`w-full py-8 ${isStaff ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'} text-white rounded-[2.5rem] font-black text-2xl shadow-2xl hover:opacity-90 active:scale-95 transition-all mt-6`}>دخول</button>
          </form>
        </div>
      </div>
    );
  }

  if (authStage === 'guest-view') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-['Tajawal']" dir="rtl">
        <header className="h-24 bg-white border-b border-slate-100 px-12 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><Award size={20}/></div>
             <h2 className="text-2xl font-black text-slate-800">مركز أبا الحسن</h2>
          </div>
          <button onClick={() => setAuthStage('selecting')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-slate-200"><ChevronRight size={18}/> الرئيسية</button>
        </header>

        <main className="p-8 md:p-12 max-w-7xl mx-auto space-y-16">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatBox label="إجمالي الطلاب" value={students.length} icon={<Users size={28}/>} color="bg-emerald-50 text-emerald-600" />
              <StatBox label="الأجزاء المتمة" value="1,240" icon={<BookOpen size={28}/>} color="bg-blue-50 text-blue-600" />
              <StatBox label="طاقم العمل" value={teachers.length} icon={<Briefcase size={28}/>} color="bg-amber-50 text-amber-600" />
           </div>

           <Card className="bg-emerald-900 text-white border-none relative overflow-hidden p-12 lg:p-20 shadow-2xl shadow-emerald-200">
              <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-800 rounded-full -ml-48 -mt-48 blur-3xl opacity-30"></div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div className="space-y-8">
                    <h2 className="text-6xl font-black tracking-tighter leading-tight">سجّل ابنك الآن بـ 100 ريال فقط</h2>
                    <p className="text-xl text-emerald-100/60 leading-relaxed font-bold">انضم لحلقاتنا القرآنية واحصل على نظام متابعة ذكي وتدريس متقن تحت إشراف نخبة من المعلمين.</p>
                    <div className="flex flex-col sm:flex-row gap-6">
                       <button onClick={() => setShowSubModal(true)} className="px-10 py-6 bg-white text-emerald-900 rounded-[2rem] font-black text-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 shadow-xl"><CreditCard size={24}/> اشترك الآن</button>
                       <a href={`tel:${MANAGER_PHONE}`} className="px-10 py-6 bg-emerald-800 text-white border-2 border-emerald-700 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3"><Phone size={24}/> المدير: {MANAGER_PHONE}</a>
                    </div>
                 </div>
                 <div className="hidden lg:block bg-white/5 p-12 rounded-[4rem] border border-white/10 backdrop-blur-md">
                    <h4 className="text-2xl font-black mb-8 text-emerald-400">لماذا مجمع أبا الحسن؟</h4>
                    <ul className="space-y-6">
                       <li className="flex items-center gap-4 text-xl font-bold"><CheckCircle2 className="text-emerald-400"/> معلمين متقنين ومعتمدين</li>
                       <li className="flex items-center gap-4 text-xl font-bold"><CheckCircle2 className="text-emerald-400"/> نظام تحفيز وجوائز أسبوعية</li>
                       <li className="flex items-center gap-4 text-xl font-bold"><CheckCircle2 className="text-emerald-400"/> تقارير أداء دورية لولي الأمر</li>
                    </ul>
                 </div>
              </div>
           </Card>

           <div className="space-y-12">
              <div className="text-center">
                 <h3 className="text-4xl font-black text-slate-800 tracking-tight">طاقم العمل والمعلمين</h3>
                 <p className="text-slate-400 font-bold text-lg mt-2">نخبة من خيرة المعلمين لخدمة أهل القرآن</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {teachers.map(t => (
                    <Card key={t.id} className="text-center group hover:border-emerald-200 transition-all p-10 relative">
                       {t.role === 'admin' && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500 text-white flex items-center justify-center rounded-bl-3xl shadow-lg"><ShieldCheck size={28}/></div>}
                       <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform ${t.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-300'}`}><User size={48} /></div>
                       <h4 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{t.name}</h4>
                       <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase ${t.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{t.role === 'admin' ? 'مدير المركز' : 'معلم حلقة'}</span>
                    </Card>
                 ))}
              </div>
           </div>
        </main>

        {showSubModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 md:p-20 shadow-2xl relative animate-in zoom-in">
                <button onClick={() => setShowSubModal(false)} className="absolute top-10 left-10 text-slate-300 hover:text-slate-800 transition-colors p-2"><X size={36}/></button>
                {isSuccess ? (
                  <div className="text-center space-y-8 py-10">
                     <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><CheckCircle2 size={64}/></div>
                     <h2 className="text-4xl font-black text-slate-800">تم إرسال الطلب!</h2>
                     <p className="text-xl font-bold text-slate-400 leading-relaxed">شكراً لانضمامكم لأسرة المركز. سنتواصل معكم قريباً لإكمال إجراءات التسجيل.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-4xl font-black text-slate-800 mb-10 text-center">طلب اشتراك طالب جديد</h2>
                    <form onSubmit={handleSubscription} className="space-y-8">
                       <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 mr-5 uppercase">الاسم الكامل للطالب</label>
                          <input type="text" required placeholder="الاسم الثلاثي للطالب" value={subForm.name} onChange={(e) => setSubForm({...subForm, name: e.target.value})}
                            className="w-full px-10 py-7 bg-slate-50 border-2 border-transparent rounded-[2.5rem] text-xl font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-xs font-black text-slate-400 mr-5 uppercase">الجنسية</label>
                             <input type="text" required placeholder="سعودي، مقيم، إلخ" value={subForm.nationality} onChange={(e) => setSubForm({...subForm, nationality: e.target.value})}
                               className="w-full px-10 py-7 bg-slate-50 border-2 border-transparent rounded-[2.5rem] text-xl font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner" />
                          </div>
                          <div className="space-y-3">
                             <label className="text-xs font-black text-slate-400 mr-5 uppercase">العمر</label>
                             <input type="number" required placeholder="السن بالسنوات" value={subForm.age} onChange={(e) => setSubForm({...subForm, age: e.target.value})}
                               className="w-full px-10 py-7 bg-slate-50 border-2 border-transparent rounded-[2.5rem] text-xl font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner" />
                          </div>
                       </div>
                       <button disabled={isSubmitting} type="submit" className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-4">
                          {isSubmitting ? 'جاري الإرسال...' : <><CheckCircle2 size={28}/> تأكيد الاشتراك - 100 ريال</>}
                       </button>
                    </form>
                  </>
                )}
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] flex-col lg:flex-row overflow-hidden font-['Tajawal']" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className={`w-80 bg-slate-950 text-white fixed lg:static inset-y-0 right-0 z-[100] transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none"></div>
        <div className="p-10 relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-emerald-900/50">
                <Award size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-tight">مركز أبا الحسن</h1>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest opacity-80 leading-none">أكاديمية المنارة</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white"><X size={32}/></button>
          </div>
          
          <nav className="space-y-4 flex-1">
            {navigation.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-5 px-8 py-5 rounded-[2rem] transition-all text-right group relative ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-2xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                <span className={`${activeTab === item.id ? 'text-white' : 'text-emerald-600/60'}`}>{item.icon}</span>
                <span className="font-black text-lg">{item.label}</span>
                {activeTab === item.id && <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-4 h-8 bg-white rounded-r-full shadow-lg shadow-white/50 animate-pulse"></div>}
              </button>
            ))}
          </nav>
          
          <div className="mt-auto pt-10 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-5 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 hover:bg-red-500/20 transition-all group">
               <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-red-500 transition-colors"><LogOut size={20}/></div>
               <span className="font-black text-lg">خروج</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="h-32 bg-white/50 backdrop-blur-md border-b border-slate-100 px-8 md:px-20 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-800"><Menu size={28}/></button>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">
               {navigation.find(n => n.id === activeTab)?.label || 'الرئيسية'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-4 bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm">
                <Calendar size={20} className="text-emerald-600" />
                <span className="text-base font-black text-slate-700">{new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}</span>
             </div>
             <div className="flex items-center gap-4">
               <span className="hidden sm:inline font-black text-slate-800 text-lg">{currentUser?.name || currentStudent?.name}</span>
               <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-100">{(currentUser?.name || currentStudent?.name)?.charAt(0)}</div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-20 custom-scrollbar bg-slate-50/50">
           {renderContent()}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 40px; }
      `}</style>
    </div>
  );
};

export default App;
