import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@/config/env';

/**
 * Placeholder entry screen. It exists to prove the build, routing and the
 * validated configuration are wired; M1 replaces it with the role-aware shell.
 */
export default function IndexScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Voltique Home</Text>
      <Text style={styles.subtitle}>Foundation ready</Text>

      <View style={styles.card}>
        <Row label="Variant" value={env.appVariant} />
        <Row label="API base" value={env.apiBaseUrl} />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#0B1220',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 4,
  },
  card: {
    marginTop: 28,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  rowLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  rowValue: {
    color: '#E2E8F0',
    fontSize: 14,
    flexShrink: 1,
  },
});
