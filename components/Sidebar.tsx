
import React from 'react';

type ActiveView = 'tasks' | 'pomodoro' | 'habits' | 'settings';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const SidebarIcon: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
  <div className="relative group flex justify-center">
    <button
      onClick={onClick}
      aria-label={label}
      className={`h-12 w-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
        isActive ? 'bg-primary text-white' : 'text-content-secondary hover:bg-background-tertiary hover:text-primary'
      }`}
    >
      {children}
    </button>
    <span className="absolute left-16 p-2 px-3 text-sm text-primary-content bg-background-tertiary rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
      {label}
    </span>
  </div>
);

// SVG Icon Components
const UserIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> );
const TasksIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> );
const HabitIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> );
const PomodoroIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const SettingsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> );

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="w-20 bg-background-secondary flex flex-col items-center py-4 space-y-4 border-r border-border-primary">
      <div className="w-10 h-10 bg-primary rounded-full mb-4"></div>
      
      <div className="flex flex-col space-y-2 items-center flex-grow">
        <SidebarIcon label="Profile" isActive={false} onClick={() => {}}>
          <UserIcon />
        </SidebarIcon>
        <div className="w-10/12 border-t border-border-primary my-2"></div>
        <SidebarIcon label="Tasks" isActive={activeView === 'tasks'} onClick={() => setActiveView('tasks')}>
          <TasksIcon />
        </SidebarIcon>
        <SidebarIcon label="Habits" isActive={activeView === 'habits'} onClick={() => setActiveView('habits')}>
          <HabitIcon />
        </SidebarIcon>
        <SidebarIcon label="Pomodoro" isActive={activeView === 'pomodoro'} onClick={() => setActiveView('pomodoro')}>
          <PomodoroIcon />
        </SidebarIcon>
      </div>

      <div className="flex flex-col space-y-2 items-center">
        <SidebarIcon label="Settings" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')}>
            <SettingsIcon />
        </SidebarIcon>
      </div>
    </aside>
  );
};
