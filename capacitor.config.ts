import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shanvihospitality.crm',
  appName: 'Shanvi CRM',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // By default, pointing to your production deployment or local development IP.
    // To connect to your live deployment, provide URL or leave default.
    url: process.env.CAPACITOR_SERVER_URL || undefined,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
    },
  },
};

export default config;
