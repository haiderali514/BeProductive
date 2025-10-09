import React, { useState, useMemo } from 'react';
import { Task, Habit, PomodoroSession, Achievement, AppData, AchievementCategory, Level } from '../types';
import { ACHIEVEMENTS_LIST, calculateAchievementScore, LEVELS } from '../constants';

interface AchievementsPageProps {
  tasks: Task[];
  habits: Habit[];
  sessions: PomodoroSession[];
}

const AchievementBadge: React.FC<{ achievement: Achievement; progress: { current: number; goal: number } }> = ({ achievement, progress }) => {
    const isUnlocked = progress.current >= progress.goal;
    const progressPercent = isUnlocked ? 100 : Math.floor((progress.current / progress.goal) * 100);
    const Icon = achievement.icon;

    return (
        <div className={`flex flex-col items-center text-center p-4 rounded-lg transition-all duration-300 ${isUnlocked ? 'bg-background-secondary border-2 border-yellow-400' : 'bg-background-tertiary'}`}>
            <div className={`relative w-20 h-20 flex items-center justify-center rounded-full mb-3 ${isUnlocked ? 'bg-yellow-400/20' : 'bg-background-primary'}`}>
                <div className={isUnlocked ? (achievement.iconColor || 'text-yellow-400') : 'text-content-tertiary grayscale'}>
                    <Icon className="w-10 h-10" />
                </div>
            </div>
            <h4 className={`font-bold ${isUnlocked ? 'text-yellow-400' : 'text-content-primary'}`}>{achievement.title}</h4>
            <p className="text-xs text-content-secondary mt-1 h-8">{achievement.description(progress.current, progress.goal)}</p>
            {!isUnlocked && (
                 <div className="w-full mt-2">
                    <div className="w-full bg-background-primary rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="text-xs text-content-tertiary mt-1">{progress.current} / {progress.goal}</p>
                </div>
            )}
        </div>
    );
};

const AchievementSection: React.FC<{
    title: string;
    achievements: Achievement[];
    data: AppData;
}> = ({ title, achievements, data }) => {
    if (achievements.length === 0) return null;
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-content-primary">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {achievements.map(ach => {
                    const progress = ach.getProgress(data);
                    return <AchievementBadge key={ach.id} achievement={ach} progress={progress} />;
                })}
            </div>
        </div>
    );
};

const LevelProgressCard: React.FC<{ score: number; level: Level }> = ({ score, level }) => {
    const nextLevel = LEVELS.find(l => l.level === level.level + 1);

    const xpForNextLevel = nextLevel ? nextLevel.xpRange[0] - level.xpRange[0] : 0;
    const xpIntoCurrentLevel = score - level.xpRange[0];
    const progressPercent = xpForNextLevel > 0 ? Math.min(100, (xpIntoCurrentLevel / xpForNextLevel) * 100) : 100;
    const xpToNextLevel = nextLevel ? nextLevel.xpRange[0] - score : 0;
    
    return (
        <div className="bg-background-secondary p-4 rounded-lg mb-6 max-w-lg mx-auto">
            <div className="text-center mb-4">
                <p className="text-sm text-content-secondary">Total Achievement Score</p>
                <p className="text-4xl font-bold text-primary my-1">{score.toLocaleString()} <span className="text-2xl">XP</span></p>
            </div>
            
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center space-x-2">
                    <span className="text-4xl">{level.icon}</span>
                    <div>
                        <p className="text-sm text-content-secondary">Level {level.level}</p>
                        <p className="font-bold text-lg text-content-primary">{level.title}</p>
                    </div>
                </div>
                {nextLevel && (
                    <div className="text-right">
                        <p className="text-sm text-content-secondary">Next: {nextLevel.title}</p>
                        <p className="font-semibold text-primary">{nextLevel.xpRange[0].toLocaleString()} XP</p>
                    </div>
                )}
            </div>
            <div className="w-full bg-background-tertiary rounded-full h-4">
                <div className="bg-primary h-4 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
            {nextLevel && (
                <p className="text-xs text-content-secondary text-center mt-2">
                    {xpToNextLevel > 0 ? `${xpToNextLevel.toLocaleString()} XP to next level` : "You're at the highest level!"}
                </p>
            )}
        </div>
    );
};


const LevelCard: React.FC<{ level: Level; isCurrent: boolean; isUnlocked: boolean }> = ({ level, isCurrent, isUnlocked }) => (
    <div className={`p-4 rounded-lg transition-all ${isCurrent ? 'bg-primary/20 border-2 border-primary' : isUnlocked ? 'bg-background-secondary' : 'bg-background-tertiary'}`}>
        <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isUnlocked ? 'bg-primary/10' : 'bg-background-primary'}`}>{level.icon}</div>
            <div>
                <p className={`text-xs ${isUnlocked ? 'text-content-secondary' : 'text-content-tertiary'}`}>Level {level.level}</p>
                <h4 className={`font-bold ${isUnlocked ? 'text-content-primary' : 'text-content-tertiary'}`}>{level.title}</h4>
                <p className={`text-xs ${isUnlocked ? 'text-primary' : 'text-content-tertiary'}`}>{level.xpRange[0].toLocaleString()} XP</p>
            </div>
        </div>
    </div>
);

type AchievementTab = 'badges' | 'levels' | 'milestones' | 'streaks' | 'insights';

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ tasks, habits, sessions }) => {
    const [activeTab, setActiveTab] = useState<AchievementTab>('badges');
    
    const appData: AppData = useMemo(() => ({ tasks, habits, sessions }), [tasks, habits, sessions]);

    const groupedAchievements = useMemo(() => {
        return ACHIEVEMENTS_LIST.reduce((acc, ach) => {
            const category = ach.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(ach);
            return acc;
        }, {} as Record<AchievementCategory, Achievement[]>);
    }, []);

    const { score, currentLevel } = useMemo(() => {
        const calculatedScore = calculateAchievementScore(appData);
        const level = LEVELS.slice().reverse().find(l => calculatedScore >= l.xpRange[0]) || LEVELS[0];
        return { score: calculatedScore, currentLevel: level };
    }, [appData]);
    
    const categoryTitles: Record<AchievementCategory, string> = {
        task: 'Task & Project',
        focus: 'Focus & Time',
        habit: 'Habit Building',
        consistency: 'Consistency & Streaks',
        milestone: 'Milestones',
        special: 'Special Events',
    };

    const tabs: {id: AchievementTab, label: string}[] = [
        { id: 'badges', label: '🏅 Badges' },
        { id: 'levels', label: '📈 Levels & Score' },
        { id: 'milestones', label: '🎯 Milestones' },
        { id: 'streaks', label: '🔥 Streaks' },
        { id: 'insights', label: '📊 Insights' },
    ];


    return (
        <div className="p-6 h-full flex flex-col">
            <header className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-content-primary mb-4">Achievements</h1>
                <div className="flex space-x-1 bg-background-secondary p-1 rounded-lg self-start">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)} 
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'hover:bg-background-tertiary text-content-secondary'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto mt-8">
                {activeTab === 'badges' && (
                    <div className="space-y-12">
                        {Object.entries(groupedAchievements).map(([category, achievements]) => (
                            <AchievementSection 
                                key={category}
                                title={categoryTitles[category as AchievementCategory]} 
                                achievements={achievements} 
                                data={appData} 
                            />
                        ))}
                    </div>
                )}
                {activeTab === 'levels' && (
                    <div>
                        <LevelProgressCard score={score} level={currentLevel} />
                        <h2 className="text-2xl font-bold mb-6 text-content-primary">All Levels</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {LEVELS.map(level => (
                                <LevelCard 
                                    key={level.level}
                                    level={level}
                                    isCurrent={currentLevel.level === level.level}
                                    isUnlocked={score >= level.xpRange[0]}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {['milestones', 'streaks', 'insights'].includes(activeTab) && (
                    <div className="flex items-center justify-center h-full text-content-tertiary">
                        <p>This section is coming soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
};