import { WhatsAppBot } from './utils/bot';
import { BotConfig } from '../types';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config: BotConfig = {
  prefix: process.env.BOT_PREFIX || '.',
  ownerNumber: process.env.OWNER_NUMBER || '62xxxxxxxxxxxx', // Ganti dengan nomor owner
  botName: process.env.BOT_NAME || 'LazBot',
  sessionPath: process.env.SESSION_PATH || path.join(__dirname, '../.sessions')
};

async function main() {
  console.log(`
  ██╗      █████╗ ███████╗██████╗  ██████╗ ████████╗
  ██║     ██╔══██╗╚══███╔╝██╔══██╗██╔═══██╗╚══██╔══╝
  ██║     ███████║  ███╔╝ ██████╔╝██║   ██║   ██║   
  ██║     ██╔══██║ ███╔╝  ██╔══██╗██║   ██║   ██║   
  ███████╗██║  ██║███████╗██████╔╝╚██████╔╝   ██║   
  ╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝    ╚═╝   
                                                    
  🤖 WhatsApp Bot with Sticker Features
  📦 Version: 1.0.0
  🔧 Prefix: ${config.prefix}
  `);

  const bot = new WhatsAppBot(config);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await bot.stop();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  try {
    await bot.start();
  } catch (error) {
    console.error('❌ Failed to start LazBot:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
