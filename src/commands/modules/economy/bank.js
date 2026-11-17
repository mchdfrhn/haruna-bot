import { userModel, walletModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'

const SUB_ALIAS = { deposit: 'deposit', tabung: 'deposit', withdraw: 'withdraw', ambil: 'withdraw' }

export default {
  name: 'bank',
  aliases: ['deposit', 'withdraw', 'tabung', 'ambil'],
  category: 'economy',
  description: 'Simpan (deposit) atau ambil (withdraw) uang dari bank',
  usage: ['bank deposit <jumlah|all>', 'bank withdraw <jumlah|all>', 'deposit <jumlah|all>', 'withdraw <jumlah|all>'],
  examples: ['bank deposit 5000', 'deposit all', 'withdraw 1k'],
  cooldown: 5_000,

  async execute(ctx) {
    // Bisa dipanggil lewat alias (!deposit 100) maupun subcommand (!bank deposit 100)
    const aliasSub = SUB_ALIAS[ctx.commandName]
    const sub = aliasSub ?? SUB_ALIAS[ctx.args[0]?.toLowerCase()]
    const amountArg = aliasSub ? ctx.args[0] : ctx.args[1]

    if (!sub || !amountArg) return ctx.usage('Cara pakai:\n`!bank deposit <jumlah|all>`\n`!bank withdraw <jumlah|all>`')

    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    const wallet = walletModel.find(ctx.sender)

    let amount
    if (amountArg.toLowerCase() === 'all') {
      amount = sub === 'deposit' ? Math.min(wallet.cash, wallet.bank_limit - wallet.bank) : wallet.bank
    } else {
      amount = F.parseAmount(amountArg)
    }
    if (!amount || amount <= 0) return ctx.usage('Jumlah harus berupa angka lebih dari 0 (contoh: `5000`, `2k`, atau `all`).')

    try {
      if (sub === 'deposit') {
        walletModel.deposit(ctx.sender, amount)
        const w = walletModel.find(ctx.sender)
        await ctx.reply(`✅ Deposit *${F.formatNumber(amount)}* ke bank berhasil!\n🏦 Bank: *${F.formatNumber(w.bank)}* / ${F.formatNumber(w.bank_limit)}`)
      } else {
        walletModel.withdraw(ctx.sender, amount)
        const w = walletModel.find(ctx.sender)
        await ctx.reply(`✅ Withdraw *${F.formatNumber(amount)}* dari bank berhasil!\n🪙 Cash: *${F.formatNumber(w.cash)}*`)
      }
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
