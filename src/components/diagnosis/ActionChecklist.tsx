'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { InterventionRecommendation } from '@/types/diagnostics';
import { loadActionItemProgress, saveActionItemProgress } from '@/app/actions/actionItemActions';
import { debounce } from '@/lib/utils/debounce';

interface ActionChecklistProps {
    primary: InterventionRecommendation;
    secondary: InterventionRecommendation;
    revenueAtRisk: number;
    sessionId: string;
    patternId: string;
}

interface ActionItem {
    task: string;
    intervention: 'primary' | 'secondary';
    expectedLift: number;
    completed: boolean;
}

// Calculate expected lift for each task
function calculateExpectedLift(
    revenueAtRisk: number,
    interventionType: 'primary' | 'secondary',
    taskIndex: number,
    totalTasks: number
): number {
    // Primary gets 60% of impact, secondary 40%
    const interventionShare = interventionType === 'primary' ? 0.6 : 0.4;

    // Distribute evenly across tasks
    const taskShare = 1 / totalTasks;

    // Conservative 30% uplift estimate
    const upliftEstimate = 0.3;

    return Math.round(revenueAtRisk * interventionShare * taskShare * upliftEstimate);
}

export function ActionChecklist({ primary, secondary, revenueAtRisk, sessionId, patternId }: ActionChecklistProps) {
    // Extract top 3 tasks from primary, top 2 from secondary
    const primaryTasks = primary.quick_wins?.slice(0, 3) || [];
    const secondaryTasks = secondary.quick_wins?.slice(0, 2) || [];
    const totalTasks = primaryTasks.length + secondaryTasks.length;

    // Build action items
    const initialItems: ActionItem[] = [
        ...primaryTasks.map((task, idx) => ({
            task,
            intervention: 'primary' as const,
            expectedLift: calculateExpectedLift(revenueAtRisk, 'primary', idx, primaryTasks.length),
            completed: false
        })),
        ...secondaryTasks.map((task, idx) => ({
            task,
            intervention: 'secondary' as const,
            expectedLift: calculateExpectedLift(revenueAtRisk, 'secondary', idx, secondaryTasks.length),
            completed: false
        }))
    ];

    const [items, setItems] = useState<ActionItem[]>(initialItems);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load saved progress on mount
    useEffect(() => {
        async function loadProgress() {
            try {
                const progressMap = await loadActionItemProgress(sessionId, patternId);

                setItems(prev => prev.map(item => ({
                    ...item,
                    completed: progressMap[item.task] ?? false
                })));
            } catch (error) {
                console.error('Failed to load progress:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadProgress();
    }, [sessionId, patternId]);

    // Debounced save function
    const debouncedSave = useRef(
        debounce(async (
            task: string,
            interventionType: 'primary' | 'secondary',
            isCompleted: boolean
        ) => {
            setIsSaving(true);
            try {
                await saveActionItemProgress(
                    sessionId,
                    patternId,
                    interventionType,
                    task,
                    isCompleted
                );
            } catch (error) {
                console.error('Failed to save:', error);
            } finally {
                setIsSaving(false);
            }
        }, 500)
    ).current;

    // Toggle item with autosave
    const toggleItem = useCallback((index: number) => {
        const item = items[index];
        const newCompleted = !item.completed;

        // Optimistic update - immediately update UI
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, completed: newCompleted } : item
        ));

        // Autosave (debounced)
        debouncedSave(item.task, item.intervention, newCompleted);
    }, [items, debouncedSave]);

    const completedCount = items.filter(i => i.completed).length;

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Action Plan
                    </h4>
                    {isSaving && (
                        <span className="text-xs text-gray-400 italic">Saving...</span>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                    {completedCount}/{totalTasks} completed
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(completedCount / totalTasks) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${item.completed
                            ? 'bg-green-50 border-green-200'
                            : item.intervention === 'primary'
                                ? 'bg-white border-green-200 hover:bg-green-50/50'
                                : 'bg-white border-blue-200 hover:bg-blue-50/50'
                            }`}
                        onClick={() => toggleItem(idx)}
                    >
                        {/* Checkbox */}
                        <div className="flex-shrink-0 mt-0.5">
                            <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleItem(idx)}
                                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                        </div>

                        {/* Task Details */}
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                }`}>
                                {item.task}
                            </div>

                            {/* Priority Badge */}
                            {item.intervention === 'primary' && !item.completed && (
                                <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                                    Top Priority
                                </span>
                            )}
                        </div>
                    </label>
                ))}
            </div>

            {/* Summary Note */}
            <div className="text-xs text-gray-500 italic bg-gray-50 rounded p-3 border border-gray-200">
                💡 Focus on top priority items first for maximum impact. Your progress is automatically saved.
            </div>
        </div>
    );
}
