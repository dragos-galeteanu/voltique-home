import { voltiqueApi } from '@/api/generated/endpoints';

/**
 * Behaviour that the generator cannot infer, layered on top of the generated endpoints
 * rather than edited into them, so `npm run codegen` stays safe to re-run.
 */
export const assetApi = voltiqueApi.enhanceEndpoints({
  endpoints: {
    deleteAsset: {
      /**
       * Removing an asset is optimistic: the row disappears at once and comes back if
       * the server refuses, which is the only honest way to handle a list that is also
       * being polled.
       */
      onQueryStarted: async ({ assetId }, { dispatch, queryFulfilled, getState }) => {
        const patches = voltiqueApi.util
          .selectInvalidatedBy(getState(), [{ type: 'Asset' }])
          .filter((entry) => entry.endpointName === 'listHouseholdAssets')
          .map((entry) =>
            dispatch(
              voltiqueApi.util.updateQueryData(
                'listHouseholdAssets',
                entry.originalArgs as Parameters<
                  typeof voltiqueApi.endpoints.listHouseholdAssets.initiate
                >[0],
                (draft) => {
                  draft.data = draft.data.filter((asset) => asset.id !== assetId);
                },
              ),
            ),
          );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    },
  },
});

export const { useDeleteAssetMutation } = assetApi;
