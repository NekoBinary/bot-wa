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
- Google Chrome atau Chromium (WhatsApp Web menolak Chromium bawaan Puppeteer; set `PUPPETEER_EXECUTABLE_PATH` ke binary Chrome/Chromium Anda)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd lazbot

# Install dependencies
pnpm install

# Start bot (production)
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
├── src/
│   ├── commands/          # Semua command berformat class turunan Command
│   │   ├── DownloadCommand.js
│   │   ├── HelpCommand.js
│   │   ├── MemeStickerCommand.js
│   │   └── StickerCommand.js
│   ├── core/
│   │   ├── BotApp.js      # Orkestrator WhatsApp bot
│   │   ├── Command.js     # Base class (SOLID-friendly)
│   │   ├── CommandLoader.js
│   │   ├── CommandRegistry.js
│   │   └── BrowserManager.js
│   ├── services/
│   │   ├── DownloadService.js
│   │   └── StickerService.js
│   ├── utils/
│   │   └── whatsapp.js
│   ├── config/
│   │   └── index.js
│   └── main.js            # Entry point
├── ecosystem.config.js
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## 🎯 Command Registration

Semua command otomatis ter-load dari `src/commands`. Untuk menambah fitur baru:

1. Buat file `NamaCommand.js` di `src/commands/`.
2. `import Command from '../core/Command.js';` lalu `export default class MyCommand extends Command { ... }`.
3. Implementasikan method `run(context)` dan gunakan data dari `context` (`client`, `message`, `args`, `registry`, `config`).

Contoh minimal:

```js
import Command from '../core/Command.js';

export default class PingCommand extends Command {
  constructor() {
    super({ name: 'ping', description: 'Tes respon', usage: '.ping' });
  }

  async run({ message }) {
    await message.reply('pong!');
  }
}
```

## ⚙️ Configuration

Semua konfigurasi ada di `.env` dan dibaca oleh `src/config/index.js`. Variabel penting:

- `BOT_PREFIX` – prefix command (default `.`)
- `OWNER_NUMBER` – nomor owner
- `SESSION_PATH` – lokasi penyimpanan session WhatsApp
- `PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH` – path Chrome/Chromium
- `MAX_DOWNLOAD_MB` – batas ukuran download (default 50 MB)

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

4. **TimeoutError saat konek ke browser / "Only Chrome is supported"**
   - Install Google Chrome atau Chromium di sistem (misal `sudo pacman -S chromium` di Arch)
   - Set `PUPPETEER_EXECUTABLE_PATH` (atau `CHROME_PATH`) ke binary tersebut di `.env`
   - Bot sekarang otomatis mencoba mendeteksi path umum, tetapi variabel env memastikan Puppeteer tidak memakai Chromium bawaan

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
