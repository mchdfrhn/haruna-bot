import { shopService } from '#features/economy/shop.js'
import { userModel } from '#storage/models/index.js'

export default {
  name: 'equip',
  aliases: ['pakai', 'unequip', 'lepas'],
  category: 'shop',
  description: 'Pasang atau lepas weapon/armor dari inventory',
  usage: ['equip <id_item>', 'unequip <weapon|armor>'],
  examples: ['equip sword_iron', 'unequip weapon'],
  cooldown: 5_000,

  async execute(ctx) {
    // !unequip/!lepas <slot>  atau  !equip unequip <slot>
    const viaAlias = ['unequip', 'lepas'].includes(ctx.commandName)
    const viaSub = ['unequip', 'lepas'].includes(ctx.args[0]?.toLowerCase())
    const unequip = viaAlias || viaSub
    const arg = (viaSub ? ctx.args[1] : ctx.args[0])?.toLowerCase()

    if (!arg) return ctx.usage('Cara pakai:\n`!equip <id_item>` — lihat ID di `!inventory`\n`!unequip <weapon|armor>`')

    userModel.ensure(ctx.sender, { pushName: ctx.pushName })
    const user = userModel.findById(ctx.sender)

    try {
      if (unequip) {
        const result = shopService.unequip(ctx.sender, arg, user.level)
        await ctx.reply(`✅ Slot *${arg}* dilepas.\n⚔️ ATK ${result.atk} · 🛡️ DEF ${result.def} · ❤️ Max HP ${result.maxHp}`)
      } else {
        const result = shopService.equip(ctx.sender, arg, user.level)
        await ctx.reply(`✅ *${result.item.name}* dipasang!\n⚔️ ATK ${result.atk} · 🛡️ DEF ${result.def} · ❤️ Max HP ${result.maxHp}`)
      }
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
