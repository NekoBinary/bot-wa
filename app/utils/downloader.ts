import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFile, unlink } from 'fs-extra';
import path from 'path';
import { DownloadOptions, DownloadResult, MediaInfo } from '../../types/index';

export class MediaDownloader {
  private static readonly MAX_SIZE_MB = 50;
  private static readonly TEMP_DIR = './temp';

  static async downloadFromUrl(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
    try {
      const platform = this.detectPlatform(url);
      
      switch (platform) {
        case 'youtube':
          return await this.downloadYoutube(url, options);
        case 'instagram':
          return await this.downloadInstagram(url, options);
        case 'tiktok':
          return await this.downloadTikTok(url, options);
        case 'facebook':
          return await this.downloadFacebook(url, options);
        default:
          return {
            success: false,
            error: 'Platform tidak didukung. Gunakan link YouTube, Instagram, TikTok, atau Facebook.'
          };
      }
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: 'Gagal mendownload media. Pastikan link valid dan media dapat diakses.'
      };
    }
  }

  private static detectPlatform(url: string): 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'unknown' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('instagram.com')) {
      return 'instagram';
    } else if (url.includes('tiktok.com')) {
      return 'tiktok';
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return 'facebook';
    }
    return 'unknown';
  }

  private static async downloadYoutube(url: string, options: DownloadOptions): Promise<DownloadResult> {
    try {
      if (!ytdl.validateURL(url)) {
        return {
          success: false,
          error: 'URL YouTube tidak valid.'
        };
      }

      // Try to get video info with timeout and retry
      let info;
      try {
        info = await Promise.race([
          ytdl.getInfo(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout getting video info')), 15000)
          )
        ]) as any;
      } catch (infoError) {
        console.error('YouTube info error:', infoError);
        return {
          success: false,
          error: 'Tidak dapat mengakses informasi video YouTube. Video mungkin private, tidak tersedia di region ini, atau sedang ada masalah dengan layanan YouTube.'
        };
      }

      const title = info.videoDetails.title;
      const duration = this.formatDuration(parseInt(info.videoDetails.lengthSeconds));

      // Check if video is too long (more than 10 minutes for video, 30 minutes for audio)
      const maxDuration = options.format === 'mp3' ? 1800 : 600; // 30 min for audio, 10 min for video
      if (parseInt(info.videoDetails.lengthSeconds) > maxDuration) {
        return {
          success: false,
          error: `Video terlalu panjang. Maksimal ${options.format === 'mp3' ? '30 menit' : '10 menit'}.`
        };
      }

      let format;
      try {
        if (options.format === 'mp3') {
          format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly'
          });
        } else {
          // Fix quality mapping for @distube/ytdl-core
          let qualityFilter;
          switch (options.quality || 'medium') {
            case 'high':
              qualityFilter = 'highest';
              break;
            case 'low':
              qualityFilter = 'lowest';
              break;
            case 'medium':
            default:
              qualityFilter = '720p'; // Use specific resolution instead of 'medium'
              break;
          }
          
          // Try different format selection strategies
          try {
            format = ytdl.chooseFormat(info.formats, { 
              quality: qualityFilter,
              filter: 'videoandaudio'
            });
          } catch (e) {
            // Fallback to any video format
            format = ytdl.chooseFormat(info.formats, { 
              filter: 'videoandaudio'
            });
          }
        }
      } catch (formatError) {
        console.error('YouTube format selection error:', formatError);
        
        // Last resort: try to get any available format
        try {
          if (options.format === 'mp3') {
            format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
          } else {
            format = ytdl.chooseFormat(info.formats, { filter: 'video' });
          }
        } catch (e) {
          return {
            success: false,
            error: 'Format video yang diminta tidak tersedia. Video mungkin memiliki pembatasan atau format khusus.'
          };
        }
      }

      if (!format) {
        return {
          success: false,
          error: 'Format video tidak tersedia. Coba dengan kualitas yang berbeda.'
        };
      }

      // Check file size
      if (format.contentLength) {
        const sizeMB = parseInt(format.contentLength) / (1024 * 1024);
        if (sizeMB > (options.maxSize || this.MAX_SIZE_MB)) {
          return {
            success: false,
            error: `File terlalu besar (${sizeMB.toFixed(1)}MB). Maksimal ${options.maxSize || this.MAX_SIZE_MB}MB.`
          };
        }
      }

      const stream = ytdl(url, { format });
      const chunks: Buffer[] = [];
      let downloadSize = 0;
      const maxSizeBytes = (options.maxSize || this.MAX_SIZE_MB) * 1024 * 1024;

      return new Promise((resolve) => {
        // Set timeout for download
        const timeout = setTimeout(() => {
          stream.destroy();
          resolve({
            success: false,
            error: 'Download timeout. Video mungkin terlalu besar atau koneksi bermasalah.'
          });
        }, 120000); // 2 minutes timeout

        stream.on('data', (chunk) => {
          downloadSize += chunk.length;
          
          // Check size during download to prevent memory issues
          if (downloadSize > maxSizeBytes) {
            clearTimeout(timeout);
            stream.destroy();
            resolve({
              success: false,
              error: `File terlalu besar (>${(downloadSize / (1024 * 1024)).toFixed(1)}MB). Maksimal ${options.maxSize || this.MAX_SIZE_MB}MB.`
            });
            return;
          }
          
          chunks.push(chunk);
        });

        stream.on('end', () => {
          clearTimeout(timeout);
          const buffer = Buffer.concat(chunks);
          const sizeMB = buffer.length / (1024 * 1024);

          resolve({
            success: true,
            buffer,
            filename: `${this.sanitizeFilename(title)}.${options.format || 'mp4'}`,
            title,
            duration,
            size: sizeMB
          });
        });

        stream.on('error', (error) => {
          clearTimeout(timeout);
          console.error('YouTube download stream error:', error);
          resolve({
            success: false,
            error: 'Gagal mendownload dari YouTube. Video mungkin tidak tersedia atau ada masalah dengan layanan.'
          });
        });
      });

    } catch (error) {
      console.error('YouTube error:', error);
      return {
        success: false,
        error: 'Gagal mengakses YouTube. Pastikan video dapat diakses publik.'
      };
    }
  }

  private static async downloadInstagram(url: string, options: DownloadOptions): Promise<DownloadResult> {
    try {
      // Simple Instagram scraper - this is a basic implementation
      // For production, you might want to use a more robust solution
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Try to find video URL in meta tags
      let mediaUrl = $('meta[property="og:video"]').attr('content');
      
      if (!mediaUrl) {
        // Try to find image URL
        mediaUrl = $('meta[property="og:image"]').attr('content');
      }

      if (!mediaUrl) {
        return {
          success: false,
          error: 'Tidak dapat menemukan media di Instagram post ini.'
        };
      }

      const mediaResponse = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const buffer = Buffer.from(mediaResponse.data);
      const sizeMB = buffer.length / (1024 * 1024);

      if (sizeMB > (options.maxSize || this.MAX_SIZE_MB)) {
        return {
          success: false,
          error: `File terlalu besar (${sizeMB.toFixed(1)}MB). Maksimal ${options.maxSize || this.MAX_SIZE_MB}MB.`
        };
      }

      const isVideo = mediaUrl.includes('.mp4') || mediaResponse.headers['content-type']?.includes('video');
      const extension = isVideo ? 'mp4' : 'jpg';

      return {
        success: true,
        buffer,
        filename: `instagram_${Date.now()}.${extension}`,
        title: 'Instagram Media',
        size: sizeMB
      };

    } catch (error) {
      console.error('Instagram error:', error);
      return {
        success: false,
        error: 'Gagal mendownload dari Instagram. Pastikan post bersifat publik dan dapat diakses.'
      };
    }
  }

  private static async downloadTikTok(url: string, options: DownloadOptions): Promise<DownloadResult> {
    try {
      // Try to get the direct video URL using multiple methods
      let videoUrl: string | null = null;
      
      // Method 1: Try to get redirect URL (for mobile links)
      try {
        const redirectResponse = await axios.head(url, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
          }
        });
        
        if (redirectResponse.headers.location) {
          url = redirectResponse.headers.location;
        }
      } catch (e) {
        // Ignore redirect errors
      }

      // Method 2: Try to extract from page content
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Try different methods to extract video URL
      const scripts = $('script').toArray();
      
      for (const script of scripts) {
        const content = $(script).html();
        if (!content) continue;

        // Method A: Look for __UNIVERSAL_DATA_FOR_REHYDRATION__
        if (content.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
          try {
            const match = content.match(/window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*(.+?);/);
            if (match) {
              const data = JSON.parse(match[1]);
              const videoData = data?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
              videoUrl = videoData?.video?.downloadAddr || videoData?.video?.playAddr || null;
              if (videoUrl) break;
            }
          } catch (e) {
            continue;
          }
        }

        // Method B: Look for direct video URLs in script
        const videoMatches = content.match(/"downloadAddr":"([^"]+)"/);
        if (videoMatches && videoMatches[1]) {
          videoUrl = videoMatches[1].replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => 
            String.fromCharCode(parseInt(grp, 16))
          );
          break;
        }

        // Method C: Look for playAddr
        const playMatches = content.match(/"playAddr":"([^"]+)"/);
        if (playMatches && playMatches[1]) {
          videoUrl = playMatches[1].replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => 
            String.fromCharCode(parseInt(grp, 16))
          );
          break;
        }
      }

      // Method 3: Try to find in meta tags
      if (!videoUrl) {
        const metaVideo = $('meta[property="og:video"]').attr('content') || 
                         $('meta[property="og:video:url"]').attr('content');
        videoUrl = metaVideo || null;
      }

      if (!videoUrl) {
        return {
          success: false,
          error: 'Tidak dapat menemukan video TikTok. Video mungkin private, dihapus, atau tidak dapat diakses dari region ini.'
        };
      }

      // Clean up the URL
      if (videoUrl.startsWith('//')) {
        videoUrl = 'https:' + videoUrl;
      }

      // Download the video
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.tiktok.com/'
        },
        timeout: 60000,
        maxContentLength: 52428800 // 50MB limit
      });

      const buffer = Buffer.from(videoResponse.data);
      const sizeMB = buffer.length / (1024 * 1024);

      if (sizeMB > (options.maxSize || this.MAX_SIZE_MB)) {
        return {
          success: false,
          error: `File terlalu besar (${sizeMB.toFixed(1)}MB). Maksimal ${options.maxSize || this.MAX_SIZE_MB}MB.`
        };
      }

      // Extract video ID from URL for filename
      const videoId = url.match(/video\/(\d+)/)?.[1] || Date.now().toString();

      return {
        success: true,
        buffer,
        filename: `tiktok_${videoId}.mp4`,
        title: 'TikTok Video',
        size: sizeMB
      };

    } catch (error: any) {
      console.error('TikTok error:', error);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Timeout saat mengunduh TikTok. Video mungkin terlalu besar atau koneksi bermasalah.'
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Akses ditolak. Video TikTok mungkin private atau memiliki pembatasan geografis.'
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Video TikTok tidak ditemukan. Link mungkin sudah tidak valid.'
        };
      } else {
        return {
          success: false,
          error: 'Gagal mendownload dari TikTok. Pastikan video bersifat publik dan dapat diakses.'
        };
      }
    }
  }

  private static async downloadFacebook(url: string, options: DownloadOptions): Promise<DownloadResult> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Try to find video URL in meta tags
      let videoUrl = $('meta[property="og:video"]').attr('content');
      
      if (!videoUrl) {
        // Try alternative selectors
        videoUrl = $('meta[property="og:video:url"]').attr('content');
      }

      if (!videoUrl) {
        return {
          success: false,
          error: 'Tidak dapat menemukan video di Facebook post ini.'
        };
      }

      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const buffer = Buffer.from(videoResponse.data);
      const sizeMB = buffer.length / (1024 * 1024);

      if (sizeMB > (options.maxSize || this.MAX_SIZE_MB)) {
        return {
          success: false,
          error: `File terlalu besar (${sizeMB.toFixed(1)}MB). Maksimal ${options.maxSize || this.MAX_SIZE_MB}MB.`
        };
      }

      return {
        success: true,
        buffer,
        filename: `facebook_${Date.now()}.mp4`,
        title: 'Facebook Video',
        size: sizeMB
      };

    } catch (error) {
      console.error('Facebook error:', error);
      return {
        success: false,
        error: 'Gagal mendownload dari Facebook. Pastikan video bersifat publik dan dapat diakses.'
      };
    }
  }

  static async getMediaInfo(url: string): Promise<MediaInfo | null> {
    try {
      const platform = this.detectPlatform(url);
      
      if (platform === 'youtube' && ytdl.validateURL(url)) {
        try {
          // Add timeout for getting info
          const info = await Promise.race([
            ytdl.getInfo(url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Info timeout')), 10000)
            )
          ]) as any;
          
          return {
            title: info.videoDetails.title,
            duration: this.formatDuration(parseInt(info.videoDetails.lengthSeconds)),
            thumbnail: info.videoDetails.thumbnails[0]?.url || '',
            url: url,
            platform: 'youtube'
          };
        } catch (infoError) {
          console.error('YouTube info error (getMediaInfo):', infoError);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Get media info error:', error);
      return null;
    }
  }

  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return this.detectPlatform(url) !== 'unknown';
    } catch {
      return false;
    }
  }
}
