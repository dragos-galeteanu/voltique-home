import { createWorld, type World } from './world';

/**
 * A scenario is a named starting point: a world, plus how the backend behaves. Adding one
 * means writing a few lines here, not touching any screen.
 */
export type ScenarioId = 'populated' | 'empty' | 'faulted' | 'installer' | 'slow' | 'failing';

export type Scenario = {
  id: ScenarioId;
  /** Shown in the dev picker. Not translated: this never ships to anyone. */
  label: string;
  description: string;
  build: () => World;
};

function populated(): World {
  return createWorld();
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'populated',
    label: 'Populated household',
    description: 'The contract examples as they are: three assets, three alerts, a full day.',
    build: populated,
  },
  {
    id: 'empty',
    label: 'Brand new account',
    description: 'Signed in with nothing yet, for checking every empty state.',
    build: () => {
      const world = populated();
      world.households = [];
      world.assets = [];
      world.alerts = [];
      world.invites = [];
      world.members = [];
      return world;
    },
  },
  {
    id: 'faulted',
    label: 'Everything is broken',
    description: 'Assets faulted and alerts open, for the states that are hard to catch.',
    build: () => {
      const world = populated();
      world.assets = world.assets.map((asset) => ({
        ...asset,
        status: 'faulted',
        openAlertCount: 1,
      }));
      world.alerts = world.alerts.map((alert) => ({
        ...alert,
        status: 'open',
        severity: 'critical',
      }));
      world.households = world.households.map((household) => ({
        ...household,
        openAlertCount: world.alerts.length,
      }));
      return world;
    },
  },
  {
    id: 'installer',
    label: 'Installer view',
    description: 'Signed in as an installer, with alerts across more than one household.',
    build: () => {
      const world = populated();
      world.user = { ...world.user, role: 'installer', displayName: 'Nadia at Voltfix' };
      return world;
    },
  },
  {
    id: 'slow',
    label: 'Slow network',
    description: 'Two seconds on every request, so loading states are actually visible.',
    build: () => {
      const world = populated();
      world.latencyMs = 2_000;
      return world;
    },
  },
  {
    id: 'failing',
    label: 'API is down',
    description: 'Every request answers 503, for checking error states and retries.',
    build: () => {
      const world = populated();
      world.failWith = 503;
      return world;
    },
  },
];

export function scenarioById(id: ScenarioId): Scenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0]!;
}
