
import { GoogleGenAI } from "@google/genai";
import { DailyRecord, Student } from "./types";

/**
 * Analyzes student progress and returns a concise pedagogical tip.
 */
export const analyzeStudentProgress = async (student: Student, records: DailyRecord[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = records.map(r => 
    `- التاريخ: ${r.date}, الحضور: ${r.attendance}, التسميع: ${r.recitation}, التقييم: ${r.evaluation}`
  ).join('\n');

  const prompt = `أنت مساعد تقني خبير في تحليل مسارات تحفيظ القرآن الكريم. 
  بناءً على سجلات الطالب التالية، استخلص "نصيحة تربوية ذهبية" واحدة مركزة جداً ومبنية على البيانات المتاحة. 
  اجعل النصيحة بصيغة نقاط (Bullet point) لا تتجاوز 40 كلمة، تركز على التحفيز وتطوير الحفظ.
  
  بيانات الطالب: ${student.name}
  تاريخ السجلات:
  ${summary}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI analysis failed:", error);
    return "💡 نصيحة اليوم: استمر في مراجعة الأجزاء السابقة لضمان ثبات الحفظ، فالتكرار أساس الإتقان.";
  }
};

/**
 * Generates a motivational praise for the "Star of the Day".
 */
export const generateStarPraise = async (student: Student, groupName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `أنت معلم قرآن ملهم. قدم كلمة ثناء قصيرة وبليغة للطالب "${student.name}" من "${groupName}" بمناسبة اختياره "نجم اليوم" لتميزه في التسميع والحضور والتقييم الممتاز. اجعل العبارة مشجعة جداً ومليئة بالفخر بأسلوب قرآني تربوي جميل (باللغة العربية، بحدود 40 كلمة).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return `ما شاء الله! الطالب ${student.name} نموذج يحتذى به في حلقة القرآن، تميز اليوم بإتقانه وسلوكه الرفيع. نفع الله به الإسلام والمسلمين.`;
  }
};
