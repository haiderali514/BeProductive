import { Priority, Habit, PomodoroSession, UserProfile, Countdown, List, Achievement, AppData, Level, Task } from './types';
import { TasksIcon, PomodoroIcon, HabitIcon, BrainIcon, CalendarIcon, TrophyIcon, PuzzleIcon, SunIcon, SparklesIcon } from './components/Icons';

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

export const DEFAULT_TASKS: Task[] = [
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

const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateLongestStreak = (checkIns: string[]): number => {
    if (checkIns.length < 2) return checkIns.length;

    const sortedDates = checkIns.map(d => new Date(d).getTime()).sort((a, b) => a - b);
    
    const uniqueDates = [...new Set(sortedDates)];

    let longestStreak = 0;
    let currentStreak = 0;
    
    if (uniqueDates.length > 0) {
        longestStreak = 1;
        currentStreak = 1;
    }

    for (let i = 1; i < uniqueDates.length; i++) {
        const diff = uniqueDates[i] - uniqueDates[i-1];
        const oneDay = 1000 * 60 * 60 * 24;

        if (Math.abs(diff - oneDay) < 1000) { // Allow for small DST differences
            currentStreak++;
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    return longestStreak;
};

const calculatePlannerStreak = (habits: Habit[]): number => {
    const allCheckins = new Set<string>();
    habits.forEach(h => h.checkIns.forEach(ci => allCheckins.add(ci)));

    if (allCheckins.size === 0) return 0;
    
    let longestStreak = 0;
    let currentStreak = 0;
    
    const sortedDates = Array.from(allCheckins).sort();
    
    if (sortedDates.length > 0) {
        longestStreak = 1;
        currentStreak = 1;
    }

    for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i-1]);
        
        const diff = currentDate.getTime() - prevDate.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        
        if (Math.abs(diff - oneDay) < 1000) { // Allow tolerance for DST changes
            currentStreak++;
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    return longestStreak;
};


export const LEVELS: Level[] = [
    { level: 1, xpRange: [0, 500], title: 'Newbie', icon: '🌱' },
    { level: 2, xpRange: [501, 1000], title: 'Starter', icon: '🎯' },
    { level: 3, xpRange: [1001, 2000], title: 'Consistent', icon: '🔥' },
    { level: 4, xpRange: [2001, 3500], title: 'Productive', icon: '💪' },
    { level: 5, xpRange: [3501, 5000], title: 'Achiever', icon: '🏆' },
    { level: 6, xpRange: [5001, 7500], title: 'Focus Master', icon: '🧘‍♂️' },
    { level: 7, xpRange: [7501, 10000], title: 'Time Lord', icon: '⏰' },
    { level: 8, xpRange: [10001, null], title: 'Productivity Legend', icon: '💎' },
];

export const calculateAchievementScore = (data: AppData): number => {
    let score = 0;
    const { tasks, habits, sessions } = data;

    // Task XP
    const completedTasks = tasks.filter(t => t.completed);
    score += completedTasks.length * 10; // +10 per completed task
    score += completedTasks.filter(t => t.completionDate && t.dueDate && new Date(t.completionDate) <= new Date(t.dueDate.replace(' ', 'T'))).length * 5; // +5 bonus for on-time

    // Focus XP
    const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / (1000 * 60);
    score += Math.floor(totalFocusMinutes / 25) * 20; // +20 per 25-minute block

    // Habit XP
    score += habits.reduce((sum, h) => sum + h.checkIns.length, 0) * 5; // +5 per check-in

    // Bonus XP from unlocked achievements
    ACHIEVEMENTS_LIST.forEach(achievement => {
        if (achievement.xpBonus) {
            const { current, goal } = achievement.getProgress(data);
            if (current >= goal) {
                score += achievement.xpBonus;
            }
        }
    });

    return score;
};

// --- New, Expanded Achievements List ---
export const ACHIEVEMENTS_LIST: Achievement[] = [
    // 1. Habit Badges
    {
        id: 'habit-starter',
        category: 'habit',
        title: 'Starter',
        description: (c, g) => `Create your first habit.`,
        icon: HabitIcon,
        getProgress: ({ habits }) => ({ current: habits.length, goal: 1 }),
    },
    {
        id: 'habit-mindful',
        category: 'habit',
        title: 'Mindful',
        description: (c, g) => `Complete ${g} total habit check-ins.`,
        icon: BrainIcon,
        xpBonus: 50,
        getProgress: ({ habits }) => ({ current: habits.reduce((sum, h) => sum + h.checkIns.length, 0), goal: 100 }),
    },
    // 2. Task & Project Badges
    {
        id: 'task-master',
        category: 'task',
        title: 'Task Master',
        description: (c, g) => `Complete ${g} tasks.`,
        icon: TasksIcon,
        xpBonus: 100,
        getProgress: ({ tasks }) => ({ current: tasks.filter(t => t.completed).length, goal: 100 }),
    },
    {
        id: 'task-efficient',
        category: 'task',
        title: 'Efficient',
        description: (c, g) => `Complete ${g} tasks before their due time.`,
        icon: SparklesIcon,
        xpBonus: 50,
        getProgress: ({ tasks }) => ({
            current: tasks.filter(t => t.completed && t.completionDate && t.dueDate && new Date(t.completionDate) <= new Date(t.dueDate.replace(' ', 'T'))).length,
            goal: 10,
        }),
    },
    {
        id: 'task-inbox-zero',
        category: 'task',
        title: 'Inbox Zero',
        description: (c, g) => `Clear all tasks in a single day.`,
        icon: TasksIcon,
        xpBonus: 30,
        getProgress: ({ tasks }) => {
             const todayStr = toYYYYMMDD(new Date());
             const todaysTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(todayStr));
             const completedToday = todaysTasks.every(t => t.completed);
             return { current: (todaysTasks.length > 0 && completedToday) ? 1 : 0, goal: 1 };
        },
    },
    // 3. Focus & Time Badges
    {
        id: 'focus-rookie',
        category: 'focus',
        title: 'Pomodoro Rookie',
        description: (c, g) => `Complete ${g} focus sessions.`,
        icon: PomodoroIcon,
        getProgress: ({ sessions }) => ({ current: sessions.length, goal: 5 }),
    },
    {
        id: 'focus-deep-worker',
        category: 'focus',
        title: 'Deep Worker',
        description: (c, g) => `Focus for ${g} hours in a single day.`,
        icon: PomodoroIcon,
        xpBonus: 40,
        getProgress: ({ sessions }) => {
            const sessionsByDay = sessions.reduce((acc, s) => {
                const day = toYYYYMMDD(new Date(s.startTime));
                const duration = (s.endTime - s.startTime) / (1000 * 60 * 60);
                acc[day] = (acc[day] || 0) + duration;
                return acc;
            }, {} as Record<string, number>);
            return { current: Math.max(0, ...Object.values(sessionsByDay)), goal: 2 };
        },
    },
    {
        id: 'focus-monk',
        category: 'focus',
        title: 'Productivity Monk',
        description: (c, g) => `Log a total of ${g} focus hours.`,
        icon: PomodoroIcon,
        xpBonus: 200,
        getProgress: ({ sessions }) => ({
            current: Math.floor(sessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / (1000 * 60 * 60)),
            goal: 100,
        }),
    },
    // 4. Consistency & Streak Badges
    {
        id: 'consistency-streaker',
        category: 'consistency',
        title: 'Streaker',
        description: (c, g) => `Maintain a ${g}-day habit streak.`,
        icon: HabitIcon,
        xpBonus: 30,
        getProgress: ({ habits }) => ({ current: Math.max(0, ...habits.map(h => calculateLongestStreak(h.checkIns))), goal: 7 }),
    },
    {
        id: 'consistency-king',
        category: 'consistency',
        title: 'Consistency King',
        description: (c, g) => `Maintain a ${g}-day habit streak.`,
        icon: HabitIcon,
        xpBonus: 50,
        getProgress: ({ habits }) => ({ current: Math.max(0, ...habits.map(h => calculateLongestStreak(h.checkIns))), goal: 30 }),
    },
    {
        id: 'consistency-unbreakable',
        category: 'consistency',
        title: 'Unbreakable',
        description: (c, g) => `Maintain a ${g}-day habit streak.`,
        icon: HabitIcon,
        xpBonus: 100,
        getProgress: ({ habits }) => ({ current: Math.max(0, ...habits.map(h => calculateLongestStreak(h.checkIns))), goal: 90 }),
    },
    // 5. Milestone Badges
    {
        id: 'milestone-21',
        category: 'milestone',
        title: '21 Days',
        description: (c, g) => `Form a habit base with a ${g}-day streak.`,
        icon: SparklesIcon,
        xpBonus: 50,
        getProgress: ({ habits }) => ({ current: Math.max(0, ...habits.map(h => calculateLongestStreak(h.checkIns))), goal: 21 }),
    },
    {
        id: 'milestone-180',
        category: 'milestone',
        title: 'Half-Year Achiever',
        description: (c, g) => `Maintain a streak for ${g} days.`,
        icon: SparklesIcon,
        xpBonus: 150,
        getProgress: ({ habits }) => ({ current: Math.max(0, ...habits.map(h => calculateLongestStreak(h.checkIns))), goal: 180 }),
    },
    {
        id: 'milestone-365',
        category: 'milestone',
        title: 'Year-long Legend',
        description: (c, g) => `Maintain a ${g}-day streak.`,
        icon: TrophyIcon,
        xpBonus: 365,
        getProgress: ({ habits }) => ({ current: Math.max(0, ...habits.map(h => calculateLongestStreak(h.checkIns))), goal: 365 }),
    },
    // 6. Special Badges
    {
        id: 'special-early-bird',
        category: 'special',
        title: 'Early Bird',
        description: (c, g) => `Complete tasks before 8 AM for ${g} days.`,
        icon: SunIcon,
        xpBonus: 20,
        getProgress: ({ tasks }) => {
            const earlyDays = new Set(tasks.filter(t => t.completed && t.completionDate && new Date(t.completionDate).getHours() < 8).map(t => toYYYYMMDD(new Date(t.completionDate!))));
            return { current: earlyDays.size, goal: 5 };
        },
    },
    {
        id: 'special-all-rounder',
        category: 'special',
        title: 'All-Rounder',
        description: (c, g) => `Earn ${g} or more different badges.`,
        icon: PuzzleIcon,
        xpBonus: 100,
        getProgress: (data) => {
            const unlockedCount = ACHIEVEMENTS_LIST.filter(a => a.id !== 'special-all-rounder' && a.getProgress(data).current >= a.getProgress(data).goal).length;
            return { current: unlockedCount, goal: 10 };
        },
    },
];