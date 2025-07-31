import { CommandHandler, CommandContext } from '../types';
import { StickerUtils } from '../app/utils/sticker';
import { MessageMedia } from 'whatsapp-web.js';

const sCommand: CommandHandler = {
  name: 's',
  description: 'Membuat sticker dari gambar, video, atau GIF',
  usage: '.s [reply to image/video/gif]',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, client } = context;

    try {
      let media: MessageMedia | undefined;
      let quotedMsg = await message.getQuotedMessage();

      // Check if replying to a message with media
      if (quotedMsg && quotedMsg.hasMedia) {
        media = await quotedMsg.downloadMedia();
      } 
      // Check if current message has media
      else if (message.hasMedia) {
        media = await message.downloadMedia();
      }

      if (!media) {
        await message.reply('❌ Kirim atau reply gambar/video/GIF untuk membuat sticker!');
        return;
      }

      // Check if media type is supported
      if (!StickerUtils.isSupportedMedia(media.mimetype)) {
        await message.reply('❌ Format file tidak didukung! Gunakan gambar, video, atau GIF.');
        return;
      }

      // Send processing message
      await message.reply('⏳ Sedang membuat sticker...');

      // Convert media data to Buffer
      const mediaBuffer = Buffer.from(media.data, 'base64');
      let stickerBuffer: Buffer;

      // Process based on media type
      if (StickerUtils.isGif(media.mimetype) || StickerUtils.isVideo(media.mimetype)) {
        stickerBuffer = await StickerUtils.createGifSticker(mediaBuffer, {
          author: 'LazBot',
          pack: 'LazBot Stickers'
        });
      } else {
        stickerBuffer = await StickerUtils.createSticker(mediaBuffer, {
          author: 'LazBot',
          pack: 'LazBot Stickers'
        });
      }

      // Create MessageMedia for sticker
      const sticker = new MessageMedia('image/webp', stickerBuffer.toString('base64'));
      
      // Send sticker
      await client.sendMessage(message.from, sticker, {
        sendMediaAsSticker: true
      });

    } catch (error) {
      console.error('Error in sticker command:', error);
      await message.reply('❌ Gagal membuat sticker. Pastikan file yang dikirim valid.');
    }
  }
};

export default sCommand;
