import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'node:path';
import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(execCallback);
const STICKER_SIZE = 512;

export default class StickerService {
  constructor(tempDir) {
    this.tempDir = tempDir;
  }

  async ensureTempDir() {
    await fs.ensureDir(this.tempDir);
  }

  isImage(mimetype) {
    return mimetype?.startsWith('image/') && !mimetype.includes('gif');
  }

  isGif(mimetype) {
    return mimetype === 'image/gif';
  }

  isVideo(mimetype) {
    return mimetype?.startsWith('video/');
  }

  isSupportedMedia(mimetype) {
    return this.isImage(mimetype) || this.isGif(mimetype) || this.isVideo(mimetype);
  }

  async createStaticSticker(buffer, options = {}) {
    const { quality = 50 } = options;
    await this.ensureTempDir();

    return sharp(buffer)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality })
      .toBuffer();
  }

  async createMemeSticker(buffer, options = {}) {
    const {
      topText = '',
      bottomText = '',
      fontSize = 150,
      fontColor = '#FFFFFF',
      quality = 50
    } = options;

    await this.ensureTempDir();

    let image = sharp(buffer)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });

    const effectiveFont = Math.max(fontSize, 135);

    if (topText || bottomText) {
      const svg = this.createTextSvg(topText, bottomText, STICKER_SIZE, effectiveFont, fontColor);
      image = image.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
    }

    return image.webp({ quality }).toBuffer();
  }

  createTextSvg(topText, bottomText, size, fontSize, color) {
    const strokeWidth = Math.max(14, Math.round(fontSize * 0.26));
    const topY = fontSize + strokeWidth;
    const bottomY = size - strokeWidth;

    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .meme-text {
              font-family: Arial, sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              text-anchor: middle;
              fill: ${color};
              stroke: black;
              stroke-width: ${strokeWidth};
              paint-order: stroke fill;
            }
          </style>
        </defs>
        ${topText ? `<text x="${size / 2}" y="${topY}" class="meme-text">${this.escapeXml(topText)}</text>` : ''}
        ${bottomText ? `<text x="${size / 2}" y="${bottomY}" class="meme-text">${this.escapeXml(bottomText)}</text>` : ''}
      </svg>
    `;
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async createAnimatedSticker(buffer, options = {}) {
    const { quality = 50 } = options;
    await this.ensureTempDir();

    const tempInput = path.join(this.tempDir, `input_${Date.now()}.tmp`);
    const tempOutput = path.join(this.tempDir, `output_${Date.now()}.webp`);

    await fs.writeFile(tempInput, buffer);

    const vf = `scale=${STICKER_SIZE}:${STICKER_SIZE}:force_original_aspect_ratio=decrease,pad=${STICKER_SIZE}:${STICKER_SIZE}:(ow-iw)/2:(oh-ih)/2:color=black@0,fps=15`;
    const cmd = `ffmpeg -y -i "${tempInput}" -vf "${vf}" -loop 0 -preset default -an -vsync 0 -quality ${quality} "${tempOutput}"`;

    await execAsync(cmd);
    const result = await fs.readFile(tempOutput);

    await Promise.all([
      fs.remove(tempInput).catch(() => {}),
      fs.remove(tempOutput).catch(() => {})
    ]);

    return result;
  }
}
