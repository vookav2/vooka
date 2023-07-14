export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production'
      LOG_LEVEL: 'trace' | 'info'
      TOKEN: string
      APP_ID: string
      CLIENT_ID: string
      GUILD_TEST_ID: string
      CHANNEL_TEST_ID: string
      // REDIS_URI: string
    }
  }
}
