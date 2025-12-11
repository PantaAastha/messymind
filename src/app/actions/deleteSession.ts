/**
 * Server Action: Delete Diagnostic Session
 * Deletes a session and all related diagnostic results (cascade)
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteSession(sessionId: string) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership before deleting
    const { data: session } = await supabase
        .from('diagnostic_sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .single();

    if (!session || session.user_id !== user.id) {
        return { success: false, error: 'Session not found or unauthorized' };
    }

    // Delete session (cascade will delete diagnostic_results automatically)
    const { error: deleteError } = await supabase
        .from('diagnostic_sessions')
        .delete()
        .eq('id', sessionId);

    if (deleteError) {
        console.error('Delete error:', deleteError);
        return { success: false, error: 'Failed to delete session' };
    }

    // Revalidate dashboard to show updated list
    revalidatePath('/dashboard');

    return { success: true };
}
