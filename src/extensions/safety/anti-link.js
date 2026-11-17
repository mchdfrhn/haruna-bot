import { groupModel } from '#storage/models/index.js'
import { logger } from '#helpers/logger.js'
import { isOwnerJid } from '#helpers/owner.js'

const LINK_PATTERN = /https?:\/\//i
const WA_LINK = /chat\.whatsapp\.com/i

export default {
  name: 'anti-link',

  init() { logger.debug('[AntiLink] Initialized') },

  async processMessage(s, sock) {
    if (!s.isGroup || s.fromMe) return true

    const group = groupModel.find(s.jid)
    if (!group?.antilink) return true

    if (!LINK_PATTERN.test(s.text) && !WA_LINK.test(s.text)) return true

    // Admin grup & owner bebas mengirim link
    if (isOwnerJid(s.sender) || (s.senderAlt && isOwnerJid(s.senderAlt))) return true
    try {
      const meta = await sock.groupMetadata(s.jid)
      const mine = new Set([s.sender, s.senderAlt].filter(Boolean))
      const isAdmin = meta.participants.some(p => p.admin && [p.id, p.phoneNumber, p.lid].some(j => j && mine.has(j)))
      if (isAdmin) return true
    } catch { /* metadata gagal → tetap proses sebagai member biasa */ }

    try {
      await sock.sendMessage(s.jid, { delete: s.key })
      await sock.sendMessage(s.jid, {
        text: `@${s.sender.split('@')[0]} link tidak diizinkan di grup ini!`,
        mentions: [s.sender],
      })
      logger.info({ jid: s.jid, sender: s.sender }, '[AntiLink] Link removed')
    } catch (err) {
      logger.error({ err }, '[AntiLink] Delete failed')
    }

    return false
  },
}
