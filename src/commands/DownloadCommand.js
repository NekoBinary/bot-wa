import Command from '../core/Command.js';
import DownloadService from '../services/DownloadService.js';
import config from '../config/index.js';
import { MessageMedia } from '../utils/whatsapp.js';

const downloadService = new DownloadService({
  tempDir: config.tempDir,
  maxSizeMb: config.maxDownloadSize
});

export default class DownloadCommand extends Command {
  constructor() {
    super({
      name: 'dl',
      description: 'Download video/audio dari YouTube, Instagram, TikTok, dll',
      usage: '.dl <url> [video|audio] [best|medium|low]',
      category: 'Download'
    });
  }

  async run({ message, args, client }) {
    try {
      if (args.length === 0) {
        await message.reply(
          `*Format salah!*\n\n` +
          `*Penggunaan:*\n${this.usage}\n\n` +
          `*Contoh:*\n` +
          `.dl https://youtube.com/watch?v=xxx\n` +
          `.dl https://instagram.com/p/xxx audio\n` +
          `.dl https://tiktok.com/@user/video/xxx video best\n\n` +
          `*Multi platform:* YouTube, TikTok, Instagram, Facebook, Twitter, dan lainnya.`
        );
        return;
      }

      const url = args[0];
      const format = args[1]?.toLowerCase() === 'audio' ? 'audio' : 'video';
      const quality = ['best', 'medium', 'low'].includes(args[2]?.toLowerCase())
        ? args[2].toLowerCase()
        : 'medium';

      if (!DownloadService.isValidUrl(url)) {
        await message.reply('*URL tidak valid!* Pastikan URL lengkap dengan https://');
        return;
      }

      await message.reply(
        `*Sedang mendownload ${format === 'audio' ? 'audio' : 'video'} (${quality})...*\n` +
        `*Dari:* ${url.split('?')[0].substring(0, 70)}...`
      );

      const result = await downloadService.download(url, { format, quality });

      if (!result.success || !result.buffer) {
        await message.reply(`*${result.error || 'Gagal mendownload media.'}*`);
        return;
      }

      const isAudio = format === 'audio';
      const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
      const extension = isAudio ? 'mp3' : 'mp4';

      const media = new MessageMedia(
        mimeType,
        result.buffer.toString('base64'),
        result.filename || `download.${extension}`
      );

      let caption = `*Download selesai!*\n\n`;
      if (result.title) caption += `*Judul:* ${result.title}\n`;
      if (result.duration) caption += `*Durasi:* ${result.duration}\n`;
      if (result.size) caption += `*Ukuran:* ${result.size.toFixed(2)} MB\n`;
      caption += `\n*Downloaded by LazBot*`;

      await client.sendMessage(message.from, media, { caption });
    } catch (error) {
      console.error('Error in download command:', error);
      await message.reply(
        '*Terjadi kesalahan saat mendownload.*\n\n' +
        '*Tips:*\n' +
        '• Pastikan link valid dan dapat diakses\n' +
        '• Coba dengan kualitas lebih rendah jika file terlalu besar\n' +
        '• Pastikan video/audio tidak bersifat private'
      );
    }
  }
}
