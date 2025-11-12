export default class CommandRegistry {
  constructor() {
    this.commands = new Map();
  }

  register(command) {
    const key = command.name.toLowerCase();
    this.commands.set(key, command);
  }

  get(name) {
    if (!name) return undefined;
    return this.commands.get(name.toLowerCase());
  }

  list() {
    return [...this.commands.values()];
  }

  clear() {
    this.commands.clear();
  }

  size() {
    return this.commands.size;
  }
}
