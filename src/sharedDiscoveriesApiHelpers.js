import {extractPersonIdsFromMarkdown} from './chatMessageUtils.js'
import {unwrapApiData} from './util.js'

const SHARED_DISCOVERIES_FEED_ENDPOINT = '/api/shared/?page=1&pagesize=10'
const SHARED_DISCOVERY_CREATE_ENDPOINT = '/api/shared/'

export function getMessageContent(message) {
  return String(message?.content || message?.message || '').trim()
}

export function buildSharedDiscoveryPayload(message) {
  const content = getMessageContent(message)
  return {
    content,
    person_ids: extractPersonIdsFromMarkdown(content),
  }
}

export async function shareDiscoveryFromMessage(apiPost, message) {
  const payload = buildSharedDiscoveryPayload(message)
  if (!payload.content) {
    return {shared: false}
  }
  const response = await apiPost(SHARED_DISCOVERY_CREATE_ENDPOINT, payload)
  if (response?.error) {
    throw new Error(response.error)
  }
  return {shared: true}
}

export async function fetchSharedDiscoveries(apiGet) {
  const response = await apiGet(SHARED_DISCOVERIES_FEED_ENDPOINT)
  if (response?.error) {
    return {discoveries: [], errorMessage: response.error}
  }
  const discoveries = unwrapApiData(response, [])
  return {
    discoveries: Array.isArray(discoveries) ? discoveries : [],
    errorMessage: '',
  }
}

export function filterVisibleDiscoveries(discoveries, dismissedDiscoveryIds) {
  const hiddenIds = new Set((dismissedDiscoveryIds || []).map(String))
  return (discoveries || []).filter(
    discovery => !hiddenIds.has(String(discovery?.id || ''))
  )
}
