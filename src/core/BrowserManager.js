import fs from 'fs-extra';
import path from 'node:path';

const DEFAULT_BROWSER_PATHS = {
  linux: [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ],
  win32: [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ]
};

const LOCK_FILES = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];

export default class BrowserManager {
  constructor(sessionPath) {
    this.sessionPath = sessionPath;
  }

  resolveExecutable() {
    const envCandidates = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_PATH
    ].filter(Boolean);

    const platformCandidates = DEFAULT_BROWSER_PATHS[process.platform] || DEFAULT_BROWSER_PATHS.linux;
    const candidates = [...envCandidates, ...platformCandidates];

    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return undefined;
  }

  cleanupLocks() {
    if (!this.sessionPath || !fs.existsSync(this.sessionPath)) {
      return;
    }

    const targets = [this.sessionPath];
    const entries = fs.readdirSync(this.sessionPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('session')) {
        targets.push(path.join(this.sessionPath, entry.name));
      }
    }

    let removed = 0;
    for (const dir of targets) {
      for (const lock of LOCK_FILES) {
        const lockPath = path.join(dir, lock);
        if (fs.existsSync(lockPath)) {
          fs.removeSync(lockPath);
          removed += 1;
        }
      }
    }

    if (removed > 0) {
      console.log(`🧹 Removed ${removed} stale Chrome lock files`);
    }
  }
}
