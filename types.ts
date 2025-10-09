import { Settings } from './hooks/useSettings';
import { ApiFeature } from './hooks/useApiUsage';
import React from 'react';

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
  description?: string;
  listId: string;
  dueDate?: string | null;
  priority: Priority;
  completed: boolean;
  completionDate?: string;
  subtasks: Subtask[];
  recurrence?: Recurrence | null;
  tags: string[];
  pinned?: boolean;
  wontDo?: boolean;
  trashed?: boolean;
  isSection?: boolean;
  isCollapsed?: boolean;
}

export interface List {
  id:string;
  name: string;
  color?: string;
  isPinned?: boolean;
  emoji?: string;
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

export type ProjectMemory = 'default' | 'project-only';

export interface Project {
  id: string;
  name: string;
  instruction: string;
  memory: ProjectMemory;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  projectId?: string | null;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'task-due' | 'ai-suggestion' | 'habit-reminder';
  relatedId?: string;
}

export interface GoalProgressReport {
  goalId: string;
  relatedTaskIds: string[];
  progressPercentage: number;
  summaryText: string;
  nextStepSuggestion: string;
}

export interface Countdown {
  id: string;
  title: string;
  date: string; // ISO string format
}

export type ActiveView = 'tasks' | 'pomodoro' | 'habits' | 'analytics' | 'profile' | 'ai-assistant' | 'eisenhower-matrix' | 'countdown' | 'calendar' | 'achievements';

export interface Tag {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
}

export type FilterDateOption = 'any' | 'today' | 'tomorrow' | 'thisWeek' | 'thisMonth' | 'overdue';

export interface Filter {
  id: string;
  name: string;
  lists: string[]; // list IDs
  tags: string[]; // tag IDs
  date: FilterDateOption;
  priority: Priority | 'All';
  includeKeywords?: string;
  type?: 'all' | 'task';
}

export interface AddTaskFormProps {
    lists: List[];
    onAddTask: (taskData: {
        title: string;
        listId: string;
        priority: Priority;
        dueDate: string | null;
        recurrence: Recurrence | null;
        tags: string[];
        isSection?: boolean;
        isCollapsed?: boolean;
    }) => void;
    aiEnabled: boolean;
    activeListId: string;
    logApiCall: (feature: ApiFeature, tokens: number) => void;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
    settings: Settings;
    onDeactivate: () => void;
    autoFocus?: boolean;
}

export interface AIContext {
    tasks: Task[];
    lists: List[];
    habits: Habit[];
    profile: UserProfile;
    pomodoroSessions: PomodoroSession[];
}

export interface AppData {
    tasks: Task[];
    habits: Habit[];
    sessions: PomodoroSession[];
    setActiveView?: (view: ActiveView) => void;
}

export type AchievementCategory = 'task' | 'focus' | 'habit' | 'consistency' | 'milestone' | 'special';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: (progress: number, goal: number) => string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  xpBonus?: number;
  getProgress: (data: AppData) => { current: number; goal: number };
}

export interface Level {
    level: number;
    xpRange: [number, number | null];
    title: string;
    icon: string;
}