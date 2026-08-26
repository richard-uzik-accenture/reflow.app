import type { Task } from './tasks';
import { TAGS_MAX_COUNT, TAG_MAX_LENGTH } from './validation';

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#/, '').replace(/\s+/g, ' ').toLowerCase();
}

export function addTag(tags: string[], raw: string): string[] {
  const normalized = normalizeTag(raw);
  if (!normalized) return tags;
  if (normalized.length > TAG_MAX_LENGTH) return tags;
  if (tags.length >= TAGS_MAX_COUNT) return tags;
  if (tags.some((t) => t.toLowerCase() === normalized)) return tags;
  return [...tags, normalized];
}

export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((t) => t !== tag);
}

export function allKnownTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const task of tasks) {
    for (const tag of task.tags) set.add(tag);
  }
  return [...set].sort();
}

export function suggestTags(known: string[], query: string, exclude: string[]): string[] {
  const normalizedQuery = normalizeTag(query);
  const excludeSet = new Set(exclude.map((t) => t.toLowerCase()));
  const candidates = known.filter((tag) => !excludeSet.has(tag.toLowerCase()));

  if (!normalizedQuery) return candidates.slice(0, 6);

  const startsWith = candidates.filter((tag) => tag.startsWith(normalizedQuery) && tag !== normalizedQuery);
  const includes = candidates.filter((tag) => !startsWith.includes(tag) && tag.includes(normalizedQuery) && tag !== normalizedQuery);
  return [...startsWith, ...includes].slice(0, 6);
}
