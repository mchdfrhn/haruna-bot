export const kickCommand = {
  name: 'kick',
  aliases: ['keluarkan', 'remove'],
  category: 'group',
  description: 'Keluarkan member dari grup (admin)',
  usage: ['kick @user [@user2 ...]'],
  examples: ['kick @budi'],
  cooldown: 5_000, groupOnly: true, adminOnly: true,

  async execute(ctx) {
    const targets = ctx.mentions.length ? ctx.mentions : null
    if (!targets) return ctx.usage('Cara pakai: `!kick @user`')
    for (const jid of targets) {
      if (jid === ctx.sender) return ctx.usage('❌ Tidak bisa kick diri sendiri.')
      try { await ctx.sock.groupParticipantsUpdate(ctx.jid, [jid], 'remove') } catch (err) { return ctx.reply(`❌ ${err.message}`) }
    }
    const names = targets.map(j => `@${j.split('@')[0]}`).join(', ')
    await ctx.reply(`✅ ${names} berhasil di-kick.`, { mentions: targets })
  },
}

export const promoteCommand = {
  name: 'promote',
  aliases: ['jadiadmin', 'promot'],
  category: 'group',
  description: 'Jadikan member sebagai admin grup (admin)',
  usage: ['promote @user'],
  examples: ['promote @budi'],
  cooldown: 5_000, groupOnly: true, adminOnly: true,

  async execute(ctx) {
    const targets = ctx.mentions.length ? ctx.mentions : null
    if (!targets) return ctx.usage('Cara pakai: `!promote @user`')
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, 'promote')
      const names = targets.map(j => `@${j.split('@')[0]}`).join(', ')
      await ctx.reply(`✅ ${names} sekarang jadi admin!`, { mentions: targets })
    } catch (err) { await ctx.reply(`❌ ${err.message}`) }
  },
}

export const demoteCommand = {
  name: 'demote',
  aliases: ['cabutadmin', 'turunkan'],
  category: 'group',
  description: 'Cabut status admin dari member (admin)',
  usage: ['demote @user'],
  examples: ['demote @budi'],
  cooldown: 5_000, groupOnly: true, adminOnly: true,

  async execute(ctx) {
    const targets = ctx.mentions.length ? ctx.mentions : null
    if (!targets) return ctx.usage('Cara pakai: `!demote @user`')
    try {
      await ctx.sock.groupParticipantsUpdate(ctx.jid, targets, 'demote')
      const names = targets.map(j => `@${j.split('@')[0]}`).join(', ')
      await ctx.reply(`✅ Admin ${names} dicabut.`, { mentions: targets })
    } catch (err) { await ctx.reply(`❌ ${err.message}`) }
  },
}
