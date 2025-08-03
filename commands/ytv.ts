import { CommandHandler, CommandContext } from '../types/index';
import { MediaDownloader } from '../app/utils/downloader';
import { MessageMedia } from 'whatsapp-web.js';

const ytvCommand: CommandHandler = {
  name: 'ytv',
  description: 'Download video dari YouTube',
  usage: '.ytv <url> [quality]',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;

    try {
      if (args.length === 0) {
        const helpText = `
📺 *YOUTUBE VIDEO DOWNLOADER*

🔧 *Penggunaan:*
.ytv <youtube_url> [quality]

🎯 *Kualitas:*
• high (1080p/720p)
• medium (480p) - default
• low (360p/240p)

📏 *Batasan:*
• Maksimal 50MB
• Durasi maksimal 10 menit
• Hanya video YouTube

✨ *Contoh:*
• .ytv https://youtu.be/xxx
• .ytv https://youtu.be/xxx high
        `.trim();
        
        await message.reply(helpText);
        return;
      }

      const url = args[0];
      const quality = (args[1] || 'medium').toLowerCase() as 'high' | 'medium' | 'low';

      // Validate YouTube URL
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        await message.reply('❌ Gunakan URL YouTube yang valid!\n\nContoh: https://youtu.be/xxx atau https://youtube.com/watch?v=xxx');
        return;
      }

      if (!['high', 'medium', 'low'].includes(quality)) {
        await message.reply('❌ Kualitas tidak valid! Gunakan: high, medium, atau low');
        return;
      }

      await message.reply('⏳ Sedang menganalisis video YouTube...');

      const result = await MediaDownloader.downloadFromUrl(url, {
        format: 'mp4',
        quality,
        maxSize: 50
      });

      if (!result.success) {
        await message.reply(`❌ ${result.error}`);
        return;
      }

      if (!result.buffer || !result.filename) {
        await message.reply('❌ Gagal mendownload video.');
        return;
      }

      const media = new MessageMedia(
        'video/mp4',
        result.buffer.toString('base64'),
        result.filename
      );

      // Clean text to avoid WhatsApp formatting issues
      const cleanTitle = result.title ? result.title.replace(/[*_~`]/g, '') : '';
      const cleanDuration = result.duration ? result.duration.replace(/[*_~`]/g, '') : '';
      
      const successText = `
✅ Video YouTube Downloaded!

📁 ${result.filename}
📊 ${result.size?.toFixed(1)}MB
${cleanTitle ? `🎬 ${cleanTitle}` : ''}
${cleanDuration ? `⏱️ ${cleanDuration}` : ''}
      `.trim();

      await client.sendMessage(message.from, successText);
      await client.sendMessage(message.from, media);

    } catch (error) {
      console.error('Error in ytv command:', error);
      await message.reply('❌ Gagal mendownload video YouTube.');
    }
  }
};

export default ytvCommand;
