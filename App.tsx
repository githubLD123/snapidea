
import React, { useState, useEffect, useMemo } from 'react';
import { Idea, TodoItem } from './types';
import { analyzeScreenshot } from './services/geminiService';
import { UploadSection } from './components/UploadSection';
import { IdeaCard } from './components/IdeaCard';
import { Search, SlidersHorizontal, Lightbulb, Sparkles, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('snap-ideas');
    if (saved) {
      setIdeas(JSON.parse(saved));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('snap-ideas', JSON.stringify(ideas));
  }, [ideas]);

  const handleAnalyze = async (imageUrl: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeScreenshot(imageUrl);
      const newIdea: Idea = {
        id: Date.now().toString(),
        title: result.title,
        summary: result.summary,
        category: result.category,
        todos: result.todos.map(task => ({ task, completed: false })),
        imageUrl,
        timestamp: Date.now(),
      };
      setIdeas(prev => [newIdea, ...prev]);
    } catch (error) {
      console.error(error);
      alert("分析失败，请检查 API Key 或图片内容。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除这条灵感吗？")) {
      setIdeas(prev => prev.filter(idea => idea.id !== id));
    }
  };

  const handleToggleTodo = (ideaId: string, todoIndex: number) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id === ideaId) {
        const newTodos = [...idea.todos];
        newTodos[todoIndex] = { ...newTodos[todoIndex], completed: !newTodos[todoIndex].completed };
        return { ...idea, todos: newTodos };
      }
      return idea;
    }));
  };

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(ideas.map(i => i.category))];
    return cats;
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            idea.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || idea.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [ideas, searchQuery, filterCategory]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">SnapIdea <span className="text-blue-600">闪念</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-500">
             <div className="flex items-center gap-1"><BrainCircuit size={16}/> AI 驱动</div>
             <div className="flex items-center gap-1"><Lightbulb size={16}/> 灵感管理</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <section className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">别让截图烂在相册里</h2>
          <p className="text-gray-500 max-w-lg mx-auto">导入你在小红书、微博、知乎看到的精彩瞬间，AI 自动帮你归纳成点子与待办。</p>
        </section>

        {/* Action Center */}
        <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

        {/* Filter & Search */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索标题、内容或想法..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <SlidersHorizontal size={18} className="text-gray-400 shrink-0" />
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filterCategory === cat 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  {cat === 'All' ? '全部' : cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="grid grid-cols-1 gap-6">
          {filteredIdeas.length > 0 ? (
            filteredIdeas.map(idea => (
              <IdeaCard 
                key={idea.id} 
                idea={idea} 
                onDelete={handleDelete} 
                onToggleTodo={handleToggleTodo}
              />
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="inline-block p-4 bg-gray-100 rounded-full text-gray-400">
                <Lightbulb size={40} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">暂无灵感点子</h3>
                <p className="text-gray-500">上传一张截图，让 AI 开启你的思维工坊。</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer / Mobile Nav (optional) */}
      <footer className="mt-20 py-10 border-t border-gray-100 text-center">
         <p className="text-xs text-gray-400">© 2024 SnapIdea - 你的第二大脑 AI 截图伴侣</p>
      </footer>
    </div>
  );
};

export default App;
