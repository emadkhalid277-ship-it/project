
export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر';
export type RecitationStatus = 'سمّع' | 'لم يسمّع';
export type EvaluationGrade = 'ممتاز' | 'جيد جدًا' | 'جيد' | 'يحتاج متابعة';

export type NotificationType = 'achievement' | 'reminder' | 'improvement' | 'system';

export interface Student {
  id: string;
  name: string;
  groupId: string;
  age: number;
  joinDate: string;
  phone: string;
  memorizedParts: number; // عدد الأجزاء المحفوظة
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

export interface Statistics {
  attendanceRate: number;
  absenceCount: number;
  lateCount: number;
  recitationCount: number;
  averageEvaluation: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  recipientId: string;
  isRead: boolean;
}
