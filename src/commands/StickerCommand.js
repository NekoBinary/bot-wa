import Command from '../core/Command.js';
import StickerService from '../services/StickerService.js';
import config from '../config/index.js';
import { MessageMedia } from '../utils/whatsapp.js';

const stickerService = new StickerService(config.tempDir);

export default class StickerCommand extends Command {
  constructor() {
    super({
      name: 's',
      description: 'Membuat sticker dari gambar, video, atau GIF',
      usage: '.s [reply media]',
      category: 'Sticker'
    });
  }

  async run({ message, client }) {
    try {
      const media = await this.resolveMedia(message);
      if (!media) {
        await message.reply('*Kirim atau reply gambar/video/GIF untuk membuat sticker!*');
        return;
      }

      if (!stickerService.isSupportedMedia(media.mimetype)) {
        await message.reply('*Format file tidak didukung!* Gunakan gambar, video, atau GIF.');
        return;
      }

      await message.reply('*Sedang membuat sticker...*');

      const buffer = Buffer.from(media.data, 'base64');
      let stickerBuffer;

      if (stickerService.isGif(media.mimetype) || stickerService.isVideo(media.mimetype)) {
        stickerBuffer = await stickerService.createAnimatedSticker(buffer, { quality: 50 });
      } else {
        stickerBuffer = await stickerService.createStaticSticker(buffer, { quality: 50 });
      }

      const stickerMedia = new MessageMedia('image/webp', stickerBuffer.toString('base64'), 'sticker.webp');
      await client.sendMessage(message.from, stickerMedia, { sendMediaAsSticker: true });
    } catch (error) {
      console.error('Error in sticker command:', error);
      await message.reply('*Gagal membuat sticker. Pastikan file yang dikirim valid.*');
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
