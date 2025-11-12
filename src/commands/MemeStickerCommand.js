import Command from '../core/Command.js';
import StickerService from '../services/StickerService.js';
import config from '../config/index.js';
import { MessageMedia } from '../utils/whatsapp.js';

const stickerService = new StickerService(config.tempDir);

export default class MemeStickerCommand extends Command {
  constructor() {
    super({
      name: 'smeme',
      description: 'Membuat sticker meme dari gambar dengan teks atas/bawah',
      usage: '.smeme <teks atas>|<teks bawah> [reply gambar]',
      category: 'Sticker'
    });
  }

  async run({ message, args, client }) {
    try {
      const text = args.join(' ');
      if (!text) {
        await message.reply(`❌ Format salah!\n\n📝 Penggunaan:\n${this.usage}`);
        return;
      }

      const [rawTop, rawBottom] = text.split('|');
      const topText = rawTop?.trim() || '';
      const bottomText = rawBottom?.trim() || '';

      if (!topText && !bottomText) {
        await message.reply('❌ Minimal masukkan satu teks (atas atau bawah)!');
        return;
      }

      const media = await this.resolveMedia(message);
      if (!media) {
        await message.reply('❌ Kirim atau reply gambar untuk membuat sticker meme!');
        return;
      }

      if (!stickerService.isImage(media.mimetype)) {
        await message.reply('❌ Untuk meme sticker, gunakan gambar saja!');
        return;
      }

      await message.reply('⏳ Sedang membuat sticker meme...');

      const buffer = Buffer.from(media.data, 'base64');
      const stickerBuffer = await stickerService.createMemeSticker(buffer, {
        topText,
        bottomText,
        fontSize: 150,
        fontColor: '#FFFFFF',
        quality: 60
      });

      const stickerMedia = new MessageMedia('image/webp', stickerBuffer.toString('base64'), 'meme.webp');
      await client.sendMessage(message.from, stickerMedia, { sendMediaAsSticker: true });
    } catch (error) {
      console.error('Error in meme sticker command:', error);
      await message.reply('❌ Gagal membuat sticker meme. Pastikan gambar yang dikirim valid.');
    }
  }

  async resolveMedia(message) {
    const quoted = await message.getQuotedMessage().catch(() => undefined);

    if (quoted?.hasMedia) {
      return quoted.downloadMedia();
    }

    if (message.hasMedia) {
      return message.downloadMedia();
    }

    return undefined;
  }
}
