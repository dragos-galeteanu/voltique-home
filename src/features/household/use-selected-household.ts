import { useEffect, useMemo } from 'react';

import { useListHouseholdsQuery } from '@/api/generated/endpoints';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { householdSelected, selectSelectedHouseholdId } from './household-slice';

/**
 * The household every consumer screen works against. Selecting the first one when
 * nothing is selected keeps a fresh install from showing an empty picker.
 */
export function useSelectedHousehold() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(selectSelectedHouseholdId);
  const query = useListHouseholdsQuery({});

  // Memoised so the empty fallback does not get a new identity on every render and
  // retrigger the selection effect below.
  const households = useMemo(() => query.data?.data ?? [], [query.data]);
  const selected = households.find((household) => household.id === selectedId) ?? null;

  useEffect(() => {
    if (selected || households.length === 0) return;
    const first = households[0];
    if (first) dispatch(householdSelected(first.id));
  }, [dispatch, households, selected]);

  return {
    households,
    household: selected,
    selectedHouseholdId: selected?.id ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
