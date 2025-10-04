
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Conversation } from '../types';
import { AIAssistantIcon, UserIcon, PlusIcon, TrashIcon } from './Icons';

interface AIAssistantPageProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    isLoading: boolean;
    onSendMessage: (prompt: string) => void;
    onNewChat: () => void;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const text = message.parts.map(p => p.text).join('');

    return (
        <div className={`flex items-start gap-4 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isModel ? 'bg-primary' : 'bg-background-tertiary'}`}>
                {isModel ? <AIAssistantIcon /> : <UserIcon />}
            </div>
            <div className={`p-4 rounded-lg max-w-2xl ${isModel ? 'bg-background-secondary' : 'bg-primary/20'}`}>
                <p className="whitespace-pre-wrap">{text}</p>
            </div>
        </div>
    );
};

const LoadingBubble: React.FC = () => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <AIAssistantIcon />
        </div>
        <div className="p-4 rounded-lg bg-background-secondary">
            <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-content-tertiary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-content-tertiary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-content-tertiary rounded-full animate-pulse"></div>
            </div>
        </div>
    </div>
);


export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ conversations, activeConversationId, isLoading, onSendMessage, onNewChat, onSelectConversation, onDeleteConversation }) => {
    const [prompt, setPrompt] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages, isLoading]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isLoading) {
            onSendMessage(prompt.trim());
            setPrompt('');
        }
    };
    
    const showLoading = isLoading && activeConversation && activeConversation.messages.length > 0 && activeConversation.messages[activeConversation.messages.length - 1].role === 'user';


    return (
        <div className="flex h-full bg-background-primary">
            {/* Sidebar */}
            <aside className="w-80 bg-background-secondary border-r border-border-primary flex flex-col p-4">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold">Chats</h2>
                    <button onClick={onNewChat} className="p-2 rounded-lg hover:bg-background-tertiary text-content-secondary hover:text-primary">
                        <PlusIcon />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2">
                    {conversations.map(convo => (
                        <div key={convo.id} className="relative group">
                            <button
                                onClick={() => onSelectConversation(convo.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg truncate text-sm transition-colors ${activeConversationId === convo.id ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-background-tertiary'}`}
                            >
                                {convo.title}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteConversation(convo.id); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-content-tertiary hover:text-red-500 hover:bg-background-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Delete chat"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col">
                <header className="p-6 border-b border-border-primary">
                    <h2 className="text-2xl font-bold">{activeConversation?.title || 'AI Assistant'}</h2>
                </header>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeConversation ? (
                        <>
                            {activeConversation.messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                            {showLoading && <LoadingBubble />}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <AIAssistantIcon className="h-16 w-16 text-content-tertiary mb-4" />
                            <h3 className="text-xl font-semibold">Select a chat to start</h3>
                            <p className="text-content-secondary">Or create a new one to begin your conversation with Aura.</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-border-primary bg-background-secondary/50">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            placeholder="Ask me to add a task, summarize your day, or anything else..."
                            disabled={isLoading || !activeConversationId}
                            className="w-full pl-4 pr-12 py-3 bg-background-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow text-content-primary placeholder-content-tertiary"
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !activeConversationId}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-primary-focus disabled:bg-background-tertiary disabled:text-content-tertiary transition-colors"
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};