import React from 'react';

// Generic icon wrapper to reduce boilerplate
const Icon: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className="h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
    </svg>
);

const SolidIcon: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className="h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        {children}
    </svg>
);


export const AccountIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></Icon>;
export const TrophyIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></Icon>;
export const FeaturesIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></Icon>;
export const SmartListIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></Icon>;
export const NotificationsIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></Icon>;
export const DateTimeIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>;
export const AppearanceIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></Icon>;
export const MoreIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></Icon>;
export const IntegrationsIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></Icon>;
export const CollaborateIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></Icon>;
export const StickyNoteIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon>;
export const DesktopWidgetsIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></Icon>;
export const ShortcutsIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></Icon>;
export const AboutIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
export const AnalyticsIcon: React.FC<{ className?: string }> = ({ className = "h-[24px] w-[24px]" }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></Icon>;
export const AIAssistantIcon: React.FC<{ className?: string }> = ({ className = "h-[24px] w-[24px]" }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></Icon>;
export const NotificationBellIcon: React.FC<{className?: string}> = ({className="h-[24px] w-[24px]"}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></Icon>;
export const MatrixIcon: React.FC<{ className?: string }> = ({ className = "h-[24px] w-[24px]" }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></Icon>;
export const CountdownIcon: React.FC<{className?: string}> = ({className = "h-[24px] w-[24px]"}) => ( <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon> );
export const FolderPlusIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></Icon>;
export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></Icon>;
export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-6l-2-2H6c-1.1 0-2 .9-2 2z" /></Icon>;
export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></Icon>;
export const LibraryIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></Icon>;
export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Icon>;
export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></Icon>;
export const ArchiveIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></Icon>;
export const ReportIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></Icon>;
export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></Icon>;
export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
export const MoonIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></Icon>;
export const SunIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></Icon>;
export const SparklesIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></Icon>;


// Icons moved from Sidebar
export const UserIcon = () => ( <Icon className="h-[24px] w-[24px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></Icon> );
export const TasksIcon: React.FC<{className?: string}> = ({className = "h-[24px] w-[24px]"}) => ( <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></Icon> );
export const HabitIcon: React.FC<{className?: string}> = ({className = "h-[24px] w-[24px]"}) => ( <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></Icon> );
export const PomodoroIcon: React.FC<{className?: string}> = ({className = "h-[24px] w-[24px]"}) => ( <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon> );
export const SettingsIcon: React.FC<{className?: string}> = ({className}) => ( <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-.2924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></Icon> );
export const PlusIcon = () => <Icon className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Icon>;
export const TrashIcon = () => <Icon className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon>;
export const EditIcon = () => <Icon className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon>;
export const MagicIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2l4.588.453a1 1 0 01.527 1.745l-3.26 3.4.963 4.753a1 1 0 01-1.482 1.054L12 15.547l-4.478 2.658a1 1 0 01-1.482-1.054l.963-4.753-3.26-3.4a1 1 0 01.527-1.745l4.588-.453L11.033 2.744A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
);
// Icons for manual add form
// FIX: Consolidating duplicate CalendarIcon definitions.
export const CalendarIcon: React.FC<{className?: string}> = ({className="h-[24px] w-[24px]"}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>;
export const FlagIcon: React.FC<{className?: string}> = ({className}) => <SolidIcon className={className}><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" /></SolidIcon>;
export const TagIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V5c0-1.1.9-2 2-2z" /></Icon>;
// FIX: The error message for MoreIcon was likely misleading. MoveToListIcon was defined without accepting props.
// Updated to accept and pass a className, consistent with other icons.
export const MoveToListIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></Icon>;
export const AttachmentIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></Icon>;
export const TemplateIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>;

// --- NEW ICONS FOR TASK DETAIL PANEL ---
export const StarIcon: React.FC<{className?: string, isFilled?: boolean}> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={isFilled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);
export const SubtaskIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></Icon>;
export const LinkParentIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></Icon>;
export const WontDoIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></Icon>;
export const TaskActivitiesIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></Icon>;
export const DuplicateIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></Icon>;
export const CopyLinkIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></Icon>;
export const ConvertToNoteIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>;
export const PrintIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></Icon>;
export const ChevronRightIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></Icon>;
export const HamburgerMenuIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></Icon>;
export const PinIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></Icon>;

// Text Formatting and Detail Panel Icons
export const TextFormatIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M6 6v12M10 6v12M14 10h-4" /></Icon>;
export const HeadingIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-8h8" /></Icon>;
export const BulletedListIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></Icon>;
export const CheckItemIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
export const QuoteIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l1.707-1.707A1 1 0 019 8v8a1 1 0 01-1.707.707L5.586 15zM15.586 15H14a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l1.707-1.707A1 1 0 0119 8v8a1 1 0 01-1.707.707L15.586 15z" /></Icon>;
export const CommentIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></Icon>;

export const DescriptionModeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M5 7h14" />
        <path d="M5 12h10" />
        <path d="M5 17h6" />
    </svg>
);

export const ChecklistModeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6H4v4h4V6z" />
        <path d="M10 8h10" />
        <path d="M8 14H4v4h4v-4z" />
        <path d="M10 16h10" />
    </svg>
);

// --- NEW ICONS FOR TASKS SIDEBAR ---
export const AllTasksIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></Icon>;
export const TodayIcon: React.FC<{className?: string}> = ({className}) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>;
export const TomorrowIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></Icon>;
export const Next7DaysIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>;
export const InboxIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></Icon>;
export const AssignedToMeIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></Icon>;
export const SummaryIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>;
export const CompletedIcon = () => <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
// FIX: Update FiltersIcon to accept a className prop to fix an error where it was being used with a className but didn't accept one.
export const FiltersIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></Icon>;


// --- NEW ICONS FOR HABIT STATS ---
export const ArrowsRightLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || 'w-4 h-4'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-7.5-12L21 9m0 0L16.5 4.5M21 9H3" />
    </svg>
);

export const BrainIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.871 14.143c-1.358-1.358-1.358-3.56 0-4.918l.004-.004a3.48 3.48 0 014.918 0L12 11.5l2.207-2.279a3.48 3.48 0 014.918 0l.004.004c1.358 1.358 1.358 3.56 0 4.918l-7.293 7.293a1 1 0 01-1.414 0L4.87 14.143zM12 3a2.99 2.99 0 012.121.879l4 4A2.99 2.99 0 0119 10v4a2.99 2.99 0 01-.879 2.121l-4 4A2.99 2.99 0 0112 21a2.99 2.99 0 01-2.121-.879l-4-4A2.99 2.99 0 015 14v-4a2.99 2.99 0 01.879-2.121l4-4A2.99 2.99 0 0112 3z" /></Icon>;
export const PuzzleIcon: React.FC<{ className?: string }> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></Icon>;
export const CheckCircleSolidIcon: React.FC<{className?: string}> = ({className}) => <SolidIcon className={className}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></SolidIcon>;
export const BoltSolidIcon: React.FC<{className?: string}> = ({className}) => <SolidIcon className={className}><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5.293l6.293-6.293a1 1 0 111.414 1.414L13.414 8.5H18a1 1 0 01.894 1.447l-8 10A1 1 0 019 18v-5.293l-6.293 6.293a1 1 0 01-1.414-1.414L7.586 11.5H3a1 1 0 01-.894-1.447l8-10A1 1 0 0111.3 1.046z" clipRule="evenodd" /></SolidIcon>;
export const FireSolidIcon: React.FC<{className?: string}> = ({className}) => <SolidIcon className={className}><path fillRule="evenodd" d="M12.965 2.522a.75.75 0 01.063.878A23.96 23.96 0 0110.5 16.5c-2.113 0-4.102-.6-5.835-1.656a.75.75 0 01-.708-1.22A25.433 25.433 0 0012.965 2.522zM10.5 18c-3.032 0-5.822-1.21-7.84-3.142a.75.75 0 01.927-1.171A21.53 21.53 0 0010.5 16.5c1.929 0 3.758-.42 5.437-1.156a.75.75 0 01.76 1.18A23.04 23.04 0 0110.5 18z" clipRule="evenodd" /></SolidIcon>;
export const ChartPieSolidIcon: React.FC<{className?: string}> = ({className}) => <SolidIcon className={className}><path d="M10 3.5A1.5 1.5 0 0111.5 2h.098a1.5 1.5 0 011.085.46l4.43 4.43a1.5 1.5 0 01.46 1.085v.098A1.5 1.5 0 0116 9.5h-3.5a1.5 1.5 0 01-1.5-1.5V3.5z" /><path d="M9 3.5a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 009 15.5h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0116 20.121V9.5A1.5 1.5 0 0014.5 8h-5A1.5 1.5 0 018 6.5v-3A1.5 1.5 0 006.5 2H3.879a1.5 1.5 0 01-1.06-.44L-.293-.56A1.5 1.5 0 010-1.621V6.5A1.5 1.5 0 001.5 8h5A1.5 1.5 0 018 9.5v5A1.5 1.5 0 009.5 16h.379a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0015 20.121V16.5A1.5 1.5 0 0013.5 15H9.5A1.5 1.5 0 008 13.5v-3A1.5 1.5 0 019.5 9H16a1.5 1.5 0 001.5-1.5V3.879a1.5 1.5 0 01-.44-1.06L17.58.293a1.5 1.5 0 011.621 0l-5.656 5.657a1.5 1.5 0 01-1.061.44H9.5A1.5 1.5 0 018 5V3.5A1.5 1.5 0 019.5 2h.5z" transform="translate(1.5 -1)"/></SolidIcon>;