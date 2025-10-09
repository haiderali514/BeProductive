import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Conversation, ChatMessage, Project, ProjectMemory } from '../types';
// FIX: Added missing import for FolderPlusIcon.
import { AIAssistantIcon, UserIcon, PlusIcon, TrashIcon, EditIcon, FolderIcon, FolderPlusIcon, ChevronDownIcon, MoveToListIcon, SettingsIcon, SearchIcon, LibraryIcon, CloseIcon, PlusCircleIcon, MicrophoneIcon, MoreIcon, ArchiveIcon, ReportIcon, ShareIcon } from './Icons';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useChat } from '../contexts/ChatContext';
import { useSettings } from '../contexts/SettingsContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { useData } from '../contexts/DataContext';
import { ResizablePanel } from './ResizablePanel';


// --- Chat Bubble Component ---
const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const { userProfile } = useData();
    
    return (
        <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''} w-full`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <AIAssistantIcon className="h-5 w-5 text-primary" />
                </div>
            )}
            <div className={`max-w-3xl p-4 rounded-2xl ${isUser ? 'bg-primary text-primary-content rounded-br-none' : 'bg-background-secondary rounded-bl-none'}`}>
                <MarkdownRenderer text={message.parts[0].text} />
            </div>
             {isUser && (
                 <img src={userProfile.avatarUrl} alt="User" className="w-8 h-8 rounded-full flex-shrink-0" />
            )}
        </div>
    );
};

// --- Loading Bubble Component ---
const LoadingBubble: React.FC = () => (
    <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <AIAssistantIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="max-w-2xl p-4 rounded-2xl bg-background-secondary rounded-bl-none">
            <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-content-tertiary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-content-tertiary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-content-tertiary rounded-full animate-pulse"></div>
            </div>
        </div>
    </div>
);

// --- Dropdown Menu Component ---
const DropdownMenu: React.FC<{ children: React.ReactNode; onClose: () => void; }> = ({ children, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="absolute top-full right-0 mt-2 w-48 bg-background-tertiary rounded-lg shadow-2xl border border-border-primary z-20 py-1">
            {children}
        </div>
    );
};

const DropdownItem: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; isDestructive?: boolean }> = ({ label, icon, onClick, isDestructive }) => (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-3 py-2 text-sm text-left ${isDestructive ? 'text-red-500 hover:bg-red-500/10' : 'text-content-primary hover:bg-background-primary'}`}>
        {icon}
        <span>{label}</span>
    </button>
);


// --- Project Creation Modal ---
const ProjectCreationModal: React.FC<{ isOpen: boolean; onClose: () => void; onAddProject: (name: string, memory: ProjectMemory) => void; }> = ({ isOpen, onClose, onAddProject }) => {
    const [projectName, setProjectName] = useState('');
    const [showMemorySettings, setShowMemorySettings] = useState(false);
    const [memory, setMemory] = useState<ProjectMemory>('default');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (projectName.trim()) {
            onAddProject(projectName.trim(), memory);
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background-secondary rounded-xl shadow-2xl w-full max-w-[448px] relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-content-tertiary hover:bg-background-tertiary"><CloseIcon/></button>
                
                {showMemorySettings ? (
                    <div className="p-8">
                        <div className="flex items-center mb-6">
                            <button onClick={() => setShowMemorySettings(false)} className="p-1.5 rounded-full text-content-tertiary hover:bg-background-tertiary mr-2">&lt;</button>
                            <h2 className="text-xl font-semibold">Memory</h2>
                        </div>
                        <div className="space-y-4">
                             <div onClick={() => setMemory('default')} className={`p-4 rounded-lg border-2 cursor-pointer ${memory === 'default' ? 'border-primary' : 'border-border-primary'}`}>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">Default</h3>
                                    {memory === 'default' && <span className="text-primary">✓</span>}
                                </div>
                                <p className="text-sm text-content-secondary mt-1">Project can access memories from outside chats, and vice versa.</p>
                             </div>
                             <div onClick={() => setMemory('project-only')} className={`p-4 rounded-lg border-2 cursor-pointer ${memory === 'project-only' ? 'border-primary' : 'border-border-primary'}`}>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">Project-only</h3>
                                    {memory === 'project-only' && <span className="text-primary">✓</span>}
                                </div>
                                <p className="text-sm text-content-secondary mt-1">Project can only access its own memories. Its memories are hidden from outside chats.</p>
                             </div>
                        </div>
                        <p className="text-xs text-content-tertiary mt-6 text-center">Note that this setting can't be changed later.</p>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Project name</h2>
                            <button onClick={() => setShowMemorySettings(true)} className="p-1.5 rounded-full text-content-tertiary hover:bg-background-tertiary"><SettingsIcon /></button>
                        </div>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Copenhagen Trip"
                            className="w-full bg-background-primary border border-border-primary rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                        <div className="my-6 p-4 bg-background-primary rounded-lg flex items-start space-x-4">
                            <AIAssistantIcon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold">Keep things tidy</h4>
                                <p className="text-sm text-content-secondary">Projects keep chats, files, and custom instructions in one place. Use them for ongoing work, or just to keep things tidy.</p>
                            </div>
                        </div>
                        <button onClick={handleSubmit} disabled={!projectName.trim()} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus disabled:bg-background-tertiary disabled:text-content-tertiary">
                            Create project
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main AI Assistant Page ---
export const AIAssistantPage: React.FC = () => {
    const { 
        conversations, projects, activeConversationId, isAILoading, 
        handleSendMessage, handleNewChat, selectConversation, deleteConversation, 
        renameConversation, addProject, deleteProject, renameProject, moveChatToProject,
        updateProjectInstruction
    } = useChat();
    const { userProfile } = useData();
    const [settings] = useSettings();
    const [promptInput, setPromptInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [collapsedSections, setCollapsedSections] = useLocalStorage<Record<string, boolean>>('ai_collapsed_sections', {});
    const [isProjectModalOpen, setProjectModalOpen] = useState(false);
    
    const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const activeProject = activeConversation?.projectId ? projects.find(p => p.id === activeConversation.projectId) : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeConversation?.messages, isAILoading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [promptInput]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (promptInput.trim() && !isAILoading && settings.enableAIFeatures) {
            handleSendMessage(promptInput.trim());
            setPromptInput('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const toggleSection = (section: 'projects' | 'chats') => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const sortedConversations = useMemo(() => {
        return [...conversations].reverse();
    }, [conversations]);


    // FIX: Refactored to correctly access `name` or `title` property and avoid type errors.
    const renderSidebarItem = (item: Conversation | Project, type: 'chat' | 'project') => {
        const isProject = type === 'project';
        const isActive = isProject ? false : activeConversationId === item.id;

        const title = isProject ? (item as Project).name : (item as Conversation).title;

        const handleRename = () => {
            const newName = prompt(`Enter new name for "${title}":`, title);
            if (newName && newName.trim()) {
                if (isProject) {
                    renameProject(item.id, newName.trim());
                } else {
                    renameConversation(item.id, newName.trim());
                }
            }
            setActiveChatMenu(null);
        };
        
        const handleDelete = () => {
            if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
                if(isProject) {
                    deleteProject(item.id);
                } else {
                    deleteConversation(item.id);
                }
            }
            setActiveChatMenu(null);
        };

        return (
            <div className="group relative">
                <button
                    onClick={() => !isProject && selectConversation(item.id)}
                    className={`w-full flex items-center space-x-3 text-left px-2 py-2 text-sm rounded-lg transition-colors ${isActive ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-background-tertiary'}`}
                >
                    {isProject ? <FolderIcon className="h-4 w-4 flex-shrink-0" /> : <LibraryIcon className="h-4 w-4 flex-shrink-0" />}
                    <span className="truncate flex-1">{title}</span>
                </button>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setActiveChatMenu(activeChatMenu === item.id ? null : item.id)} className="p-1 rounded text-content-tertiary hover:text-primary"><MoreIcon /></button>
                    {activeChatMenu === item.id && (
                        <DropdownMenu onClose={() => setActiveChatMenu(null)}>
                            {!isProject && <DropdownItem label="Rename" icon={<EditIcon />} onClick={handleRename} />}
                            {isProject && <DropdownItem label="Rename Project" icon={<EditIcon />} onClick={handleRename} />}
                            <DropdownItem label="Delete" icon={<TrashIcon />} onClick={handleDelete} isDestructive />
                        </DropdownMenu>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <ResizablePanel storageKey="ai-sidebar-width" initialWidth={320} minWidth={240} maxWidth={500}>
                {/* Sidebar */}
                <aside className="bg-background-secondary p-3 flex flex-col h-full">
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-8 h-8 rounded-full" />
                                <h2 className="font-semibold text-content-primary">{userProfile.name}</h2>
                            </div>
                            <button onClick={handleNewChat} className="p-1.5 text-content-secondary hover:text-content-primary hover:bg-background-tertiary rounded-md">
                                <PlusIcon />
                            </button>
                        </div>
                        <div className="relative">
                            <input type="text" placeholder="Search chats..." className="w-full bg-background-primary border border-border-primary rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"><SearchIcon className="h-4 w-4" /></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto mt-4 -mr-2 pr-2 space-y-3">
                        {/* Projects Section */}
                        <div className="flex justify-between items-center px-2 py-1">
                            <button onClick={() => toggleSection('projects')} className="flex items-center text-xs font-bold uppercase text-content-tertiary hover:text-content-primary">
                                <ChevronDownIcon className={`h-4 w-4 mr-1 transition-transform ${collapsedSections['projects'] ? '-rotate-90' : ''}`} />
                                Projects
                            </button>
                            <button onClick={() => setProjectModalOpen(true)} className="p-1 rounded text-content-tertiary hover:text-primary">
                                <FolderPlusIcon />
                            </button>
                        </div>
                        {!collapsedSections['projects'] && (
                            <div className="space-y-1">
                                {projects.map(p => (
                                    <div key={p.id}>
                                        {renderSidebarItem(p, 'project')}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Chats Section */}
                        <div className="flex justify-between items-center px-2 py-1">
                            <button onClick={() => toggleSection('chats')} className="flex items-center text-xs font-bold uppercase text-content-tertiary hover:text-content-primary">
                                <ChevronDownIcon className={`h-4 w-4 mr-1 transition-transform ${collapsedSections['chats'] ? '-rotate-90' : ''}`} />
                                Chats
                            </button>
                        </div>
                        {!collapsedSections['chats'] && (
                            <div className="space-y-1">
                                {sortedConversations.map(c => renderSidebarItem(c, 'chat'))}
                            </div>
                        )}
                    </div>
                </aside>
                
                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col bg-background-primary h-full">
                    {activeConversation ? (
                         <>
                            <header className="flex-shrink-0 p-4 border-b border-border-primary flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-bold">{activeConversation.title}</h1>
                                    {activeProject && <p className="text-xs text-content-secondary">{activeProject.name}</p>}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="p-2 text-content-secondary hover:text-primary rounded-full hover:bg-background-secondary"><ShareIcon/></button>
                                    <button className="p-2 text-content-secondary hover:text-primary rounded-full hover:bg-background-secondary"><ArchiveIcon/></button>
                                    <button className="p-2 text-content-secondary hover:text-primary rounded-full hover:bg-background-secondary"><ReportIcon/></button>
                                </div>
                            </header>
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="max-w-4xl mx-auto space-y-4">
                                    {activeConversation.messages.map(message => (
                                        <ChatBubble key={message.id} message={message} />
                                    ))}
                                    {isAILoading && <LoadingBubble />}
                                </div>
                                <div ref={messagesEndRef} />
                            </div>
                            <footer className="flex-shrink-0 p-4">
                                <div className="max-w-4xl mx-auto">
                                    <form onSubmit={handleSubmit} className="relative bg-background-secondary rounded-xl p-2 flex items-end border border-transparent focus-within:border-primary">
                                        <button type="button" className="p-3 text-content-secondary hover:text-primary"><PlusCircleIcon className="h-6 w-6" /></button>
                                        <textarea
                                            ref={textareaRef}
                                            value={promptInput}
                                            onChange={e => setPromptInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={settings.enableAIFeatures ? "Ask Aura anything..." : "AI features are disabled in settings"}
                                            disabled={!settings.enableAIFeatures || isAILoading}
                                            className="flex-1 bg-transparent resize-none focus:outline-none max-h-48 text-content-primary p-2"
                                            rows={1}
                                        />
                                        <button type="button" className="p-3 text-content-secondary hover:text-primary"><MicrophoneIcon className="h-6 w-6" /></button>
                                    </form>
                                </div>
                            </footer>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-content-tertiary">
                             <AIAssistantIcon className="h-16 w-16 text-primary mb-4" />
                            <h2 className="text-2xl font-bold text-content-primary">AI Assistant</h2>
                            <p>Select a chat or start a new one to begin.</p>
                        </div>
                    )}
                </main>
            </ResizablePanel>
            <ProjectCreationModal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} onAddProject={addProject} />
        </>
    );
};