# LazBot - WhatsApp Sticker Bot 🤖

Bot WhatsApp yang dapat membuat sticker dari gambar, video, dan GIF dengan fitur meme text overlay.

## ✨ Fitur Utama

- 🎨 **Sticker Creator** - Konversi gambar/video/GIF menjadi sticker
- 😂 **Meme Sticker** - Tambahkan teks atas dan bawah pada gambar
- 🎬 **GIF Support** - Support GIF animasi menjadi sticker animasi
- 📱 **QR Terminal** - Login mudah dengan scan QR di terminal
- 🔧 **Auto Command Registration** - Command otomatis terdaftar dari folder commands/

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- ffmpeg (untuk GIF/video processing)
- webpmux (opsional, untuk metadata sticker)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd lazbot

# Install dependencies
pnpm install

# Build project
pnpm run build

# Start bot
pnpm start
```

### Development

```bash
# Development mode dengan hot reload
pnpm run dev
```

## 📋 Commands

| Command | Deskripsi | Usage |
|---------|-----------|-------|
| `.s` | Membuat sticker dari media | Reply media dengan `.s` |
| `.smeme` | Membuat meme sticker | `.smeme teks_atas\|teks_bawah` + reply gambar |
| `.help` | Bantuan command | `.help` atau `.help [command]` |

## 🏗️ Struktur Proyek

```
lazbot/
├── app/
│   ├── index.ts          # Entry point aplikasi
│   └── utils/
│       ├── bot.ts        # Bot logic & command manager
│       └── sticker.ts    # Sticker processing utilities
├── commands/
│   ├── s.ts             # Sticker command
│   ├── smeme.ts         # Meme sticker command
│   └── help.ts          # Help command
├── types/
│   └── index.ts         # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Command Registration

Commands secara otomatis terdaftar berdasarkan nama file di folder `commands/`. 

Untuk membuat command baru:

1. Buat file baru di `commands/namacommand.ts`
2. Export default CommandHandler object
3. Bot akan otomatis load command saat startup

### Contoh Command Structure

```typescript
import { CommandHandler, CommandContext } from '../types';

const myCommand: CommandHandler = {
  name: 'mycommand',
  description: 'Deskripsi command',
  usage: '.mycommand [parameter]',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;
    
    // Command logic here
    await message.reply('Hello from my command!');
  }
};

export default myCommand;
```

## ⚙️ Configuration

Edit `app/index.ts` untuk mengubah konfigurasi bot:

```typescript
const config: BotConfig = {
  prefix: '.',                    // Command prefix
  ownerNumber: '62xxxxxxxxxxxx',  // Owner WhatsApp number
  botName: 'LazBot',             // Bot name
  sessionPath: './sessions'       // WhatsApp session storage
};
```

## 🔧 Dependencies

### Main Dependencies
- `whatsapp-web.js` - WhatsApp Web API
- `qrcode-terminal` - QR code display di terminal
- `sharp` - Image processing (with SVG text overlay)
- `fs-extra` - File system utilities

### Optional Dependencies
- `ffmpeg-static` - Video/GIF processing
- `dotenv` - Environment variables

## 📱 Supported Media Types

- **Images**: JPG, PNG, WEBP
- **Videos**: MP4, MOV, AVI (dikonversi ke WebP animasi)
- **GIF**: Animasi (dikonversi ke WebP animasi)

## 🔍 Troubleshooting

### Common Issues

1. **Error "webpmux not available"**
   - Install webpmux: `npm install -g node-webpmux`
   - Atau abaikan, sticker tetap bisa dibuat tanpa metadata

2. **Error ffmpeg not found**
   - Install ffmpeg di sistem
   - Atau gunakan ffmpeg-static (sudah included)

3. **Canvas/Sharp build errors**
   - Pastikan Python dan build tools terinstall
   - Windows: `npm install --global windows-build-tools`

### Session Issues

Jika terjadi masalah dengan session WhatsApp:
1. Hapus folder `.sessions`
2. Restart bot
3. Scan QR code ulang

## 📄 License

MIT License

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

Jika ada masalah atau pertanyaan:
- Open issue di GitHub
- Contact: [Your Contact Info]

---

Made with ❤️ by LazBot Team