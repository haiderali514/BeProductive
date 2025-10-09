import React, { useState, useMemo, useRef, useEffect } from 'react';
import { List, Task, Tag, Filter, Priority } from '../types';
import { Settings, SmartListVisibility } from '../hooks/useSettings';
import { AllTasksIcon, TodayIcon, TomorrowIcon, Next7DaysIcon, AssignedToMeIcon, InboxIcon, SummaryIcon, CompletedIcon, TrashIcon, MoreIcon, TrophyIcon, PinIcon, EditIcon, DuplicateIcon, ShareIcon, ArchiveIcon, PlusIcon, ChevronDownIcon, WontDoIcon, TagIcon, FiltersIcon } from './Icons';
import { Popover } from './Popover';
import { useData } from '../contexts/DataContext';
import { EditListModal } from './EditListModal';
import { AddListModal } from './AddListModal';
import { AddTagModal } from './AddTagModal';
import { AddFilterModal } from './AddFilterModal';
import useLocalStorage from '../hooks/useLocalStorage';

interface TasksSidebarProps {
    lists: List[];
    tasks: Task[];
    tags: Tag[];
    filters: Filter[];
    activeView: string;
    onSelectView: (viewId: string) => void;
    onAddList: (listData: { name: string; emoji: string; color: string; }) => void;
    onAddTag: (tagData: { name: string; color: string; parentId: string | null; }) => void;
    onAddFilter: (filterData: Omit<Filter, 'id'>) => void;
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const smartListsConfig = [
    { id: 'all', name: 'All', icon: <AllTasksIcon /> },
    { id: 'today', name: 'Today', icon: <TodayIcon /> },
    { id: 'tomorrow', name: 'Tomorrow', icon: <TomorrowIcon /> },
    { id: 'next7days', name: 'Next 7 Days', icon: <Next7DaysIcon /> },
    { id: 'assignedToMe', name: 'Assigned to Me', icon: <AssignedToMeIcon /> },
    { id: 'inbox', name: 'Inbox', icon: <InboxIcon /> },
    { id: 'summary', name: 'Summary', icon: <SummaryIcon /> },
];

const staticItemsConfig = [
    { id: 'completed', name: 'Completed', icon: <CompletedIcon /> },
    { id: 'wontdo', name: 'Won\'t Do', icon: <WontDoIcon /> },
    { id: 'trash', name: 'Trash', icon: <TrashIcon /> },
]

// ====================================================================
// Unified Sidebar List Item Component
// ====================================================================
const SidebarListItem: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count?: number;
    color?: string;
    moreMenu?: React.ReactNode;
    isDraggable?: boolean;
    onDragStart?: () => void;
    onDrop?: () => void;
    onDragEnter?: () => void;
    onDragEnd?: () => void;
    isDropTarget?: boolean;
}> = ({ isActive, onClick, icon, label, count, color, moreMenu, isDraggable, onDragStart, onDrop, onDragEnter, onDragEnd, isDropTarget }) => {
    return (
        <div 
            className="relative group"
            draggable={isDraggable}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={isDraggable ? (e) => e.preventDefault() : undefined}
        >
            {isDropTarget && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />}
            <button
                onClick={onClick}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                        ? 'bg-primary/20 text-primary font-semibold'
                        : 'text-content-secondary hover:bg-background-tertiary hover:text-content-primary'
                }`}
            >
                {/* Icon and Label */}
                <div className="flex items-center space-x-3 flex-1 truncate">
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</span>
                    <span className="truncate">{label}</span>
                </div>
            </button>

            {/* Right-aligned content container */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-full flex items-center justify-end pointer-events-none">
                
                {/* Count and Dot (visible normally, hidden on hover if more menu exists) */}
                <div className={`flex items-center flex-row-reverse space-x-2 space-x-reverse transition-opacity duration-200 ${moreMenu ? 'group-hover:opacity-0' : ''}`}>
                    <span className={`text-xs tabular-nums ${
                        (typeof count === 'number' && count > 0)
                        ? 'text-content-tertiary'
                        : 'text-transparent'
                    }`}>
                        {typeof count === 'number' ? count : '0'}
                    </span>
                    <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color || 'transparent' }}
                    ></div>
                </div>

                {/* More Menu (hidden normally, visible on hover) */}
                {moreMenu && (
                    <div className="absolute inset-y-0 right-0 flex items-center justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-auto">
                        {moreMenu}
                    </div>
                )}
            </div>
        </div>
    );
};


export const TasksSidebar: React.FC<TasksSidebarProps> = ({ lists, tasks, tags, filters, activeView, onSelectView, onAddList, onAddTag, onAddFilter, settings, onSettingsChange }) => {
    const [isAddListModalOpen, setAddListModalOpen] = useState(false);
    const [isAddTagModalOpen, setAddTagModalOpen] = useState(false);
    const [isAddFilterModalOpen, setAddFilterModalOpen] = useState(false);
    const [listToEdit, setListToEdit] = useState<List | null>(null);
    const { handleUpdateList, handleDeleteList, handleReorderList } = useData();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useLocalStorage<Record<string, boolean>>(
        'sidebar_collapsed_sections',
        { lists: false, filters: false, tags: false }
    );
    
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    const menuTriggersRef = useRef<Record<string, HTMLButtonElement | null>>({});

    const handleDragStart = (id: string) => setDraggedId(id);
    const handleDragEnter = (id: string) => { if (id !== draggedId) setDropTargetId(id); };
    const handleDrop = () => {
        if (draggedId && dropTargetId) {
            handleReorderList(draggedId, dropTargetId);
        }
        setDraggedId(null);
        setDropTargetId(null);
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
    };

    const handleToggleSection = (sectionId: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const handleVisibilityChange = (key: keyof Settings['smartListSettings'], value: SmartListVisibility) => {
        onSettingsChange({
            smartListSettings: {
                ...settings.smartListSettings,
                [key]: value,
            },
        });
        setOpenMenuId(null);
    };

    const taskCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 6);

        tasks.forEach(task => {
            if (!task.completed && !task.wontDo && !task.trashed) {
                // Regular lists
                counts[task.listId] = (counts[task.listId] || 0) + 1;

                // Tags
                task.tags.forEach(tagId => {
                    counts[`tag-${tagId}`] = (counts[`tag-${tagId}`] || 0) + 1;
                });

                // Smart lists
                counts.all = (counts.all || 0) + 1;
                if (task.dueDate?.startsWith(todayStr)) counts.today = (counts.today || 0) + 1;
                if (task.dueDate?.startsWith(tomorrowStr)) counts.tomorrow = (counts.tomorrow || 0) + 1;

                if(task.dueDate) {
                     try {
                        const taskDate = new Date(task.dueDate.split(' ')[0] + 'T00:00:00Z');
                        if (taskDate >= today && taskDate <= sevenDaysLater) {
                            counts.next7days = (counts.next7days || 0) + 1;
                        }
                    } catch {}
                }
            }
        });
        return counts;
    }, [tasks]);
    
    const visibleSmartLists = useMemo(() => {
        return smartListsConfig.filter(list => {
            const setting = settings.smartListSettings[list.id as keyof typeof settings.smartListSettings];
            if (setting === 'hide') return false;
            if (setting === 'show-if-not-empty') return (taskCounts[list.id] || 0) > 0;
            return true;
        })
    }, [settings.smartListSettings, taskCounts]);
    
    const userLists = useMemo(() => lists.filter(l => l.id !== 'inbox'), [lists]);
    const pinnedLists = useMemo(() => userLists.filter(l => l.isPinned), [userLists]);
    const regularLists = useMemo(() => userLists.filter(l => !l.isPinned), [userLists]);

    return (
        <>
            <aside className="bg-background-primary p-3 flex-col flex h-full overflow-y-auto relative z-10">
                <nav className="flex-1">
                     <div className="space-y-1">
                        {visibleSmartLists.map(listConfig => {
                            const list = listConfig.id === 'inbox' ? lists.find(l => l.id === 'inbox') : listConfig;
                            if (!list) return null;

                            const inboxListObject = listConfig.id === 'inbox' ? (list as List) : null;
                            const isMenuOpen = openMenuId === list.id;
                            
                            const menuContent = () => {
                                if (inboxListObject) {
                                    return <button onClick={() => { setListToEdit(inboxListObject); setOpenMenuId(null); }} className="w-full text-left p-2 text-sm rounded hover:bg-[#2f2f2f]">Edit</button>;
                                }
                                if (['all', 'summary'].includes(list.id)) {
                                    return <button onClick={() => handleVisibilityChange(list.id as keyof Settings['smartListSettings'], 'hide')} className="w-full text-left p-2 text-sm rounded hover:bg-[#2f2f2f]">Hide</button>;
                                }
                                return (
                                    <>
                                        <button onClick={() => handleVisibilityChange(list.id as keyof Settings['smartListSettings'], 'show-if-not-empty')} className="w-full text-left p-2 text-sm rounded hover:bg-[#2f2f2f]">Show if not empty</button>
                                        <button onClick={() => handleVisibilityChange(list.id as keyof Settings['smartListSettings'], 'hide')} className="w-full text-left p-2 text-sm rounded hover:bg-[#2f2f2f]">Hide</button>
                                    </>
                                );
                            };

                            const moreMenu = (
                                <>
                                    <button 
                                        ref={el => { menuTriggersRef.current[list.id] = el; }}
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(prevId => prevId === list.id ? null : list.id)}}
                                        className="p-1 rounded-full text-content-tertiary hover:text-content-primary hover:bg-background-primary"
                                    >
                                        <MoreIcon className="w-4 h-4" />
                                    </button>
                                    <Popover isOpen={isMenuOpen} onClose={() => setOpenMenuId(null)} triggerRef={{ current: menuTriggersRef.current[list.id]}} position="right-start">
                                        <div className="w-48 bg-[#242424] rounded-lg shadow-xl border border-border-primary p-2 text-white">
                                            {menuContent()}
                                        </div>
                                    </Popover>
                                </>
                            );

                            return (
                                <SidebarListItem
                                    key={list.id}
                                    isActive={activeView === list.id}
                                    onClick={() => onSelectView(list.id)}
                                    icon={listConfig.icon}
                                    label={list.name}
                                    count={taskCounts[list.id]}
                                    color={inboxListObject?.color}
                                    moreMenu={moreMenu}
                                />
                            );
                        })}
                    </div>
                    
                    {pinnedLists.length > 0 && (
                        <div>
                            <button onClick={() => handleToggleSection('pinned')} className="w-full flex items-center pt-4 pb-2 px-2 text-xs font-bold uppercase text-content-tertiary hover:text-content-primary">
                                <ChevronDownIcon className={`h-4 w-4 mr-1 transition-transform ${collapsedSections['pinned'] ? '-rotate-90' : ''}`} />
                                Pinned
                            </button>
                            {!collapsedSections['pinned'] && (
                                <div className="space-y-1">
                                    {/* Content for pinned lists will be rendered below */}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 pb-2 px-2 group">
                        <button onClick={() => handleToggleSection('lists')} className="flex items-center text-xs font-bold uppercase text-content-tertiary hover:text-content-primary">
                            <ChevronDownIcon className={`h-4 w-4 mr-1 transition-transform ${collapsedSections['lists'] ? '-rotate-90' : ''}`} />
                            Lists
                        </button>
                        <button onClick={() => setAddListModalOpen(true)} className="p-1 rounded text-content-tertiary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlusIcon />
                        </button>
                    </div>
                    {!collapsedSections['lists'] && (
                        <div className="space-y-1">
                            {[...pinnedLists, ...regularLists].map(list => {
                                const isMenuOpen = openMenuId === list.id;
                                const moreMenu = (
                                     <>
                                        <button 
                                            ref={el => { menuTriggersRef.current[list.id] = el; }}
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(prevId => prevId === list.id ? null : list.id)}}
                                            className="p-1 rounded-full text-content-tertiary hover:text-content-primary hover:bg-background-primary"
                                        >
                                            <MoreIcon className="w-4 h-4" />
                                        </button>
                                        <Popover isOpen={isMenuOpen} onClose={() => setOpenMenuId(null)} triggerRef={{ current: menuTriggersRef.current[list.id]}} position="right-start">
                                            <div className="w-48 bg-[#242424] rounded-lg shadow-xl border border-border-primary p-2 text-white text-sm">
                                                <button onClick={() => { setListToEdit(list); setOpenMenuId(null); }} className="w-full text-left flex items-center space-x-2 p-2 rounded hover:bg-[#2f2f2f]"><EditIcon /><span>Edit</span></button>
                                                <button onClick={() => { handleUpdateList(list.id, { isPinned: !list.isPinned }); setOpenMenuId(null); }} className="w-full text-left flex items-center space-x-2 p-2 rounded hover:bg-[#2f2f2f]"><PinIcon /><span>{list.isPinned ? 'Unpin' : 'Pin'}</span></button>
                                                <div className="my-1 border-t border-border-primary"></div>
                                                <button onClick={() => { handleDeleteList(list.id); setOpenMenuId(null); }} className="w-full text-left flex items-center space-x-2 p-2 rounded text-red-500 hover:bg-red-500/10"><TrashIcon /><span>Delete</span></button>
                                            </div>
                                        </Popover>
                                    </>
                                );
                                return (
                                    <SidebarListItem
                                        key={list.id}
                                        isActive={activeView === list.id}
                                        onClick={() => onSelectView(list.id)}
                                        icon={<span>{list.emoji || '•'}</span>}
                                        label={list.name}
                                        count={taskCounts[list.id]}
                                        color={list.color}
                                        moreMenu={moreMenu}
                                        isDraggable={true}
                                        onDragStart={() => handleDragStart(list.id)}
                                        onDrop={handleDrop}
                                        onDragEnter={() => handleDragEnter(list.id)}
                                        onDragEnd={handleDragEnd}
                                        isDropTarget={dropTargetId === list.id}
                                    />
                                );
                            })}
                        </div>
                    )}
                    
                    {settings.smartListSettings.filters === 'show' && (
                        <div className="relative group">
                            <div className="flex justify-between items-center pt-4 pb-2 px-2">
                                <button onClick={() => handleToggleSection('filters')} className="flex items-center text-xs font-bold uppercase text-content-tertiary hover:text-content-primary">
                                    <ChevronDownIcon className={`h-4 w-4 mr-1 transition-transform ${collapsedSections['filters'] ? '-rotate-90' : ''}`} />
                                    Filters
                                </button>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button ref={el => { menuTriggersRef.current['filters_main'] = el; }} onClick={() => setOpenMenuId(prev => prev === 'filters_main' ? null : 'filters_main')} className="p-1 rounded text-content-tertiary hover:text-content-primary"><MoreIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setAddFilterModalOpen(true)} className="p-1 rounded text-content-tertiary hover:text-primary"><PlusIcon /></button>
                                </div>
                            </div>
                            {!collapsedSections['filters'] && (
                                <div className="text-sm text-content-tertiary py-2 space-y-1">
                                    {filters.map(filter => (
                                        <SidebarListItem
                                            key={filter.id}
                                            isActive={activeView === filter.id}
                                            onClick={() => onSelectView(filter.id)}
                                            icon={<FiltersIcon className="w-5 h-5"/>}
                                            label={filter.name}
                                        />
                                    ))}
                                </div>
                            )}
                            <Popover isOpen={openMenuId === 'filters_main'} onClose={() => setOpenMenuId(null)} triggerRef={{ current: menuTriggersRef.current['filters_main']}} position="right-start">
                                <div className="w-40 p-2 bg-[#242424] rounded-lg shadow-xl border border-border-primary text-white">
                                    <button onClick={() => handleVisibilityChange('filters', 'hide')} className="w-full text-left p-2 text-sm rounded hover:bg-[#2f2f2f]">Hide</button>
                                </div>
                            </Popover>
                        </div>
                    )}
                    
                    {settings.smartListSettings.tags === 'show' && (
                         <div className="relative group">
                            <div className="flex justify-between items-center pt-4 pb-2 px-2">
                                <button onClick={() => handleToggleSection('tags')} className="w-full flex items-center text-xs font-bold uppercase text-content-tertiary hover:text-content-primary">
                                    <ChevronDownIcon className={`h-4 w-4 mr-1 transition-transform ${collapsedSections['tags'] ? '-rotate-90' : ''}`} />
                                    Tags
                                </button>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button ref={el => { menuTriggersRef.current['tags_main'] = el; }} onClick={() => setOpenMenuId(prev => prev === 'tags_main' ? null : 'tags_main')} className="p-1 rounded text-content-tertiary hover:text-content-primary"><MoreIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setAddTagModalOpen(true)} className="p-1 rounded text-content-tertiary hover:text-primary"><PlusIcon /></button>
                                </div>
                            </div>
                            {!collapsedSections['tags'] && (
                                <div className="text-sm text-content-tertiary py-2 space-y-1">
                                    {tags.map(tag => (
                                        <SidebarListItem
                                            key={tag.id}
                                            isActive={activeView === tag.id}
                                            onClick={() => onSelectView(tag.id)}
                                            icon={<TagIcon className="w-5 h-5"/>}
                                            label={tag.name}
                                            count={taskCounts[`tag-${tag.id}`]}
                                            color={tag.color}
                                        />
                                    ))}
                                </div>
                            )}
                            <Popover isOpen={openMenuId === 'tags_main'} onClose={() => setOpenMenuId(null)} triggerRef={{ current: menuTriggersRef.current['tags_main']}} position="right-start">
                                <div className="w-40 p-2 bg-[#242424] rounded-lg shadow-xl border border-border-primary text-white">
                                    <button onClick={() => handleVisibilityChange('tags', 'hide')} className="w-full text-left p-2 text-sm rounded hover:bg-[#2f2f2f]">Hide</button>
                                </div>
                            </Popover>
                        </div>
                    )}
                </nav>
                <div className="my-2 border-t border-border-primary"></div>
                <nav className="space-y-1">
                     {staticItemsConfig.map(item => {
                        const key = item.id as keyof Settings['smartListSettings'];
                        if (settings.smartListSettings[key] !== 'show') return null;
                        return (
                            <SidebarListItem
                                key={item.id}
                                isActive={activeView === item.id}
                                onClick={() => onSelectView(item.id)}
                                icon={item.icon}
                                label={item.name}
                            />
                        );
                     })}
                </nav>
                <div className="mt-auto pt-2 border-t border-border-primary">
                    <button className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md text-yellow-400 hover:bg-background-tertiary">
                        <div className="flex items-center space-x-3">
                             <TrophyIcon/>
                             <span>Upgrade to Premium</span>
                        </div>
                        <span>&gt;</span>
                    </button>
                </div>
            </aside>
            {listToEdit && (
                <EditListModal
                    isOpen={!!listToEdit}
                    onClose={() => setListToEdit(null)}
                    list={listToEdit}
                    onSave={(updatedList) => handleUpdateList(listToEdit.id, updatedList)}
                />
            )}
            <AddListModal
                isOpen={isAddListModalOpen}
                onClose={() => setAddListModalOpen(false)}
                onAddList={onAddList}
            />
            <AddTagModal
                isOpen={isAddTagModalOpen}
                onClose={() => setAddTagModalOpen(false)}
                onAddTag={onAddTag}
                tags={tags}
            />
            <AddFilterModal
                isOpen={isAddFilterModalOpen}
                onClose={() => setAddFilterModalOpen(false)}
                onAddFilter={onAddFilter}
                lists={lists}
                tags={tags}
            />
        </>
    );
};