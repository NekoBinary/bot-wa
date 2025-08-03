import { CommandHandler, CommandContext } from '../types/index';
import { MediaDownloader } from '../app/utils/downloader';

const statusCommand: CommandHandler = {
  name: 'status',
  description: 'Cek status sistem dan downloader',
  usage: '.status',
  
  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    try {
      // Test YouTube functionality
      let youtubeStatus = '❓ Testing...';
      try {
        const testResult = await MediaDownloader.getMediaInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        youtubeStatus = testResult ? '✅ Working' : '⚠️ Limited';
      } catch (error) {
        youtubeStatus = '❌ Error';
      }

      // Get system info
      const uptime = process.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);
      
      const memUsage = process.memoryUsage();
      const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

      const statusText = `
🤖 *LAZBOT STATUS*

🔧 *Sistem:*
• Uptime: ${uptimeHours}h ${uptimeMinutes}m
• Memory: ${memUsedMB}MB / ${memTotalMB}MB
• Node.js: ${process.version}

📥 *Download Services:*
• YouTube: ${youtubeStatus}
• Instagram: ✅ Available
• TikTok: ✅ Available  
• Facebook: ✅ Available

📋 *Commands Available:*
• .dl - Universal downloader
• .ytv - YouTube video
• .yta - YouTube audio
• .ytalt - YouTube alternative
• .s - Sticker maker
• .smeme - Meme sticker

💡 *Tips:*
• Jika YouTube error, coba .ytalt
• Gunakan kualitas rendah untuk file besar
• Maksimal 50MB per download

📞 Support: LazBot v1.0.0
      `.trim();

      await message.reply(statusText);

    } catch (error) {
      console.error('Error in status command:', error);
      await message.reply('❌ Gagal mengecek status sistem.');
    }
  }
};

export default statusCommand;
