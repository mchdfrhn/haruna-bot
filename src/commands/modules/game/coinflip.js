import { userModel, walletModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'

const SIDES = { heads: 'kepala', tails: 'ekor', kepala: 'kepala', ekor: 'ekor' }
const MIN_BET = 100

export default {
  name: 'coinflip',
  aliases: ['cf', 'flip', 'toss'],
  category: 'game',
  description: 'Tebak sisi koin — menang dapat 2x taruhan',
  usage: ['coinflip <kepala|ekor> <taruhan>'],
  examples: ['coinflip kepala 500', 'cf tails 1k'],
  cooldown: 5_000,

  async execute(ctx) {
    const choice = SIDES[ctx.args[0]?.toLowerCase()]
    const bet = F.parseAmount(ctx.args[1])

    if (!choice || !bet) return ctx.usage('Cara pakai: `!coinflip <kepala/ekor> <taruhan>`\nContoh: `!coinflip kepala 500`')
    if (bet < MIN_BET) return ctx.usage(`Minimal taruhan: 🪙${MIN_BET}`)

    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    const wallet = walletModel.find(ctx.sender)
    if (!wallet || wallet.cash < bet) return ctx.usage('Saldo cash tidak cukup.')

    const result = Math.random() < 0.5 ? 'kepala' : 'ekor'
    if (result === choice) {
      walletModel.addCash(ctx.sender, bet) // untung = 1x taruhan (total kembali 2x)
      await ctx.reply(`🪙 *COINFLIP*\n\nHasil: *${result.toUpperCase()}*\n\n✨ *WIN!* Kamu dapat *${F.formatNumber(bet * 2)}* (untung ${F.formatNumber(bet)})!`)
    } else {
      walletModel.addCash(ctx.sender, -bet)
      await ctx.reply(`🪙 *COINFLIP*\n\nHasil: *${result.toUpperCase()}*\n\n😔 *Kalah* — ${F.formatNumber(bet)} hangus.`)
    }
  },
}
