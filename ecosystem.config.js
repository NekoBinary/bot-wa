module.exports = {
  apps: [
    {
      name: 'lazbot',
      script: 'dist/app/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
      shutdown_with_message: true,
      // Auto restart if memory usage exceeds 1GB
      max_memory_restart: '1G',
      // Graceful shutdown
      kill_timeout: 5000,
      // Restart configuration
      autorestart: true,
      // Environment variables
      env_file: '.env'
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/lazbot.git',
      path: '/var/www/lazbot',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
