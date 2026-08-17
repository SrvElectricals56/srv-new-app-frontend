module.exports = ({ config }) => {
  const isStaging = process.env.APP_VARIANT === 'staging';

  return {
    ...config,
    name: isStaging ? 'SRV Electricals Staging' : config.name,
    icon: './assets/srv-app-icon-final-v2.png',
    ios: {
      ...config.ios,
      icon: './assets/srv-app-icon-final-v2.png',
      bundleIdentifier: isStaging
        ? 'com.srvelectricals.app.staging'
        : config.ios.bundleIdentifier,
      supportsTablet: true,
      infoPlist: {
        ...config.ios.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      icon: './assets/srv-app-icon-final-v2.png',
      adaptiveIcon: {
        foregroundImage: './assets/srv-app-icon-final-v2.png',
        backgroundColor: '#FFFFFF',
      },
    },
  };
};
