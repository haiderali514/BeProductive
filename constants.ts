
import { Priority, Habit, PomodoroSession } from './types';

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.HIGH]: 'border-red-500',
  [Priority.MEDIUM]: 'border-yellow-500',
  [Priority.LOW]: 'border-blue-500',
  [Priority.NONE]: 'border-transparent',
};

export const PRIORITY_BG_COLORS: Record<Priority, string> = {
  [Priority.HIGH]: 'bg-red-900/50 text-red-300',
  [Priority.MEDIUM]: 'bg-yellow-900/50 text-yellow-300',
  [Priority.LOW]: 'bg-blue-900/50 text-blue-300',
  [Priority.NONE]: 'bg-background-tertiary text-content-secondary',
};

export const DEFAULT_LISTS = [
    { id: 'inbox', name: 'Inbox' },
    { id: 'work', name: 'Work' },
];

export const DEFAULT_TASKS = [
    {
      id: '1',
      title: 'Welcome to your AI-powered todo list!',
      listId: 'inbox',
      priority: Priority.MEDIUM,
      completed: false,
      subtasks: [],
    },
    {
      id: '2',
      title: 'Try the smart add: "Review project proposal tomorrow 3pm #work !high"',
      listId: 'inbox',
      priority: Priority.HIGH,
      completed: false,
      subtasks: [],
    },
    {
      id: '3',
      title: 'Generate subtasks for "Plan team offsite"',
      listId: 'work',
      priority: Priority.LOW,
      completed: false,
      subtasks: [
        { id: '3-1', title: 'Click the ✨ icon on this task!', completed: false },
      ],
    },
];

export const DEFAULT_HABITS: Habit[] = [
    { id: 'h1', name: 'Programming', icon: '👨‍💻', period: 'Morning', checkIns: ['2024-07-29', '2024-07-30', '2024-08-01', '2024-08-02', '2024-08-03'], totalDays: 190, streak: 1 },
    { id: 'h2', name: 'Freelancing', icon: '💰', period: 'Afternoon', checkIns: [], totalDays: 33, streak: 0 },
    { id: 'h3', name: 'Youtube', icon: '📺', period: 'Night', checkIns: ['2024-08-01', '2024-08-02', '2024-08-03'], totalDays: 183, streak: 0 },
    { id: 'h4', name: 'SM Retention = Brain Power', icon: '🧠', period: 'Night', checkIns: ['2024-08-01', '2024-08-02', '2024-08-03'], totalDays: 127, streak: 0 },
    { id: 'h5', name: 'Namaz/Majlis', icon: '🙏', period: 'Night', checkIns: [], totalDays: 48, streak: 0 },
];

export const DEFAULT_POMODORO_SESSIONS: PomodoroSession[] = [
    { id: 'p1', startTime: new Date('2024-08-03T09:45:00').getTime(), endTime: new Date('2024-08-03T11:15:00').getTime(), taskName: 'Vibe Coding' },
    { id: 'p2', startTime: new Date('2024-08-03T01:56:00').getTime(), endTime: new Date('2024-08-03T03:25:00').getTime(), taskName: 'Vibe Coding' },
    { id: 'p3', startTime: new Date('2024-08-03T00:26:00').getTime(), endTime: new Date('2024-08-03T01:56:00').getTime(), taskName: 'Vibe Coding' },
    { id: 'p4', startTime: new Date('2024-08-02T23:56:00').getTime(), endTime: new Date('2024-08-03T00:00:00').getTime(), taskName: 'Vibe Coding' },
];
