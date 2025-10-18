// This is a new file: components/PlansPage.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { LearningPlan, LearningTopic, LearningTopicStatus } from '../types';
import { PlusIcon, MagicIcon, MapIcon, ChevronDownIcon, CloseIcon, EditIcon, TrashIcon } from './Icons';
import { DateTimePicker } from './DateTimePicker';
import { useSettings } from '../contexts/SettingsContext';
import { useApiUsage } from '../contexts/ApiUsageContext';
import { generateLearningRoadmap, AIRoadmapResponse } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';

// --- New File Content ---

const AddPlanModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddPlan: (title: string, targetDate: string, skills: string[]) => void;
}> = ({ isOpen, onClose, onAddPlan }) => {
    const [title, setTitle] = useState('');
    const [targetDate, setTargetDate] = useState(() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
    });
    const [skills, setSkills] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddPlan(title.trim(), targetDate.toISOString(), skills.split(',').map(s => s.trim()).filter(Boolean));
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold">Create New Learning Plan</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Plan Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Master MERN Stack" className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Target Completion Date</label>
                        <DateTimePicker value={targetDate} onChange={setTargetDate} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-1">Key Skills (comma-separated)</label>
                        <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js, MongoDB..." className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2" />
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-background-tertiary hover:bg-border-primary font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus">Create Plan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GenerateRoadmapModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    plan: LearningPlan;
    onGenerate: (roadmap: LearningTopic[]) => void;
}> = ({ isOpen, onClose, plan, onGenerate }) => {
    const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, logApiCall] = useApiUsage();

    if (!isOpen) return null;

    const addIdsAndStatus = (topics: AIRoadmapResponse): LearningTopic[] => {
        const recursivelyMap = (items: AIRoadmapResponse): LearningTopic[] => {
            return items.map(item => ({
                ...item,
                id: Date.now().toString() + Math.random(),
                status: 'not-started',
                children: item.children ? recursivelyMap(item.children as AIRoadmapResponse) : [],
            }));
        };
        return recursivelyMap(topics);
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, tokensUsed } = await generateLearningRoadmap(plan.title, skillLevel);
            logApiCall('generateRoadmap', tokensUsed);
            const fullRoadmap = addIdsAndStatus(data);
            onGenerate(fullRoadmap);
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-primary flex justify-between items-center">
                    <h2 className="text-xl font-bold">Generate Roadmap</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-content-tertiary hover:bg-background-tertiary"><CloseIcon /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p>Aura will create a learning plan for <strong>"{plan.title}"</strong> based on your current skill level.</p>
                    <div>
                        <label className="block text-sm font-medium text-content-secondary mb-2">My Current Skill Level</label>
                        <div className="flex space-x-2">
                            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
                                <button key={level} onClick={() => setSkillLevel(level)} className={`flex-1 py-2 rounded-md font-semibold ${skillLevel === level ? 'bg-primary text-white' : 'bg-background-tertiary hover:bg-border-primary'}`}>
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <div className="p-4 bg-background-primary rounded-b-lg flex justify-end">
                    <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-focus flex items-center space-x-2 disabled:bg-background-tertiary">
                        {isLoading && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
                        <span>{isLoading ? 'Generating...' : 'Generate with AI'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const countTopics = (topics: LearningTopic[]): { total: number; completed: number } => {
    let total = 0;
    let completed = 0;
    const traverse = (items: LearningTopic[]) => {
        for (const item of items) {
            total++;
            if (item.status === 'completed') {
                completed++;
            }
            if (item.children) {
                traverse(item.children);
            }
        }
    };
    traverse(topics);
    return { total, completed };
};

const LearningTopicItem: React.FC<{
    topic: LearningTopic;
    level: number;
    onStatusChange: (topicId: string, status: LearningTopicStatus) => void;
}> = ({ topic, level, onStatusChange }) => {
    const [isCollapsed, setIsCollapsed] = useLocalStorage(`plan_topic_${topic.id}_collapsed`, false);
    
    const statusColors: Record<LearningTopicStatus, string> = {
        'not-started': 'bg-content-tertiary',
        'in-progress': 'bg-yellow-500',
        'completed': 'bg-green-500',
    };

    return (
        <div style={{ marginLeft: `${level * 24}px` }}>
            <div className="flex items-center space-x-3 group py-1">
                {topic.children.length > 0 && (
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-full hover:bg-background-tertiary">
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                )}
                {topic.children.length === 0 && <div className="w-6"></div>}
                
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[topic.status]}`}></div>
                
                <div className="flex-1">
                    <p className="font-medium text-content-primary">{topic.title}</p>
                    {topic.description && <p className="text-xs text-content-secondary">{topic.description}</p>}
                </div>
                
                <select 
                    value={topic.status}
                    onChange={(e) => onStatusChange(topic.id, e.target.value as LearningTopicStatus)}
                    className="bg-background-tertiary border-border-primary rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            {!isCollapsed && topic.children.length > 0 && (
                <div className="border-l-2 border-border-primary ml-4 pl-2">
                    {topic.children.map(child => (
                        <LearningTopicItem key={child.id} topic={child} level={level + 1} onStatusChange={onStatusChange} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const PlansPage: React.FC = () => {
    const { plans, handleAddPlan, handleUpdatePlan, handleDeletePlan } = useData();
    const { settings } = useSettings();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);

    const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [plans, selectedPlanId]);

    const { total, completed } = selectedPlan ? countTopics(selectedPlan.roadmap) : { total: 0, completed: 0 };
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const handleUpdateTopicStatus = (topicId: string, status: LearningTopicStatus) => {
        if (!selectedPlan) return;

        const newRoadmap = [...selectedPlan.roadmap];

        const findAndUpdate = (items: LearningTopic[]): boolean => {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === topicId) {
                    items[i] = { ...items[i], status };
                    return true;
                }
                if (items[i].children && findAndUpdate(items[i].children)) {
                    return true;
                }
            }
            return false;
        };

        findAndUpdate(newRoadmap);
        handleUpdatePlan(selectedPlan.id, { roadmap: newRoadmap });
    };
    
    const handleGenerateRoadmap = (roadmap: LearningTopic[]) => {
        if (selectedPlan) {
            handleUpdatePlan(selectedPlan.id, { roadmap });
        }
    };

    if (selectedPlan) {
        return (
            <div className="h-full flex flex-col">
                <header className="p-4 border-b border-border-primary flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <button onClick={() => setSelectedPlanId(null)} className="font-semibold text-primary hover:underline">&lt; All Plans</button>
                        <div>
                            <button className="p-2 rounded-full hover:bg-background-tertiary"><EditIcon /></button>
                            <button onClick={() => handleDeletePlan(selectedPlan.id)} className="p-2 rounded-full hover:bg-background-tertiary text-red-500"><TrashIcon /></button>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mt-2">{selectedPlan.title}</h1>
                    <div className="mt-4">
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span>Progress</span>
                            <span className="text-primary">{progress}%</span>
                        </div>
                        <div className="w-full bg-background-tertiary rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedPlan.roadmap.length > 0 ? (
                        <div className="space-y-2">
                             {selectedPlan.roadmap.map(topic => (
                                <LearningTopicItem key={topic.id} topic={topic} level={0} onStatusChange={handleUpdateTopicStatus} />
                             ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-content-tertiary">
                            <p className="font-semibold text-lg">No roadmap yet!</p>
                            <p className="mt-2">Let Aura create a personalized learning path for you.</p>
                            <button onClick={() => setGenerateModalOpen(true)} disabled={!settings.enableAIFeatures} className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg font-semibold hover:bg-primary/30 disabled:bg-background-tertiary disabled:text-content-tertiary disabled:cursor-not-allowed flex items-center space-x-2 mx-auto">
                                <MagicIcon />
                                <span>Generate with AI</span>
                            </button>
                        </div>
                    )}
                </div>
                 {isGenerateModalOpen && <GenerateRoadmapModal isOpen={isGenerateModalOpen} onClose={() => setGenerateModalOpen(false)} plan={selectedPlan} onGenerate={handleGenerateRoadmap} />}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="p-4 border-b border-border-primary flex-shrink-0 flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Learning Plans</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-focus flex items-center space-x-2">
                    <PlusIcon />
                    <span>New Plan</span>
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-6">
                {plans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => {
                            const { total, completed } = countTopics(plan.roadmap);
                            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                            return (
                                <div key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className="bg-background-secondary p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                    <h3 className="font-bold text-lg truncate">{plan.title}</h3>
                                    <div className="flex flex-wrap gap-1 my-2">
                                        {plan.skills.slice(0, 3).map(skill => <span key={skill} className="text-xs bg-background-tertiary px-2 py-1 rounded-full">{skill}</span>)}
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm font-medium mb-1">
                                            <span>Progress</span>
                                            <span className="text-primary">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-background-tertiary rounded-full h-2">
                                            <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                     <div className="text-center py-16 text-content-tertiary flex flex-col items-center">
                        <MapIcon className="w-16 h-16 mb-4" />
                        <p className="font-semibold text-lg">Let's build your path to success.</p>
                        <p className="mt-1">Create a new learning plan to get started.</p>
                    </div>
                )}
            </main>
            <AddPlanModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddPlan={handleAddPlan} />
        </div>
    );
};