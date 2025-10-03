
import React, { useMemo } from 'react';
import { Task, Habit, PomodoroSession, List, Priority } from '../types';

interface AnalyticsPageProps {
  tasks: Task[];
  habits: Habit[];
  sessions: PomodoroSession[];
  lists: List[];
}

// Helper components for charts and stats, defined within this file for simplicity

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="bg-background-secondary p-6 rounded-lg shadow">
    <p className="text-sm text-content-secondary mb-1">{title}</p>
    <p className="text-3xl font-bold text-content-primary">{value}</p>
  </div>
);

const BarChart: React.FC<{ title: string; data: { label: string; value: number }[]; unit?: string }> = ({ title, data, unit = '' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-background-secondary p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex justify-around items-end h-48 space-x-2">
        {data.map(item => (
          <div key={item.label} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-primary rounded-t-md hover:bg-primary-focus transition-colors"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.value} ${unit}`}
            ></div>
            <p className="text-xs text-content-tertiary mt-2">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PIE_COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#9013FE'];

const PieChart: React.FC<{ title: string; data: { label: string; value: number }[] }> = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return (
     <div className="bg-background-secondary p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-content-secondary text-center h-48 flex items-center justify-center">No data available</p>
    </div>
  );

  let cumulativePercent = 0;
  const gradients = data.map((item, index) => {
    const percent = (item.value / total) * 100;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const gradientPart = `${color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return gradientPart;
  });

  return (
    <div className="bg-background-secondary p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center space-x-6">
        <div 
          className="w-32 h-32 rounded-full"
          style={{ background: `conic-gradient(${gradients.join(', ')})` }}
        ></div>
        <div className="text-sm space-y-2">
          {data.map((item, index) => (
            <div key={item.label} className="flex items-center">
              <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
              <span>{item.label}: {item.value} ({Math.round((item.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ tasks, habits, sessions, lists }) => {
    
    const analyticsData = useMemo(() => {
        // --- Top Stats ---
        const tasksCompleted = tasks.filter(t => t.completed).length;

        const totalFocusMs = sessions.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
        const totalFocusHours = Math.floor(totalFocusMs / (1000 * 60 * 60));
        const totalFocusMinutes = Math.floor((totalFocusMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalFocusDuration = `${totalFocusHours}h ${totalFocusMinutes}m`;

        const totalHabitCheckIns = habits.reduce((sum, h) => sum + h.checkIns.length, 0);
        
        // --- Chart Data ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Task Completion Trend (based on due date of completed tasks in the last week)
        const taskTrendData = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' });
            
            const count = tasks.filter(t => t.completed && t.dueDate && t.dueDate.startsWith(dateStr)).length;
            return { label: dayLabel, value: count };
        });

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

        // Tasks by Priority
        const tasksByPriority = tasks.filter(t => t.completed).reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {} as Record<Priority, number>);
        const priorityData = Object.entries(tasksByPriority).map(([label, value]) => ({ label, value }));
        
        // Tasks by List
        const listNameMap = lists.reduce((map, list) => {
            map[list.id] = list.name;
            return map;
        }, {} as Record<string, string>);
        const tasksByList = tasks.filter(t => t.completed).reduce((acc, task) => {
            const listName = listNameMap[task.listId] || 'Unknown';
            acc[listName] = (acc[listName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const listData = Object.entries(tasksByList).map(([label, value]) => ({ label, value }));

        // Habit Performance
        const habitPerformance = [...habits]
            .sort((a, b) => b.checkIns.length - a.checkIns.length)
            .slice(0, 3)
            .map(h => ({ name: `${h.icon} ${h.name}`, checkIns: h.checkIns.length }));

        return {
            tasksCompleted,
            totalFocusDuration,
            totalHabitCheckIns,
            taskTrendData,
            focusTrendData,
            priorityData,
            listData,
            habitPerformance
        };
    }, [tasks, habits, sessions, lists]);

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-background-primary">
            <h1 className="text-3xl font-bold text-content-primary mb-8">Analytics Dashboard</h1>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Tasks Completed" value={analyticsData.tasksCompleted} />
                <StatCard title="Total Focus Duration" value={analyticsData.totalFocusDuration} />
                <StatCard title="Total Habit Check-ins" value={analyticsData.totalHabitCheckIns} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <BarChart title="Task Completion Trend (Last 7 Days)" data={analyticsData.taskTrendData} unit="tasks" />
                <BarChart title="Focus Time Distribution (Last 7 Days)" data={analyticsData.focusTrendData} unit="minutes" />
                <PieChart title="Tasks by Priority" data={analyticsData.priorityData} />
                <PieChart title="Tasks by List" data={analyticsData.listData} />
            </div>

            {/* Habit Performance */}
            <div className="bg-background-secondary p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Top Habit Performance</h3>
                <ul className="space-y-3">
                    {analyticsData.habitPerformance.map(habit => (
                        <li key={habit.name} className="flex justify-between items-center bg-background-tertiary p-3 rounded-md">
                            <span className="font-medium">{habit.name}</span>
                            <span className="font-semibold text-primary">{habit.checkIns} check-ins</span>
                        </li>
                    ))}
                    {analyticsData.habitPerformance.length === 0 && (
                        <p className="text-content-secondary text-center py-4">No habit data yet.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};
