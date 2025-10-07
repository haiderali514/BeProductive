import React, { useMemo, useState } from 'react';
import { Task, Habit, PomodoroSession, List, Priority, UserProfile } from '../types';
import { generateWeeklyReview, AIContext } from '../services/geminiService';
import { WeeklyReviewModal } from './WeeklyReviewModal';
import { Settings } from '../hooks/useSettings';
import { ApiFeature, ApiUsage, FEATURE_NAMES } from '../hooks/useApiUsage';
import { BarChart, PieChart, Bar, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';


type AnalyticsFilter = 'all' | 'tasks' | 'focus' | 'habits';

interface AnalyticsPageProps {
  tasks: Task[];
  habits: Habit[];
  sessions: PomodoroSession[];
  lists: List[];
  profile: UserProfile;
  settings: Settings;
  apiUsage: ApiUsage;
  logApiCall: (feature: ApiFeature, tokens: number) => void;
}

const toYYYYMMDD = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Heatmap: React.FC<{ title: string; data: Record<string, number> }> = ({ title, data }) => {
    const today = useMemo(() => new Date(), []);
    
    const { days, firstDayOfWeek } = useMemo(() => {
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() + 1);

        const dayArray = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dayArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return {
            days: dayArray,
            firstDayOfWeek: startDate.getDay() // 0 = Sunday
        };
    }, [today]);

    const monthLabels = useMemo(() => {
        const labels: { label: string; colStart: number }[] = [];
        let lastMonth = -1;
        days.forEach((day, index) => {
            const month = day.getMonth();
            if (month !== lastMonth) {
                const weekIndex = Math.floor((index + firstDayOfWeek) / 7);
                 if (labels.length === 0 || weekIndex > labels[labels.length - 1].colStart + 2) {
                    labels.push({
                        label: day.toLocaleString('default', { month: 'short' }),
                        colStart: weekIndex,
                    });
                }
                lastMonth = month;
            }
        });
        return labels;
    }, [days, firstDayOfWeek]);
    
    // FIX: Cast Object.values(data) to number[] to resolve 'unknown' type error.
    const maxCount = Math.max(...(Object.values(data) as number[]), 0);
    const getColor = (count: number) => {
        if (count <= 0) return 'bg-background-tertiary';
        if (!maxCount) return 'bg-background-tertiary';
        const intensity = Math.min(count / (maxCount * 0.8), 1); // scale intensity to make colors pop more
        if (intensity < 0.25) return 'bg-primary/20';
        if (intensity < 0.5) return 'bg-primary/40';
        if (intensity < 0.75) return 'bg-primary/70';
        return 'bg-primary';
    };

    return (
        <div className="bg-background-secondary p-6 rounded-lg shadow col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="flex">
                <div className="flex flex-col text-xs text-content-tertiary pr-3 shrink-0" style={{paddingTop: '28px', justifyContent: 'space-between', height: '124px'}}>
                    <span>M</span>
                    <span>W</span>
                    <span>F</span>
                </div>
                <div className="w-full overflow-x-auto">
                     <div className="relative">
                        <div className="absolute top-0 left-0 h-5 flex">
                            {monthLabels.map(({ label, colStart }) => (
                                <span key={label} className="text-xs text-content-tertiary absolute" style={{ left: `calc(${colStart} * (0.875rem + 4px))` }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                        <div className="grid grid-rows-7 grid-flow-col gap-1 pt-5">
                            {Array.from({ length: firstDayOfWeek }).map((_, index) => <div key={`empty-${index}`} />)}
                            {days.map(day => {
                                const dateStr = toYYYYMMDD(day);
                                const count = data[dateStr] || 0;
                                return (
                                    <div
                                        key={dateStr}
                                        className={`w-3.5 h-3.5 rounded-sm ${getColor(count)}`}
                                        title={`${count} contributions on ${day.toLocaleDateString()}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
             <div className="flex justify-end items-center mt-4 text-xs text-content-tertiary space-x-2">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-background-tertiary" />
                <div className="w-3 h-3 rounded-sm bg-primary/20" />
                <div className="w-3 h-3 rounded-sm bg-primary/40" />
                <div className="w-3 h-3 rounded-sm bg-primary/70" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>More</span>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="bg-background-secondary p-6 rounded-lg shadow">
    <p className="text-sm text-content-secondary mb-1">{title}</p>
    <p className="text-3xl font-bold text-content-primary">{value}</p>
  </div>
);

// FIX: Using React.FC to explicitly type the component. This can help resolve "Untyped function calls" errors when components are used in a generic context.
const ChartWrapper: React.FC<{ title: string; children: React.ReactNode; height?: number }> = ({ title, children, height = 250 }) => (
    <div className="bg-background-secondary p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
            {children}
        </ResponsiveContainer>
    </div>
);

// FIX: Using React.FC and an explicit props interface to correctly type the component. This resolves "Untyped function calls may not accept type arguments" errors.
interface RechartsBarChartWrapperProps {
    title: string;
    data: { label: string; value: number }[];
    unit?: string;
}
const RechartsBarChartWrapper: React.FC<RechartsBarChartWrapperProps> = ({ title, data, unit = '' }) => {
    return (
      <ChartWrapper title={title}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="label" stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                    cursor={{fill: 'rgba(107, 107, 107, 0.1)'}}
                    contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333', borderRadius: '0.5rem' }} 
                    labelStyle={{ color: '#E0E0E0' }}
                    formatter={(value: number) => [`${value} ${unit}`, null]}
                />
                <Bar dataKey="value" fill="#4A90E2" radius={[4, 4, 0, 0]} />
            </BarChart>
      </ChartWrapper>
    );
};

const PIE_COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#9013FE', '#d946ef', '#f43f5e'];
const RADIAN = Math.PI / 180;
// FIX: Added interface for customized label props to remove `any` type.
interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomizedLabelProps) => {
    if (percent < 0.05) return null; // Don't render label for small slices
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// FIX: Using React.FC and an explicit props interface to correctly type the component. This resolves "Untyped function calls may not accept type arguments" errors.
interface RechartsPieChartWrapperProps {
    title: string;
    data: { label: string; value: number }[];
    innerRadius?: number;
}
const RechartsPieChartWrapper: React.FC<RechartsPieChartWrapperProps> = ({ title, data, innerRadius = 0 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return (
     <div className="bg-background-secondary p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-content-secondary text-center h-[250px] flex items-center justify-center">No data available</p>
    </div>
  );

  // FIX: Untyped function calls may not accept type arguments. Removed invalid <any> type arguments from Pie, Cell, and Legend components.
  return (
    <ChartWrapper title={title}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} innerRadius={innerRadius} labelLine={false} label={innerRadius > 0 ? false : renderCustomizedLabel}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={'#252525'} strokeWidth={2}/>
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333', borderRadius: '0.5rem' }} 
            labelStyle={{ color: '#E0E0E0' }}
          />
          <Legend iconSize={10} wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
        </PieChart>
    </ChartWrapper>
  );
};


export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ tasks, habits, sessions, lists, profile, settings, apiUsage, logApiCall }) => {
    const [filter, setFilter] = useState<AnalyticsFilter>('all');
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    
    const analyticsData = useMemo(() => {
        // --- Top Stats ---
        const tasksCompleted = tasks.filter(t => t.completed && !t.trashed).length;

        const totalFocusMs = sessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
        const totalFocusHours = Math.floor(totalFocusMs / (1000 * 60 * 60));
        const totalFocusMinutes = Math.floor((totalFocusMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalFocusDuration = `${totalFocusHours}h ${totalFocusMinutes}m`;

        const totalHabitCheckIns = habits.reduce((sum, h) => sum + h.checkIns.length, 0);
        
        // --- Chart Data ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Task Velocity (Last 30 days)
        const taskVelocityData = Array.from({ length: 30 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (29 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            const count = tasks.filter(t => t.completed && !t.trashed && t.dueDate && t.dueDate.startsWith(dateStr)).length;
            return { label: dayLabel, value: count };
        });

        // Completions by Day of Week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const completionsByDay = Array(7).fill(0);
        tasks.filter(t => t.completed && !t.trashed && t.dueDate).forEach(t => {
            try {
                const dayIndex = new Date(t.dueDate.replace(' ', 'T')).getDay();
                completionsByDay[dayIndex]++;
            } catch (e) {}
        });
        const completionsByDayData = dayNames.map((day, i) => ({ label: day, value: completionsByDay[i] }));
        
        // Task Status Distribution
        const incompleteTasks = tasks.filter(t => !t.completed && !t.wontDo && !t.trashed);
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        const taskStatus = { Overdue: 0, 'Due Today': 0, 'Due This Week': 0, 'No Due Date': 0, Later: 0 };
        incompleteTasks.forEach(t => {
            if (!t.dueDate) {
                taskStatus['No Due Date']++;
                return;
            }
            try {
                const dueDate = new Date(t.dueDate.replace(' ', 'T'));
                if (dueDate < today) taskStatus.Overdue++;
                else if (toYYYYMMDD(dueDate) === toYYYYMMDD(now)) taskStatus['Due Today']++;
                else if (dueDate <= weekEnd) taskStatus['Due This Week']++;
                else taskStatus.Later++;
            } catch (e) {}
        });
        const taskStatusData = Object.entries(taskStatus).filter(([, value]) => value > 0).map(([label, value]) => ({ label, value }));


        // Focus Time Distribution
        const focusTrendData = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - i));
            const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' });
            
            const focusMinutes = sessions.reduce((sum, s) => {
                const sessionDate = new Date(s.startTime);
                if (sessionDate.toDateString() === date.toDateString()) {
                    return sum + (s.endTime - s.startTime);
                }
                return sum;
            }, 0) / (1000 * 60);

            return { label: dayLabel, value: Math.round(focusMinutes) };
        });
        
        // Top Focused Tasks
        const focusByTask: Record<string, number> = {};
        sessions.forEach(s => {
            focusByTask[s.taskName] = (focusByTask[s.taskName] || 0) + (s.endTime - s.startTime);
        });
        const topFocusedTasks = Object.entries(focusByTask)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, ms]) => ({ label: name, value: Math.round(ms / (1000 * 60)) }));

        // Tasks by Priority
        const tasksByPriority = tasks.filter(t => t.completed && !t.trashed).reduce<Record<string, number>>((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {});
        const priorityData = Object.entries(tasksByPriority).map(([label, value]) => ({ label, value }));
        
        // Tasks by List
        const listNameMap = lists.reduce<Record<string, string>>((map, list) => {
            map[list.id] = list.name;
            return map;
        }, {});
        const tasksByList = tasks.filter(t => t.completed && !t.trashed).reduce<Record<string, number>>((acc, task) => {
            const listName = listNameMap[task.listId] || 'Unknown';
            acc[listName] = (acc[listName] || 0) + 1;
            return acc;
        }, {});
        const listData = Object.entries(tasksByList).map(([label, value]) => ({ label, value }));

        // Habit Consistency Radar
        const top5Habits = [...habits].sort((a,b) => b.checkIns.length - a.checkIns.length).slice(0, 5);
        const habitConsistencyData = top5Habits.map(h => {
            const totalDays = h.totalDays > 0 ? h.totalDays : 1;
            const consistency = Math.round((h.checkIns.length / totalDays) * 100);
            return { subject: `${h.icon} ${h.name}`, value: consistency, fullMark: 100 };
        });

        // AI Usage Breakdown
        // FIX: Cast Object.entries result to resolve 'unknown' type error.
        const aiUsageData = (Object.entries(apiUsage.breakdown) as [ApiFeature, { count: number; tokens: number }][])
            .filter(([, data]) => data.tokens > 0)
            .map(([key, data]) => ({ label: FEATURE_NAMES[key] || key, value: data.tokens }));


        // Heatmap Data
        const heatmapData: Record<string, number> = {};
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const incrementDate = (date: Date) => {
            if (date >= oneYearAgo) {
                const dateStr = toYYYYMMDD(date);
                heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
            }
        };

        tasks.forEach(task => {
            if (task.completed && !task.trashed && task.dueDate) {
                try {
                    const completedDate = new Date(task.dueDate.split(' ')[0]);
                    incrementDate(completedDate);
                } catch (e) { /* ignore invalid dates */ }
            }
        });

        habits.forEach(habit => {
            habit.checkIns.forEach(checkInDateStr => {
                try {
                    const checkInDate = new Date(checkInDateStr);
                    incrementDate(checkInDate);
                } catch (e) { /* ignore invalid dates */ }
            });
        });

        sessions.forEach(session => {
            try {
                const sessionDate = new Date(session.startTime);
                incrementDate(sessionDate);
            } catch (e) { /* ignore invalid dates */ }
        });


        return {
            tasksCompleted,
            totalFocusDuration,
            totalHabitCheckIns,
            taskVelocityData,
            completionsByDayData,
            taskStatusData,
            focusTrendData,
            topFocusedTasks,
            priorityData,
            listData,
            habitConsistencyData,
            aiUsageData,
            heatmapData
        };
    }, [tasks, habits, sessions, lists, apiUsage]);

    const handleGenerateReview = async () => {
        if (!settings.enableAIFeatures) {
            throw new Error("AI features are disabled in settings.");
        }
        const context: AIContext = { tasks, lists, habits, profile };
        const { data, tokensUsed } = await generateWeeklyReview(context);
        logApiCall('weeklyReview', tokensUsed);
        return data;
    };

    const filterButtons: { id: AnalyticsFilter; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'focus', label: 'Focus' },
        { id: 'habits', label: 'Habits' },
    ];

    const getButtonClass = (buttonId: AnalyticsFilter) => {
        return `px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === buttonId 
            ? 'bg-primary text-white' 
            : 'bg-background-secondary hover:bg-background-tertiary text-content-secondary'
        }`;
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-8 bg-background-primary">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-content-primary">Analytics Dashboard</h1>
                    <button 
                        onClick={() => setReviewModalOpen(true)}
                        disabled={!settings.enableAIFeatures}
                        title={!settings.enableAIFeatures ? "AI features are disabled" : "Generate Weekly Review"}
                        className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-semibold hover:bg-primary/30 transition-colors flex items-center space-x-2 disabled:bg-background-tertiary disabled:text-content-tertiary disabled:cursor-not-allowed"
                    >
                        <span>Generate Weekly Review ✨</span>
                    </button>
                </div>
                
                <div className="flex space-x-2 mb-8">
                    {filterButtons.map(btn => (
                        <button key={btn.id} onClick={() => setFilter(btn.id)} className={getButtonClass(btn.id)}>
                            {btn.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Tasks Completed" value={analyticsData.tasksCompleted} />
                    <StatCard title="Total Focus Duration" value={analyticsData.totalFocusDuration} />
                    <StatCard title="Total Habit Check-ins" value={analyticsData.totalHabitCheckIns} />
                </div>
                
                {filter === 'all' && (
                     <div className="grid grid-cols-1 gap-6 mb-8">
                        <Heatmap title="Contribution Heatmap" data={analyticsData.heatmapData} />
                    </div>
                )}
                
                {(filter === 'all' || filter === 'tasks') && (
                    <>
                        <h2 className="text-2xl font-bold text-content-primary mt-12 mb-6">Task Analytics</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                             <ChartWrapper title="Task Velocity (Last 30 Days)">
                                <LineChart data={analyticsData.taskVelocityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                                    <XAxis dataKey="label" stroke="#A0A0A0" fontSize={10} tick={{ dy: 5 }} interval={4} />
                                    <YAxis stroke="#A0A0A0" fontSize={12} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333', borderRadius: '0.5rem' }} 
                                        labelStyle={{ color: '#E0E0E0' }}
                                        formatter={(value: number) => [`${value} tasks`, null]}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#4A90E2" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                </LineChart>
                             </ChartWrapper>
                            <RechartsPieChartWrapper title="Task Status Distribution" data={analyticsData.taskStatusData} innerRadius={60} />
                            <RechartsBarChartWrapper title="Completions by Day of Week" data={analyticsData.completionsByDayData} unit="tasks" />
                            <RechartsPieChartWrapper title="Tasks by Priority" data={analyticsData.priorityData} />
                            <RechartsPieChartWrapper title="Tasks by List" data={analyticsData.listData} />
                        </div>
                    </>
                )}
                
                {(filter === 'all' || filter === 'focus') && (
                     <>
                        <h2 className="text-2xl font-bold text-content-primary mt-12 mb-6">Focus Analytics</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <RechartsBarChartWrapper title="Focus Time Distribution (Last 7 Days)" data={analyticsData.focusTrendData} unit="minutes" />
                            <RechartsBarChartWrapper title="Top 5 Focused Tasks" data={analyticsData.topFocusedTasks} unit="minutes" />
                        </div>
                    </>
                )}

                {(filter === 'all' || filter === 'habits') && (
                    <>
                        <h2 className="text-2xl font-bold text-content-primary mt-12 mb-6">Habit Analytics</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <ChartWrapper title="Habit Consistency (%)">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.habitConsistencyData}>
                                    <PolarGrid stroke="#6B6B6B" />
                                    <PolarAngleAxis dataKey="subject" stroke="#E0E0E0" fontSize={12} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#A0A0A0" fontSize={10} />
                                    <Radar name="Consistency" dataKey="value" stroke="#4A90E2" fill="#4A90E2" fillOpacity={0.6} />
                                     <Tooltip 
                                        contentStyle={{ backgroundColor: '#252525', border: '1px solid #333333', borderRadius: '0.5rem' }} 
                                        labelStyle={{ color: '#E0E0E0' }}
                                        formatter={(value: number) => [`${value}% consistent`, null]}
                                    />
                                </RadarChart>
                            </ChartWrapper>
                        </div>
                    </>
                )}

                 {settings.enableAIFeatures && (filter === 'all') && (
                    <>
                        <h2 className="text-2xl font-bold text-content-primary mt-12 mb-6">AI Usage</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                             <RechartsPieChartWrapper title="AI Feature Usage (by Tokens)" data={analyticsData.aiUsageData} />
                        </div>
                    </>
                )}
            </div>
            {settings.enableAIFeatures && <WeeklyReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                onGenerate={handleGenerateReview}
            />}
        </>
    );
};