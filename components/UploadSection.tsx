
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface UploadSectionProps {
  onAnalyze: (image: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = async () => {
    if (preview) {
      await onAnalyze(preview);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-blue-50">
      <div className="flex flex-col items-center text-center space-y-4">
        {!preview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-12 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/30 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-blue-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">导入灵感截图</h3>
            <p className="text-sm text-gray-500 max-w-[240px]">支持 PNG, JPG。让 AI 帮你整理脑海中的碎片。</p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="relative w-full max-w-sm mx-auto h-64 rounded-xl overflow-hidden border border-gray-100">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                ✕
              </button>
            </div>
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-70"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  AI 正在深度解析...
                </>
              ) : (
                <>
                  <ImageIcon size={20} />
                  开始分析灵感
                </>
              )}
            </button>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />
      </div>
    </div>
  );
};
