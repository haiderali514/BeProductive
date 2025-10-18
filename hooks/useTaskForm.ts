





import { useState, useCallback, useEffect, FormEvent } from 'react';
import { List, Priority, Recurrence, AddTaskFormProps } from '../types';
import { parseTaskFromString } from '../services/geminiService';
import { ApiFeature } from './useApiUsage';

type UseTaskFormProps = Pick<AddTaskFormProps, 'lists' | 'onAddTask' | 'aiEnabled' | 'activeListId' | 'logApiCall' | 'onDeactivate'>;

export const useTaskForm = ({
    lists,
    onAddTask,
    aiEnabled,
    activeListId,
    logApiCall,
    onDeactivate,
}: UseTaskFormProps) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [priority, setPriority] = useState<Priority>(Priority.NONE);
    const [selectedListId, setSelectedListId] = useState(activeListId);
    const [tags, setTags] = useState<string[]>([]);
    const [listPillLabel, setListPillLabel] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedListId(activeListId);
    }, [activeListId]);

    const resetForm = useCallback(() => {
        setTitle('');
        setDueDate(null);
        setPriority(Priority.NONE);
        setSelectedListId(activeListId);
        setTags([]);
        setListPillLabel(null);
        setError(null);
    }, [activeListId]);

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            // @google/genai-sdk: Fix: Add missing properties to satisfy the onAddTask type definition.
            onAddTask({
                title: title.trim(),
                listId: selectedListId,
                priority,
                dueDate: dueDate ? dueDate.toISOString().slice(0, 16).replace('T', ' ') : null,
                // @google/genai-sdk: Fix: Added missing properties to satisfy the onAddTask type definition.
                startDate: null,
                isAllDay: false,
                recurrence: null,
                reminder: null,
                tags,
                isSection: false,
                isCollapsed: false,
                afterTaskId: undefined,
            });
            
            resetForm();
            if(onDeactivate) {
                onDeactivate();
            }

        } catch (e: any) {
            setError(e.message || "Failed to add task.");
        } finally {
            setIsLoading(false);
        }
    }, [
        title, isLoading, onAddTask, selectedListId, priority, dueDate, tags, resetForm, onDeactivate
    ]);
    
    return {
        title,
        dueDate,
        priority,
        selectedListId,
        tags,
        listPillLabel,
        isLoading,
        error,
        setTitle,
        setDueDate,
        setPriority,
        setSelectedListId,
        setTags,
        setListPillLabel,
        setError,
        handleSubmit,
        resetForm,
    };
};