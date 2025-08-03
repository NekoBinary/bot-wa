import { CommandHandler, CommandContext } from '../types/index';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { MessageMedia } from 'whatsapp-web.js';

const tiktokCommand: CommandHandler = {
  name: 'tiktok',
  description: 'Download video TikTok dengan metode khusus',
  usage: '.tiktok <url>',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;

    try {
      if (args.length === 0) {
        const helpText = `
📱 *TIKTOK DOWNLOADER*

🔧 *Penggunaan:*
.tiktok <tiktok_url>

📋 *Link yang didukung:*
• tiktok.com/@user/video/xxx
• vm.tiktok.com/xxx
• vt.tiktok.com/xxx

🎯 *Fitur:*
• Download tanpa watermark (jika tersedia)
• Kualitas HD
• Format MP4

📏 *Batasan:*
• Maksimal 50MB
• Hanya video publik
• Video tidak boleh private

✨ *Contoh:*
• .tiktok https://tiktok.com/@user/video/123
• .tiktok https://vm.tiktok.com/abc123
        `.trim();
        
        await message.reply(helpText);
        return;
      }

      const url = args[0];

      // Validate TikTok URL
      if (!url.includes('tiktok.com')) {
        await message.reply('❌ Gunakan URL TikTok yang valid!\n\nContoh: https://tiktok.com/@user/video/123');
        return;
      }

      await message.reply('📱 Sedang mengunduh video TikTok...');

      try {
        // Method 1: Try to resolve shortened URLs
        let resolvedUrl = url;
        if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
          try {
            const response = await axios.head(url, {
              maxRedirects: 5,
              headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
              }
            });
            resolvedUrl = response.request.res.responseUrl || url;
          } catch (e) {
            // Use original URL if redirect fails
          }
        }

        // Method 2: Get page content with mobile user agent
        const pageResponse = await axios.get(resolvedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
          },
          timeout: 15000
        });

        const $ = cheerio.load(pageResponse.data);
        let videoUrl: string | null = null;

        // Try to extract video URL from various sources
        $('script').each((i, element) => {
          const content = $(element).html();
          if (!content || videoUrl) return;

          // Look for video URL patterns
          const patterns = [
            /"downloadAddr":"([^"]+)"/,
            /"playAddr":"([^"]+)"/,
            /playAddr['"]\s*:\s*['"]([^'"]+)['"]/,
            /downloadAddr['"]\s*:\s*['"]([^'"]+)['"]/
          ];

          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
              videoUrl = match[1]
                .replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => 
                  String.fromCharCode(parseInt(grp, 16))
                )
                .replace(/\\(.)/g, '$1'); // Remove escaping
              break;
            }
          }
        });

        // Fallback: try meta tags
        if (!videoUrl) {
          videoUrl = $('meta[property="og:video"]').attr('content') ||
                    $('meta[property="og:video:url"]').attr('content') ||
                    null;
        }

        if (!videoUrl) {
          await message.reply('❌ Tidak dapat menemukan video TikTok. Video mungkin:\n• Private atau dihapus\n• Memiliki pembatasan geografis\n• Tidak dapat diakses\n\nCoba dengan video yang berbeda.');
          return;
        }

        // Clean and validate URL
        if (videoUrl.startsWith('//')) {
          videoUrl = 'https:' + videoUrl;
        } else if (videoUrl.startsWith('/')) {
          videoUrl = 'https://www.tiktok.com' + videoUrl;
        }

        // Download the video
        await client.sendMessage(message.from, '⏳ Mengunduh file...');

        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            'Referer': 'https://www.tiktok.com/'
          },
          timeout: 60000,
          maxContentLength: 52428800 // 50MB
        });

        const buffer = Buffer.from(videoResponse.data);
        const sizeMB = buffer.length / (1024 * 1024);

        if (sizeMB > 50) {
          await message.reply(`❌ File terlalu besar (${sizeMB.toFixed(1)}MB). Maksimal 50MB.`);
          return;
        }

        // Extract video ID for filename
        const videoId = resolvedUrl.match(/video\/(\d+)/)?.[1] || 
                       resolvedUrl.match(/\/(\d+)/)?.[1] || 
                       Date.now().toString();

        const media = new MessageMedia(
          'video/mp4',
          buffer.toString('base64'),
          `tiktok_${videoId}.mp4`
        );

        const successText = `
✅ *TikTok Downloaded!*

📁 tiktok_${videoId}.mp4
📊 ${sizeMB.toFixed(1)}MB
📱 Platform: TikTok

🎉 Video berhasil diunduh!
        `.trim();

        await client.sendMessage(message.from, successText);
        await client.sendMessage(message.from, media);

      } catch (downloadError: any) {
        console.error('TikTok download error:', downloadError);

        if (downloadError.code === 'ECONNABORTED') {
          await message.reply('❌ Timeout saat download. Video mungkin terlalu besar atau koneksi bermasalah.');
        } else if (downloadError.response?.status === 403) {
          await message.reply('❌ Akses ditolak. Video TikTok mungkin private atau memiliki pembatasan.');
        } else if (downloadError.response?.status === 404) {
          await message.reply('❌ Video tidak ditemukan. Link mungkin sudah tidak valid.');
        } else {
          await message.reply('❌ Gagal mengunduh video TikTok. Coba dengan video yang berbeda atau gunakan .dl sebagai alternatif.');
        }
      }

    } catch (error) {
      console.error('Error in TikTok command:', error);
      await message.reply('❌ Terjadi kesalahan saat memproses command TikTok.');
    }
  }
};

export default tiktokCommand;
