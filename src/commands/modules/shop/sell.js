import { shopService } from '#features/economy/shop.js'
import { F } from '#helpers/index.js'

export default {
  name: 'sell',
  aliases: ['jual'],
  category: 'shop',
  description: 'Jual item dari inventory (harga jual 60% dari harga toko)',
  usage: ['sell <id_item> [jumlah]'],
  examples: ['sell potion_hp_sm', 'sell potion_hp_sm 3'],
  cooldown: 5_000,

  async execute(ctx) {
    const itemId = ctx.args[0]
    if (!itemId) return ctx.usage('Cara pakai: `!sell <id_item> [jumlah]`\nLihat ID item di `!inventory`.')
    const qty = ctx.args[1] ? F.parseAmount(ctx.args[1]) : 1
    if (!qty) return ctx.usage('❌ Jumlah harus berupa angka lebih dari 0.')

    try {
      const { item, earned } = shopService.sell(ctx.sender, itemId, qty)
      await ctx.reply(`💰 *Penjualan Berhasil!*\n📦 ${item.name} ×${qty}\n🪙 +${F.formatNumber(earned)}`)
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
