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
  const apiResponse = await apiPost(SHARED_DISCOVERY_CREATE_ENDPOINT, payload)
  if (apiResponse?.error) {
    throw new Error(apiResponse.error)
  }
  return {shared: true}
}

export async function fetchSharedDiscoveries(apiGet) {
  const apiResponse = await apiGet(SHARED_DISCOVERIES_FEED_ENDPOINT)
  if (apiResponse?.error) {
    return {discoveries: [], errorMessage: apiResponse.error}
  }
  const discoveries = unwrapApiData(apiResponse, [])
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
