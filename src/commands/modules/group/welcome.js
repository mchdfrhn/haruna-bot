import { groupModel } from '#storage/models/index.js'

export default {
  name: 'welcome',
  aliases: ['setwelcome'],
  category: 'group',
  description: 'Atur pesan sambutan member baru (admin)',
  usage: ['welcome', 'welcome on|off', 'welcome set <pesan>', 'welcome reset'],
  examples: ['welcome on', 'welcome set Halo {name}, selamat datang di {group}! Kamu member ke-{count}'],
  cooldown: 5_000, groupOnly: true, adminOnly: true,

  async execute(ctx) {
    // !setwelcome <pesan> = !welcome set <pesan>
    const viaAlias = ctx.commandName === 'setwelcome'
    const sub = viaAlias ? 'set' : ctx.args[0]?.toLowerCase()
    const msg = (viaAlias ? ctx.rawArgs : ctx.args.slice(1).join(' ')).trim()

    if (sub === 'on' || sub === 'enable' || sub === 'off' || sub === 'disable') {
      const enabled = sub === 'on' || sub === 'enable'
      groupModel.update(ctx.jid, { welcome: enabled ? 1 : 0 })
      return ctx.reply(`✅ Welcome message ${enabled ? 'diaktifkan' : 'dinonaktifkan'}.`)
    }

    if (sub === 'set') {
      if (!msg) return ctx.usage('Cara pakai: `!welcome set <pesan>`\nVariabel: `{name}` `{group}` `{count}`')
      groupModel.update(ctx.jid, { welcome_msg: msg })
      return ctx.reply('✅ Pesan welcome diupdate.')
    }

    if (sub === 'reset') {
      groupModel.update(ctx.jid, { welcome_msg: '' })
      return ctx.reply('✅ Pesan welcome dikembalikan ke default.')
    }

    const settings = groupModel.find(ctx.jid)
    await ctx.usage([
      '👋 *Welcome Settings*',
      '',
      `Status: ${settings?.welcome ? '✅ Aktif' : '❌ Nonaktif'}`,
      `Pesan : ${settings?.welcome_msg || '(default)'}`,
      '',
      '`!welcome on` / `!welcome off`',
      '`!welcome set <pesan>` — variabel: `{name}` `{group}` `{count}`',
      '`!welcome reset`',
    ].join('\n'))
  },
}
