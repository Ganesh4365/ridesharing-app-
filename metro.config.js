const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (async () => {
  const {
    resolver: {
      sourceExts: getDefaultConfig().resolver,
      alias: {
        'react-native-vector-icons': '@expo/vector-icons',
      'react-native-paper': 'react-native-paper',
      'socket.io-client': 'socket.io-client',
      '@react-navigation/native': '@react-navigation/native',
        '@react-navigation/stack': '@react-navigation/stack',
      },
      transform: {
        getTransformOptions: async () => ({
          transform: {
            babel: {
              plugins: [
                ['react-native-classname-to-dynamic-classname'],
                ['react-native-rename-objects'],
                ['react-native-inline-style-elements'],
              ]
            },
          },
        },
      },
      server: {
        port: 7000,
      },
    },
  };
    
  config.resolver.assetExts.push(
    require('metro-resolver/module').createModuleResolver({
      extensions: ['.ios.js', '.android.js']
    })
  );
  
  return config;
});
