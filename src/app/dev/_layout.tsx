import { Redirect, Stack } from 'expo-router';

/** Development tooling. A release build has no way in, and this refuses to render. */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
