module.exports = {
  apps: [
    {
      name: 'pm2-ecosystem-example',
      script: './build/index.js',
      max_memory_restart: '800M',
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true,
      error_file: '/dev/null',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
  ],
}
