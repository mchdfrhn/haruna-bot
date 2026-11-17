import { botConfigModel } from '#storage/models/index.js'

const KEY_INFO = {
  bot_name: 'Nama bot',
  bot_prefix: 'Prefix command',
  maintenance: '1 = hanya owner yang bisa pakai bot',
  footer_text: 'Teks footer di menu !help',
  thumbnail_url: 'URL gambar thumbnail menu !help',
  menu_url: 'Link pada preview menu',
  menu_title: 'Judul preview menu',
  menu_desc: 'Deskripsi preview menu',
  bot_status: 'Status bot',
}

export default {
  name: 'botsetting',
  aliases: ['botset', 'setbot'],
  category: 'owner',
  description: 'Lihat / ubah pengaturan bot (nama, prefix, maintenance, tampilan menu)',
  usage: ['botsetting', 'botsetting <key> <nilai>', 'botsetting reset <key>'],
  examples: ['botsetting', 'botsetting maintenance 1', 'botsetting bot_prefix .', 'botsetting reset footer_text'],
  cooldown: 0, ownerOnly: true,

  async execute(ctx) {
    const key = ctx.args[0]?.toLowerCase()

    if (!key) {
      const all = botConfigModel.getAllWithDefaults()
      const text = Object.entries(all).map(([k, v]) => `*${k}* = ${v === null || v === '' ? '_(kosong)_' : v}${KEY_INFO[k] ? `\n   _${KEY_INFO[k]}_` : ''}`).join('\n')
      return ctx.usage(`⚙️ *Bot Settings*\n\n${text}\n\nUbah: \`!botsetting <key> <nilai>\`\nReset: \`!botsetting reset <key>\``)
    }

    if (key === 'reset') {
      const target = ctx.args[1]?.toLowerCase()
      if (!target) return ctx.usage('Cara pakai: `!botsetting reset <key>`')
      botConfigModel.reset(target)
      return ctx.reply(`✅ *${target}* dikembalikan ke default.`)
    }

    const value = ctx.args.slice(1).join(' ').trim()
    if (!value) return ctx.usage(`Nilai kosong. Cara pakai: \`!botsetting ${key} <nilai>\``)
    botConfigModel.set(key, value)
    await ctx.reply(`✅ *${key}* diupdate ke: ${value}`)
  },
}
