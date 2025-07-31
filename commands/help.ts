import { CommandHandler, CommandContext } from '../types';

const helpCommand: CommandHandler = {
  name: 'help',
  description: 'Menampilkan daftar perintah yang tersedia',
  usage: '.help [command_name]',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args } = context;

    try {
      // If specific command requested
      if (args.length > 0) {
        const commandName = args[0].toLowerCase();
        // This would require access to command manager, but for simplicity:
        
        const commands = {
          's': {
            name: 's',
            description: 'Membuat sticker dari gambar, video, atau GIF',
            usage: '.s [reply to image/video/gif]'
          },
          'smeme': {
            name: 'smeme',
            description: 'Membuat sticker meme dengan teks dari gambar',
            usage: '.smeme <teks atas>|<teks bawah> [reply to image]'
          },
          'help': {
            name: 'help',
            description: 'Menampilkan daftar perintah yang tersedia',
            usage: '.help [command_name]'
          }
        };

        const cmd = commands[commandName as keyof typeof commands];
        if (cmd) {
          const helpText = `
📌 *${cmd.name.toUpperCase()}*

📝 *Deskripsi:*
${cmd.description}

🔧 *Penggunaan:*
${cmd.usage}

${cmd.name === 's' ? `
📋 *Format yang didukung:*
• Gambar (JPG, PNG, WEBP)
• Video (MP4, MOV, AVI)
• GIF animasi

✨ *Contoh:*
Reply gambar/video/GIF dengan pesan ".s"
` : ''}

${cmd.name === 'smeme' ? `
📋 *Format teks:*
• Teks atas|Teks bawah
• Gunakan "|" untuk memisahkan teks atas dan bawah
• Kosongkan salah satu untuk teks tunggal

✨ *Contoh:*
• .smeme WHEN|IMPOSTOR SUS
• .smeme STONKS|
• .smeme |BOTTOM TEXT ONLY
` : ''}
          `.trim();
          
          await message.reply(helpText);
        } else {
          await message.reply(`❌ Command "${commandName}" tidak ditemukan!`);
        }
        return;
      }

      // General help message
      const helpText = `
🤖 *LAZBOT - WhatsApp Sticker Bot*

📋 *Daftar Perintah:*

🎨 *.s* - Membuat sticker
• Reply gambar/video/GIF dengan ".s"
• Support: JPG, PNG, WEBP, MP4, GIF

😂 *.smeme* - Membuat sticker meme
• Format: .smeme teks_atas|teks_bawah
• Reply gambar dengan command

❓ *.help* - Bantuan
• .help - Tampilkan semua command
• .help [nama_command] - Detail command

┌─────────────────────────┐
│  🔧 *Cara Penggunaan:*   │
└─────────────────────────┘
1️⃣ Kirim/Reply media
2️⃣ Ketik command yang diinginkan
3️⃣ Tunggu bot memproses
4️⃣ Sticker siap digunakan!

💡 *Tips:* 
• Gunakan gambar/video berkualitas baik
• GIF akan dikonversi menjadi sticker animasi
• Ukuran file maksimal yang direkomendasikan: 5MB

📞 *Support:* LazBot v1.0.0
      `.trim();

      await message.reply(helpText);

    } catch (error) {
      console.error('Error in help command:', error);
      await message.reply('❌ Gagal menampilkan bantuan.');
    }
  }
};

export default helpCommand;
