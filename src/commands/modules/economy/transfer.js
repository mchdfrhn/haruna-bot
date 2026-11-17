import { userModel, walletModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'
import { phoneToJid } from '#helpers/identifier.js'

const TAX_RATE = 0.05

export default {
  name: 'transfer',
  aliases: ['tf', 'kirim'],
  category: 'economy',
  description: 'Kirim cash ke user lain (pajak 5%)',
  usage: ['transfer @user <jumlah>', 'transfer <nomor> <jumlah>'],
  examples: ['transfer @budi 5000', 'transfer 628123456789 2k'],
  cooldown: 10_000,

  async execute(ctx) {
    const fromMention = ctx.mentions[0]
    // Argumen mention (@123) bukan angka jumlah; ambil token terakhir sebagai jumlah.
    const amountArg = ctx.args.filter(a => !a.startsWith('@')).at(-1)
    const phoneArg = fromMention ? null : ctx.args.find(a => /^\+?\d{8,}$/.test(a) && a !== amountArg)
    const targetJid = fromMention ?? (phoneArg ? phoneToJid(phoneArg) : null)
    const amount = F.parseAmount(amountArg)

    if (!targetJid || !amount) return ctx.usage('Cara pakai: `!transfer @user <jumlah>`\nContoh: `!transfer @budi 5000`')
    if (targetJid === ctx.sender) return ctx.usage('❌ Tidak bisa transfer ke diri sendiri.')
    if (!userModel.findById(targetJid)) return ctx.usage('❌ User tujuan belum terdaftar (belum pernah memakai bot).')

    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    const tax = Math.floor(amount * TAX_RATE)

    try {
      // Pengirim membayar jumlah + pajak; penerima hanya menerima jumlah penuh.
      walletModel.transfer(ctx.sender, targetJid, amount, 'transfer', tax)
      await ctx.reply(`✅ Transfer *${F.formatNumber(amount)}* ke @${targetJid.split('@')[0]} berhasil!\n💰 Pajak: *${F.formatNumber(tax)}* (total dipotong ${F.formatNumber(amount + tax)})`, { mentions: [targetJid] })
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
