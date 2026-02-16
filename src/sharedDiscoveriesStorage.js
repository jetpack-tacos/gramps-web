import {getTreeId} from './api.js'

const DISMISSED_DISCOVERIES_PREFIX = 'grampsjs_dismissed_shared_discoveries'

export function getDismissedDiscoveriesStorageKey(treePath) {
  return `${DISMISSED_DISCOVERIES_PREFIX}:${
    treePath || getTreeId() || 'unknown'
  }`
}

export function loadDismissedDiscoveries(treePath, storage = localStorage) {
  try {
    const raw = storage.getItem(getDismissedDiscoveriesStorageKey(treePath))
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.map(id => String(id)) : []
  } catch {
    return []
  }
}

export function saveDismissedDiscoveries(
  treePath,
  dismissedDiscoveryIds,
  storage = localStorage
) {
  storage.setItem(
    getDismissedDiscoveriesStorageKey(treePath),
    JSON.stringify(dismissedDiscoveryIds)
  )
}

export function appendDismissedDiscoveryId(dismissedDiscoveryIds, id) {
  const discoveryId = String(id || '')
  if (!discoveryId || dismissedDiscoveryIds.includes(discoveryId)) {
    return dismissedDiscoveryIds
  }
  return [...dismissedDiscoveryIds, discoveryId]
}
