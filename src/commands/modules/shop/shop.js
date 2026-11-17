import { shopService } from '#features/economy/shop.js'
import { userModel, walletModel } from '#storage/models/index.js'
import { F } from '#helpers/index.js'

const RARITY_EMOJI = { common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟨' }
const CAT_LABEL = { weapon: '🗡️ Weapon', armor: '🥋 Armor', consumable: '🧪 Consumable', special: '✨ Special' }

export default {
  name: 'shop',
  aliases: ['toko', 'store', 'buy', 'beli'],
  category: 'shop',
  description: 'Lihat daftar toko dan beli item',
  usage: ['shop', 'shop buy <id_item> [jumlah]', 'buy <id_item> [jumlah]'],
  examples: ['shop', 'shop buy sword_wood', 'buy potion_hp_sm 5'],
  cooldown: 5_000,

  async execute(ctx) {
    const viaAlias = ['buy', 'beli'].includes(ctx.commandName)
    const viaSub = ['buy', 'beli'].includes(ctx.args[0]?.toLowerCase())

    if (viaAlias || viaSub) {
      const rest = viaSub ? ctx.args.slice(1) : ctx.args
      const itemId = rest[0]
      if (!itemId) return ctx.usage('Cara pakai: `!shop buy <id_item> [jumlah]`\nContoh: `!shop buy potion_hp_sm 5`')
      const qty = rest[1] ? F.parseAmount(rest[1]) : 1
      if (!qty) return ctx.usage('❌ Jumlah harus berupa angka lebih dari 0.')

      userModel.ensure(ctx.sender, { pushName: ctx.pushName })
      try {
        const { item, total } = shopService.buy(ctx.sender, itemId, qty)
        const wallet = walletModel.find(ctx.sender)
        return ctx.reply(`🛒 *Pembelian Berhasil!*\n📦 ${item.name} ×${qty}\n🪙 -${F.formatNumber(total)}\n💰 Sisa: ${F.formatNumber(wallet?.cash ?? 0)}`)
      } catch (err) { return ctx.reply(`❌ ${err.message}`) }
    }

    const grouped = shopService.getShopItems()
    if (!Object.keys(grouped).length) return ctx.reply('🏪 Toko masih kosong. Owner perlu menjalankan `npm run db:seed`.')

    const wallet = walletModel.find(ctx.sender)
    let text = `🏪 *Toko HarunaBot*\n💰 Cash kamu: *${F.formatNumber(wallet?.cash ?? 0)}*\n`
    for (const [cat, items] of Object.entries(grouped)) {
      text += `\n*${CAT_LABEL[cat] ?? cat.toUpperCase()}*\n`
      for (const item of items) {
        text += `${RARITY_EMOJI[item.rarity] ?? '⬜'} \`${item.id}\` — *${item.name}* 🪙${F.formatNumber(item.price)}\n   _${item.description}_\n`
      }
    }
    text += '\nBeli  : `!shop buy <id> [jumlah]`\nPakai : `!use <id>` · Pasang : `!equip <id>`'
    await ctx.reply(text)
  },
}
