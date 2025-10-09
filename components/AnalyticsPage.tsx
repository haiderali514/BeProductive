import React, { useMemo, useState, useCallback } from 'react';
import { Task, Habit, PomodoroSession, List, Priority, UserProfile, AIContext, ActiveView, Achievement, Level, AppData } from '../types';
import { generateWeeklyReview, generateAnalyticsInsights } from '../services/geminiService';
import { WeeklyReviewModal } from './WeeklyReviewModal';
import { Settings } from '../hooks/useSettings';
import { ApiFeature, ApiUsage, FEATURE_NAMES } from '../hooks/useApiUsage';
import { BarChart, PieChart, Bar, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AIAssistantIcon, TrophyIcon } from './Icons';
import { ACHIEVEMENTS_LIST, LEVELS, calculateAchievementScore } from '../constants';


type AnalyticsFilter = 'dashboard' | 'tasks' | 'focus' | 'habits';

interface AnalyticsPageProps {
  tasks: Task[];
  habits: Habit[];
  sessions: PomodoroSession[];
  lists: List[];
  profile: UserProfile;
  settings: Settings;
  apiUsage: ApiUsage;
  logApiCall: (feature: ApiFeature, tokens: number) => void;
  setActiveView: (view: ActiveView) => void;
}

const toYYYYMMDD = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateStreak = (checkIns: string[]): number => {
    if (checkIns.length === 0) return 0;
    
    const checkInSet = new Set(checkIns);
    
    let currentDate = new Date();
    // If today is not checked, start from yesterday
    if (!checkInSet.has(toYYYYMMDD(currentDate))) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // If yesterday is also not checked, streak is 0 unless today was checked
     if (!checkInSet.has(toYYYYMMDD(currentDate)) && !checkInSet.has(toYYYYMMDD(new Date()))) {
        return 0;
     }
    
    let streak = 0;
    while(checkInSet.has(toYYYYMMDD(currentDate))) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
};

const ChartWrapper: React.FC<{ title: string; children: React.ReactElement; height?: number }> = ({ title, children, height = 250 }) => (
    <div className="bg-background-secondary p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
            {children}
        </ResponsiveContainer>
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-background-secondary p-4 rounded-lg shadow">
        <p className="text-sm text-content-secondary">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {description && <p className="text-xs text-content-tertiary mt-1">{description}</p>}
    </div>
);

// --- New Gamification Components ---

const ProductivityComparisonCard: React.FC<{ title: string; change: number; isPercentage?: boolean; upIsGood?: boolean }> = ({ title, change, isPercentage = true, upIsGood = true }) => {
    const isUp = change > 0;
    const isDown = change < 0;
    
    let color = 'text-content-primary';
    if(upIsGood) {
        if (isUp) color = 'text-green-400';
        if (isDown) color = 'text-red-400';
    } else {
        if (isUp) color = 'text-red-400';
        if (isDown) color = 'text-green-400';
    }

    const changeText = isUp ? `+${change}` : `${change}`;
    const unit = isPercentage ? '%' : '';

    return (
        <div className="bg-background-secondary p-4 rounded-lg shadow text-center flex flex-col justify-center">
            <h4 className="text-sm text-content-secondary font-semibold mb-1">{title}</h4>
            <p className={`text-2xl font-bold ${color}`}>
                {changeText}{unit}
            </p>
            <p className="text-xs text-content-tertiary mt-1">vs. last week</p>
        </div>
    );
};

const BadgesDisplay: React.FC<{ badges: Achievement[]; allBadgesCount: number; setActiveView: (view: ActiveView) => void; }> = ({ badges, allBadgesCount, setActiveView }) => (
    <div className="bg-background-secondary p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">🏅 Badges Unlocked ({badges.length} / {allBadgesCount})</h3>
        <div className="flex flex-wrap gap-3 mb-3">
            {badges.slice(0, 10).map(badge => {
                const Icon = badge.icon;
                return (
                    <div key={badge.id} title={badge.title} className={`w-10 h-10 flex items-center justify-center rounded-full bg-background-primary ${badge.iconColor || 'text-yellow-400'}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )
            })}
        </div>
        <button onClick={() => setActiveView('achievements')} className="text-sm text-primary hover:underline font-semibold">
            View All Achievements →
        </button>
    </div>
);

const Heatmap = ({ data }: { data: { date: string, count: number }[] }) => {
    const getColor = (count: number) => {
        if (count === 0) return 'bg-background-tertiary';
        if (count <= 2) return 'bg-primary/30';
        if (count <= 5) return 'bg-primary/60';
        return 'bg-primary';
    };
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    const startDay = startDate.getDay();

    const allDays = Array.from({ length: 365 + startDay }).map((_, i) => {
        if (i < startDay) return null;
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + (i - startDay));
        const dateStr = toYYYYMMDD(d);
        const dayData = data.find(item => item.date === dateStr);
        return { date: dateStr, count: dayData?.count || 0 };
    });

    return (
        <div className="grid grid-flow-col grid-rows-7 gap-1">
            {allDays.map((day, i) =>
                day ? (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                        title={`${day.date}: ${day.count} contribution${day.count !== 1 ? 's' : ''}`}
                    />
                ) : (
                    <div key={`empty-${i}`} className="w-3 h-3" />
                )
            )}
        </div>
    );
};


export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ tasks, habits, sessions, lists, profile, settings, apiUsage, logApiCall, setActiveView }) => {
    const [filter, setFilter] = useState<AnalyticsFilter>('dashboard');
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    
    const analyticsData = useMemo(() => {
        // --- Gamification Data ---
        const appData: AppData = { tasks, habits, sessions };
        const allUnlockedBadges = ACHIEVEMENTS_LIST.filter(a => a.getProgress(appData).current >= a.getProgress(appData).goal);

        // --- Productivity Comparisons ---
        const today = new Date(); today.setHours(23, 59, 59, 999);
        const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7); sevenDaysAgo.setHours(0,0,0,0);
        const fourteenDaysAgo = new Date(today); fourteenDaysAgo.setDate(today.getDate() - 14); fourteenDaysAgo.setHours(0,0,0,0);
        
        const tasksCompletedThisWeek = tasks.filter(t => t.completed && t.completionDate && new Date(t.completionDate) >= sevenDaysAgo && new Date(t.completionDate) <= today).length;
        const tasksCompletedLastWeek = tasks.filter(t => t.completed && t.completionDate && new Date(t.completionDate) >= fourteenDaysAgo && new Date(t.completionDate) < sevenDaysAgo).length;
        const taskCompletionChange = tasksCompletedThisWeek - tasksCompletedLastWeek;

        const focusThisWeek = sessions.reduce((sum, s) => (s.startTime >= sevenDaysAgo.getTime() && s.startTime <= today.getTime()) ? sum + (s.endTime - s.startTime) : sum, 0);
        const focusLastWeek = sessions.reduce((sum, s) => (s.startTime >= fourteenDaysAgo.getTime() && s.startTime < sevenDaysAgo.getTime()) ? sum + (s.endTime - s.startTime) : sum, 0);
        const focusChangeMinutes = Math.round((focusThisWeek - focusLastWeek) / (1000 * 60));

        const getHabitRate = (habits: Habit[], start: Date, end: Date): number => {
            if (habits.length === 0) return 0;
            const dayCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (dayCount <= 0) return 0;
            const totalPossibleCheckins = habits.length * dayCount;
            if (totalPossibleCheckins === 0) return 0;
            const totalActualCheckins = habits.reduce((sum, h) => sum + h.checkIns.filter(ci => { const d = new Date(ci); return d >= start && d < end; }).length, 0);
            return Math.round((totalActualCheckins / totalPossibleCheckins) * 100);
        };
        const habitConsistencyThisWeek = getHabitRate(habits, sevenDaysAgo, today);
        const habitConsistencyLastWeek = getHabitRate(habits, fourteenDaysAgo, sevenDaysAgo);
        const habitConsistencyChange = habitConsistencyThisWeek - habitConsistencyLastWeek;
        
        // --- Achievement Score Trend ---
        const achievementScoreTrend = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            date.setHours(23, 59, 59, 999); // End of the day

            const dataUptoDate: AppData = {
                tasks: tasks.filter(t => !t.completionDate || new Date(t.completionDate) <= date),
                habits: habits.map(h => ({ ...h, checkIns: h.checkIns.filter(ci => new Date(ci) <= date) })),
                sessions: sessions.filter(s => s.startTime <= date.getTime())
            };

            return {
                date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                score: calculateAchievementScore(dataUptoDate)
            };
        });


        // --- Dashboard Chart Data ---
        const contributions = [...tasks.filter(t => t.completed && t.completionDate).map(t => ({ date: toYYYYMMDD(new Date(t.completionDate!)) })), ...habits.flatMap(h => h.checkIns.map(ci => ({ date: ci }))), ...sessions.map(s => ({ date: toYYYYMMDD(new Date(s.startTime)) }))]
            .reduce((acc, item) => {
                if (item.date) acc[item.date] = (acc[item.date] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        
        const heatmapData = Array.from({ length: 365 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = toYYYYMMDD(d);
            return { date: dateStr, count: contributions[dateStr] || 0 };
        }).reverse();

        const taskVelocityData = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const dateStr = toYYYYMMDD(d);
            const created = tasks.filter(t => t.id && new Date(parseInt(t.id)).toISOString().split('T')[0] === dateStr).length;
            const completed = tasks.filter(t => t.completed && t.completionDate && t.completionDate.startsWith(dateStr)).length;
            return { date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), created, completed };
        });
        
        const focusByListData = sessions.reduce((acc, session) => {
            const taskItem = tasks.find(t => t.id === session.taskId);
            const list = lists.find(l => l.id === taskItem?.listId);
            const listName = list?.name || 'No List';
            const duration = (session.endTime - session.startTime) / (1000 * 60);
            const existing = acc.find(item => item.name === listName);
            if (existing) existing.value += duration;
            else acc.push({ name: listName, value: Math.round(duration) });
            return acc;
        }, [] as { name: string, value: number }[]);

        const PIE_COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#9013FE'];

        const productivityByTimeData = sessions.reduce((acc, session) => {
            const hour = new Date(session.startTime).getHours();
            let period = 'Evening';
            if (hour >= 5 && hour < 12) period = 'Morning';
            else if (hour >= 12 && hour < 17) period = 'Afternoon';
            
            const existing = acc.find(item => item.name === period);
            const duration = (session.endTime - session.startTime) / (1000 * 60);
            if (existing) existing.focusMinutes += duration;
            else acc.push({ name: period, focusMinutes: duration });
            return acc;
        }, [] as { name: string, focusMinutes: number }[]).map(d => ({...d, focusMinutes: Math.round(d.focusMinutes)}));

        // --- Detailed Tab Data ---
        const totalCompletedTasks = tasks.filter(t => t.completed).length;
        const overdueTasksCount = tasks.filter(t => !t.completed && !t.wontDo && !t.trashed && t.dueDate && new Date(t.dueDate.split(' ')[0]) < new Date(new Date().toDateString())).length;
        const totalMeaningfulTasks = tasks.filter(t => !t.isSection).length;
        const taskCompletionRate = totalMeaningfulTasks > 0 ? Math.round((totalCompletedTasks / totalMeaningfulTasks) * 100) : 0;
        
        const taskCompletionTrend = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = toYYYYMMDD(d);
            const completed = tasks.filter(t => t.completed && t.completionDate && t.completionDate.startsWith(dateStr)).length;
            return { date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), completed };
        }).reverse();

        const completedByPriority = Object.values(Priority).filter(p => p !== Priority.NONE).map(p => ({
            name: p,
            value: tasks.filter(t => t.completed && t.priority === p).length
        })).filter(item => item.value > 0);

        const tasksByList = lists.map(list => ({
            name: list.name,
            value: tasks.filter(t => !t.completed && !t.wontDo && !t.trashed && t.listId === list.id).length
        })).filter(item => item.value > 0);

        const totalFocusMs = sessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
        const totalFocusHours = (totalFocusMs / (1000 * 60 * 60)).toFixed(1);
        const avgSessionLength = sessions.length > 0 ? Math.round(totalFocusMs / sessions.length / (1000 * 60)) : 0;
        
        const focusByDayOfWeek = sessions.reduce((acc, session) => {
            const day = new Date(session.startTime).toLocaleString('default', { weekday: 'long' });
            const duration = (session.endTime - session.startTime) / (1000 * 60);
            acc[day] = (acc[day] || 0) + duration;
            return acc;
        }, {} as Record<string, number>);
        const mostProductiveDay = Object.entries(focusByDayOfWeek).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
        const focusTrend = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = toYYYYMMDD(d);
            const minutes = sessions
                .filter(s => toYYYYMMDD(new Date(s.startTime)) === dateStr)
                .reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / (1000 * 60);
            return { date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), minutes: Math.round(minutes) };
        }).reverse();
        
        const focusByHour = Array.from({ length: 24 }).map((_, hour) => {
            const minutes = sessions
                .filter(s => new Date(s.startTime).getHours() === hour)
                .reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / (1000 * 60);
            return { hour: `${String(hour).padStart(2, '0')}:00`, minutes: Math.round(minutes) };
        });

        const totalCheckIns = habits.reduce((sum, h) => sum + h.checkIns.length, 0);
        const totalPossibleDays = habits.reduce((sum, h) => {
            if (h.checkIns.length === 0) return sum;
            const firstCheckIn = new Date(h.checkIns.sort()[0]);
            const days = Math.floor((new Date().getTime() - firstCheckIn.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return sum + days;
        }, 0);
        const overallConsistency = totalPossibleDays > 0 ? Math.round((totalCheckIns / totalPossibleDays) * 100) : 0;

        const habitConsistencyRates = habits.map(h => {
            if (h.checkIns.length === 0) return { name: h.name, rate: 0 };
            const firstCheckIn = new Date(h.checkIns.sort()[0]);
            const days = Math.floor((new Date().getTime() - firstCheckIn.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return { name: h.name, rate: days > 0 ? Math.round((h.checkIns.length / days) * 100) : 0 };
        });
        const mostConsistentHabit = habitConsistencyRates.sort((a,b) => b.rate - a.rate)[0]?.name || 'N/A';
        
        const habitStreaks = habits.map(h => ({ name: h.name, streak: calculateStreak(h.checkIns) }));
        
        const checkinsByDayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => {
            const count = habits.reduce((sum, h) => sum + h.checkIns.filter(ci => new Date(ci+'T00:00:00').getUTCDay() === index).length, 0);
            return { day: dayName, checkins: count };
        });


        return {
            unlockedBadges: allUnlockedBadges,
            taskCompletionChange,
            focusChangeMinutes,
            habitConsistencyChange,
            achievementScoreTrend,
            heatmapData,
            taskVelocityData,
            focusByListData,
            PIE_COLORS,
            productivityByTimeData,
            taskAnalytics: {
                totalCompleted: totalCompletedTasks,
                overdue: overdueTasksCount,
                completionRate: taskCompletionRate,
                completionTrend: taskCompletionTrend,
                completedByPriority,
                tasksByList
            },
            focusAnalytics: {
                totalHours: totalFocusHours,
                avgSessionLength: `${avgSessionLength}m`,
                mostProductiveDay,
                focusTrend,
                focusByHour
            },
            habitAnalytics: {
                totalCheckIns,
                consistencyRate: `${overallConsistency}%`,
                mostConsistentHabit,
                streaks: habitStreaks,
                byDayOfWeek: checkinsByDayOfWeek
            }
        };
    }, [tasks, habits, sessions, lists]);

    const handleGenerateReview = async () => {
        if (!settings.enableAIFeatures) {
            throw new Error("AI features are disabled in settings.");
        }
        const context: AIContext = { tasks, lists, habits, profile, pomodoroSessions: sessions };
        const { data, tokensUsed } = await generateWeeklyReview(context);
        logApiCall('weeklyReview', tokensUsed);
        return data;
    };

    const filterButtons: { id: AnalyticsFilter; label: string }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'focus', label: 'Focus' },
        { id: 'habits', label: 'Habits' },
    ];

    const getButtonClass = (buttonId: AnalyticsFilter) => `px-4 py-2 rounded-lg font-semibold transition-colors ${filter === buttonId ? 'bg-primary text-white' : 'bg-background-secondary hover:bg-background-tertiary text-content-secondary'}`;

    return (
        <>
            <div className="flex-1 overflow-y-auto p-8 bg-background-primary">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-content-primary">Analytics</h1>
                    <button onClick={() => setReviewModalOpen(true)} disabled={!settings.enableAIFeatures} title={!settings.enableAIFeatures ? "AI features are disabled" : "Generate Weekly Review"} className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-semibold hover:bg-primary/30 transition-colors flex items-center space-x-2 disabled:bg-background-tertiary disabled:text-content-tertiary disabled:cursor-not-allowed">
                        <span>Generate Weekly Review ✨</span>
                    </button>
                </div>
                
                <div className="flex space-x-2 mb-8">
                    {filterButtons.map(btn => (<button key={btn.id} onClick={() => setFilter(btn.id)} className={getButtonClass(btn.id)}>{btn.label}</button>))}
                </div>

                {filter === 'dashboard' && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <ChartWrapper title="Achievement Score Trend (Last 7 Days)">
                                <LineChart data={analyticsData.achievementScoreTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                    <XAxis dataKey="date" stroke="#A0A0A0" fontSize={12} />
                                    <YAxis stroke="#A0A0A0" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} />
                                    <Line type="monotone" dataKey="score" name="XP" stroke="#4A90E2" strokeWidth={2} />
                                </LineChart>
                            </ChartWrapper>
                            <BadgesDisplay badges={analyticsData.unlockedBadges} allBadgesCount={ACHIEVEMENTS_LIST.length} setActiveView={setActiveView} />
                        </div>
                        <div className="space-y-6">
                            <ProductivityComparisonCard title="Tasks Done" change={analyticsData.taskCompletionChange} isPercentage={false} />
                            <ProductivityComparisonCard title="Focus Time (min)" change={analyticsData.focusChangeMinutes} isPercentage={false} />
                            <ProductivityComparisonCard title="Habit Consistency" change={analyticsData.habitConsistencyChange} />
                        </div>

                        <ChartWrapper title="Contribution Heatmap (Last Year)" height={120} >
                             <Heatmap data={analyticsData.heatmapData} />
                        </ChartWrapper>
                        <ChartWrapper title="Task Velocity (Last 30 Days)">
                            <BarChart data={analyticsData.taskVelocityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                <XAxis dataKey="date" stroke="#A0A0A0" fontSize={12} />
                                <YAxis stroke="#A0A0A0" fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} />
                                <Legend />
                                <Bar dataKey="completed" stackId="a" fill="#82ca9d" name="Completed" />
                                <Bar dataKey="created" stackId="b" fill="#8884d8" name="Created" />
                            </BarChart>
                        </ChartWrapper>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ChartWrapper title="Focus Distribution by List">
                                <PieChart>
                                    <Pie data={analyticsData.focusByListData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                        {analyticsData.focusByListData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={analyticsData.PIE_COLORS[index % analyticsData.PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} />
                                </PieChart>
                            </ChartWrapper>
                            <ChartWrapper title="Productivity by Time of Day">
                                 <BarChart data={analyticsData.productivityByTimeData}>
                                    <XAxis dataKey="name" stroke="#A0A0A0" fontSize={12} />
                                    <YAxis unit="m" stroke="#A0A0A0" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} />
                                    <Bar dataKey="focusMinutes" fill="#f59e0b" name="Focus Minutes" />
                                </BarChart>
                            </ChartWrapper>
                        </div>
                    </div>
                )}
                
                {(filter === 'tasks') && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Completed" value={analyticsData.taskAnalytics.totalCompleted} />
                            <StatCard title="Overdue" value={analyticsData.taskAnalytics.overdue} />
                            <StatCard title="Completion Rate" value={`${analyticsData.taskAnalytics.completionRate}%`} />
                        </div>
                        <ChartWrapper title="Daily Completions (Last 30 Days)">
                             <BarChart data={analyticsData.taskAnalytics.completionTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                <XAxis dataKey="date" stroke="#A0A0A0" fontSize={12} />
                                <YAxis stroke="#A0A0A0" fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} cursor={{fill: '#333333'}}/>
                                <Bar dataKey="completed" name="Completed Tasks" fill="#82ca9d" />
                            </BarChart>
                        </ChartWrapper>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ChartWrapper title="Completed by Priority">
                                {analyticsData.taskAnalytics.completedByPriority.length > 0 ? (
                                    <PieChart>
                                        <Pie data={analyticsData.taskAnalytics.completedByPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                            <Cell fill="#ef4444" /><Cell fill="#f59e0b" /><Cell fill="#3b82f6" />
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} />
                                        <Legend />
                                    </PieChart>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-content-tertiary">No prioritized tasks completed yet.</div>
                                )}
                            </ChartWrapper>
                            <ChartWrapper title="Task Distribution by List">
                                {analyticsData.taskAnalytics.tasksByList.length > 0 ? (
                                    <PieChart>
                                        <Pie data={analyticsData.taskAnalytics.tasksByList} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                            {analyticsData.taskAnalytics.tasksByList.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={analyticsData.PIE_COLORS[index % analyticsData.PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} />
                                    </PieChart>
                                ) : (
                                     <div className="flex items-center justify-center h-full text-content-tertiary">No active tasks found in lists.</div>
                                )}
                            </ChartWrapper>
                        </div>
                    </div>
                )}
                
                {(filter === 'focus') && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Focus" value={`${analyticsData.focusAnalytics.totalHours}h`} />
                            <StatCard title="Avg. Session" value={analyticsData.focusAnalytics.avgSessionLength} />
                            <StatCard title="Most Productive Day" value={analyticsData.focusAnalytics.mostProductiveDay} />
                        </div>
                        <ChartWrapper title="Daily Focus Trend (Last 30 Days)">
                             <LineChart data={analyticsData.focusAnalytics.focusTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                <XAxis dataKey="date" stroke="#A0A0A0" fontSize={12} />
                                <YAxis unit="m" stroke="#A0A0A0" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} />
                                <Legend />
                                <Line type="monotone" dataKey="minutes" name="Focus Minutes" stroke="#8884d8" />
                            </LineChart>
                        </ChartWrapper>
                        <ChartWrapper title="Productivity by Hour of Day">
                            <BarChart data={analyticsData.focusAnalytics.focusByHour}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                <XAxis dataKey="hour" stroke="#A0A0A0" fontSize={12} />
                                <YAxis unit="m" stroke="#A0A0A0" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} cursor={{fill: '#333333'}}/>
                                <Bar dataKey="minutes" name="Focus Minutes" fill="#8884d8" />
                            </BarChart>
                        </ChartWrapper>
                    </div>
                )}

                {(filter === 'habits') && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Check-ins" value={analyticsData.habitAnalytics.totalCheckIns} />
                            <StatCard title="Overall Consistency" value={analyticsData.habitAnalytics.consistencyRate} />
                            <StatCard title="Most Consistent" value={analyticsData.habitAnalytics.mostConsistentHabit} description="Based on completion rate" />
                        </div>
                         <ChartWrapper title="Current Habit Streaks">
                            <BarChart data={analyticsData.habitAnalytics.streaks} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                <XAxis type="number" stroke="#A0A0A0" fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke="#A0A0A0" fontSize={12} width={80} />
                                <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} cursor={{fill: '#333333'}}/>
                                <Bar dataKey="streak" name="Current Streak (days)" fill="#4A90E2" />
                            </BarChart>
                        </ChartWrapper>
                        <ChartWrapper title="Check-ins by Day of Week">
                            <BarChart data={analyticsData.habitAnalytics.byDayOfWeek}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                <XAxis dataKey="day" stroke="#A0A0A0" fontSize={12} />
                                <YAxis stroke="#A0A0A0" fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333' }} cursor={{fill: '#333333'}}/>
                                <Bar dataKey="checkins" name="Total Check-ins" fill="#50E3C2" />
                            </BarChart>
                        </ChartWrapper>
                    </div>
                )}
            </div>
            {settings.enableAIFeatures && <WeeklyReviewModal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} onGenerate={handleGenerateReview} />}
        </>
    );
};
