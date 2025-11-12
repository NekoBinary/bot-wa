import Command from '../core/Command.js';

export default class HelpCommand extends Command {
  constructor() {
    super({
      name: 'help',
      description: 'Menampilkan daftar command yang tersedia',
      usage: '.help [command]',
      category: 'Info'
    });
  }

  async run({ message, args, registry }) {
    try {
      if (!registry) {
        await message.reply('❌ Command registry belum siap. Coba lagi dalam beberapa detik.');
        return;
      }

      if (args.length > 0) {
        const target = registry.get(args[0]);
        if (!target) {
          await message.reply(`❌ Command "${args[0]}" tidak ditemukan!`);
          return;
        }

        await message.reply(
          `📌 *${target.name.toUpperCase()}*\n\n` +
          `📝 Deskripsi:\n${target.description}\n\n` +
          `💡 Penggunaan:\n${target.usage}`
        );
        return;
      }

      const commands = registry.list();
      if (commands.length === 0) {
        await message.reply('❌ Tidak ada command yang tersedia!');
        return;
      }

      const grouped = commands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) {
          acc[cmd.category] = [];
        }
        acc[cmd.category].push(cmd);
        return acc;
      }, {});

      let text = `🤖 *${process.env.BOT_NAME || 'LazBot'} - Daftar Command*\n`;

      Object.entries(grouped).forEach(([category, cmdList]) => {
        text += `\n📂 *${category}*\n`;
        cmdList.forEach((cmd) => {
          text += `  • .${cmd.name} - ${cmd.description}\n`;
        });
      });

      text += `\n💬 Ketik .help <command> untuk info detail`;
      await message.reply(text);
    } catch (error) {
      console.error('Error in help command:', error);
      await message.reply('❌ Gagal menampilkan daftar command.');
    }
  }
}
