import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import ff from 'fluent-ffmpeg'
import webp from 'node-webpmux'
import { fileTypeFromBuffer } from 'file-type'
import { logger } from '#helpers/logger.js'
import SETTINGS from '#environment/settings.js'

const TEMP_DIR = path.join(process.cwd(), 'temp')
try { fs.mkdirSync(TEMP_DIR, { recursive: true }) } catch {}

function getRandom(ext) { return `${randomBytes(6).toString('hex')}.${ext}` }

const rm = (...files) => files.forEach(f => fs.promises.unlink(f).catch(() => {}))

const STICKER_VF = "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse"

function runFfmpeg(input, output, options, format) {
  return new Promise((resolve, reject) => {
    const cmd = ff(input).on('error', reject).on('end', () => resolve(true)).addOutputOptions(options)
    if (format) cmd.toFormat(format)
    cmd.save(output)
  })
}

export async function imageToWebp(media) {
  const tmpOut = path.join(TEMP_DIR, getRandom('webp'))
  const tmpIn = path.join(TEMP_DIR, getRandom('jpg'))
  fs.writeFileSync(tmpIn, media)
  try {
    await runFfmpeg(tmpIn, tmpOut, ['-vcodec', 'libwebp', '-vf', STICKER_VF], 'webp')
    return fs.readFileSync(tmpOut)
  } finally { rm(tmpIn, tmpOut) }
}

export async function videoToWebp(media) {
  const tmpOut = path.join(TEMP_DIR, getRandom('webp'))
  const tmpIn = path.join(TEMP_DIR, getRandom('mp4'))
  fs.writeFileSync(tmpIn, media)
  try {
    await runFfmpeg(tmpIn, tmpOut, ['-vcodec', 'libwebp', '-vf', STICKER_VF, '-loop', '0', '-ss', '00:00:00.0', '-t', '00:00:05.0', '-preset', 'default', '-an', '-vsync', '0'], 'webp')
    return fs.readFileSync(tmpOut)
  } finally { rm(tmpIn, tmpOut) }
}

// Stiker (webp) → gambar PNG. Untuk stiker animasi, hanya frame pertama yang diambil.
export async function webpToPng(media) {
  const tmpOut = path.join(TEMP_DIR, getRandom('png'))
  const tmpIn = path.join(TEMP_DIR, getRandom('webp'))
  const tmpRaw = path.join(TEMP_DIR, getRandom('rgba'))
  fs.writeFileSync(tmpIn, media)
  try {
    try {
      await runFfmpeg(tmpIn, tmpOut, ['-frames:v', '1'], 'image2')
    } catch {
      // ffmpeg tidak bisa decode WebP animasi → ambil frame pertama (RGBA mentah) lewat node-webpmux
      await webp.Image.initLib()
      const img = new webp.Image()
      await img.load(media)
      if (!img.hasAnim) throw new Error('File stiker tidak valid.')
      fs.writeFileSync(tmpRaw, await img.getFrameData(0))
      await new Promise((resolve, reject) => {
        ff(tmpRaw).inputOptions(['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${img.width}x${img.height}`])
          .on('error', reject).on('end', resolve).addOutputOptions(['-frames:v', '1']).save(tmpOut)
      })
    }
    return fs.readFileSync(tmpOut)
  } finally { rm(tmpIn, tmpOut, tmpRaw) }
}

export async function writeExif(media, metadata = {}) {
  let wMedia
  if (/webp/.test(media.mimetype)) wMedia = media.data
  else if (/image/.test(media.mimetype)) wMedia = await imageToWebp(media.data)
  else if (/video/.test(media.mimetype)) wMedia = await videoToWebp(media.data)
  else throw new Error('Format media tidak didukung untuk sticker.')

  const tmpOut = path.join(TEMP_DIR, getRandom('webp'))
  const tmpIn = path.join(TEMP_DIR, getRandom('webp'))
  fs.writeFileSync(tmpIn, wMedia)

  const owner = SETTINGS.ownerNumber?.[0]?.split('@')[0] ?? ''
  const opt = {
    packId: metadata.packId ?? `https://wa.me/${owner}`,
    packName: metadata.packName ?? SETTINGS.botName,
    packPublish: metadata.packPublish ?? SETTINGS.botName,
    packEmail: metadata.packEmail ?? '', packWebsite: metadata.packWebsite ?? '',
    androidApp: metadata.androidApp ?? '', iOSApp: metadata.iOSApp ?? '',
    emojis: metadata.emojis ?? ['🤖'], isAvatar: metadata.isAvatar ?? 0,
  }

  const json = {
    'sticker-pack-id': opt.packId, 'sticker-pack-name': opt.packName,
    'sticker-pack-publisher': opt.packPublish, 'sticker-pack-publisher-email': opt.packEmail,
    'sticker-pack-publisher-website': opt.packWebsite, 'android-app-store-link': opt.androidApp,
    'ios-app-store-link': opt.iOSApp, emojis: opt.emojis, 'is-avatar-sticker': opt.isAvatar,
  }

  const exifAttr = Buffer.from([0x49,0x49,0x2a,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuff])
  exif.writeUIntLE(jsonBuff.length, 14, 4)

  try {
    const img = new webp.Image()
    await img.load(tmpIn)
    img.exif = exif
    await img.save(tmpOut)
    return fs.readFileSync(tmpOut)
  } finally { rm(tmpIn, tmpOut) }
}

export async function toStickerBuffer(buffer, meta = {}) {
  const type = await fileTypeFromBuffer(buffer)
  if (!type) throw new Error('Tidak bisa detect tipe file.')
  return writeExif({ data: buffer, mimetype: type.mime }, {
    packName: meta.packName ?? SETTINGS.botName,
    packPublish: meta.packPublish ?? SETTINGS.botName,
    emojis: meta.emojis ?? ['🤖'],
  })
}
