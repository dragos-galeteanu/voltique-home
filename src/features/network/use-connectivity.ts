import * as Network from 'expo-network';
import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';

import { connectivityChanged } from './network-slice';

function isOnline(state: Network.NetworkState): boolean {
  // Connected to something and able to reach the internet. A captive portal reports the
  // first without the second, which is exactly when requests hang.
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

/** Keeps the store's view of connectivity current. Mounted once, at the root. */
export function useConnectivity() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    void Network.getNetworkStateAsync().then((state) => {
      if (!cancelled) dispatch(connectivityChanged(isOnline(state)));
    });

    const subscription = Network.addNetworkStateListener((state) => {
      dispatch(connectivityChanged(isOnline(state)));
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [dispatch]);
}
