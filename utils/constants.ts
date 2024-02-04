import { BASE_URL as CONFIG_BASE_URL } from '../config'

function getBaseUrl() {
  try {
    const url = new URL(CONFIG_BASE_URL ?? '')
    return `${url.protocol}//${url.hostname}`
  } catch (_) {
    return ''
  }
}

const BASE_URL = getBaseUrl()
const IMAGE_PATH = '/uploads/images/'
const IMAGE_URL = BASE_URL + IMAGE_PATH
const LIMIT = 10

export { BASE_URL, IMAGE_PATH, IMAGE_URL, LIMIT }
