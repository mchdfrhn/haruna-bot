import axios from 'axios'
import { logger } from '#helpers/logger.js'

// Beberapa API publik (mis. Wikimedia) menolak request tanpa User-Agent yang jelas.
const UA = 'HarunaBot/4.0 (WhatsApp bot; +https://github.com)'

class DownloaderService {
  async toBuffer(url, { timeout = 30_000, headers = {} } = {}) {
    try {
      const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout, headers: { 'User-Agent': UA, ...headers } })
      return Buffer.from(data)
    } catch (err) {
      logger.error({ err: err.message, url }, 'Downloader failed')
      throw new Error('Gagal mengunduh file dari server sumber.')
    }
  }

  async fetchJson(url, params = {}, { headers = {} } = {}) {
    try {
      const { data } = await axios.get(url, { params, timeout: 15_000, headers: { 'User-Agent': UA, ...headers } })
      return data
    } catch (err) {
      logger.error({ err: err.message, status: err.response?.status, url }, 'Fetch JSON failed')
      const e = new Error(`Gagal mengambil data dari layanan eksternal${err.response?.status ? ` (HTTP ${err.response.status})` : ''}.`)
      e.status = err.response?.status
      throw e
    }
  }
}

export const downloaderService = new DownloaderService()
