
export interface TodoItem {
  task: string;
  completed: boolean;
}

export interface Idea {
  id: string;
  title: string;
  summary: string;
  category: string;
  todos: TodoItem[];
  imageUrl: string;
  timestamp: number;
}

export interface AnalysisResult {
  title: string;
  summary: string;
  category: string;
  todos: string[];
}
