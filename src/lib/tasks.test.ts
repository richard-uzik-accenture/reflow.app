import { describe, expect, it } from 'vitest';
import { normalizeTask, type Task } from './tasks';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'id',
    user_id: 'user',
    title: 'task',
    note: null,
    status: 'active',
    rank: 0,
    created_at: '2026-08-01T00:00:00.000Z',
    completed_at: null,
    last_triaged_on: '2026-08-01',
    tags: [],
    ...overrides,
  };
}

describe('normalizeTask', () => {
  it('replaces a null tags column with an empty array', () => {
    const task = makeTask({ tags: null as unknown as string[] });
    expect(normalizeTask(task).tags).toEqual([]);
  });

  it('leaves an existing tags array untouched', () => {
    const task = makeTask({ tags: ['work'] });
    expect(normalizeTask(task).tags).toEqual(['work']);
  });
});
