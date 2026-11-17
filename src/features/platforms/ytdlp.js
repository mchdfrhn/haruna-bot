import { spawn } from 'child_process'
import { mkdtemp, readdir, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { logger } from '#helpers/logger.js'

const BIN = process.env.YTDLP_PATH || 'yt-dlp'
const MAX_MB = Number(process.env.DOWNLOAD_MAX_MB) || 60 // batas aman media WhatsApp
const TIMEOUT_MS = 180_000

// Format: utamakan H.264 + AAC (MP4) agar bisa diputar di semua perangkat WhatsApp.
const videoFormat = h => `bv*[height<=${h}][vcodec^=avc1]+ba[ext=m4a]/b[height<=${h}][ext=mp4]/bv*[height<=${h}]+ba/b[height<=${h}]/b`

function run(args, { timeout = TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = '', err = ''
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Download terlalu lama (timeout).')) }, timeout)
    child.stdout.on('data', d => { out += d })
    child.stderr.on('data', d => { err += d; if (err.length > 20_000) err = err.slice(-20_000) })
    child.on('error', e => { clearTimeout(timer); reject(e) })
    child.on('close', code => { clearTimeout(timer); resolve({ code, out, err }) })
  })
}

function friendlyError(stderr) {
  const line = stderr.split('\n').reverse().find(l => /ERROR/i.test(l)) ?? ''
  const msg = line.replace(/^.*ERROR:\s*(\[[^\]]+\]\s*)?/i, '').trim()
  if (/private|login|sign in|cookies/i.test(msg)) return 'Konten ini privat / butuh login, tidak bisa diunduh.'
  if (/unavailable|not available|removed|deleted/i.test(msg)) return 'Konten tidak tersedia (dihapus / dibatasi wilayah).'
  if (/unsupported url/i.test(msg)) return 'Link tidak didukung.'
  return msg ? `Gagal mengunduh: ${msg.slice(0, 150)}` : 'Gagal mengunduh media.'
}

class YtDlpService {
  constructor() { this._available = null }

  // Cek sekali apakah binary yt-dlp terpasang (hasil di-cache)
  async isAvailable() {
    if (this._available !== null) return this._available
    try {
      const { code } = await run(['--version'], { timeout: 10_000 })
      this._available = code === 0
    } catch { this._available = false }
    if (this._available) logger.info('[yt-dlp] terdeteksi — dipakai untuk YouTube & fallback platform lain')
    else logger.debug('[yt-dlp] tidak terpasang — memakai resolver bawaan')
    return this._available
  }

  // Untuk fallback: null jika yt-dlp tidak terpasang, selain itu sama dengan download()
  async downloadIfAvailable(url, opts) {
    return (await this.isAvailable()) ? this.download(url, opts) : null
  }

  /**
   * Unduh media dari URL apa pun yang didukung yt-dlp.
   * @returns {{ buffer: Buffer, title: string, duration: number, quality: string, author: string, mimetype: string, ext: string }}
   */
  async download(url, { audioOnly = false, maxHeight = 720 } = {}) {
    if (!/^https?:\/\//i.test(url)) throw new Error('Link tidak valid.')

    const dir = await mkdtemp(join(tmpdir(), 'haruna-ytdlp-'))
    try {
      const args = [
        '--no-playlist', '--no-warnings', '--no-progress', '--no-part',
        '--max-filesize', `${MAX_MB}M`,
        '-o', join(dir, 'media.%(ext)s'),
        '--dump-single-json', '--no-simulate',
        ...(audioOnly
          ? ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '5']
          : ['-f', videoFormat(maxHeight), '--merge-output-format', 'mp4']),
        '--', url,
      ]

      let result
      try { result = await run(args) } catch (e) {
        if (e.code === 'ENOENT') { this._available = false; throw new Error('yt-dlp tidak terpasang di server.') }
        throw e
      }
      const { code, out, err } = result
      if (code !== 0) {
        logger.warn({ code, err: err.slice(-300) }, '[yt-dlp] gagal')
        throw new Error(friendlyError(err))
      }

      const file = (await readdir(dir)).find(f => f.startsWith('media.'))
      if (!file) throw new Error(`Ukuran media melebihi batas ${MAX_MB} MB.`)

      const buffer = await readFile(join(dir, file))
      if (buffer.length > MAX_MB * 1024 * 1024) throw new Error(`Ukuran media melebihi batas ${MAX_MB} MB.`)

      let info = {}
      try { info = JSON.parse(out.trim().split('\n').pop()) } catch { /* info opsional */ }
      const ext = file.split('.').pop()
      return {
        buffer, ext,
        title: info.title ?? '',
        author: info.uploader ?? info.channel ?? '',
        duration: Number(info.duration) || 0,
        quality: info.height ? `${info.height}p` : '',
        mimetype: audioOnly ? 'audio/mpeg' : 'video/mp4',
      }
    } finally {
      await rm(dir, { recursive: true, force: true }).catch(() => {})
    }
  }
}

export const ytdlp = new YtDlpService()
