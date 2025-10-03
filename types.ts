
export enum Priority {
  NONE = 'None',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  listId: string;
  dueDate?: string | null;
  priority: Priority;
  completed: boolean;
  subtasks: Subtask[];
}

export interface List {
  id:string;
  name: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  period: 'Morning' | 'Afternoon' | 'Night';
  checkIns: string[]; // Array of dates in 'YYYY-MM-DD' format
  totalDays: number;
  streak: number;
}

export interface PomodoroSession {
    id: string;
    startTime: number;
    endTime: number;
    taskName: string;
}
