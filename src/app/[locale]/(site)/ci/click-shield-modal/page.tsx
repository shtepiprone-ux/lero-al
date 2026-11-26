import { notFound } from 'next/navigation'
import { ClickShieldModalFixture } from '@/components/ci/ClickShieldModalFixture'

// The fixture flag is supplied only by the blocking Click-Shield workflow. `force-dynamic`
// ensures the server evaluates that runtime guard on `next start`, rather than caching a build-
// time result from an ordinary local build.
export const dynamic = 'force-dynamic'

export default function ClickShieldModalFixturePage() {
  if (process.env.CLICK_SHIELD_CI_FIXTURE !== '1') notFound()

  return <ClickShieldModalFixture />
}
