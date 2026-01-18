
export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر';
export type RecitationStatus = 'سمّع' | 'لم يسمّع';
export type EvaluationGrade = 'ممتاز' | 'جيد جدًا' | 'جيد' | 'يحتاج متابعة';

export type UserRole = 'admin' | 'teacher';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface Student {
  id: string;
  name: string;
  groupId: string;
  age: number;
  joinDate: string;
  phone: string;
  memorizedParts: number;
  photoURL?: string;
  badges?: string[];
  points: number;
  streak: number;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
}

export interface Teacher {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole; // 'admin' or 'teacher'
}

export interface DailyRecord {
  id: string;
  studentId: string;
  date: string;
  attendance: AttendanceStatus;
  recitation: RecitationStatus;
  evaluation: EvaluationGrade;
  notes: string;
}

export interface FollowUpRecord {
  id: string;
  studentId: string;
  date: string;
  memorization: {
    surah: string;
    fromVerse: string;
    toVerse: string;
  };
  revision: {
    surah: string;
    fromVerse: string;
    toVerse: string;
  };
}
