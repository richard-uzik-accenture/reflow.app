import { supabase } from './supabase';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  status: 'active' | 'done' | 'dropped';
  rank: number;
  created_at: string;
  completed_at: string | null;
  last_triaged_on: string; // ISO date, e.g. "2026-08-09"
  tags: string[];
}

/** Some existing rows predate the `tags` column and have it as null rather than '{}'. */
export function normalizeTask(row: Task): Task {
  return row.tags ? row : { ...row, tags: [] };
}

/** All active tasks for the signed-in user, ordered most-urgent-first. */
export async function listActiveTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'active')
    .order('rank', { ascending: true });

  if (error) throw error;
  return (data as Task[]).map(normalizeTask);
}

/** Creates a task at the given rank. Callers compute the rank (top-level list append, or via the compare mechanic). */
export async function createTask(userId: string, title: string, rank: number, tags: string[] = []): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, rank, status: 'active', tags })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  const patch: Partial<Task> = { status };
  if (status === 'done') patch.completed_at = new Date().toISOString();
  const { error } = await supabase.from('tasks').update(patch).eq('id', taskId);
  if (error) throw error;
}

export async function updateTask(
  taskId: string,
  patch: { title?: string; tags?: string[] },
): Promise<void> {
  const { error } = await supabase.from('tasks').update(patch).eq('id', taskId);
  if (error) throw error;
}

export async function updateTaskRank(taskId: string, rank: number): Promise<void> {
  const { error } = await supabase.from('tasks').update({ rank }).eq('id', taskId);
  if (error) throw error;
}

/** Bulk rank update used after a full manual reorder (Phase 5). */
export async function updateTaskRanks(updates: { id: string; rank: number }[]): Promise<void> {
  await Promise.all(updates.map((u) => updateTaskRank(u.id, u.rank)));
}

export async function markTriaged(taskId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('tasks').update({ last_triaged_on: today }).eq('id', taskId);
  if (error) throw error;
}

/** Whether the signed-in user has completed at least one task today — used to tell a genuine "cleared my list" moment apart from a brand-new account with nothing completed yet. */
export async function hasCompletedToday(): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'done')
    .gte('completed_at', startOfDay.toISOString());

  if (error) throw error;
  return (count ?? 0) > 0;
}
