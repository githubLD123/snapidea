
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeScreenshot = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: "分析这张截图。提取核心想法、总结内容，并列出可能的待办事项(To-do items)。请用中文回答。",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A short, catchy title for the idea.",
          },
          summary: {
            type: Type.STRING,
            description: "A concise summary of the screenshot's content.",
          },
          category: {
            type: Type.STRING,
            description: "A general category like 'Shopping', 'Tech', 'Food', 'Design', etc.",
          },
          todos: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "Actionable steps derived from the screenshot.",
          },
        },
        required: ["title", "summary", "category", "todos"],
      },
    },
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response", text);
    throw new Error("AI analysis failed to produce valid data.");
  }
};
