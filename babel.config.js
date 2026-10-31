module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo ya registra el plugin de react-native-worklets (Reanimated 4).
  return {
    presets: ['babel-preset-expo'],
  };
};
