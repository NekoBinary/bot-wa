import { CommandHandler, CommandContext } from '../types/index';
import axios from 'axios';
import { MessageMedia } from 'whatsapp-web.js';

const ytAltCommand: CommandHandler = {
  name: 'ytalt',
  description: 'Download YouTube dengan metode alternatif',
  usage: '.ytalt <url>',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;

    try {
      if (args.length === 0) {
        const helpText = `
🔄 *YOUTUBE ALTERNATIVE DOWNLOADER*

🔧 *Penggunaan:*
.ytalt <youtube_url>

⚠️ *Kapan digunakan:*
• Ketika .ytv atau .yta gagal
• Jika ada error "Could not extract functions"
• Sebagai backup downloader

📋 *Fitur:*
• Menggunakan layanan download online
• Kualitas otomatis
• Format MP4

⚠️ *Catatan:*
• Kualitas mungkin lebih rendah
• Proses lebih lama
• Tidak semua video supported

✨ *Contoh:*
.ytalt https://youtu.be/xxx
        `.trim();
        
        await message.reply(helpText);
        return;
      }

      const url = args[0];

      // Validate YouTube URL
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        await message.reply('❌ Gunakan URL YouTube yang valid!');
        return;
      }

      await message.reply('🔄 Mencoba metode alternatif untuk download YouTube...\n⏳ Proses ini mungkin membutuhkan waktu lebih lama...');

      try {
        // Extract video ID
        let videoId = '';
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('v=')[1].split('&')[0];
        }

        if (!videoId) {
          await message.reply('❌ Tidak dapat mengekstrak video ID dari URL.');
          return;
        }

        // Use a public API service for YouTube download (example using a free service)
        // Note: This is just an example - you should use a reliable service
        const apiUrl = `https://api.cobalt.tools/api/json`;
        
        const response = await axios.post(apiUrl, {
          url: url,
          vCodec: 'h264',
          vQuality: '720',
          aFormat: 'mp3',
          filenamePattern: 'classic',
          isAudioOnly: false
        }, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        });

        if (response.data && response.data.status === 'success' && response.data.url) {
          // Download the file
          const fileResponse = await axios.get(response.data.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: 52428800 // 50MB limit
          });

          const buffer = Buffer.from(fileResponse.data);
          const sizeMB = buffer.length / (1024 * 1024);

          if (sizeMB > 50) {
            await message.reply(`❌ File terlalu besar (${sizeMB.toFixed(1)}MB). Maksimal 50MB.`);
            return;
          }

          const media = new MessageMedia(
            'video/mp4',
            buffer.toString('base64'),
            `youtube_alt_${videoId}.mp4`
          );

          const successText = `
✅ *Download Berhasil (Metode Alternatif)*

📁 youtube_alt_${videoId}.mp4
📊 ${sizeMB.toFixed(1)}MB
🎬 Video ID: ${videoId}

📤 Mengirim file...
          `.trim();

          await client.sendMessage(message.from, successText);
          await client.sendMessage(message.from, media);

        } else {
          await message.reply('❌ Layanan download alternatif tidak dapat memproses video ini. Coba dengan video yang berbeda atau gunakan .ytv nanti.');
        }

      } catch (downloadError: any) {
        console.error('Alternative YouTube download error:', downloadError);
        
        if (downloadError.code === 'ECONNABORTED') {
          await message.reply('❌ Timeout saat download. Video mungkin terlalu besar atau koneksi bermasalah.');
        } else if (downloadError.response?.status === 429) {
          await message.reply('❌ Terlalu banyak permintaan. Coba lagi dalam beberapa menit.');
        } else {
          await message.reply('❌ Metode alternatif gagal. Coba lagi nanti atau gunakan video yang berbeda.');
        }
      }

    } catch (error) {
      console.error('Error in alternative YouTube command:', error);
      await message.reply('❌ Terjadi kesalahan saat memproses command.');
    }
  }
};

export default ytAltCommand;
