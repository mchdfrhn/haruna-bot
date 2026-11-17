import { commandRegistry } from '#commands/registry.js'
import { reloadCommand, reloadAllCommands } from '#commands/loader.js'

export default {
  name: 'reload',
  aliases: ['rl', 'restart'],
  category: 'owner',
  description: 'Hot-reload command tanpa restart, atau restart bot',
  usage: ['reload <command>', 'reload all', 'reload bot', 'restart'],
  examples: ['reload daily', 'reload all', 'restart'],
  cooldown: 0, ownerOnly: true,

  async execute(ctx) {
    const sub = ctx.commandName === 'restart' ? 'bot' : ctx.args[0]?.toLowerCase()

    if (!sub) return ctx.usage('Cara pakai:\n`!reload <command>` — reload satu command\n`!reload all` — reload semua command\n`!reload bot` / `!restart` — restart proses bot')

    if (sub === 'all' || sub === 'commands') {
      const { ok, failed } = await reloadAllCommands()
      return ctx.reply(`✅ ${ok} file command di-reload${failed ? `, ❌ ${failed} gagal (cek log)` : ''}.`)
    }

    if (sub === 'bot' || sub === 'hard') {
      await ctx.reply('🔄 Merestart bot... (butuh PM2 / Docker restart policy agar otomatis hidup lagi)')
      // SIGTERM → shutdown handler menutup socket & database dengan rapi sebelum exit
      setTimeout(() => process.kill(process.pid, 'SIGTERM'), 500)
      return
    }

    const file = commandRegistry.getFile(sub)
    if (!file) return ctx.usage(`❌ Command \`${sub}\` tidak ditemukan.`)
    const ok = await reloadCommand(file)
    await ctx.reply(ok ? `✅ Command \`${commandRegistry.get(sub)?.name ?? sub}\` di-reload.` : `❌ Gagal reload \`${sub}\` (cek log).`)
  },
}
