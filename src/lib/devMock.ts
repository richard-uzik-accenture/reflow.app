import type { Task } from './tasks';

/**
 * Dev-only mock session and seed data, used to reach authenticated screens
 * (Today, MorningFlow, CompareDuel) in local browser automation without a
 * real Supabase login. Active only when VITE_DEV_MODE=true; never bundled
 * into a path that runs against production credentials.
 */
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const DEV_USER_ID = 'dev-mock-user';

export const mockSession = {
  user: { id: DEV_USER_ID, email: 'dev@reflow.local' },
  access_token: 'dev-mock-token',
} as unknown as import('@supabase/supabase-js').Session;

const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

let mockTasks: Task[] = [
  { id: 'mock-1', user_id: DEV_USER_ID, title: 'ship the quarterly report', note: null, status: 'active', rank: 100, created_at: yesterday, completed_at: null, last_triaged_on: today, tags: [] },
  { id: 'mock-2', user_id: DEV_USER_ID, title: 'review pull request from priya', note: null, status: 'active', rank: 200, created_at: yesterday, completed_at: null, last_triaged_on: today, tags: [] },
  { id: 'mock-3', user_id: DEV_USER_ID, title: 'call the dentist back', note: null, status: 'active', rank: 300, created_at: today, completed_at: null, last_triaged_on: today, tags: [] },
  { id: 'mock-4', user_id: DEV_USER_ID, title: 'prep slides for 2pm sync', note: null, status: 'active', rank: 400, created_at: today, completed_at: null, last_triaged_on: today, tags: [] },
  { id: 'mock-5', user_id: DEV_USER_ID, title: 'reply to legal about the vendor contract', note: null, status: 'active', rank: 500, created_at: today, completed_at: null, last_triaged_on: today, tags: [] },
  { id: 'mock-6', user_id: DEV_USER_ID, title: 'onboard the new hire on the data pipeline', note: null, status: 'active', rank: 600, created_at: today, completed_at: null, last_triaged_on: today, tags: [] },
  { id: 'mock-7', user_id: DEV_USER_ID, title: 'still open: finish the migration doc', note: null, status: 'active', rank: 700, created_at: yesterday, completed_at: null, last_triaged_on: yesterday, tags: [] },
  { id: 'mock-8', user_id: DEV_USER_ID, title: 'still open: follow up with finance on budget', note: null, status: 'active', rank: 800, created_at: yesterday, completed_at: null, last_triaged_on: yesterday, tags: [] },
];

let mockCompletedToday = false;

export const mockTasksApi = {
  list: async (): Promise<Task[]> => [...mockTasks].sort((a, b) => a.rank - b.rank),
  create: async (userId: string, title: string, rank: number, tags: string[] = []): Promise<Task> => {
    const created: Task = {
      id: `mock-${Date.now()}`, user_id: userId, title, note: null,
      status: 'active', rank, created_at: today, completed_at: null, last_triaged_on: today,
      tags,
    };
    mockTasks = [...mockTasks, created];
    return created;
  },
  update: async (taskId: string, patch: { title?: string; tags?: string[] }): Promise<void> => {
    mockTasks = mockTasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
  },
  updateStatus: async (taskId: string, status: Task['status']): Promise<void> => {
    mockTasks = mockTasks.map((t) => (t.id === taskId ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : t.completed_at } : t));
    if (status === 'done') mockCompletedToday = true;
  },
  updateRanks: async (updates: { id: string; rank: number }[]): Promise<void> => {
    const byId = new Map(updates.map((u) => [u.id, u.rank]));
    mockTasks = mockTasks.map((t) => (byId.has(t.id) ? { ...t, rank: byId.get(t.id)! } : t));
  },
  markTriaged: async (taskId: string): Promise<void> => {
    mockTasks = mockTasks.map((t) => (t.id === taskId ? { ...t, last_triaged_on: today } : t));
  },
  hasCompletedToday: async (): Promise<boolean> => mockCompletedToday,
};
