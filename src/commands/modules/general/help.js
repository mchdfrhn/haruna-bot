import axios from 'axios'
import { commandRegistry } from '#commands/registry.js'
import { botConfigModel } from '#storage/models/index.js'
import SETTINGS from '#environment/settings.js'

// Urutan di sini = urutan tampil di menu. Kategori yang belum terdaftar di sini tetap tampil di akhir.
const CATEGORIES = {
  general: { icon: '📋', title: 'Umum', desc: 'Bantuan, info, dan ping bot', aliases: ['umum', 'info'] },
  economy: { icon: '💰', title: 'Ekonomi', desc: 'Saldo, bank, kerja, dan transfer uang', aliases: ['eco', 'ekonomi', 'uang'] },
  game: { icon: '🎰', title: 'Game', desc: 'Taruhan: coinflip, roulette, slots', aliases: ['games', 'judi'] },
  rpg: { icon: '⚔️', title: 'RPG', desc: 'Battle, dungeon, quest, mining, fishing', aliases: ['battle'] },
  shop: { icon: '🛒', title: 'Toko & Item', desc: 'Beli, jual, pakai, dan equip item', aliases: ['toko', 'item', 'store'] },
  utility: { icon: '🔧', title: 'Utilitas', desc: 'AI, stiker, terjemahan, cuaca, wiki, TTS', aliases: ['util', 'tools', 'utilitas'] },
  downloader: { icon: '📥', title: 'Downloader', desc: 'Unduh video/audio dari YouTube, TikTok, IG, FB', aliases: ['dl', 'download'] },
  group: { icon: '👥', title: 'Grup', desc: 'Moderasi & pengaturan grup (kebanyakan khusus admin)', aliases: ['grup', 'admin'] },
  owner: { icon: '👑', title: 'Owner', desc: 'Kontrol bot — khusus owner', aliases: ['own'], ownerOnly: true },
}

const MAX_CHARS = 3500 // batas aman per pesan WhatsApp
const DIVIDER = '━━━━━━━━━━━━━━━━━━'

function formatCooldown(ms) {
  if (!ms || ms <= 0) return 'tanpa cooldown'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} detik`
  if (s < 3600) return `${Math.round(s / 60)} menit`
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60)
  return m ? `${h} jam ${m} menit` : `${h} jam`
}

function requirements(cmd) {
  const r = []
  if (cmd.ownerOnly) r.push('👑 Khusus owner')
  if (cmd.adminOnly) r.push('👮 Khusus admin grup')
  if (cmd.groupOnly && !cmd.adminOnly) r.push('👥 Hanya di grup')
  if (cmd.privateOnly) r.push('💬 Hanya di chat pribadi')
  if (cmd.premiumOnly) r.push('💎 Khusus premium')
  return r
}

const badges = cmd => [cmd.ownerOnly && '👑', cmd.adminOnly && '👮', cmd.premiumOnly && '💎'].filter(Boolean).join('')
const asList = v => (Array.isArray(v) ? v : v ? [v] : [])

// Jarak edit (Levenshtein) untuk saran typo
function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

// Pecah teks panjang menjadi beberapa pesan tanpa memotong di tengah baris
function chunk(text) {
  if (text.length <= MAX_CHARS) return [text]
  const parts = []
  let cur = ''
  for (const line of text.split('\n')) {
    if ((cur + '\n' + line).length > MAX_CHARS && cur) { parts.push(cur); cur = line }
    else cur = cur ? `${cur}\n${line}` : line
  }
  if (cur) parts.push(cur)
  return parts
}

export default {
  name: 'help',
  aliases: ['h', 'menu', 'bantuan'],
  category: 'general',
  description: 'Menu bantuan: daftar kategori, daftar command, dan cara pakai',
  usage: ['help', 'help <kategori>', 'help <command>'],
  examples: ['help', 'help economy', 'help bank'],
  cooldown: 3_000,

  async execute(ctx) {
    const prefix = ctx.prefix
    const isOwner = ctx.isOwner()
    const query = ctx.args[0]?.toLowerCase().replace(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')

    const cats = this._visibleCategories(isOwner)

    if (!query) return this._overview(ctx, cats, prefix)

    // 1) angka → kategori ke-N, 2) nama/alias kategori, 3) nama/alias command
    const byIndex = /^\d+$/.test(query) ? cats[Number(query) - 1] : null
    const cat = byIndex ?? cats.find(c => c.key === query || CATEGORIES[c.key]?.aliases?.includes(query))
    if (cat) return this._category(ctx, cat, prefix)

    const cmd = commandRegistry.get(query)
    if (cmd && (!cmd.ownerOnly || isOwner)) return this._command(ctx, cmd, prefix)

    if (!isOwner && CATEGORIES[query]?.ownerOnly) return ctx.usage('🔒 Kategori ini khusus owner bot.')
    return this._notFound(ctx, query, cats, prefix, isOwner)
  },

  _visibleCategories(isOwner) {
    const known = Object.keys(CATEGORIES)
    const present = commandRegistry.getCategories().filter(k => commandRegistry.getByCategory(k).length)
    const ordered = [...known.filter(k => present.includes(k)), ...present.filter(k => !known.includes(k))]
    return ordered
      .filter(k => isOwner || !CATEGORIES[k]?.ownerOnly)
      .map(key => ({ key, ...(CATEGORIES[key] ?? { icon: '📁', title: key[0].toUpperCase() + key.slice(1), desc: '' }), cmds: commandRegistry.getByCategory(key) }))
  },

  // ─── !help ───────────────────────────────────────────────────────────────
  async _overview(ctx, cats, prefix) {
    const botName = botConfigModel.get('bot_name') || SETTINGS.botName
    const now = new Date().toLocaleString('id-ID', { timeZone: SETTINGS.timezone, dateStyle: 'medium', timeStyle: 'short' })
    const total = cats.reduce((n, c) => n + c.cmds.length, 0)

    let text = `╭━━━〔 *${botName}* 〕━━━╮\n`
    text += `┃ 🕐 ${now}\n`
    text += `┃ 📦 ${total} command · ${cats.length} kategori\n`
    text += `┃ 🔑 Prefix: \`${prefix}\`\n`
    text += '╰━━━━━━━━━━━━━━━━━━━╯\n\n'
    text += '*📂 KATEGORI*\n'
    cats.forEach((c, i) => {
      text += `${i + 1}. ${c.icon} *${c.title}* — ${c.cmds.length} command\n`
      if (c.desc) text += `    _${c.desc}_\n`
    })
    text += `\n${DIVIDER}\n`
    text += '*📖 CARA MEMAKAI MENU*\n'
    text += `• \`${prefix}help <kategori>\` → daftar command\n`
    text += `   contoh: \`${prefix}help economy\` atau \`${prefix}help 2\`\n`
    text += `• \`${prefix}help <command>\` → cara pakai lengkap\n`
    text += `   contoh: \`${prefix}help bank\`\n\n`
    text += '*🔣 ARTI SIMBOL*\n'
    text += '`<teks>` wajib diisi · `[teks]` opsional · `a|b` pilih salah satu\n'
    text += '👮 khusus admin grup · 👑 khusus owner · 💎 premium'

    const footerText = botConfigModel.get('footer_text')
    if (footerText) text += `\n\n_${footerText}_`

    const thumbUrl = botConfigModel.get('thumbnail_url')
    if (thumbUrl) {
      try {
        const { data } = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 10_000 })
        const menu = botConfigModel.getMenuConfig() ?? {}
        await ctx.sendLinkPreview(text, menu.url, menu.title, menu.desc, Buffer.from(data))
        return
      } catch { /* thumbnail gagal → kirim teks biasa */ }
    }

    await ctx.reply(text)
  },

  // ─── !help <kategori> ────────────────────────────────────────────────────
  async _category(ctx, cat, prefix) {
    let text = `${cat.icon} *${cat.title.toUpperCase()}*\n`
    if (cat.desc) text += `_${cat.desc}_\n`
    text += `${DIVIDER}\n`

    for (const cmd of cat.cmds) {
      const alias = asList(cmd.aliases).filter(a => a !== cmd.name)
      text += `\n▸ *${prefix}${cmd.name}*${badges(cmd) ? ` ${badges(cmd)}` : ''}\n`
      text += `   ${cmd.description ?? 'Tidak ada deskripsi'}\n`
      const usage = asList(cmd.usage)
      text += `   📝 ${(usage.length ? usage : [cmd.name]).map(u => `\`${prefix}${u}\``).join('\n   📝 ')}\n`
      if (alias.length) text += `   🔁 alias: ${alias.map(a => `${prefix}${a}`).join(', ')}\n`
    }

    text += `\n${DIVIDER}\n`
    text += `Detail & contoh: \`${prefix}help <command>\`\n`
    text += `Kembali ke menu: \`${prefix}help\``

    for (const part of chunk(text)) await ctx.reply(part)
  },

  // ─── !help <command> ─────────────────────────────────────────────────────
  async _command(ctx, cmd, prefix) {
    const meta = CATEGORIES[cmd.category]
    const alias = asList(cmd.aliases).filter(a => a !== cmd.name)
    const usage = asList(cmd.usage)
    const examples = asList(cmd.examples)
    const reqs = requirements(cmd)

    let text = `📖 *${prefix}${cmd.name}*\n`
    text += `${cmd.description ?? 'Tidak ada deskripsi'}\n\n`
    text += '*📝 Cara pakai*\n'
    text += (usage.length ? usage : [cmd.name]).map(u => `• \`${prefix}${u}\``).join('\n') + '\n'
    if (examples.length) {
      text += '\n*💡 Contoh*\n'
      text += examples.map(e => (e.startsWith('(') ? `• ${e.replace(/!/g, prefix)}` : `• \`${prefix}${e}\``)).join('\n') + '\n'
    }
    text += '\n'
    if (alias.length) text += `🔁 *Alias:* ${alias.map(a => `${prefix}${a}`).join(', ')}\n`
    text += `⏱️ *Cooldown:* ${formatCooldown(cmd.cooldown ?? 3_000)}\n`
    if (reqs.length) text += `🔒 *Syarat:* ${reqs.join(' · ')}\n`
    text += `📂 *Kategori:* ${meta?.icon ?? '📁'} ${meta?.title ?? cmd.category} (\`${prefix}help ${cmd.category}\`)`

    await ctx.reply(text)
  },

  // ─── tidak ditemukan ─────────────────────────────────────────────────────
  async _notFound(ctx, query, cats, prefix, isOwner) {
    const names = commandRegistry.getAll().filter(c => isOwner || !c.ownerOnly).map(c => c.name)
    const similar = names.filter(n => n.includes(query) || query.includes(n) || distance(n, query) <= 2).slice(0, 5)

    let text = `❌ Kategori atau command *${query}* tidak ditemukan.\n`
    if (similar.length) text += `\nMungkin maksud kamu: ${similar.map(n => `\`${prefix}help ${n}\``).join(', ')}\n`
    text += `\nKategori tersedia: ${cats.map(c => c.key).join(', ')}\nKetik \`${prefix}help\` untuk melihat menu utama.`
    await ctx.usage(text)
  },
}
