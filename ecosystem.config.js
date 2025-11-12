module.exports = {
  apps: [
    {
      name: 'lazbot',
      script: 'src/main.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium'
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
      autorestart: true,
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
      'post-deploy': 'pnpm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
