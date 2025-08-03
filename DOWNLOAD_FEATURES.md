# 📥 Download Feature Documentation

## Overview
LazBot sekarang mendukung download media dari berbagai platform populer dengan handling yang robust untuk error dan ukuran file.

## 🌐 Platform yang Didukung

### ✅ YouTube
- **URL Format**: `youtube.com/watch?v=xxx`, `youtu.be/xxx`
- **Format**: MP4 (video), MP3 (audio)
- **Kualitas**: High, Medium, Low
- **Batasan**: 
  - Video: maksimal 10 menit, 50MB
  - Audio: maksimal 30 menit, 50MB

### ✅ Instagram
- **URL Format**: `instagram.com/p/xxx`, `instagram.com/reel/xxx`
- **Format**: MP4 (video), JPG (image)
- **Batasan**: maksimal 50MB
- **Note**: Hanya konten publik yang dapat didownload

### ✅ TikTok
- **URL Format**: `tiktok.com/@user/video/xxx`
- **Format**: MP4 (video)
- **Batasan**: maksimal 50MB
- **Note**: Hanya video publik

### ✅ Facebook
- **URL Format**: `facebook.com/xxx`, `fb.watch/xxx`
- **Format**: MP4 (video)
- **Batasan**: maksimal 50MB
- **Note**: Hanya konten publik

## 🤖 Commands

### `.dl` - Universal Downloader
```
.dl <url> [format] [quality]
```
- **Format**: mp4 (default), mp3
- **Quality**: high, medium (default), low
- **Contoh**:
  - `.dl https://youtu.be/xxx`
  - `.dl https://youtu.be/xxx mp3`
  - `.dl https://instagram.com/p/xxx`

### `.ytv` - YouTube Video
```
.ytv <youtube_url> [quality]
```
- **Quality**: high, medium (default), low
- **Format**: MP4 only
- **Contoh**: `.ytv https://youtu.be/xxx high`

### `.yta` - YouTube Audio
```
.yta <youtube_url>
```
- **Format**: MP3 only
- **Quality**: Highest available
- **Contoh**: `.yta https://youtu.be/xxx`

## 🛡️ Error Handling

### URL Validation
- ❌ Platform tidak didukung
- ❌ URL tidak valid
- ❌ Format/kualitas tidak valid

### Size & Duration Limits
- ❌ File terlalu besar (>50MB)
- ❌ Video terlalu panjang (>10 menit untuk video, >30 menit untuk audio)
- ❌ Format tidak tersedia

### Network & Access Issues
- ❌ Konten private/tidak dapat diakses
- ❌ Video tidak tersedia di region
- ❌ Timeout atau network error

### Graceful Degradation
- 🔄 Retry mechanism untuk temporary failures
- 📊 File size check sebelum download
- ⚡ Progress indicators untuk user feedback

## 🎯 Quality Settings

### Video Quality
- **High**: 1080p/720p (best available)
- **Medium**: 480p (balanced)
- **Low**: 360p/240p (smallest size)

### Audio Quality
- **MP3**: Highest available audio bitrate
- **Size**: Significantly smaller than video

## 💡 Best Practices

### For Users
1. Gunakan kualitas rendah jika file terlalu besar
2. Pastikan konten bersifat publik
3. Tunggu hingga proses selesai (jangan spam command)

### For Developers
1. Always validate URLs before processing
2. Check file size limits early
3. Provide clear error messages
4. Implement proper cleanup for temp files

## 🔧 Technical Implementation

### Dependencies
- `ytdl-core`: YouTube download
- `axios`: HTTP requests
- `cheerio`: HTML parsing
- `fs-extra`: File operations

### Architecture
```
Command (dl/ytv/yta) → MediaDownloader → Platform-specific logic → Result
```

### File Flow
1. URL validation
2. Media info extraction
3. Download with size checking
4. Buffer to WhatsApp media
5. Send to user

## 🚀 Future Enhancements

### Planned Features
- [ ] Twitter/X support
- [ ] Playlist download (with limits)
- [ ] Custom resolution selection
- [ ] Download queue for multiple files
- [ ] Progress tracking for large files

### Performance Optimizations
- [ ] Streaming instead of full buffer
- [ ] Parallel downloads
- [ ] Cache for media info
- [ ] Compression options

## 📊 Monitoring

### PM2 Logs
```bash
pm2 logs lazbot
```

### Error Types to Monitor
- Download failures
- Size limit exceeded
- Platform API changes
- Network timeouts

## 🔐 Security Considerations

### Input Validation
- URL sanitization
- File type checking
- Size limits enforcement

### Rate Limiting
- Per-user download limits
- Cooldown periods
- Abuse prevention

### Privacy
- No storage of downloaded content
- No user tracking
- Temporary file cleanup

---

*LazBot v1.0.0 - Download Feature Documentation*
