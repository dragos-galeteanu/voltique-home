import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { api } from '@/api/api';
import { Button, Screen, StatusPill, Surface, Text, useTheme } from '@/design-system';
import { signedIn, signedOut } from '@/features/auth/auth-slice';
import { mockScenarioSelected, selectMockScenario } from '@/features/dev/dev-slice';
import { startScenario } from '@/mocks/fixture-base-query';
import { scenarioById, type ScenarioId, SCENARIOS } from '@/mocks/scenarios';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/**
 * Runs the app against the contract's examples instead of a server.
 *
 * Picking a scenario rebuilds the mock world and empties the query cache, so every screen
 * refetches into the new state. The session is replaced too, since the role decides which
 * shell opens.
 */
export default function ScenariosScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const active = useAppSelector(selectMockScenario);

  function activate(id: ScenarioId) {
    const world = scenarioById(id).build();
    startScenario(id);

    dispatch(mockScenarioSelected(id));
    dispatch(api.util.resetApiState());
    dispatch(
      signedIn({
        user: {
          id: world.user.id,
          email: world.user.email,
          displayName: world.user.displayName,
          role: world.user.role,
        },
        tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
      }),
    );

    router.replace('/');
  }

  function stop() {
    dispatch(mockScenarioSelected(null));
    dispatch(api.util.resetApiState());
    dispatch(signedOut());
    router.replace('/');
  }

  return (
    <Screen testID="dev-scenarios">
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4 }}>
          <Text variant="display">Mock scenarios</Text>
          <Text tone="secondary">
            Answers every request from the examples in the contract. No server needed.
          </Text>
        </View>

        {SCENARIOS.map((scenario) => (
          <Pressable
            key={scenario.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active === scenario.id }}
            onPress={() => activate(scenario.id)}
            testID={`scenario-${scenario.id}`}
          >
            <Surface gap="sm">
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
              >
                <Text variant="heading" style={{ flexShrink: 1 }}>
                  {scenario.label}
                </Text>
                {active === scenario.id ? <StatusPill label="Running" tone="success" /> : null}
              </View>
              <Text variant="caption" tone="muted">
                {scenario.description}
              </Text>
            </Surface>
          </Pressable>
        ))}

        <Button
          label="Use the real API"
          variant={active ? 'danger' : 'secondary'}
          onPress={stop}
          testID="scenario-stop"
        />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
