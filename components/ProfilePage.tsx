import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, UserTrait, TraitType, GoalSubtype, Task, GoalProgressReport } from '../types';
import { generateGoalProgressReport } from '../services/geminiService';
import { Settings } from '../hooks/useSettings';
import { ApiFeature } from '../hooks/useApiUsage';
import { ResizablePanel } from './ResizablePanel';

const DataInput: React.FC<{ onAdd: (text: string) => void, placeholder: string }> = ({ onAdd, placeholder }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onAdd(text.trim());
            setText('');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-background-primary border border-border-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
        </form>
    );
};

const DataItem: React.FC<{ item: UserTrait; onDelete: (id: string) => void; showSuggest?: boolean }> = ({ item, onDelete, showSuggest = false }) => (
    <div className="group flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
        <p className="text-content-primary">{item.text}</p>
        <div className="flex items-center space-x-2">
            {showSuggest && (
                <button className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                    Suggest Tasks ✨
                </button>
            )}
            <button onClick={() => onDelete(item.id)} className="p-1 rounded-full text-content-tertiary opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-background-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    </div>
);

const TraitSection: React.FC<{
    title: string;
    description?: string;
    traits: UserTrait[];
    onDelete: (id: string) => void;
    onAdd: (text: string) => void;
    addPlaceholder: string;
    showSuggestButton?: boolean;
}> = ({ title, description, traits, onDelete, onAdd, addPlaceholder, showSuggestButton = false }) => (
     <div>
        <h3 className="font-bold mb-1 text-content-primary text-lg">{title}</h3>
        {description && <p className="text-xs text-content-tertiary mb-3">{description}</p>}
        <div className="space-y-3 mb-4">
            {traits.map(trait => (
                <DataItem key={trait.id} item={trait} onDelete={onDelete} showSuggest={showSuggestButton} />
            ))}
             {traits.length === 0 && <p className="text-sm text-content-tertiary text-center p-4 bg-background-tertiary rounded-lg">No {title.toLowerCase()} added yet.</p>}
        </div>
        <DataInput onAdd={onAdd} placeholder={addPlaceholder} />
    </div>
);

const GoalProgressCard: React.FC<{ 
    goal: UserTrait; 
    allTasks: Task[]; 
    aiEnabled: boolean;
    logApiCall: (feature: ApiFeature, tokens: number) => void;
}> = ({ goal, allTasks, aiEnabled, logApiCall }) => {
    const [report, setReport] = useState<Omit<GoalProgressReport, 'goalId'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const relevantTasks = useMemo(() => allTasks.filter(t => !t.trashed && !t.wontDo), [allTasks]);

    useEffect(() => {
        if (!aiEnabled) {
            setIsLoading(false);
            return;
        }

        const fetchReport = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data, tokensUsed } = await generateGoalProgressReport(goal, relevantTasks);
                logApiCall('goalProgress', tokensUsed);
                setReport(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [goal, relevantTasks, aiEnabled, logApiCall]);
    
    if (!aiEnabled) {
        const relatedTasks = relevantTasks.filter(t => goal.text.toLowerCase().split(" ").some(keyword => t.title.toLowerCase().includes(keyword) && keyword.length > 3));
        const completedTasks = relatedTasks.filter(t => t.completed);
        const progress = relatedTasks.length > 0 ? Math.round((completedTasks.length / relatedTasks.length) * 100) : 0;

        return (
            <div className="bg-background-tertiary p-4 rounded-lg">
                <h4 className="font-semibold text-content-primary mb-2">{goal.text}</h4>
                <div className="flex items-center space-x-3 mb-3">
                    <div className="w-full bg-background-primary rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                    </div>
                    <span className="text-sm font-semibold text-primary">{progress}%</span>
                </div>
                <p className="text-xs text-content-tertiary italic">Enable AI features in settings for a detailed summary and next step suggestions.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-background-tertiary p-4 rounded-lg space-y-3 animate-pulse">
                <div className="h-5 bg-background-primary rounded w-3/4"></div>
                <div className="h-4 bg-background-primary rounded w-full"></div>
                <div className="h-3 bg-background-primary rounded w-1/2"></div>
            </div>
        );
    }

    if (error || !report) {
        return (
             <div className="bg-background-tertiary p-4 rounded-lg">
                <p className="font-semibold text-content-primary">{goal.text}</p>
                <p className="text-xs text-red-500 mt-2">Could not load progress report.</p>
            </div>
        )
    }

    return (
        <div className="bg-background-tertiary p-4 rounded-lg">
            <h4 className="font-semibold text-content-primary mb-2">{goal.text}</h4>
            
            <div className="flex items-center space-x-3 mb-3">
                <div className="w-full bg-background-primary rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${report.progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
                </div>
                <span className="text-sm font-semibold text-primary">{report.progressPercentage}%</span>
            </div>
            
            <p className="text-sm text-content-secondary italic mb-3">"{report.summaryText}"</p>
            
            <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg">
                <p className="text-xs font-bold text-primary mb-1">Next Step Suggestion:</p>
                <p className="text-sm text-content-primary">{report.nextStepSuggestion}</p>
            </div>
        </div>
    );
};


interface ProfilePageProps {
    profile: UserProfile;
    onUpdateProfile: (newProfileData: Partial<UserProfile>) => void;
    tasks: Task[];
    settings: Settings;
    logApiCall: (feature: ApiFeature, tokens: number) => void;
}

type ProfileSection = 'profile' | 'traits' | 'personalization' | 'data';

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onUpdateProfile, tasks, settings, logApiCall }) => {
    const [activeSection, setActiveSection] = useState<ProfileSection>('profile');
    
    const handleAddTrait = (text: string, type: TraitType, subtype?: GoalSubtype) => {
        const newTrait: UserTrait = { id: Date.now().toString(), text, type, subtype };
        const updatedTraits = [...profile.traits, newTrait];
        onUpdateProfile({ traits: updatedTraits });
    };
    
    const handleDeleteTrait = (id: string) => {
        const updatedTraits = profile.traits.filter(trait => trait.id !== id);
        onUpdateProfile({ traits: updatedTraits });
    };
    
    const sidebarItems = [
        { id: 'profile', label: 'My Profile' },
        { id: 'traits', label: 'About Me' },
        { id: 'personalization', label: 'Personalization' },
        { id: 'data', label: 'User Data' },
    ];

    const sectionTitles: Record<ProfileSection, string> = {
        profile: 'My Profile',
        traits: 'About Me',
        personalization: 'Personalization',
        data: 'User Data',
    };

    const groupedTraits = useMemo(() => {
        return (profile.traits || []).reduce((acc, trait) => {
            const key = trait.type;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(trait);
            return acc;
        }, {} as Record<TraitType, UserTrait[]>);
    }, [profile.traits]);

    const renderSection = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className="max-w-2xl">
                        <div className="flex items-center space-x-6 mb-6">
                            <img src={profile.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-primary" />
                            <div>
                                <h1 className="text-3xl font-bold text-content-primary">{profile.name}</h1>
                                <p className="text-lg text-content-secondary">{profile.email}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <button className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-focus transition-colors">
                                Edit Profile
                            </button>
                             <button className="px-4 py-2 bg-background-tertiary text-content-primary rounded-lg font-semibold hover:bg-border-primary transition-colors ml-4">
                                Change Password
                            </button>
                        </div>
                    </div>
                );
            case 'traits':
                return (
                    <div className="max-w-4xl">
                        <p className="text-sm text-content-secondary mb-6">This is what Aura, your AI coach, knows about you. Keeping this up-to-date helps it provide more personalized advice.</p>
                        <div className="space-y-8">
                            <div>
                                <h3 className="font-bold mb-1 text-content-primary text-lg">Long-term Goals</h3>
                                <p className="text-xs text-content-tertiary mb-3">Your big picture ambitions. Aura can help you break them down.</p>
                                <div className="space-y-3 mb-4">
                                    {((groupedTraits.goal || []).filter(g => g.subtype === 'long-term')).map(goal => (
                                        <GoalProgressCard key={goal.id} goal={goal} allTasks={tasks} aiEnabled={settings.enableAIFeatures} logApiCall={logApiCall} />
                                    ))}
                                    {((groupedTraits.goal || []).filter(g => g.subtype === 'long-term')).length === 0 && <p className="text-sm text-content-tertiary text-center p-4 bg-background-tertiary rounded-lg">No long-term goals added yet.</p>}
                                </div>
                                <DataInput onAdd={(text) => handleAddTrait(text, 'goal', 'long-term')} placeholder="Add a new long-term goal..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <TraitSection 
                                    title="Short-term Goals"
                                    description="What you're focused on right now."
                                    traits={(groupedTraits.goal || []).filter(g => g.subtype === 'short-term')}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'goal', 'short-term')}
                                    addPlaceholder="Add a new short-term goal..."
                                    showSuggestButton
                                />
                                <TraitSection 
                                    title="Struggles & Weaknesses"
                                    description="Sharing these helps Aura provide better support when you need it."
                                    traits={[...(groupedTraits.struggle || []), ...(groupedTraits.weakness || [])]}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'struggle')}
                                    addPlaceholder="Add a struggle or weakness..."
                                />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <TraitSection 
                                    title="Passions & Hobbies"
                                    description="What you love to do. Aura can suggest tasks that align with your interests."
                                    traits={[...(groupedTraits.passion || []), ...(groupedTraits.hobby || [])]}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'hobby')}
                                    addPlaceholder="Add a passion or hobby..."
                                />
                                 <TraitSection 
                                    title="Routines"
                                    description="Your daily or weekly habits. Aura will help you stick to them."
                                    traits={groupedTraits.routine || []}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'routine')}
                                    addPlaceholder="Add a routine..."
                                />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <TraitSection 
                                    title="Preferences"
                                    description="How you like to work. Aura will adapt its suggestions to your style."
                                    traits={groupedTraits.preference || []}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'preference')}
                                    addPlaceholder="Add a preference..."
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'personalization':
                return (
                    <div className="bg-background-secondary p-6 rounded-lg shadow-md max-w-2xl">
                        <p className="text-content-secondary">Coming soon: Customize your AI assistant's behavior, preferred work styles, and more.</p>
                    </div>
                );
            case 'data':
                return (
                    <div className="bg-background-secondary p-6 rounded-lg shadow-md max-w-2xl">
                         <p className="text-content-secondary">Coming soon: Manage and export your data.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <ResizablePanel storageKey="profile-sidebar-width" initialWidth={288} minWidth={220} maxWidth={400}>
            <aside className="bg-background-secondary flex flex-col p-4 h-full">
                <h2 className="text-xl font-bold text-content-primary mb-4 px-3">Profile</h2>
                <nav className="flex flex-col space-y-1">
                    {sidebarItems.map(item => (
                        <a 
                            key={item.id} 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); setActiveSection(item.id as ProfileSection); }}
                            className={`px-3 py-2 rounded-md text-sm ${activeSection === item.id ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-background-tertiary'}`}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 flex flex-col h-full">
                <header className="p-4 border-b border-border-primary">
                    <h2 className="text-2xl font-bold">{sectionTitles[activeSection]}</h2>
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    {renderSection()}
                </div>
            </main>
        </ResizablePanel>
    );
};