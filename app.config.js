module.exports = ({ config }) => {
  const isStaging = process.env.APP_VARIANT === 'staging';

  return {
    ...config,
    name: isStaging ? 'SRV Electricals Staging' : config.name,
    icon: './assets/srv-app-icon-final-v2.png',
    plugins: [
      ...(config.plugins ?? []),
      'expo-image',
      'expo-sharing',
      [
        'expo-awesome-app-icon',
        {
          icons: {
            diwali: {
              ios: { light: './assets/app-icons/diwali.png' },
              android: { image: './assets/app-icons/diwali.png' },
            },
            'republic-day': {
              ios: { light: './assets/app-icons/republic-day.png' },
              android: { image: './assets/app-icons/republic-day.png' },
            },
          },
        },
      ],
    ],
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
      package: isStaging ? 'com.srvelectricals.app.staging' : config.android.package,
      icon: './assets/srv-app-icon-final-v2.png',
      adaptiveIcon: {
        foregroundImage: './assets/srv-app-icon-final-v2.png',
        backgroundColor: '#FFFFFF',
      },
    },
  };
};
