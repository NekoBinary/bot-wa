import qrcode from 'qrcode-terminal';
import CommandRegistry from './CommandRegistry.js';
import CommandLoader from './CommandLoader.js';
import BrowserManager from './BrowserManager.js';
import { Client, LocalAuth } from '../utils/whatsapp.js';

const PUPPETEER_ARGS = [
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
];

export default class BotApp {
  constructor(config) {
    this.config = config;
    this.registry = new CommandRegistry();
    this.loader = new CommandLoader(config.commandsDir);
    this.browserManager = new BrowserManager(config.sessionPath);
    this.client = null;
    this.commandsReady = null;
  }

  createClient(executablePath) {
    const puppeteerOptions = {
      headless: true,
      args: PUPPETEER_ARGS
    };

    if (executablePath) {
      puppeteerOptions.executablePath = executablePath;
    } else {
      console.warn('⚠️ Chrome/Chromium executable not found. Set PUPPETEER_EXECUTABLE_PATH untuk hasil terbaik.');
    }

    return new Client({
      authStrategy: new LocalAuth({ dataPath: this.config.sessionPath }),
      puppeteer: puppeteerOptions
    });
  }

  async ensureCommands() {
    if (!this.commandsReady) {
      this.commandsReady = this.loader.loadInto(this.registry);
    }

    try {
      await this.commandsReady;
    } catch (error) {
      console.error('❌ Command registry gagal dimuat, mencoba ulang:', error);
      this.commandsReady = this.loader.loadInto(this.registry);
      await this.commandsReady;
    }
  }

  attachEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('🔗 Scan QR Code to login:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', async () => {
      console.log('🚀 LazBot is ready!');
      this.commandsReady = this.loader.loadInto(this.registry);
      await this.commandsReady;
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
      if (message.from === 'status@broadcast' || message.fromMe) return;

      if (!message.body.startsWith(this.config.prefix)) {
        return;
      }

      const args = message.body.slice(this.config.prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) {
        return;
      }

      await this.ensureCommands();

      let command = this.registry.get(commandName);
      if (!command) {
        console.warn(`⚠️ Command ${commandName} tidak ditemukan. Memuat ulang registry...`);
        await this.loader.loadInto(this.registry);
        command = this.registry.get(commandName);
      }

      if (!command) {
        console.warn(`⚠️ Command ${commandName} tetap tidak ditemukan.`);
        await message.reply('*Command tidak dikenali. Ketik .help untuk daftar command.*');
        return;
      }

      try {
        await command.execute({
          client: this.client,
          message,
          args,
          command: commandName,
          registry: this.registry,
          config: this.config
        });
      } catch (error) {
        console.error(`❌ Error executing command ${commandName}:`, error);
        await message.reply('*Terjadi kesalahan saat menjalankan command.*');
      }
    });
  }

  async start() {
    this.browserManager.cleanupLocks();
    const executablePath = this.browserManager.resolveExecutable();
    this.client = this.createClient(executablePath);
    this.attachEventHandlers();
    await this.ensureCommands();
    console.log('🤖 Starting LazBot...');
    await this.client.initialize();
  }

  async stop() {
    if (this.client) {
      await this.client.destroy();
    }
  }
}
