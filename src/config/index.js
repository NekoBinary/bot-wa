import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveSessionPath() {
  if (process.env.SESSION_PATH) {
    return path.resolve(process.env.SESSION_PATH);
  }

  const rootSession = path.join(process.cwd(), '.sessions');
  if (fs.existsSync(rootSession)) {
    return rootSession;
  }

  const legacySession = path.join(process.cwd(), 'dist', '.sessions');
  if (fs.existsSync(legacySession)) {
    return legacySession;
  }

  return rootSession;
}

const config = {
  prefix: process.env.BOT_PREFIX || '.',
  ownerNumber: process.env.OWNER_NUMBER || '62xxxxxxxxxxxx',
  botName: process.env.BOT_NAME || 'LazBot',
  sessionPath: resolveSessionPath(),
  commandsDir: path.join(__dirname, '..', 'commands'),
  tempDir: path.join(process.cwd(), 'temp'),
  logLevel: process.env.LOG_LEVEL || 'info',
  maxDownloadSize: Number(process.env.MAX_DOWNLOAD_MB || 50)
};

export default config;
