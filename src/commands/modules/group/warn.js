import { db } from '#storage/connection.js'
import { phoneToJid } from '#helpers/identifier.js'
import { logger } from '#helpers/logger.js'

const MAX_WARNS = 3

export default {
  name: 'warn',
  aliases: ['peringatan', 'warning'],
  category: 'group',
  description: `Beri peringatan ke member — ${MAX_WARNS}x warn = otomatis kick (admin)`,
  usage: ['warn @user [alasan]', 'warn list @user', 'warn reset @user'],
  examples: ['warn @budi spam link', 'warn list @budi', 'warn reset @budi'],
  cooldown: 5_000, groupOnly: true, adminOnly: true,

  async execute(ctx) {
    const action = ['list', 'reset'].includes(ctx.args[0]?.toLowerCase()) ? ctx.args[0].toLowerCase() : null
    const rest = action ? ctx.args.slice(1) : ctx.args
    const targetJid = ctx.mentions[0] ?? (rest[0] && /^\+?\d{8,}$/.test(rest[0]) ? phoneToJid(rest[0]) : null)
    if (!targetJid) return ctx.usage('Cara pakai:\n`!warn @user [alasan]`\n`!warn list @user`\n`!warn reset @user`')

    const tag = `@${targetJid.split('@')[0]}`
    const countOf = () => db.prepare('SELECT COUNT(*) AS c FROM warns WHERE jid = ? AND group_jid = ?').get(targetJid, ctx.jid).c

    if (action === 'list') {
      const rows = db.prepare('SELECT reason, created_at FROM warns WHERE jid = ? AND group_jid = ? ORDER BY id').all(targetJid, ctx.jid)
      if (!rows.length) return ctx.reply(`✅ ${tag} tidak punya warn.`, { mentions: [targetJid] })
      const lines = rows.map((r, i) => `${i + 1}. ${r.reason}`).join('\n')
      return ctx.reply(`⚠️ *Warn ${tag}* (${rows.length}/${MAX_WARNS})\n\n${lines}`, { mentions: [targetJid] })
    }

    if (action === 'reset') {
      db.prepare('DELETE FROM warns WHERE jid = ? AND group_jid = ?').run(targetJid, ctx.jid)
      return ctx.reply(`✅ Warn ${tag} direset.`, { mentions: [targetJid] })
    }

    if (targetJid === ctx.sender) return ctx.usage('Tidak bisa warn diri sendiri.')

    const reason = rest.filter(a => !a.startsWith('@') && !/^\+?\d{8,}$/.test(a)).join(' ').trim() || 'tanpa alasan'
    db.prepare('INSERT INTO warns (jid, group_jid, reason) VALUES (?, ?, ?)').run(targetJid, ctx.jid, reason)
    const count = countOf()

    if (count >= MAX_WARNS) {
      try {
        await ctx.sock.groupParticipantsUpdate(ctx.jid, [targetJid], 'remove')
        db.prepare('DELETE FROM warns WHERE jid = ? AND group_jid = ?').run(targetJid, ctx.jid)
        await ctx.reply(`🚫 ${tag} mendapat ${MAX_WARNS} warn dan di-kick!`, { mentions: [targetJid] })
      } catch (err) {
        logger.warn({ err }, 'Failed to kick warned user')
        await ctx.reply(`⚠️ ${tag} sudah ${count}/${MAX_WARNS} warn, tapi gagal di-kick (pastikan bot adalah admin).`, { mentions: [targetJid] })
      }
    } else {
      await ctx.reply(`⚠️ ${tag} di-warn (${count}/${MAX_WARNS})\n📝 Alasan: ${reason}`, { mentions: [targetJid] })
    }
  },
}
