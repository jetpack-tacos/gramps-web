const TIME_GROUP_ORDER = [
  'Today',
  'Yesterday',
  'This Week',
  'This Month',
  'Older',
]

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

export function getConversationTimeGroup(dateStr, now = new Date()) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) {
    return 'Older'
  }

  const nowUtcDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const dateUtcDay = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )
  const diffDays = Math.floor((nowUtcDay - dateUtcDay) / MILLISECONDS_PER_DAY)

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return 'This Week'
  if (diffDays <= 30) return 'This Month'
  return 'Older'
}

export function groupConversationsByTime(conversations, now = new Date()) {
  const groups = new Map()
  for (const conversation of conversations || []) {
    const label = getConversationTimeGroup(
      conversation?.updated_at || conversation?.created_at,
      now
    )
    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label).push(conversation)
  }

  return TIME_GROUP_ORDER.filter(label => groups.has(label)).map(label => ({
    label,
    items: groups.get(label),
  }))
}
