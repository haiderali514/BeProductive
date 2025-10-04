export enum Priority {
  NONE = 'None',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum Recurrence {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
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
  recurrence?: Recurrence | null;
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
    taskId?: string; // Link to a task or habit
    note?: string;
}

export type TraitType = 'goal' | 'struggle' | 'passion' | 'hobby' | 'routine' | 'preference' | 'weakness';
export type GoalSubtype = 'long-term' | 'short-term';

export interface UserTrait {
  id: string;
  type: TraitType;
  subtype?: GoalSubtype;
  text: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  traits: UserTrait[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'task-due' | 'ai-suggestion' | 'habit-reminder';
  relatedId?: string;
}

export type ActiveView = 'tasks' | 'pomodoro' | 'habits' | 'analytics' | 'profile' | 'ai-assistant';