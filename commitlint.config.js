/** Conventional Commits, so release notes and version bumps can be derived later. */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'app',
        'api',
        'auth',
        'household',
        'assets',
        'telemetry',
        'logs',
        'design-system',
        'ci',
        'deps',
        'config',
        'e2e',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
  },
};
