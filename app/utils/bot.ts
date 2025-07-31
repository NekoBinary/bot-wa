import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { CommandHandler, BotConfig } from '../../types';
import fs from 'fs-extra';
import path from 'path';

export class CommandManager {
  private commands = new Map<string, CommandHandler>();
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  async loadCommands(): Promise<void> {
    // Check if we're running from dist directory (production) or source (development)
    const isProduction = __filename.includes('dist');
    const commandsDir = isProduction 
      ? path.join(process.cwd(), 'dist', 'commands')
      : path.join(process.cwd(), 'commands');
    
    try {
      const files = await fs.readdir(commandsDir);
      const commandFiles = isProduction 
        ? files.filter(file => file.endsWith('.js'))
        : files.filter(file => file.endsWith('.ts') || file.endsWith('.js'));

      for (const file of commandFiles) {
        try {
          const commandPath = path.join(commandsDir, file);
          const commandModule = await import(commandPath);
          const command: CommandHandler = commandModule.default || commandModule;

          if (command && command.name && typeof command.execute === 'function') {
            this.commands.set(command.name, command);
            console.log(`✅ Loaded command: ${command.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to load command ${file}:`, error);
        }
      }

      console.log(`📦 Loaded ${this.commands.size} commands`);
    } catch (error) {
      console.error('❌ Failed to load commands directory:', error);
    }
  }

  getCommand(name: string): CommandHandler | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): CommandHandler[] {
    return Array.from(this.commands.values());
  }

  hasCommand(name: string): boolean {
    return this.commands.has(name);
  }
}

export class WhatsAppBot {
  private client: Client;
  private commandManager: CommandManager;
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: config.sessionPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-default-apps',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        executablePath: process.env.CHROME_PATH || undefined
      }
    });

    this.commandManager = new CommandManager(config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('qr', (qr) => {
      console.log('🔗 Scan QR Code to login:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', async () => {
      console.log('🚀 LazBot is ready!');
      await this.commandManager.loadCommands();
    });

    this.client.on('authenticated', () => {
      console.log('✅ Authenticated successfully');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log('📴 Client was logged out:', reason);
    });

    this.client.on('message_create', async (message) => {
      // Ignore status messages and own messages
      if (message.from === 'status@broadcast' || message.fromMe) return;

      // Check if message starts with prefix
      if (!message.body.startsWith(this.config.prefix)) return;

      const args = message.body.slice(this.config.prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = this.commandManager.getCommand(commandName);
      if (!command) return;

      try {
        await command.execute({
          client: this.client,
          message,
          args,
          command: commandName
        });
      } catch (error) {
        console.error(`❌ Error executing command ${commandName}:`, error);
        await message.reply('❌ Terjadi kesalahan saat menjalankan command.');
      }
    });
  }

  async start(): Promise<void> {
    try {
      console.log('🤖 Starting LazBot...');
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.client.destroy();
      console.log('👋 LazBot stopped');
    } catch (error) {
      console.error('❌ Error stopping bot:', error);
    }
  }

  getClient(): Client {
    return this.client;
  }

  getCommandManager(): CommandManager {
    return this.commandManager;
  }
}
