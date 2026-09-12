import { voltiqueApi } from '@/api/generated/endpoints';

/**
 * Acknowledging or resolving is optimistic: the row changes at once and reverts if the
 * server refuses. Both the inbox and the open alert's own screen are patched, so the two
 * cannot disagree while the request is in flight.
 */
export const alertApi = voltiqueApi.enhanceEndpoints({
  endpoints: {
    updateAlertStatus: {
      onQueryStarted: async (
        { alertId, alertStatusUpdate },
        { dispatch, queryFulfilled, getState },
      ) => {
        const patches = [
          dispatch(
            voltiqueApi.util.updateQueryData('getAlert', { alertId }, (draft) => {
              draft.status = alertStatusUpdate.status;
            }),
          ),
          ...voltiqueApi.util
            .selectInvalidatedBy(getState(), [{ type: 'Alert' }])
            .filter((entry) => entry.endpointName === 'listHouseholdAlerts')
            .map((entry) =>
              dispatch(
                voltiqueApi.util.updateQueryData(
                  'listHouseholdAlerts',
                  entry.originalArgs as Parameters<
                    typeof voltiqueApi.endpoints.listHouseholdAlerts.initiate
                  >[0],
                  (draft) => {
                    const alert = draft.data.find((candidate) => candidate.id === alertId);
                    if (alert) alert.status = alertStatusUpdate.status;
                  },
                ),
              ),
            ),
        ];

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    },
  },
});

export const { useUpdateAlertStatusMutation } = alertApi;
