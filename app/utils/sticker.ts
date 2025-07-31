import sharp from 'sharp';
import { writeFile, readFile, unlink } from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { StickerOptions, MemeOptions } from '../../types';

const execAsync = promisify(exec);

export class StickerUtils {
  private static readonly STICKER_SIZE = 512;
  private static readonly TEMP_DIR = './temp';

  static async createSticker(
    media: Buffer,
    options: StickerOptions = {}
  ): Promise<Buffer> {
    const { author = 'LazBot', pack = 'LazBot Stickers', quality = 50 } = options;

    try {
      // Ensure temp directory exists
      await this.ensureTempDir();

      // Process image to sticker format
      const processedImage = await sharp(media)
        .resize(this.STICKER_SIZE, this.STICKER_SIZE, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality })
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('Error creating sticker:', error);
      throw new Error('Failed to create sticker');
    }
  }

  static async createMemeSticker(
    media: Buffer,
    options: MemeOptions = {}
  ): Promise<Buffer> {
    const {
      topText = '',
      bottomText = '',
      fontSize = 40,
      fontColor = '#FFFFFF',
      ...stickerOptions
    } = options;

    try {
      await this.ensureTempDir();

      // For now, we'll create a simple meme using Sharp's text overlay
      // This is a simplified version - the text will be basic overlay
      let image = sharp(media)
        .resize(this.STICKER_SIZE, this.STICKER_SIZE, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });

      // Create text overlay using SVG
      if (topText || bottomText) {
        const textSvg = this.createTextSvg(topText, bottomText, this.STICKER_SIZE);
        const textBuffer = Buffer.from(textSvg);
        
        image = image.composite([{
          input: textBuffer,
          top: 0,
          left: 0
        }]);
      }

      const buffer = await image.png().toBuffer();
      
      // Create sticker from the meme
      return await this.createSticker(buffer, stickerOptions);
    } catch (error) {
      console.error('Error creating meme sticker:', error);
      // Fallback: create normal sticker without text
      return await this.createSticker(media, stickerOptions);
    }
  }

  private static createTextSvg(topText: string, bottomText: string, size: number): string {
    const fontSize = 40;
    const fontFamily = 'Arial, sans-serif';
    
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .meme-text {
              font-family: ${fontFamily};
              font-size: ${fontSize}px;
              font-weight: bold;
              text-anchor: middle;
              fill: white;
              stroke: black;
              stroke-width: 2;
              paint-order: stroke fill;
            }
          </style>
        </defs>
        ${topText ? `<text x="${size/2}" y="${fontSize + 10}" class="meme-text">${this.escapeXml(topText)}</text>` : ''}
        ${bottomText ? `<text x="${size/2}" y="${size - 20}" class="meme-text">${this.escapeXml(bottomText)}</text>` : ''}
      </svg>
    `;
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static async createGifSticker(
    media: Buffer,
    options: StickerOptions = {}
  ): Promise<Buffer> {
    const { quality = 50 } = options;

    try {
      await this.ensureTempDir();

      const tempInput = path.join(this.TEMP_DIR, `input_${Date.now()}.gif`);
      const tempOutput = path.join(this.TEMP_DIR, `output_${Date.now()}.webp`);

      await writeFile(tempInput, media);

      // Convert GIF to animated WebP using ffmpeg
      const ffmpegCmd = `ffmpeg -i ${tempInput} -vf scale=${this.STICKER_SIZE}:${this.STICKER_SIZE}:force_original_aspect_ratio=decrease,pad=${this.STICKER_SIZE}:${this.STICKER_SIZE}:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=15 -loop 0 -preset default -an -vsync 0 -quality ${quality} ${tempOutput}`;

      await execAsync(ffmpegCmd);
      const result = await readFile(tempOutput);

      // Cleanup
      await Promise.all([
        unlink(tempInput).catch(() => {}),
        unlink(tempOutput).catch(() => {})
      ]);

      return result;
    } catch (error) {
      console.error('Error creating GIF sticker:', error);
      // Fallback: treat as static image
      return await this.createSticker(media, options);
    }
  }

  private static async ensureTempDir(): Promise<void> {
    const fs = await import('fs-extra');
    await fs.ensureDir(this.TEMP_DIR);
  }

  static isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/') && !mimetype.includes('gif');
  }

  static isGif(mimetype: string): boolean {
    return mimetype === 'image/gif';
  }

  static isVideo(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  static isSupportedMedia(mimetype: string): boolean {
    return this.isImage(mimetype) || this.isGif(mimetype) || this.isVideo(mimetype);
  }
}
