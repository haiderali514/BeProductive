

import { Priority, Habit, PomodoroSession, UserProfile, Countdown, List } from './types';

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

export const DEFAULT_LISTS: List[] = [
    { id: 'inbox', name: 'Inbox', color: '#F5A623', emoji: '📥' },
    { id: 'welcome', name: 'Welcome', emoji: '👋', color: '#50E3C2', isPinned: false },
    { id: 'work', name: 'Work', emoji: '💼', color: '#4A90E2', isPinned: false },
    { id: 'study', name: 'Study', emoji: '📖', color: '#BD10E0', isPinned: false },
];

export const DEFAULT_TASKS = [
    {
      id: '1',
      title: 'Welcome to your AI-powered todo list!',
      description: 'This is where you can add more details, notes, or links related to your task. Use the subtask section below to break this down into smaller steps!',
      listId: 'welcome',
      priority: Priority.MEDIUM,
      completed: false,
      subtasks: [],
      tags: [],
      pinned: true,
    },
    {
      id: '2',
      title: 'Try the smart add: "Review project proposal tomorrow 3pm #work !high"',
      description: '',
      listId: 'inbox',
      priority: Priority.HIGH,
      completed: false,
      subtasks: [],
      tags: [],
      pinned: false,
    },
    {
      id: '3',
      title: 'Generate subtasks for "Plan team offsite"',
      description: 'Click the magic wand icon on this task in the list to see the AI generate a list of actionable subtasks for you.',
      listId: 'work',
      priority: Priority.LOW,
      completed: false,
      subtasks: [
        { id: '3-1', title: 'Click the ✨ icon on this task!', completed: false },
      ],
      tags: [],
      pinned: false,
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

export const DEFAULT_USER_PROFILE: UserProfile = {
    name: 'Ch Haider Ali',
    email: 'chhaiderali0509@gmail.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    traits: [
        { id: 'ltg1', type: 'goal', subtype: 'long-term', text: 'Become a principal engineer' },
        { id: 'ltg2', type: 'goal', subtype: 'long-term', text: 'Launch a successful side project' },
        { id: 'stg1', type: 'goal', subtype: 'short-term', text: 'Master React state management' },
        { id: 'stg2', type: 'goal', subtype: 'short-term', text: 'Finish the design system for the current project' },
    ],
};

export const DEFAULT_COUNTDOWNS: Countdown[] = [
    { id: 'cd1', title: 'New Year 2025', date: '2025-01-01T00:00:00.000Z' },
    { id: 'cd2', title: 'Project Deadline', date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() }, // 15 days from now
];