const { AndroidConfig, withStringsXml } = require('expo/config-plugins');

/**
 * Sets the Android launcher label per build variant.
 *
 * The Expo config `name` stays constant so that the generated native projects and the
 * Xcode scheme keep one stable name across variants, which keeps the Fastlane lanes
 * simple. The user-visible label is set here instead.
 */
module.exports = function withAndroidAppName(config, { name }) {
  return withStringsXml(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name', translatable: 'false' }, _: name }],
      modConfig.modResults,
    );
    return modConfig;
  });
};
