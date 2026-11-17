import { db } from '#storage/connection.js'
import { lazyPrepare } from '#storage/lazy.js'
import { cooldownModel } from '#storage/models/cooldown.js'

export const EXP_BOOST_KEY = 'buff:exp'

class UserModel {
  _findById = lazyPrepare('SELECT * FROM users WHERE jid = ?')
  _findByPn = lazyPrepare('SELECT * FROM users WHERE pn = ?')
  _upsert = lazyPrepare(`
    INSERT INTO users (jid, pn, push_name) VALUES (@jid, @pn, @pushName)
    ON CONFLICT(jid) DO UPDATE SET
      push_name = CASE WHEN excluded.push_name != '' THEN excluded.push_name ELSE users.push_name END,
      updated_at = unixepoch()
  `)
  _upsertWallet = lazyPrepare(`
    INSERT INTO wallets (jid) VALUES (?) ON CONFLICT(jid) DO NOTHING
  `)
  _addExp = lazyPrepare(`
    UPDATE users SET exp = exp + @amount, updated_at = unixepoch() WHERE jid = @jid
  `)
  _setLevel = lazyPrepare(`
    UPDATE users SET level = @level, exp = @exp, updated_at = unixepoch() WHERE jid = @jid
  `)
  _levelUpHp = lazyPrepare('UPDATE stats SET max_hp = max_hp + 10 WHERE jid = ?')
  _setPremium = lazyPrepare(`
    UPDATE users SET premium = @premium, premium_exp = @premiumExp, updated_at = unixepoch() WHERE jid = @jid
  `)
  _setBanned = lazyPrepare(`
    UPDATE users SET banned = @banned, updated_at = unixepoch() WHERE jid = @jid
  `)
  _leaderboard = lazyPrepare(`
    SELECT u.jid, u.push_name, u.level, u.exp, w.cash + w.bank AS total_balance
    FROM users u LEFT JOIN wallets w ON w.jid = u.jid
    ORDER BY u.level DESC, u.exp DESC LIMIT ?
  `)

  findById(jid) { return this._findById().get(jid) ?? null }
  findByPn(pnJid) { return this._findByPn().get(pnJid) ?? null }

  ensure(jid, { pn = null, pushName = '' } = {}) {
    this._upsert().run({ jid, pn, pushName })
    this._upsertWallet().run(jid)
    return this._findById().get(jid)
  }

  addExp(jid, amount) {
    // Buff EXP Booster (item) menggandakan EXP selama aktif
    if (cooldownModel.check(jid, EXP_BOOST_KEY) > 0) amount *= 2
    this._addExp().run({ jid, amount })
    const user = this._findById().get(jid)
    const threshold = this.expForLevel(user.level + 1)
    if (user.exp >= threshold) {
      const newLevel = user.level + 1
      this._setLevel().run({ jid, level: newLevel, exp: 0 })
      this._levelUpHp().run(jid) // +10 Max HP tiap naik level (sesuai rumus equip)
      return { user: { ...user, level: newLevel, exp: 0 }, leveledUp: true, newLevel }
    }
    return { user, leveledUp: false, newLevel: user.level }
  }

  expForLevel(level) { return level * level * 100 }

  setPremium(jid, durationMs) {
    // Jika masih premium, durasi ditambahkan ke sisa masa aktif
    const cur = this._findById().get(jid)
    const base = cur?.premium && cur.premium_exp * 1000 > Date.now() ? cur.premium_exp * 1000 : Date.now()
    const expiresAt = Math.floor((base + durationMs) / 1000)
    this._setPremium().run({ jid, premium: 1, premiumExp: expiresAt })
  }

  removePremium(jid) { this._setPremium().run({ jid, premium: 0, premiumExp: 0 }) }

  checkPremiumExpiry(jid) {
    const user = this._findById().get(jid)
    if (user?.premium && user.premium_exp > 0 && user.premium_exp < Math.floor(Date.now() / 1000)) {
      this.removePremium(jid)
    }
  }

  ban(jid) { this._setBanned().run({ jid, banned: 1 }) }
  unban(jid) { this._setBanned().run({ jid, banned: 0 }) }
  isBanned(jid) { return (this._findById().get(jid)?.banned ?? 0) === 1 }
  leaderboard(limit = 10) { return this._leaderboard().all(limit) }
}

export const userModel = new UserModel()
