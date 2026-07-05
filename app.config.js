module.exports = ({ config }) => {
  const isStaging = process.env.APP_VARIANT === 'staging';

  return {
    ...config,
    name: isStaging ? 'SRV Electricals Staging' : config.name,
    icon: './assets/app-icon.png',
    ios: {
      ...config.ios,
      bundleIdentifier: isStaging
        ? 'com.srvelectricals.app.staging'
        : config.ios.bundleIdentifier,
      buildNumber: '12',
      supportsTablet: false,
      infoPlist: {
        ...config.ios.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
  };
};
