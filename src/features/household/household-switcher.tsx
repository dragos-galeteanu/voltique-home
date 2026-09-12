import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { Household } from '@/api/generated/endpoints';
import { Button, Sheet, Text, useTheme } from '@/design-system';
import { useAppDispatch } from '@/store/hooks';

import { householdSelected } from './household-slice';

/**
 * Header control that names the current household and switches between them. Creating
 * one is offered here too, since an account with no household lands in the same place.
 */
export function HouseholdSwitcher({
  households,
  selected,
}: {
  households: Household[];
  selected: Household | null;
}) {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Switch household"
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
        testID="household-switcher"
      >
        <Text variant="display" numberOfLines={1} style={{ flexShrink: 1 }}>
          {selected?.name ?? 'No household'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Households"
        testID="household-sheet"
      >
        <View style={{ gap: theme.spacing.sm }}>
          {households.map((household) => {
            const isSelected = household.id === selected?.id;
            return (
              <Pressable
                key={household.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  dispatch(householdSelected(household.id));
                  setOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing.md,
                }}
                testID={`household-option-${household.id}`}
              >
                <View style={{ gap: 2, flexShrink: 1 }}>
                  <Text variant="heading">{household.name}</Text>
                  <Text variant="caption" tone="muted">
                    {household.assetCount} assets
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark" size={20} color={theme.colors.accent} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Create household"
          variant="secondary"
          testID="create-household"
          onPress={() => {
            setOpen(false);
            router.push('/consumer/new-household');
          }}
        />
      </Sheet>
    </>
  );
}
