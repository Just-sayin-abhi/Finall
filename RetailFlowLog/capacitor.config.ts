import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nivarana.app',
  appName: 'NIVARANA',
  webDir: 'dist/public',
  server: {
    // Use https scheme on Android so cookies (session) work properly
    androidScheme: 'https',
    // During LOCAL development only: point to your machine's dev server.
    // Comment this out before doing a production build + cap sync.
    // url: 'http://10.0.2.2:5000',   // Android emulator → host machine
    // url: 'http://192.168.x.x:5000', // Real device → your LAN IP
    cleartext: true, // allow http during dev (remove for prod)
  },
  android: {
    allowMixedContent: true, // allow http API calls during dev
  },
};

export default config;
