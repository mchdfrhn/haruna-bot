import { broadcastService } from '#features/broadcast.js'

export default {
  name: 'broadcast',
  aliases: ['bc', 'siaran'],
  category: 'owner',
  description: 'Kirim pesan massal ke semua grup atau semua user',
  usage: ['broadcast group <pesan>', 'broadcast user <pesan>'],
  examples: ['broadcast group Bot akan maintenance jam 22.00'],
  cooldown: 0, ownerOnly: true,

  async execute(ctx) {
    const sub = ctx.args[0]?.toLowerCase()
    const target = ['group', 'grup'].includes(sub) ? 'group' : sub === 'user' ? 'user' : null
    const text = ctx.args.slice(1).join(' ').trim()

    if (!target || !text) return ctx.usage('Cara pakai: `!broadcast <group/user> <pesan>`\nContoh: `!broadcast group Halo semua!`')

    try {
      await ctx.reply(`📡 Mengirim broadcast ke semua ${target === 'group' ? 'grup' : 'user'}...`)
      const result = target === 'group'
        ? await broadcastService.toAllGroups(ctx.sock, { text })
        : await broadcastService.toAllUsers(ctx.sock, { text })
      await ctx.reply(`✅ Broadcast selesai: ${result.sent} terkirim, ${result.failed} gagal.`)
    } catch (err) {
      await ctx.reply(`❌ Broadcast gagal: ${err.message}`)
    }
  },
}
