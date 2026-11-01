import 'server-only'
import { requireViewer } from '@/lib/auth/requireViewer'
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
  // The role comes from requireViewer() (Task 923 R44): a blocked, deactivated or deleted agent is `unauthenticated`, and a lookup that
  // fails is denied (`not_agent`), never granted.
  const viewer = await requireViewer()
  if (!viewer.ok) return viewer.reason === 'lookup_failed' ? { kind: 'not_agent' } : { kind: 'unauthenticated' }
  if (viewer.role !== 'agent') return { kind: 'not_agent' }

  return { kind: 'ok', ownerId: viewer.userId as AgentOwnerId }
}
