module.exports = ({ config }) => {
  const isStaging = process.env.APP_VARIANT === 'staging';

  return {
    ...config,
    name: isStaging ? 'SRV Electricals Staging' : config.name,
    icon: './assets/srv-mark-final.png',
    ios: {
      ...config.ios,
      bundleIdentifier: isStaging
        ? 'com.srvelectricals.app.staging'
        : config.ios.bundleIdentifier,
      supportsTablet: false,
      infoPlist: {
        ...config.ios.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      icon: './assets/srv-mark-final.png',
      adaptiveIcon: {
        foregroundImage: './assets/srv-mark-final.png',
        backgroundColor: '#FFFFFF',
      },
    },
  };
};
