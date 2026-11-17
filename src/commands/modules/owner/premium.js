import { userModel } from '#storage/models/index.js'
import { phoneToJid } from '#helpers/identifier.js'

const DAY = 24 * 60 * 60 * 1000

export default {
  name: 'premium',
  aliases: ['addprem', 'delprem'],
  category: 'owner',
  description: 'Tambah / cabut status premium user',
  usage: ['premium add @user [hari]', 'premium del @user', 'addprem @user [hari]', 'delprem @user'],
  examples: ['premium add @budi 30', 'addprem 628123456789 7', 'delprem @budi'],
  cooldown: 0, ownerOnly: true,

  async execute(ctx) {
    const viaAlias = { addprem: 'add', delprem: 'del' }[ctx.commandName]
    const sub = viaAlias ?? ctx.args[0]?.toLowerCase()
    const rest = viaAlias ? ctx.args : ctx.args.slice(1)

    const phoneArg = rest.find(a => /^\+?\d{8,}$/.test(a))
    const targetJid = ctx.mentions[0] ?? (phoneArg ? phoneToJid(phoneArg) : null)
    const dayArg = rest.find(a => /^\d{1,4}$/.test(a))

    if ((sub === 'add' || sub === 'del' || sub === 'remove') && !targetJid) {
      return ctx.usage('Cara pakai: `!premium add @user [hari]` · `!premium del @user`')
    }

    if (sub === 'add') {
      const days = parseInt(dayArg) || 30
      userModel.ensure(targetJid)
      userModel.setPremium(targetJid, days * DAY)
      return ctx.reply(`✅ @${targetJid.split('@')[0]} dapat premium ${days} hari.`, { mentions: [targetJid] })
    }

    if (sub === 'del' || sub === 'remove') {
      userModel.removePremium(targetJid)
      return ctx.reply(`✅ Premium @${targetJid.split('@')[0]} dicabut.`, { mentions: [targetJid] })
    }

    return ctx.usage('Cara pakai: `!premium add @user [hari]` · `!premium del @user`')
  },
}
