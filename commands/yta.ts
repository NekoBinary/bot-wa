import { CommandHandler, CommandContext } from '../types/index';
import { MediaDownloader } from '../app/utils/downloader';
import { MessageMedia } from 'whatsapp-web.js';

const ytaCommand: CommandHandler = {
  name: 'yta',
  description: 'Download audio dari YouTube',
  usage: '.yta <url>',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;

    try {
      if (args.length === 0) {
        const helpText = `
🎵 *YOUTUBE AUDIO DOWNLOADER*

🔧 *Penggunaan:*
.yta <youtube_url>

📋 *Fitur:*
• Download audio saja (MP3)
• Kualitas audio terbaik
• File size lebih kecil

📏 *Batasan:*
• Maksimal 50MB
• Durasi maksimal 30 menit
• Hanya video YouTube

✨ *Contoh:*
• .yta https://youtu.be/xxx
• .yta https://youtube.com/watch?v=xxx
        `.trim();
        
        await message.reply(helpText);
        return;
      }

      const url = args[0];

      // Validate YouTube URL
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        await message.reply('❌ Gunakan URL YouTube yang valid!\n\nContoh: https://youtu.be/xxx atau https://youtube.com/watch?v=xxx');
        return;
      }

      await message.reply('🎵 Sedang mengunduh audio dari YouTube...');

      const result = await MediaDownloader.downloadFromUrl(url, {
        format: 'mp3',
        quality: 'high',
        maxSize: 50
      });

      if (!result.success) {
        await message.reply(`❌ ${result.error}`);
        return;
      }

      if (!result.buffer || !result.filename) {
        await message.reply('❌ Gagal mendownload audio.');
        return;
      }

      const media = new MessageMedia(
        'audio/mpeg',
        result.buffer.toString('base64'),
        result.filename
      );

      // Clean text to avoid WhatsApp formatting issues
      const cleanTitle = result.title ? result.title.replace(/[*_~`]/g, '') : '';
      const cleanDuration = result.duration ? result.duration.replace(/[*_~`]/g, '') : '';

      const successText = `
🎵 Audio YouTube Downloaded!

📁 ${result.filename}
📊 ${result.size?.toFixed(1)}MB
${cleanTitle ? `🎬 ${cleanTitle}` : ''}
${cleanDuration ? `⏱️ ${cleanDuration}` : ''}

🎧 Format: MP3 (Audio Only)
      `.trim();

      await client.sendMessage(message.from, successText);
      await client.sendMessage(message.from, media, {
        sendMediaAsDocument: true
      });

    } catch (error) {
      console.error('Error in yta command:', error);
      await message.reply('❌ Gagal mendownload audio YouTube.');
    }
  }
};

export default ytaCommand;
