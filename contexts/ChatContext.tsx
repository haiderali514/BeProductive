import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Conversation, ChatMessage, UserTrait, TraitType, GoalSubtype, Project, ProjectMemory } from '../types';
import { chatWithAssistant, generateChatTitle, AIContext } from '../services/geminiService';
import { useData } from './DataContext';
import { useSettings } from './SettingsContext';
import { useApiUsage } from './ApiUsageContext';
import { Content as GeminiContent } from '@google/genai';

interface ChatContextType {
    conversations: Conversation[];
    projects: Project[];
    activeConversationId: string | null;
    isAILoading: boolean;
    handleSendMessage: (prompt: string) => Promise<void>;
    handleNewChat: () => void;
    selectConversation: (id: string | null) => void;
    deleteConversation: (id: string) => void;
    renameConversation: (id: string, newTitle: string) => void;
    addProject: (name: string, memory: ProjectMemory) => void;
    deleteProject: (id: string) => void;
    renameProject: (id: string, newName: string) => void;
    moveChatToProject: (chatId: string, projectId: string | null) => void;
    updateProjectInstruction: (id: string, instruction: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tasks, lists, habits, userProfile, handleAddTask, getTasksForPeriod, findFreeSlots, setUserProfile, pomodoroSessions } = useData();
    const [settings] = useSettings();
    const [, logApiCall] = useApiUsage();

    const [conversations, setConversations] = useLocalStorage<Conversation[]>('aiConversations', [{ id: '1', title: 'Welcome Chat', messages: [{ id: '0', role: 'model', parts: [{ text: "Hello! I'm Aura, your personal AI assistant. How can I help you organize your day?" }] }] }]);
    const [projects, setProjects] = useLocalStorage<Project[]>('aiProjects', []);
    const [activeConversationId, setActiveConversationId] = useLocalStorage<string | null>('activeConversationId', '1');
    const [isAILoading, setIsAILoading] = useState(false);
    
    useEffect(() => {
        // One-time migration for projects that don't have the `instruction` or `memory` field.
        if (projects.length > 0 && (typeof (projects[0] as any).instruction === 'undefined' || typeof (projects[0] as any).memory === 'undefined')) {
            setProjects(currentProjects => 
                currentProjects.map(p => ({
                    ...p,
                    instruction: (p as any).instruction || '',
                    memory: (p as any).memory || 'default',
                }))
            );
        }
    }, [projects, setProjects]);

    const handleNewChat = useCallback(() => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [{ id: '0', role: 'model', parts: [{ text: "Hello! I'm Aura. How can I assist you today?" }] }],
        };
        setConversations(prev => [...prev, newConversation]);
        setActiveConversationId(newConversation.id);
    }, [setConversations, setActiveConversationId]);
    
    const deleteConversation = useCallback((id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
            const remainingConversations = conversations.filter(c => c.id !== id);
            setActiveConversationId(remainingConversations.length > 0 ? remainingConversations[0].id : null);
        }
    }, [conversations, activeConversationId, setConversations, setActiveConversationId]);
    
    const renameConversation = useCallback((id: string, newTitle: string) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    }, [setConversations]);

    const addProject = useCallback((name: string, memory: ProjectMemory) => {
        const newProject: Project = { id: Date.now().toString(), name, instruction: '', memory };
        setProjects(prev => [...prev, newProject]);
    }, [setProjects]);

    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        setConversations(prev => prev.map(c => c.projectId === id ? { ...c, projectId: null } : c));
    }, [setProjects, setConversations]);
    
    const renameProject = useCallback((id: string, newName: string) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    }, [setProjects]);

    const moveChatToProject = useCallback((chatId: string, projectId: string | null) => {
        setConversations(prev => prev.map(c => c.id === chatId ? { ...c, projectId } : c));
    }, [setConversations]);

    const updateProjectInstruction = useCallback((id: string, instruction: string) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, instruction } : p));
    }, [setProjects]);


    const handleSendMessage = useCallback(async (prompt: string) => {
        if (!settings.enableAIFeatures || !activeConversationId) return;

        setIsAILoading(true);
        const conversationId = activeConversationId;
        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', parts: [{ text: prompt }] };
        const activeConvo = conversations.find(c => c.id === conversationId)!;
        const isNewChat = activeConvo.messages.filter(m => m.role === 'user').length === 0;

        const historyForAPI: GeminiContent[] = [...activeConvo.messages, newUserMessage].map(m => ({ role: m.role, parts: m.parts }));

        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: [...c.messages, newUserMessage] } : c));
        
        const projectInstruction = activeConvo.projectId 
            ? projects.find(p => p.id === activeConvo.projectId)?.instruction 
            : undefined;

        try {
            const context: AIContext = { tasks, lists, habits, profile: userProfile };
            const { data: response, tokensUsed: firstCallTokens } = await chatWithAssistant(historyForAPI, context, projectInstruction);
            let totalTokens = firstCallTokens;
            let finalModelMessage: ChatMessage;

            if (response.functionCalls) {
                const functionResponses = [];
                for (const funcCall of response.functionCalls) {
                    let result: any;
                    
                     if (funcCall.name === 'addTask') {
                        const list = lists.find(l => l.name.toLowerCase() === ((funcCall.args.listName as string) || 'inbox').toLowerCase()) || lists.find(l => l.id === 'inbox');
                        result = { success: true, task: handleAddTask({ title: funcCall.args.title as string, listId: list!.id, priority: (funcCall.args.priority as any) || 'None', dueDate: (funcCall.args.dueDate as string) || null, recurrence: null, tags: [] }) };
                    } else if (funcCall.name === 'saveUserTrait') {
                        const newTrait: UserTrait = {
                            id: Date.now().toString(),
                            text: funcCall.args.traitText as string,
                            type: funcCall.args.traitType as TraitType,
                            subtype: funcCall.args.goalSubtype as GoalSubtype | undefined,
                        };
                        const updatedTraits = [...userProfile.traits, newTrait];
                        setUserProfile(prev => ({ ...prev, traits: updatedTraits }));
                        result = { success: true, trait: newTrait };
                    } else if (funcCall.name === 'getTasks') {
                        result = { success: true, tasks: getTasksForPeriod(funcCall.args.period as 'today' | 'tomorrow' | 'this week') };
                    } else if (funcCall.name === 'getFreeSlots') {
                        result = { success: true, slots: findFreeSlots(funcCall.args.date as string, (funcCall.args.durationMinutes as number) || 60) };
                    }
                    functionResponses.push({ name: funcCall.name, response: { result: result } });
                }
                
                // ... logic to call chatWithAssistant again with function responses ...
                const refreshedContext: AIContext = { ...context, profile: userProfile }; // re-fetch profile after potential update
                const finalResponse = await chatWithAssistant([...historyForAPI, response.candidates![0].content, {role: 'user', parts: [{functionResponse: {name: 'tool_response', response: {responses: functionResponses}}}]}], refreshedContext, projectInstruction);
                totalTokens += finalResponse.tokensUsed;
                finalModelMessage = { id: Date.now().toString() + '-final', role: 'model', parts: [{ text: finalResponse.data.text ?? "OK." }] };

            } else {
                finalModelMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: response.text?.trim() || "I'm not sure how to respond." }] };
            }
            logApiCall('aiAssistant', totalTokens);
            setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: [...c.messages, finalModelMessage] } : c));

            if (isNewChat) {
                const { data: title, tokensUsed: titleTokens } = await generateChatTitle(prompt);
                logApiCall('chatTitleGeneration', titleTokens);
                renameConversation(conversationId, title);
            }
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: "Sorry, I encountered an error." }] };
            setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: [...c.messages, errorMessage] } : c));
        } finally {
            setIsAILoading(false);
        }
    }, [activeConversationId, conversations, settings.enableAIFeatures, tasks, lists, habits, userProfile, pomodoroSessions, handleAddTask, getTasksForPeriod, findFreeSlots, setUserProfile, logApiCall, setConversations, renameConversation, projects]);

    const value = { conversations, projects, activeConversationId, isAILoading, handleSendMessage, handleNewChat, selectConversation: setActiveConversationId, deleteConversation, renameConversation, addProject, deleteProject, renameProject, moveChatToProject, updateProjectInstruction };
    
    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};