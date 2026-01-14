
import { GoogleGenAI } from "@google/genai";
import { DailyRecord, Student, GroundingLocation } from "./types";

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

/**
 * البحث عن مراكز تحفيظ قرآنية قريبة باستخدام Google Maps Grounding.
 */
export const findNearbyCenters = async (lat: number, lng: number): Promise<{ text: string; locations: GroundingLocation[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = "ما هي أقرب مساجد أو مراكز تحفيظ قرآن معتمدة في منطقتي الحالية؟ قدم قائمة قصيرة ومفيدة.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const locations: GroundingLocation[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          locations.push({
            title: chunk.maps.title,
            uri: chunk.maps.uri,
            address: "" // Optional if provided in snippets
          });
        }
      });
    }

    return {
      text: response.text || "إليك بعض المراكز القرآنية القريبة منك:",
      locations
    };
  } catch (error) {
    console.error("Maps grounding failed:", error);
    return { text: "عذراً، لم نتمكن من جلب المواقع القريبة حالياً.", locations: [] };
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

export const generateCertificate = async (studentName: string, groupName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A beautiful, official-looking digital recognition certificate for a Quran student named "${studentName}" from the group "${groupName}". Islamic patterns, emerald and gold colors. Arabic text: "شهادة تميز - الطالب: ${studentName}".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
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
