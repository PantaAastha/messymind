'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ActionItemProgress {
    session_id: string;
    pattern_id: string;
    intervention_type: 'primary' | 'secondary';
    task_text: string;
    is_completed: boolean;
}

/**
 * Save or update action item completion status
 * Uses upsert to handle both insert and update cases
 */
export async function saveActionItemProgress(
    sessionId: string,
    patternId: string,
    interventionType: 'primary' | 'secondary',
    taskText: string,
    isCompleted: boolean
) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('Auth error:', authError);
            return { success: false, error: 'Unauthorized' };
        }

        // Upsert (insert or update)
        const { error } = await supabase
            .from('action_item_progress')
            .upsert({
                user_id: user.id,
                session_id: sessionId,
                pattern_id: patternId,
                intervention_type: interventionType,
                task_text: taskText,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null,
            }, {
                onConflict: 'user_id,session_id,pattern_id,task_text'
            });

        if (error) {
            console.error('Supabase error saving action item:', error);
            return { success: false, error: error.message };
        }

        // Revalidate the session results page
        revalidatePath(`/session/${sessionId}/results`);

        return { success: true };
    } catch (error) {
        console.error('Unexpected error saving action item:', error);
        return { success: false, error: 'Failed to save' };
    }
}

/**
 * Load all action item progress for a session and pattern
 * Returns a map of task_text -> is_completed
 */
export async function loadActionItemProgress(
    sessionId: string,
    patternId: string
): Promise<Record<string, boolean>> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('Auth error loading progress:', authError);
            return {};
        }

        const { data, error } = await supabase
            .from('action_item_progress')
            .select('task_text, is_completed')
            .eq('user_id', user.id)
            .eq('session_id', sessionId)
            .eq('pattern_id', patternId);

        if (error) {
            console.error('Error loading action item progress:', error);
            return {};
        }

        // Convert to map: task_text -> is_completed
        const progressMap: Record<string, boolean> = {};
        data?.forEach(item => {
            progressMap[item.task_text] = item.is_completed;
        });

        return progressMap;
    } catch (error) {
        console.error('Unexpected error loading action items:', error);
        return {};
    }
}

/**
 * Get completion statistics for a session
 * Useful for dashboard analytics
 */
export async function getSessionCompletionStats(sessionId: string) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return null;

        const { data, error } = await supabase
            .from('action_item_progress')
            .select('is_completed, pattern_id')
            .eq('user_id', user.id)
            .eq('session_id', sessionId);

        if (error) {
            console.error('Error fetching completion stats:', error);
            return null;
        }

        const total = data?.length || 0;
        const completed = data?.filter(item => item.is_completed).length || 0;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            percentage,
            patterns: [...new Set(data?.map(item => item.pattern_id) || [])]
        };
    } catch (error) {
        console.error('Unexpected error fetching stats:', error);
        return null;
    }
}
