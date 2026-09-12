import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function DashboardScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('placeholder.dashboardTitle')}
      description={t('placeholder.dashboardDescription')}
      milestone="M7"
      testID="consumer-dashboard"
    />
  );
}
