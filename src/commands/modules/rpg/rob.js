import { robService } from '#features/combat/rob.js'
import { userModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'
import { phoneToJid } from '#helpers/identifier.js'

export default {
  name: 'rob',
  aliases: ['rampok', 'mencuri'],
  category: 'rpg',
  description: 'Rampok cash user lain (1x sehari, bisa gagal & kena denda)',
  usage: ['rob @user', 'rob <nomor>'],
  examples: ['rob @budi'],
  cooldown: 24 * 60 * 60 * 1000,

  async execute(ctx) {
    const targetJid = ctx.mentions[0] ?? (ctx.args[0] ? phoneToJid(ctx.args[0]) : null)
    if (!targetJid) return ctx.usage('Cara pakai: `!rob @user`\nContoh: `!rob @budi`')
    if (targetJid === ctx.sender) return ctx.usage('❌ Tidak bisa merampok diri sendiri.')

    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    const target = userModel.findById(targetJid)
    if (!target) return ctx.usage('❌ User belum terdaftar (belum pernah memakai bot).')

    try {
      await ctx.typing()
      const result = robService.attempt(ctx.sender, targetJid)
      if (result.success) {
        await ctx.reply(`✅ *Berhasil merampok!*\n🪙 +${F.formatNumber(result.stolen)}\n🎯 Chance: ${result.chance}%`)
      } else {
        await ctx.reply(`❌ *Gagal!* Kamu ketangkap!\n💸 Denda: 🪙${F.formatNumber(result.penalty)}`)
      }
    } catch (err) {
      await ctx.usage(`❌ ${err.message}`)
    }
  },
}
