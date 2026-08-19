import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hamaacademy.app',
  appName: 'Hama Academy',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config