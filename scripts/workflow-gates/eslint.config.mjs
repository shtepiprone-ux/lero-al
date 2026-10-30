export default [{
  files: ['**/*.mjs'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: {
    console: 'readonly', process: 'readonly', URL: 'readonly', Buffer: 'readonly', structuredClone: 'readonly',
  } },
  rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    'no-undef': 'error', eqeqeq: 'error', 'no-unreachable': 'error', 'no-constant-condition': 'error' },
}, {
  // These identifiers occur inside functions serialized by Playwright into Chromium.
  files: ['scripts/check-card-track-monotonicity.mjs', 'scripts/check-homepage-grid.mjs'],
  languageOptions: { globals: { document: 'readonly', window: 'readonly', getComputedStyle: 'readonly', requestAnimationFrame: 'readonly' } },
}];
