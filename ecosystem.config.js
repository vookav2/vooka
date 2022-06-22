module.exports = {
  apps: [
    {
      name: 'pm2-ecosystem-example',
      script: './index.js',
      args: 'start-client',
      max_memory_restart: '800M',
      autorestart: true,
      error_file: '/dev/null',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
  ],
}
