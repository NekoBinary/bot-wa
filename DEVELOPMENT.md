# LazBot Development Guide

## 🚀 Quick Start

### Development Mode
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Production Deployment

#### With PM2 (Recommended for VPS)
```bash
# Deploy with PM2
./deploy.sh

# Or manually:
pnpm run build
pnpm run pm2:start
```

#### With Docker
```bash
# Deploy with Docker
./deploy-docker.sh

# Or manually:
cp .env.example .env  # Edit configuration
docker-compose up -d --build
```

## 📁 Project Structure

```
lazbot/
├── app/
│   ├── index.ts          # Application entry point
│   └── utils/
│       ├── bot.ts        # WhatsApp bot logic
│       └── sticker.ts    # Sticker processing utilities
├── commands/
│   ├── s.ts             # Sticker creation command
│   ├── smeme.ts         # Meme sticker command
│   └── help.ts          # Help command
├── types/
│   └── index.ts         # TypeScript type definitions
├── logs/                # Application logs (created at runtime)
├── .sessions/           # WhatsApp session storage (created at runtime)
├── temp/                # Temporary files for processing
├── ecosystem.config.js  # PM2 configuration
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Docker image configuration
└── package.json         # Project dependencies and scripts
```

## 🛠️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
BOT_PREFIX=.                    # Command prefix
BOT_NAME=LazBot                # Bot display name
OWNER_NUMBER=62xxxxxxxxxxxx    # Owner WhatsApp number
SESSION_PATH=./.sessions       # Session storage path
NODE_ENV=production           # Environment mode
```

### PM2 Configuration

Edit `ecosystem.config.js`:
- Adjust memory limits
- Configure log files
- Set environment variables
- Configure deployment settings

### Docker Configuration

Edit `docker-compose.yml`:
- Adjust resource limits
- Configure volumes
- Set environment variables
- Configure networking

## 🔧 Adding New Commands

1. Create new file in `commands/` directory:
```typescript
// commands/newcommand.ts
import { CommandHandler, CommandContext } from '../types';

const newCommand: CommandHandler = {
  name: 'newcommand',
  description: 'Description of the command',
  usage: '.newcommand [parameters]',
  
  async execute(context: CommandContext): Promise<void> {
    const { message, args, client } = context;
    
    // Command logic here
    await message.reply('Hello from new command!');
  }
};

export default newCommand;
```

2. The command will be automatically registered on bot restart.

## 📊 Monitoring

### PM2 Monitoring
```bash
pnpm run pm2:logs    # View logs
pnpm run pm2:monit   # Process monitor
pm2 status           # Process status
```

### Docker Monitoring
```bash
pnpm run docker:compose:logs  # View logs
docker-compose ps             # Container status
docker stats                  # Resource usage
```

## 🐛 Debugging

### Common Issues

1. **Canvas/Sharp build errors**
   - ~~Install Python and build tools~~ **FIXED**
   - We use Sharp with SVG overlay instead of Canvas
   - No native dependencies required

2. **Error "webpmux not available"**
   - ~~Install webpmux: `npm install -g node-webpmux`~~ **REMOVED**
   - Stickers work without metadata (simplified approach)

3. **Error ffmpeg not found**
   - Install ffmpeg di sistem
   - Atau gunakan ffmpeg-static (sudah included)

4. **Session expired**
   - Delete `.sessions` folder
   - Restart bot and scan QR again

5. **Permission errors**
   - Check file permissions: `chmod -R 755 .sessions logs temp`

### Logs Location
- PM2: `./logs/` directory
- Docker: `docker-compose logs lazbot`
- Development: Console output

## 🚀 Performance Optimization

### For VPS Deployment
- Use PM2 cluster mode for multiple instances
- Configure nginx reverse proxy
- Set up log rotation
- Monitor memory usage

### For Docker Deployment
- Use multi-stage builds for smaller images
- Configure resource limits
- Use volume mounts for persistent data
- Set up container health checks

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use secrets management in production

2. **File Permissions**
   - Restrict access to session files
   - Use non-root user in Docker

3. **Network Security**
   - Use reverse proxy in production
   - Configure firewall rules
   - Enable HTTPS if exposing web interface

## 📝 Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   pnpm run dev  # Test changes
   git commit -m "Add new feature"
   ```

2. **Testing**
   ```bash
   pnpm run lint     # Type checking
   pnpm run build    # Compilation test
   ```

3. **Deployment**
   ```bash
   git push origin main
   ./deploy.sh       # PM2 deployment
   # or
   ./deploy-docker.sh # Docker deployment
   ```

## 📚 Additional Resources

- [WhatsApp Web.js Documentation](https://wwebjs.dev/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
