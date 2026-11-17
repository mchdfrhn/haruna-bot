import { questModel, userModel, walletModel, inventoryModel, itemModel } from '#storage/models/index.js'
import { db } from '#storage/connection.js'
import { F } from '#helpers/index.js'

const bar = (cur, goal) => { const f = Math.round((cur / goal) * 10); return '█'.repeat(f) + '░'.repeat(10 - f) }

export default {
  name: 'quest',
  aliases: ['mission', 'tugas'],
  category: 'rpg',
  description: 'Lihat progres quest dan klaim hadiahnya',
  usage: ['quest', 'quest claim <id_quest>', 'quest claim all'],
  examples: ['quest', 'quest claim daily_win', 'quest claim all'],
  cooldown: 5_000,

  async execute(ctx) {
    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    // Pastikan semua quest muncul di daftar walau progresnya masih 0
    for (const q of questModel.allQuests()) questModel.ensure(ctx.sender, q.id)

    const sub = ctx.args[0]?.toLowerCase()
    if (sub === 'claim') {
      const target = ctx.args[1]?.toLowerCase()
      if (!target) return ctx.usage('Cara pakai: `!quest claim <id_quest>` atau `!quest claim all`')

      const all = questModel.getAllProgress(ctx.sender)
      const ready = target === 'all' ? all.filter(q => q.completed && !q.claimed) : all.filter(q => q.quest_id === target)
      if (!ready.length) return ctx.usage(target === 'all' ? '📋 Belum ada quest yang siap diklaim.' : '❌ Quest tidak ditemukan. Lihat ID di `!quest`.')

      const lines = []
      for (const q of ready) {
        if (!q.completed) { lines.push(`⏳ *${q.name}* belum selesai (${q.progress}/${q.goal})`); continue }
        if (q.claimed) { lines.push(`✅ *${q.name}* sudah diklaim`); continue }
        db.transaction(() => {
          if (!questModel.claim(ctx.sender, q.quest_id)) return
          if (q.reward_cash > 0) walletModel.reward(ctx.sender, q.reward_cash, `quest: ${q.quest_id}`)
          if (q.reward_exp > 0) userModel.addExp(ctx.sender, q.reward_exp)
          if (q.reward_item) inventoryModel.add(ctx.sender, q.reward_item, 1)
        })()
        const bits = []
        if (q.reward_cash > 0) bits.push(`🪙${F.formatNumber(q.reward_cash)}`)
        if (q.reward_exp > 0) bits.push(`⭐${q.reward_exp} EXP`)
        if (q.reward_item) bits.push(`📦 ${itemModel.findById(q.reward_item)?.name ?? q.reward_item}`)
        lines.push(`🎁 *${q.name}* diklaim: ${bits.join(' · ')}`)
      }
      return ctx.reply(lines.join('\n'))
    }

    const progress = questModel.getAllProgress(ctx.sender)
    if (!progress.length) return ctx.reply('📋 Belum ada quest. Minta owner menjalankan `npm run db:seed`.')

    const TYPE = { daily: '📅 HARIAN', weekly: '🗓️ MINGGUAN', story: '📖 STORY' }
    let text = '📋 *Quest Progress*\n'
    let lastType = null
    for (const q of progress) {
      if (q.type !== lastType) { text += `\n*${TYPE[q.type] ?? q.type.toUpperCase()}*\n`; lastType = q.type }
      const badge = q.claimed ? '✅' : q.completed ? '🎁' : '📌'
      text += `${badge} *${q.name}* — \`${q.quest_id}\`\n  ${bar(q.progress, q.goal)} ${q.progress}/${q.goal}\n  _${q.description}_\n`
    }
    text += '\n🎁 = siap diklaim → `!quest claim <id>` atau `!quest claim all`'
    await ctx.reply(text)
  },
}
