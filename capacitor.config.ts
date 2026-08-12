import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.laesquina51.app',
  appName: 'La Esquina 51',
  webDir: 'public',
  server: {
    url: 'https://laesquina51.es',
    cleartext: false
  },
  android: {
    buildOptions: {
      keystorePath: 'laesquina51-release.jks',
      keystoreAlias: 'key0'
    }
  }
};

export default config;
