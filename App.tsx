import React, { useState, useEffect, useMemo } from 'react';
import { Idea, TodoItem } from './types';
import { analysisService } from './services/geminiService';
import { taskScheduler, Task } from './services/taskScheduler';
import { UploadSection } from './components/UploadSection';
import { IdeaCard } from './components/IdeaCard';
import { Search, SlidersHorizontal, Lightbulb, Sparkles, BrainCircuit, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [apiKey, setApiKey] = useState<string>('');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('snap-ideas');
    if (saved) {
      setIdeas(JSON.parse(saved));
    }
    taskScheduler.start();
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('snap-ideas', JSON.stringify(ideas));
  }, [ideas]);

  // Track tasks
  useEffect(() => {
    const updateTasks = () => {
      setTasks(taskScheduler.getTasks());
    };
    updateTasks();
    const interval = setInterval(updateTasks, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async (imageUrl: string) => {
    const taskId = taskScheduler.createTask();
    setIsAnalyzing(true);

    setTimeout(() => {
      const task = taskScheduler.getTask(taskId);
      if (task && task.status === 'pending') {
        taskScheduler.runTask(taskId, async () => {
          const result = await analysisService.analyzeScreenshot(imageUrl);
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
          return result;
        });
      }
    }, 500);

    // 检查任务完成状态
    const checkInterval = setInterval(() => {
      const task = taskScheduler.getTask(taskId);
      if (task && (task.status === 'completed' || task.status === 'failed')) {
        setIsAnalyzing(false);
        clearInterval(checkInterval);
        if (task.status === 'failed') {
          alert(`分析失败: ${task.error}`);
        }
      }
    }, 1000);
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

  // 统计信息
  const stats = useMemo(() => {
    const todos = ideas.reduce((acc, idea) => {
      const todoStats = idea.todos.reduce((tAcc, todo) => {
        return {
          total: tAcc.total + 1,
          completed: tAcc.completed + (todo.completed ? 1 : 0)
        };
      }, { total: 0, completed: 0 });
      acc.total += todoStats.total;
      acc.completed += todoStats.completed;
      return acc;
    }, { total: 0, completed: 0 });

    const taskStats = taskScheduler.getStats();

    return {
      ideas: ideas.length,
      todos: todos,
      categories: categories.length - 1,
      tasks: taskStats
    };
  }, [ideas, categories]);

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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总灵感</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ideas}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                <Lightbulb size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待办任务</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todos.total}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Clock size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">分类</p>
                <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <SlidersHorizontal size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">运行任务</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tasks.runningCount}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <Sparkles size={20} />
              </div>
            </div>
          </div>
        </div>

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