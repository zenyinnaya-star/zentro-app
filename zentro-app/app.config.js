// Extends app.json with settings that need a real JS value (env vars) rather
// than a static JSON literal — see app.json for the rest of the config.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow Zentro to use your location to show nearby events and walking directions.',
      },
    ],
  ],
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
});
