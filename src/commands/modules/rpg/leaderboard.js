import { userModel, statsModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'

export default {
  name: 'leaderboard',
  aliases: ['lb', 'top', 'ranking'],
  category: 'rpg',
  description: 'Peringkat user berdasarkan level atau kemenangan PvP',
  usage: ['leaderboard [pvp] [jumlah]'],
  examples: ['leaderboard', 'top pvp 5'],
  cooldown: 10_000,

  async execute(ctx) {
    const sub = ctx.args[0]?.toLowerCase()
    const limitArg = /^\d+$/.test(sub ?? '') ? sub : ctx.args[1]
    const limit = Math.min(25, Math.max(1, parseInt(limitArg) || 10))

    if (sub === 'pvp' || sub === 'battle') {
      const top = statsModel.topWins(limit)
      if (!top.length) return ctx.reply('Belum ada data PvP.')
      let text = `🏆 *Leaderboard PvP* (Top ${limit})\n\n`
      top.forEach((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
        const total = u.win + u.loss
        const wr = total === 0 ? '0%' : `${Math.round((u.win / total) * 100)}%`
        text += `${medal} *${u.push_name || u.jid.split('@')[0]}* — ${u.win}W/${u.loss}L (${wr})\n`
      })
      return ctx.reply(text)
    }

    const top = userModel.leaderboard(limit)
    if (!top.length) return ctx.reply('Belum ada data user.')
    let text = `⭐ *Leaderboard Level* (Top ${limit})\n\n`
    top.forEach((u, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      text += `${medal} *${u.push_name || u.jid.split('@')[0]}* — Level ${u.level} | 🪙${F.formatNumber(u.total_balance ?? 0)}\n`
    })
    await ctx.reply(text)
  },
}
