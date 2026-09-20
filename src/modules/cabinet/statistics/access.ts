import 'server-only'
import { getUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import type { AgentOwnerId, AgentStatisticsAccess } from './types'

/**
 * The agent statistics gate — Task 848, owner decision D78-3.
 *
 * Reads the session on the server and answers one of three kinds. The signed-in user must have
 * `users.role = 'agent'` (not the self-selected `user_type`); `admin` and `moderator` are `not_agent`.
 * The returned `ownerId` is the session user's id — the only identity the data layer ever accepts —
 * and the single `AgentOwnerId` cast in the codebase lives here. A role that cannot be read is
 * denied (`not_agent`), never granted.
 */
export async function getAgentStatisticsAccess(): Promise<AgentStatisticsAccess> {
  const authUser = await getUser()
  if (!authUser) return { kind: 'unauthenticated' }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('users').select('role').eq('id', authUser.id).single()
    if (error) {
      console.error('[AgentStatistics] access failed', { code: error.code ?? null })
      return { kind: 'not_agent' }
    }
    if (data?.role !== 'agent') return { kind: 'not_agent' }
  } catch (cause) {
    console.error('[AgentStatistics] access failed', { code: null, cause })
    return { kind: 'not_agent' }
  }

  return { kind: 'ok', ownerId: authUser.id as AgentOwnerId }
}
