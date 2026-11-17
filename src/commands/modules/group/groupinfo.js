export default {
  name: 'groupinfo',
  aliases: ['ginfo', 'infogrup'],
  category: 'group',
  description: 'Lihat info grup: nama, jumlah member/admin, deskripsi',
  usage: ['groupinfo'],
  examples: ['groupinfo'],
  cooldown: 5_000, groupOnly: true,

  async execute(ctx) {
    let meta
    try {
      meta = await ctx.sock.groupMetadata(ctx.jid)
    } catch {
      return ctx.reply('Gagal mengambil data grup.')
    }
    const admins = meta.participants.filter(p => p.admin).length
    const created = meta.creation ? new Date(meta.creation * 1000).toLocaleDateString('id-ID') : '-'
    const text = [
      `👥 *${meta.subject}*`,
      '',
      `🆔 ${meta.id}`,
      `👤 Member: ${meta.participants.length}`,
      `👑 Admin: ${admins}`,
      `📅 Dibuat: ${created}`,
      `📝 ${meta.desc || 'Tidak ada deskripsi'}`,
    ].join('\n')

    await ctx.reply(text)
  },
}
