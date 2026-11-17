import { userModel } from '#storage/models/index.js'
import { db } from '#storage/connection.js'
import { phoneToJid } from '#helpers/identifier.js'

export default {
  name: 'ban',
  aliases: ['unban', 'listban'],
  category: 'owner',
  description: 'Ban / unban user dari bot, atau lihat daftar ban',
  usage: ['ban @user', 'unban @user', 'listban'],
  examples: ['ban @budi', 'unban 628123456789', 'listban'],
  cooldown: 0, ownerOnly: true,

  async execute(ctx) {
    if (ctx.commandName === 'listban' || ctx.args[0]?.toLowerCase() === 'list') {
      const banned = db.prepare('SELECT jid, push_name FROM users WHERE banned = 1').all()
      if (!banned.length) return ctx.reply('✅ Tidak ada user yang dibanned.')
      const list = banned.map((u, i) => `${i + 1}. ${u.push_name || u.jid.split('@')[0]} (${u.jid.split('@')[0]})`).join('\n')
      return ctx.reply(`🚫 *Banned Users (${banned.length})*\n\n${list}`)
    }

    const phoneArg = ctx.args.find(a => /^\+?\d{8,}$/.test(a))
    const targetJid = ctx.mentions[0] ?? (phoneArg ? phoneToJid(phoneArg) : null)
    if (!targetJid) return ctx.usage('Cara pakai: `!ban @user` · `!unban @user` · `!listban`')
    if (targetJid === ctx.sender) return ctx.usage('❌ Tidak bisa ban diri sendiri.')

    if (ctx.commandName === 'unban') {
      userModel.unban(targetJid)
      await ctx.reply(`✅ @${targetJid.split('@')[0]} berhasil di-unban.`, { mentions: [targetJid] })
    } else {
      userModel.ensure(targetJid)
      userModel.ban(targetJid)
      await ctx.reply(`🚫 @${targetJid.split('@')[0]} berhasil di-ban.`, { mentions: [targetJid] })
    }
  },
}
