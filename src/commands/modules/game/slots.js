import { userModel, walletModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣']
const PAYOUTS = { '7️⃣': 10, '💎': 8, '🍇': 5, '🍊': 4, '🍋': 3, '🍒': 2 }
const MIN_BET = 100
const pick = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]

export default {
  name: 'slots',
  aliases: ['slot', 'mesin'],
  category: 'game',
  description: 'Mesin slot — 3 simbol sama = jackpot (2x sampai 10x)',
  usage: ['slots [taruhan]'],
  examples: ['slots', 'slots 500'],
  cooldown: 5_000,

  async execute(ctx) {
    const bet = ctx.args[0] ? F.parseAmount(ctx.args[0]) : MIN_BET
    if (!bet) return ctx.usage('Cara pakai: `!slots [taruhan]` (default 100)')
    if (bet < MIN_BET) return ctx.usage(`Minimal taruhan: 🪙${F.formatNumber(MIN_BET)}`)

    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    const wallet = walletModel.find(ctx.sender)
    if (!wallet || wallet.cash < bet) return ctx.usage('Saldo cash tidak cukup.')

    const [a, b, c] = [pick(), pick(), pick()]
    const line = `${a} | ${b} | ${c}`
    const mult = a === b && b === c ? PAYOUTS[a] : 0

    if (mult > 0) {
      walletModel.addCash(ctx.sender, bet * (mult - 1))
      await ctx.reply(`🎰 *SLOTS*\n\n${line}\n\n✨ *JACKPOT!* Kamu menang *${F.formatNumber(bet * mult)}*! (${mult}x)`)
    } else {
      walletModel.addCash(ctx.sender, -bet)
      await ctx.reply(`🎰 *SLOTS*\n\n${line}\n\n😔 Sayang... Coba lagi! (-${F.formatNumber(bet)})`)
    }
  },
}
