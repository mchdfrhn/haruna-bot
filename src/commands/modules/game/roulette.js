import { userModel, walletModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'

// Roda ala Eropa: 18 merah, 18 hitam, 1 hijau (37 slot) — hijau jarang (1/37) tapi bayarannya 36x.
const WHEEL = [...Array(18).fill('🔴'), ...Array(18).fill('⚫'), '🟢']
const COLORS = { red: '🔴', merah: '🔴', black: '⚫', hitam: '⚫', green: '🟢', hijau: '🟢' }
const PAYOUT = { '🔴': 2, '⚫': 2, '🟢': 36 }
const MIN_BET = 100

export default {
  name: 'roulette',
  aliases: ['roul', 'roda'],
  category: 'game',
  description: 'Roulette — tebak warna (merah/hitam 2x, hijau 36x)',
  usage: ['roulette <merah|hitam|hijau> <taruhan>'],
  examples: ['roulette merah 500', 'roul green 1k'],
  cooldown: 5_000,

  async execute(ctx) {
    const pick = COLORS[ctx.args[0]?.toLowerCase()]
    const bet = F.parseAmount(ctx.args[1])

    if (!pick || !bet) return ctx.usage('Cara pakai: `!roulette <merah/hitam/hijau> <taruhan>`\nContoh: `!roulette merah 500`')
    if (bet < MIN_BET) return ctx.usage(`Minimal taruhan: 🪙${MIN_BET}`)

    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    const wallet = walletModel.find(ctx.sender)
    if (!wallet || wallet.cash < bet) return ctx.usage('Saldo cash tidak cukup.')

    const result = WHEEL[Math.floor(Math.random() * WHEEL.length)]
    let msg = `🎡 *ROULETTE*\n\nHasil: ${result}\n`
    if (result === pick) {
      const profit = bet * (PAYOUT[result] - 1)
      walletModel.addCash(ctx.sender, profit)
      msg += `✨ *WIN!* Kamu dapat *${F.formatNumber(bet * PAYOUT[result])}* (${PAYOUT[result]}x)!`
    } else {
      walletModel.addCash(ctx.sender, -bet)
      msg += `😔 *Kalah* — ${F.formatNumber(bet)} hangus.`
    }
    await ctx.reply(msg)
  },
}
