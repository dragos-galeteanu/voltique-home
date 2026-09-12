const MOCK_HEALTH = 'http://localhost:4010/health';

/**
 * Every run starts from a known API. The mock serves the contract's examples, so the
 * assertions in the specs can name exact values without seeding a database.
 */
beforeAll(async () => {
  try {
    const response = await fetch(MOCK_HEALTH);
    if (!response.ok) throw new Error(`status ${response.status}`);
  } catch {
    throw new Error(
      'The mock API is not running. Start it with `npm run mock:start` before the e2e suite.',
    );
  }
});
