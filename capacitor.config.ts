import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.anatomia.app',
  appName: 'Anatomia',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}

export default config