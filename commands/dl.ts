import { CommandHandler, CommandContext } from '../types/index';
import { MediaDownloader } from '../app/utils/downloader';
import { MessageMedia } from 'whatsapp-web.js';

const downloadCommand: CommandHandler = {
  name: 'dl',
  description: 'Download video/audio dari YouTube, Instagram, TikTok, atau Facebook',
  usage: '.dl <url> [format] [quality]',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;

    try {
      if (args.length === 0) {
        const helpText = `
📥 *DOWNLOAD MEDIA*

🔧 *Penggunaan:*
.dl <url> [format] [quality]

📋 *Platform yang didukung:*
• YouTube (youtube.com, youtu.be)
• Instagram (instagram.com)
• TikTok (tiktok.com)
• Facebook (facebook.com, fb.watch)

🎵 *Format:*
• mp4 (video) - default
• mp3 (audio saja)

🎯 *Kualitas:*
• high (tinggi)
• medium (sedang) - default
• low (rendah)

📏 *Batasan:*
• Maksimal 50MB per file
• Video maksimal 10 menit
• Audio maksimal 30 menit

✨ *Contoh:*
• .dl https://youtu.be/xxx
• .dl https://youtu.be/xxx mp3
• .dl https://youtu.be/xxx mp4 high
• .dl https://instagram.com/p/xxx
        `.trim();
        
        await message.reply(helpText);
        return;
      }

      const url = args[0];
      const format = (args[1] || 'mp4').toLowerCase() as 'mp4' | 'mp3';
      const quality = (args[2] || 'medium').toLowerCase() as 'high' | 'medium' | 'low';

      // Validate URL
      if (!MediaDownloader.isValidUrl(url)) {
        await message.reply('❌ URL tidak valid atau platform tidak didukung!\n\nPlatform yang didukung: YouTube, Instagram, TikTok, Facebook');
        return;
      }

      // Validate format
      if (!['mp4', 'mp3'].includes(format)) {
        await message.reply('❌ Format tidak valid! Gunakan: mp4 atau mp3');
        return;
      }

      // Validate quality
      if (!['high', 'medium', 'low'].includes(quality)) {
        await message.reply('❌ Kualitas tidak valid! Gunakan: high, medium, atau low');
        return;
      }

      // Send processing message
      const processingMsg = await message.reply('⏳ Sedang menganalisis media...');

      try {
        // Get media info first (for YouTube)
        const mediaInfo = await MediaDownloader.getMediaInfo(url);
        if (mediaInfo) {
          const infoText = `
📺 *${mediaInfo.title}*
⏱️ Durasi: ${mediaInfo.duration}
🎬 Platform: ${mediaInfo.platform.toUpperCase()}
📥 Format: ${format.toUpperCase()}
🎯 Kualitas: ${quality}

⏳ Sedang mendownload...
          `.trim();
          
          await client.sendMessage(message.from, infoText);
        }

        // Download the media
        const result = await MediaDownloader.downloadFromUrl(url, {
          format,
          quality,
          maxSize: 50
        });

        if (!result.success) {
          await client.sendMessage(message.from, `❌ ${result.error}`);
          return;
        }

        if (!result.buffer || !result.filename) {
          await client.sendMessage(message.from, '❌ Gagal mendownload media.');
          return;
        }

        // Prepare the media
        const mimeType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
        const media = new MessageMedia(
          mimeType,
          result.buffer.toString('base64'),
          result.filename
        );

        // Clean text to avoid WhatsApp formatting issues
        const cleanTitle = result.title ? result.title.replace(/[*_~`]/g, '') : '';
        const cleanDuration = result.duration ? result.duration.replace(/[*_~`]/g, '') : '';

        // Send success message with file info
        const successText = `
✅ Download Berhasil!

📁 File: ${result.filename}
📊 Ukuran: ${result.size?.toFixed(1)}MB
${cleanTitle ? `🎬 Judul: ${cleanTitle}` : ''}
${cleanDuration ? `⏱️ Durasi: ${cleanDuration}` : ''}

📤 Mengirim file...
        `.trim();

        await client.sendMessage(message.from, successText);

        // Send the media file
        await client.sendMessage(message.from, media, {
          sendMediaAsDocument: format === 'mp3' // Send audio as document
        });

        // Success message
        await client.sendMessage(message.from, '🎉 File berhasil dikirim!');

      } catch (downloadError) {
        console.error('Download error:', downloadError);
        await client.sendMessage(message.from, '❌ Terjadi kesalahan saat mendownload. Coba lagi nanti.');
      }

    } catch (error) {
      console.error('Error in download command:', error);
      await message.reply('❌ Terjadi kesalahan saat memproses command.');
    }
  }
};

export default downloadCommand;
