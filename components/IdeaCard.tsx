
import React from 'react';
import { Idea } from '../types';
import { CheckCircle, Circle, Trash2, Calendar, Tag } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
  onDelete: (id: string) => void;
  onToggleTodo: (ideaId: string, todoIndex: number) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onDelete, onToggleTodo }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
      {/* Screenshot Preview */}
      <div className="w-full md:w-48 lg:w-64 h-48 md:h-auto bg-gray-200 relative group overflow-hidden">
        <img 
          src={idea.imageUrl} 
          alt={idea.title} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={() => window.open(idea.imageUrl, '_blank')}
              className="px-4 py-2 bg-white/20 backdrop-blur-md text-white text-xs rounded-full border border-white/30"
            >
                查看原图
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold uppercase rounded-full flex items-center gap-1">
                 <Tag size={10} /> {idea.category}
               </span>
               <span className="text-gray-400 text-[10px] flex items-center gap-1">
                 <Calendar size={10} /> {new Date(idea.timestamp).toLocaleDateString()}
               </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{idea.title}</h3>
          </div>
          <button 
            onClick={() => onDelete(idea.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          {idea.summary}
        </p>

        {idea.todos.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">行动清单</h4>
            <div className="space-y-2">
              {idea.todos.map((todo, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onToggleTodo(idea.id, idx)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  {todo.completed ? (
                    <CheckCircle size={16} className="text-green-500 fill-green-50" />
                  ) : (
                    <Circle size={16} className="text-gray-300 group-hover:text-blue-400" />
                  )}
                  <span className={`text-sm ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {todo.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
