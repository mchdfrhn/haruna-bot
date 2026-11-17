export default {
  name: 'tagall',
  aliases: ['everyone', 'tag', 'all'],
  category: 'group',
  description: 'Mention semua member grup dengan pesan (admin)',
  usage: ['tagall [pesan]'],
  examples: ['tagall', 'tagall Rapat jam 8 malam!'],
  cooldown: 30_000, groupOnly: true, adminOnly: true,

  async execute(ctx) {
    let meta
    try {
      meta = await ctx.sock.groupMetadata(ctx.jid)
    } catch {
      return ctx.reply('Gagal mengambil data grup.')
    }
    const mentions = meta.participants.map(p => p.id)
    const list = mentions.map(j => `@${j.split('@')[0]}`).join(' ')
    const header = ctx.rawArgs || '📢 Perhatian semua!'

    await ctx.send({ text: `${header}\n\n${list}`, mentions })
  },
}
