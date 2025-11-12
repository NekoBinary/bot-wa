import fs from 'fs-extra';
import path from 'node:path';
import YTDlpWrapModule from 'yt-dlp-wrap';

const YTDlpWrap = YTDlpWrapModule?.default ?? YTDlpWrapModule;

export default class DownloadService {
  constructor({ tempDir, maxSizeMb = 50 }) {
    this.tempDir = tempDir;
    this.maxSizeMb = maxSizeMb;
    this.wrapper = new YTDlpWrap();
  }

  static isValidUrl(candidate) {
    try {
      new URL(candidate);
      return true;
    } catch {
      return false;
    }
  }

  async ensureTempDir() {
    await fs.ensureDir(this.tempDir);
  }

  async download(url, options = {}) {
    const {
      format = 'video',
      quality = 'medium',
      maxSize = this.maxSizeMb
    } = options;

    try {
      await this.ensureTempDir();
      const info = await this.getInfo(url);

      if (!info.success) {
        return info;
      }

      const ytOptions = [];

      if (format === 'audio') {
        ytOptions.push(
          '-x',
          '--audio-format', 'mp3',
          '--audio-quality', quality === 'best' ? '0' : quality === 'low' ? '9' : '5'
        );
      } else {
        ytOptions.push('-f', this.getFormatString(quality));
      }

      const timestamp = Date.now();
      const suffix = Math.random().toString(36).slice(2, 8);
      const filePrefix = `${timestamp}_${suffix}`;
      const template = path.join(this.tempDir, `${filePrefix}.%(ext)s`);

      ytOptions.push(
        '-o', template,
        '--no-playlist',
        '--max-filesize', `${maxSize}M`,
        '--restrict-filenames',
        '--no-warnings',
        '--quiet'
      );

      await this.wrapper.execPromise([url, ...ytOptions]);

      const files = await fs.readdir(this.tempDir);
      const downloaded = files.find((file) => file.startsWith(filePrefix));

      if (!downloaded) {
        return { success: false, error: 'File tidak ditemukan setelah download.' };
      }

      const filePath = path.join(this.tempDir, downloaded);
      const buffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      const sizeMb = stats.size / (1024 * 1024);

      await fs.remove(filePath).catch(() => {});

      return {
        success: true,
        buffer,
        filename: downloaded,
        title: info.title,
        duration: info.duration,
        size: sizeMb
      };
    } catch (error) {
      console.error('YtDlp download error:', error);
      return {
        success: false,
        error: this.mapDownloadError(error)
      };
    }
  }

  getFormatString(quality) {
    switch (quality) {
      case 'best':
        return 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
      case 'low':
        return 'worstvideo[ext=mp4]+worstaudio[ext=m4a]/worst[ext=mp4]/worst';
      case 'medium':
      default:
        return 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best';
    }
  }

  async getInfo(url) {
    try {
      const info = await this.wrapper.getVideoInfo(url);
      return {
        success: true,
        title: info.title || info.fulltitle,
        duration: info.duration ? this.formatDuration(info.duration) : undefined,
        thumbnail: info.thumbnail
      };
    } catch (error) {
      console.error('YtDlp info error:', error);
      return {
        success: false,
        error: 'Tidak dapat mengambil informasi video.'
      };
    }
  }

  formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  mapDownloadError(error) {
    const message = error?.message || '';

    if (message.includes('Unsupported URL')) {
      return 'URL tidak didukung atau tidak valid.';
    }

    if (message.includes('Private video')) {
      return 'Video bersifat private atau tidak dapat diakses.';
    }

    if (message.includes('File is larger')) {
      return `File terlalu besar (max ${this.maxSizeMb}MB).`;
    }

    if (message.includes('Unable to extract')) {
      return 'Tidak dapat mengekstrak video. Link mungkin tidak valid atau expired.';
    }

    return 'Gagal mendownload media.';
  }
}
