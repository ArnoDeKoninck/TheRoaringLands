import type { SupabaseClient } from '@supabase/supabase-js'

export async function requireDm(supabase: SupabaseClient): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'dm') return { error: 'Unauthorized' }
  return { error: null }
}
