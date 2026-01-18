
import { GoogleGenAI } from "@google/genai";
import { DailyRecord, Student } from "./types";

/**
 * تحلل تقدم الطالب وتقدم رؤى تربوية ذكية.
 */
export const analyzeStudentProgress = async (student: Student, records: DailyRecord[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = records.slice(-15).map(r => 
    `- التاريخ: ${r.date}, الحضور: ${r.attendance}, التسميع: ${r.recitation}, التقييم: ${r.evaluation}`
  ).join('\n');

  const prompt = `أنت مساعد تربوي ذكي في مدرسة قرآنية.
  قم بتحليل أداء الطالب "${student.name}" (عمره: ${student.age}, أتم حفظ: ${student.memorizedParts} أجزاء).
  
  سجل الأداء الأخير:
  ${summary}

  المطلوب: قدم نصيحة تربوية واحدة "فقط" موجهة للمعلم، تكون مركزة ومبنية على البيانات المذكورة.
  الشروط: مختصر جداً، يبدأ برمز تعبيري، أسلوب تربوي راقٍ.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI analysis failed:", error);
    return "💡 نصيحة اليوم: استقرار الطالب في الحضور هو مفتاح التقدم الحقيقي.";
  }
};

export const generateStarPraise = async (student: Student, groupName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `اكتب عبارة فخر واعتزاز قصيرة وبليغة للطالب "${student.name}" من "${groupName}" بمناسبة تميزه اليوم (أقل من 30 كلمة).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return `ما شاء الله! الطالب ${student.name} شعلة من النور في حلقة القرآن اليوم.`;
  }
};

/**
 * يصدر شهادة تقدير رقمية للطالب باستخدام نموذج الصور.
 */
export const generateCertificate = async (studentName: string, groupName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A beautiful, official-looking digital recognition certificate for a Quran student named "${studentName}" from the group "${groupName}". Islamic patterns, emerald and gold colors. Arabic text: "شهادة تميز - الطالب: ${studentName}".`;

  try {
    // Fix: Updated to gemini-2.5-flash-image which is the standard default and doesn't require key selection.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Certificate failed:", error);
    throw error;
  }
};
