
import React from 'react';
import { 
  LayoutDashboard,
  Users,
  ClipboardList,
  BrainCircuit,
  Bell,
  BarChart3,
  BookMarked,
  Trophy,
  ShieldCheck,
  UserPlus,
  Layers,
  FileBarChart,
  Settings
} from 'lucide-react';

export const EVALUATION_COLORS = {
  'ممتاز': 'text-emerald-600 bg-emerald-50',
  'جيد جدًا': 'text-blue-600 bg-blue-50',
  'جيد': 'text-orange-600 bg-orange-50',
  'يحتاج متابعة': 'text-red-600 bg-red-50',
};

// عناصر قائمة المعلم
export const TEACHER_NAV = [
  { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard size={20} /> },
  { id: 'attendance', label: 'التسجيل اليومي', icon: <ClipboardList size={20} /> },
  { id: 'followup', label: 'المساعد القرآني', icon: <BookMarked size={20} /> },
  { id: 'leaderboard', label: 'لوحة الصدارة', icon: <Trophy size={20} /> },
  { id: 'students', label: 'قائمة طلابي', icon: <Users size={20} /> },
  { id: 'insights', label: 'ذكاء تربوي (AI)', icon: <BrainCircuit size={20} /> },
];

// عناصر قائمة المدير (عبدالله بامؤمن)
export const ADMIN_NAV = [
  { id: 'admin_dashboard', label: 'لوحة القيادة', icon: <ShieldCheck size={20} /> },
  { id: 'manage_groups', label: 'إدارة الحلقات', icon: <Layers size={20} /> },
  { id: 'manage_teachers', label: 'إدارة المعلمين', icon: <UserPlus size={20} /> },
  { id: 'manage_students', label: 'إدارة الطلاب', icon: <Users size={20} /> },
  { id: 'full_reports', label: 'التقارير الشاملة', icon: <FileBarChart size={20} /> },
  { id: 'settings', label: 'الإعدادات', icon: <Settings size={20} /> },
];

export const QURAN_SURAHS = [
  { id: 1, name: "الفاتحة", verses: 7 }, { id: 2, name: "البقرة", verses: 286 }, { id: 3, name: "آل عمران", verses: 200 },
  { id: 4, name: "النساء", verses: 176 }, { id: 5, name: "المائدة", verses: 120 }, { id: 6, name: "الأنعام", verses: 165 },
  { id: 7, name: "الأعراف", verses: 206 }, { id: 8, name: "الأنفال", verses: 75 }, { id: 9, name: "التوبة", verses: 129 },
  { id: 10, name: "يونس", verses: 109 }, { id: 11, name: "هود", verses: 123 }, { id: 12, name: "يوسف", verses: 111 }
];
