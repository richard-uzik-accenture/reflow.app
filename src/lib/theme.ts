import { supabase } from './supabase';

export type ThemePreference = 'system' | 'light' | 'dark';

export async function getThemePreference(userId: string): Promise<ThemePreference> {
  const { data, error } = await supabase
    .from('profiles')
    .select('theme_preference')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.theme_preference as ThemePreference | undefined) ?? 'system';
}

export async function setThemePreference(userId: string, theme: ThemePreference): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, theme_preference: theme });

  if (error) throw error;
}
