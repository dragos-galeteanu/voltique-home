import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function InstallerAlertsScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('placeholder.installerAlertsTitle')}
      description={t('placeholder.installerAlertsDescription')}
      milestone="M9"
      testID="installer-alerts"
    />
  );
}
