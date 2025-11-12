import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Command from './Command.js';

export default class CommandLoader {
  constructor(commandDirectory) {
    this.commandDirectory = commandDirectory;
  }

  async loadInto(registry) {
    registry.clear();

    let files;
    try {
      files = await readdir(this.commandDirectory);
    } catch (error) {
      console.error('❌ Tidak dapat membaca folder commands:', error);
      return;
    }

    const candidates = files.filter((file) => file.endsWith('.js')).sort();

    for (const file of candidates) {
      const modulePath = path.join(this.commandDirectory, file);
      const moduleUrl = `${pathToFileURL(modulePath).href}?update=${Date.now()}`;

      try {
        const imported = await import(moduleUrl);
        const CommandClass = imported.default || imported;
        const instance = typeof CommandClass === 'function' ? new CommandClass() : CommandClass;

        if (!(instance instanceof Command)) {
          console.warn(`⚠️ ${file} bukan turunan Command. Lewati.`);
          continue;
        }

        registry.register(instance);
        console.log(`✅ Command ready: ${instance.name}`);
      } catch (error) {
        console.error(`❌ Gagal load command ${file}:`, error);
      }
    }

    console.log(`📦 Command registry ready (${registry.size()})`);
  }
}
