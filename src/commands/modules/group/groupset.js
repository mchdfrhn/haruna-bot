import { groupModel } from '#storage/models/index.js'

const FEATURES = {
  antilink: { label: '📎 Antilink', info: 'hapus pesan berisi link' },
  antiflood: { label: '🌊 Antiflood', info: 'hapus spam (>5 pesan / 10 detik)' },
  mute: { label: '🔇 Mute', info: 'bot diam di grup ini (hanya !groupset yang jalan)' },
  nsfw: { label: '🔞 NSFW', info: 'izinkan konten dewasa' },
}

export default {
  name: 'groupset',
  aliases: ['gset', 'grpset'],
  category: 'group',
  description: 'Atur fitur grup: antilink, antiflood, mute, nsfw (admin)',
  usage: ['groupset', 'groupset <antilink|antiflood|mute|nsfw> <on|off>'],
  examples: ['groupset', 'groupset antilink on', 'gset mute off'],
  cooldown: 5_000, groupOnly: true, adminOnly: true,

  async execute(ctx) {
    const feature = ctx.args[0]?.toLowerCase()
    const value = ctx.args[1]?.toLowerCase()

    if (!FEATURES[feature] || !['on', 'off'].includes(value)) {
      const g = groupModel.find(ctx.jid)
      const lines = Object.entries(FEATURES).map(([k, f]) => `${f.label}: ${g?.[k] ? '✅ ON' : '❌ OFF'}\n   _${f.info}_`)
      return ctx.usage(`⚙️ *Pengaturan Grup*\n\n${lines.join('\n')}\n\nUbah: \`!groupset <fitur> <on/off>\`\nContoh: \`!groupset antilink on\``)
    }

    groupModel.update(ctx.jid, { [feature]: value === 'on' ? 1 : 0 })
    await ctx.reply(`✅ ${FEATURES[feature].label} *${value === 'on' ? 'diaktifkan' : 'dinonaktifkan'}*.`)
  },
}
