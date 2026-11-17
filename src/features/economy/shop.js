import { db } from '#storage/connection.js'
import { walletModel, inventoryModel, itemModel, statsModel, questModel, userModel, cooldownModel } from '#storage/models/index.js'
import { EXP_BOOST_KEY } from '#storage/models/user.js'

const SELL_RATE = 0.6
const MAX_QTY = 99
const DAY = 24 * 60 * 60 * 1000

class ShopService {
  _checkQty(qty) {
    if (!Number.isInteger(qty) || qty < 1) throw new Error('Jumlah harus bilangan bulat minimal 1.')
    if (qty > MAX_QTY) throw new Error(`Maksimal ${MAX_QTY} item per transaksi.`)
  }

  buy(jid, itemId, qty = 1) {
    this._checkQty(qty)
    const item = itemModel.findById(itemId)
    if (!item) throw new Error(`Item \`${itemId}\` tidak ditemukan.`)
    if (item.price <= 0) throw new Error('Item ini tidak dijual di toko.')

    const total = item.price * qty
    const wallet = walletModel.find(jid)
    if (!wallet || wallet.cash < total) throw new Error(`Saldo cash tidak cukup. Butuh 🪙${total.toLocaleString()}.`)

    db.transaction(() => {
      walletModel.addCash(jid, -total)
      inventoryModel.add(jid, itemId, qty)
      questModel.addProgress(jid, 'daily_shop', 1)
    })()
    return { item, qty, total }
  }

  sell(jid, itemId, qty = 1) {
    this._checkQty(qty)
    const item = itemModel.findById(itemId)
    if (!item) throw new Error(`Item \`${itemId}\` tidak ditemukan.`)
    if (!item.sellable) throw new Error('Item ini tidak bisa dijual.')

    const owned = inventoryModel.getItem(jid, itemId)
    if (!owned || owned.quantity < qty) throw new Error(`Kamu tidak punya cukup *${item.name}* (punya: ${owned?.quantity ?? 0}).`)

    const stats = statsModel.ensure(jid)
    if ((stats.weapon_id === itemId || stats.armor_id === itemId) && owned.quantity - qty < 1)
      throw new Error(`*${item.name}* sedang dipakai. Lepas dulu dengan \`!unequip\`.`)

    const earned = Math.floor(item.price * SELL_RATE) * qty
    db.transaction(() => { inventoryModel.remove(jid, itemId, qty); walletModel.addCash(jid, earned) })()
    return { item, qty, earned }
  }

  equip(jid, itemId, userLevel = 1) {
    const item = itemModel.findById(itemId)
    if (!item) throw new Error('Item tidak ditemukan.')
    if (!['weapon', 'armor'].includes(item.category)) throw new Error('Hanya weapon atau armor yang bisa diequip.')
    if (!inventoryModel.hasItem(jid, itemId)) throw new Error(`Kamu tidak punya *${item.name}*.`)

    const stats = statsModel.ensure(jid)
    const itemData = JSON.parse(item.data ?? '{}')
    const weaponId = item.category === 'weapon' ? itemId : stats.weapon_id
    const armorId = item.category === 'armor' ? itemId : stats.armor_id
    const weaponData = weaponId ? JSON.parse(itemModel.findById(weaponId)?.data ?? '{}') : {}
    const armorData = armorId ? JSON.parse(itemModel.findById(armorId)?.data ?? '{}') : {}
    const atk = 10 + (weaponData.atk ?? 0)
    const def = 5 + (armorData.def ?? 0)
    const maxHp = 100 + (userLevel - 1) * 10 + (armorData.hp ?? 0)

    statsModel.updateEquipment(jid, { weaponId, armorId, atk, def, maxHp })
    return { item, atk, def, maxHp }
  }

  unequip(jid, slot, userLevel = 1) {
    if (!['weapon', 'armor'].includes(slot)) throw new Error("Slot harus 'weapon' atau 'armor'.")
    const stats = statsModel.ensure(jid)
    const weaponId = slot === 'weapon' ? null : stats.weapon_id
    const armorId = slot === 'armor' ? null : stats.armor_id
    const weaponData = weaponId ? JSON.parse(itemModel.findById(weaponId)?.data ?? '{}') : {}
    const armorData = armorId ? JSON.parse(itemModel.findById(armorId)?.data ?? '{}') : {}
    const atk = 10 + (weaponData.atk ?? 0)
    const def = 5 + (armorData.def ?? 0)
    const maxHp = 100 + (userLevel - 1) * 10 + (armorData.hp ?? 0)
    statsModel.updateEquipment(jid, { weaponId, armorId, atk, def, maxHp })
    return { slot, atk, def, maxHp }
  }

  use(jid, itemId) {
    const item = itemModel.findById(itemId)
    if (!item) throw new Error(`Item \`${itemId}\` tidak ditemukan.`)
    if (!inventoryModel.hasItem(jid, itemId)) throw new Error(`Kamu tidak punya *${item.name}*.`)
    const data = JSON.parse(item.data ?? '{}')

    if (itemId === 'lootbox_std') throw new Error('Lootbox dibuka dengan `!lootbox`.')
    if (item.category === 'weapon' || item.category === 'armor') throw new Error('Weapon/armor dipasang dengan `!equip`.')

    let message
    db.transaction(() => {
      if (data.heal) {
        const st = statsModel.ensure(jid)
        if (st.hp >= st.max_hp) throw new Error('HP kamu sudah penuh.')
        statsModel.addHp(jid, data.heal)
        const after = statsModel.find(jid)
        message = `❤️ HP dipulihkan: *${after.hp}/${after.max_hp}*`
      } else if (itemId === 'potion_exp') {
        cooldownModel.set(jid, EXP_BOOST_KEY, 60 * 60 * 1000)
        message = '⚡ *EXP Booster* aktif selama 1 jam (EXP x2)!'
      } else if (itemId === 'bank_upgrade') {
        walletModel.addBankLimit(jid, 50_000)
        message = `🏦 Limit bank naik menjadi *${walletModel.find(jid).bank_limit.toLocaleString()}*!`
      } else if (itemId === 'premium_7d') {
        userModel.setPremium(jid, 7 * DAY)
        message = '👑 *Premium* aktif +7 hari!'
      } else {
        throw new Error('Item ini tidak bisa dipakai.')
      }
      inventoryModel.remove(jid, itemId, 1)
    })()
    return { item, message }
  }

  getShopItems() {
    return itemModel.shopItems().reduce((acc, item) => {
      const cat = item.category; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc
    }, {})
  }
}

export const shopService = new ShopService()
