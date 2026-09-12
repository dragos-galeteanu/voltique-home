import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function AlertsScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('placeholder.alertsTitle')}
      description={t('placeholder.alertsDescription')}
      milestone="M8"
      testID="consumer-alerts"
    />
  );
}
