import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function InstallerHouseholdsScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t('placeholder.installerHouseholdsTitle')}
      description={t('placeholder.installerHouseholdsDescription')}
      milestone="M9"
      testID="installer-households"
    />
  );
}
