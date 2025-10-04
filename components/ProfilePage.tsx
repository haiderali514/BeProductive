
import React, { useState, useMemo } from 'react';
import { UserProfile, UserTrait, TraitType, GoalSubtype } from '../types';

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
    traits: UserTrait[];
    onDelete: (id: string) => void;
    onAdd: (text: string) => void;
    addPlaceholder: string;
    showSuggestButton?: boolean;
}> = ({ title, traits, onDelete, onAdd, addPlaceholder, showSuggestButton = false }) => (
     <div>
        <h3 className="font-bold mb-3 text-content-primary text-lg">{title}</h3>
        <div className="space-y-3 mb-4">
            {traits.map(trait => (
                <DataItem key={trait.id} item={trait} onDelete={onDelete} showSuggest={showSuggestButton} />
            ))}
             {traits.length === 0 && <p className="text-sm text-content-tertiary text-center p-4 bg-background-tertiary rounded-lg">No {title.toLowerCase()} added yet.</p>}
        </div>
        <DataInput onAdd={onAdd} placeholder={addPlaceholder} />
    </div>
);

interface ProfilePageProps {
    profile: UserProfile;
    onUpdateProfile: (newProfileData: Partial<UserProfile>) => void;
}

type ProfileSection = 'profile' | 'traits' | 'personalization' | 'data';

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onUpdateProfile }) => {
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
                        <div className="flex items-center space-x-6 mb-8">
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
                        <div className="space-y-10">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <TraitSection 
                                    title="Long-term Goals"
                                    traits={(groupedTraits.goal || []).filter(g => g.subtype === 'long-term')}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'goal', 'long-term')}
                                    addPlaceholder="Add a new long-term goal..."
                                    showSuggestButton
                                />
                                <TraitSection 
                                    title="Short-term Goals"
                                    traits={(groupedTraits.goal || []).filter(g => g.subtype === 'short-term')}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'goal', 'short-term')}
                                    addPlaceholder="Add a new short-term goal..."
                                    showSuggestButton
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <TraitSection 
                                    title="Struggles & Weaknesses"
                                    traits={[...(groupedTraits.struggle || []), ...(groupedTraits.weakness || [])]}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'struggle')}
                                    addPlaceholder="Add a struggle..."
                                />
                                <TraitSection 
                                    title="Passions & Hobbies"
                                    traits={[...(groupedTraits.passion || []), ...(groupedTraits.hobby || [])]}
                                    onDelete={handleDeleteTrait}
                                    onAdd={(text) => handleAddTrait(text, 'hobby')}
                                    addPlaceholder="Add a passion or hobby..."
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
        <div className="flex h-full">
            <aside className="w-72 bg-background-secondary border-r border-border-primary flex flex-col p-4">
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
            <main className="flex-1 flex flex-col">
                <header className="p-6 border-b border-border-primary">
                    <h2 className="text-2xl font-bold">{sectionTitles[activeSection]}</h2>
                </header>
                <div className="flex-1 overflow-y-auto p-8">
                    {renderSection()}
                </div>
            </main>
        </div>
    );
};