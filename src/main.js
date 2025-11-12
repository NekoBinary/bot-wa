import config from './config/index.js';
import BotApp from './core/BotApp.js';

const app = new BotApp(config);

async function bootstrap() {
  try {
    await app.start();
  } catch (error) {
    console.error('❌ Failed to start LazBot:', error);
    process.exit(1);
  }
}

bootstrap();

const gracefulShutdown = async () => {
  try {
    console.log('\n⏹️  Shutting down...');
    await app.stop();
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
