export function extractPersonIdsFromMarkdown(content) {
  const personIds = []
  const pattern = /\[[^\]]+\]\(\/person\/([^)/\s]+)\)/g
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(content)) !== null) {
    if (match[1]) {
      personIds.push(match[1])
    }
  }
  return [...new Set(personIds)]
}
