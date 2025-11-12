export default class Command {
  constructor({ name, description, usage, category }) {
    if (!name) {
      throw new Error('Command name is required');
    }

    this.meta = {
      name: name.toLowerCase(),
      description: description || 'Tidak ada deskripsi',
      usage: usage || `.${name}`,
      category: category || 'General'
    };
  }

  get name() {
    return this.meta.name;
  }

  get description() {
    return this.meta.description;
  }

  get usage() {
    return this.meta.usage;
  }

  get category() {
    return this.meta.category;
  }

  async run() {
    throw new Error(`Command ${this.name} belum mengimplementasikan run()`);
  }

  async execute(context) {
    return this.run(context);
  }
}
