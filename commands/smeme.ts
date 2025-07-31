import { CommandHandler, CommandContext } from '../types/index';
import { StickerUtils } from '../app/utils/sticker';
import { MessageMedia } from 'whatsapp-web.js';

const smemeCommand: CommandHandler = {
  name: 'smeme',
  description: 'Membuat sticker meme dengan teks dari gambar',
  usage: '.smeme <teks atas>|<teks bawah> [reply to image]',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;

    try {
      // Parse text arguments
      const text = args.join(' ');
      if (!text) {
        await message.reply(`❌ Format salah!\n\n📝 Penggunaan:\n${this.usage}\n\n📌 Contoh:\n.smeme WHEN|IMPOSTOR SUS`);
        return;
      }

      const [topText, bottomText] = text.split('|').map(t => t.trim());
      
      if (!topText && !bottomText) {
        await message.reply('❌ Minimal masukkan satu teks (atas atau bawah)!');
        return;
      }

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
        await message.reply('❌ Kirim atau reply gambar untuk membuat sticker meme!');
        return;
      }

      // Check if media type is supported (only images for meme)
      if (!StickerUtils.isImage(media.mimetype)) {
        await message.reply('❌ Untuk meme sticker, gunakan gambar saja!');
        return;
      }

      // Send processing message
      await message.reply('⏳ Sedang membuat sticker meme...');

      // Convert media data to Buffer
      const mediaBuffer = Buffer.from(media.data, 'base64');
      
      // Create meme sticker
      const stickerBuffer = await StickerUtils.createMemeSticker(mediaBuffer, {
        topText: topText || '',
        bottomText: bottomText || '',
        fontSize: 40,
        fontColor: '#FFFFFF',
        author: 'LazBot',
        pack: 'LazBot Meme Stickers'
      });

      // Create MessageMedia for sticker
      const sticker = new MessageMedia('image/webp', stickerBuffer.toString('base64'));
      
      // Send sticker
      await client.sendMessage(message.from, sticker, {
        sendMediaAsSticker: true
      });

    } catch (error) {
      console.error('Error in meme sticker command:', error);
      await message.reply('❌ Gagal membuat sticker meme. Pastikan gambar yang dikirim valid.');
    }
  }
};

export default smemeCommand;
