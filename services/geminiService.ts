import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// 缓存系统
interface CacheEntry {
  result: AnalysisResult;
  timestamp: number;
}

class AnalysisService {
  private ai: GoogleGenAI | null = null;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheDuration: number = parseInt(process.env.CACHE_DURATION || '3600000');

  constructor() {
    this.initAI();
    this.loadCache();
  }

  private initAI(): void {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private loadCache(): void {
    try {
      const saved = localStorage.getItem('analysis-cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        Object.entries(parsed).forEach(([key, entry]: [string, CacheEntry]) => {
          if (now - entry.timestamp < this.cacheDuration) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load cache:', e);
    }
  }

  private saveCache(): void {
    try {
      localStorage.setItem('analysis-cache', JSON.stringify(Object.fromEntries(this.cache)));
    } catch (e) {
      console.warn('Failed to save cache:', e);
    }
  }

  private generateImageKey(base64Image: string): string {
    let data = base64Image;
    if (data.includes(',')) {
      data = data.split(',')[1];
    }
    let hash = 0;
    for (let i = 0; i < data.length && i < 10000; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  setApiKey(apiKey: string): void {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeScreenshot(base64Image: string): Promise<AnalysisResult> {
    // 检查缓存
    const cacheKey = this.generateImageKey(base64Image);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      console.log('Using cached analysis result');
      return cached.result;
    }

    if (!this.ai) {
      const apiKey = prompt('请输入你的 Gemini API Key:');
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      } else {
        throw new Error('需要提供 Gemini API Key 才能继续');
      }
    }

    try {
      const result = await this.analyzeWithRetry(base64Image);

      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      this.saveCache();

      return result;
    } catch (error: any) {
      console.error('Analysis error:', error);

      if (error.message?.includes('401') || error.message?.includes('API')) {
        const newKey = prompt('API Key 无效，请输入新的 Gemini API Key:');
        if (newKey) {
          this.setApiKey(newKey);
          return this.analyzeScreenshot(base64Image);
        }
      }

      throw error;
    }
  }

  private async analyzeWithRetry(base64Image: string): Promise<AnalysisResult> {
    const maxRetries = parseInt(process.env.MAX_RETRIES || '3');
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.ai!.models.generateContent({
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
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Analysis failed');
  }

  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('analysis-cache');
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const analysisService = new AnalysisService();

// 为保持向后兼容性
export const analyzeScreenshot = (base64Image: string) => analysisService.analyzeScreenshot(base64Image);
