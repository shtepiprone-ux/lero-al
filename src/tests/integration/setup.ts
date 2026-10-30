/**
 * Setup of the real-boundary project (vitest.integration.config.ts). Runs before every integration file: it confirms the approved development project or the
 * whole file fails. It deliberately does not touch the default jsdom run (src/tests/setup.ts), which never needs a network or a credential.
 */
import { applyIntegrationEnv, loadIntegrationEnv } from './environment'

applyIntegrationEnv(loadIntegrationEnv())
