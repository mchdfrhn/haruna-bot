import { jidNormalizedUser } from 'baileys'

const norm = j => (j ? jidNormalizedUser(j) : null)

export async function checkAdmin(ctx, command) {
  if (!command.adminOnly) return true

  if (!ctx.isGroup) {
    await ctx.reply('Command ini hanya bisa dipakai di grup.')
    return false
  }

  if (ctx.isOwner()) return true

  try {
    const meta = await ctx.sock.groupMetadata(ctx.jid)
    // Grup bisa memakai LID atau nomor telepon; cocokkan semua identitas pengirim.
    const mine = new Set([ctx.sender, ctx.msg.senderAlt, ctx.msg.jidAlt].map(norm).filter(Boolean))
    const isAdmin = meta.participants.some(p =>
      (p.admin === 'admin' || p.admin === 'superadmin') &&
      [p.id, p.phoneNumber, p.lid].map(norm).some(j => j && mine.has(j)))

    if (isAdmin) return true

    await ctx.reply('Command ini khusus admin grup.')
    return false
  } catch {
    await ctx.reply('Gagal memeriksa status admin.')
    return false
  }
}
