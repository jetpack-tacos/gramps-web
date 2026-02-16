function hasErrorField(data) {
  return Boolean(data && typeof data === 'object' && 'error' in data)
}

export function resolveApiErrorMessage(errorOrResponse, fallback) {
  if (typeof errorOrResponse?.error === 'string' && errorOrResponse.error) {
    return errorOrResponse.error
  }
  if (typeof errorOrResponse?.message === 'string' && errorOrResponse.message) {
    return errorOrResponse.message
  }
  return fallback
}

export function normalizeChatRole(role) {
  if (role === 'user' || role === 'human') return 'human'
  if (role === 'assistant' || role === 'model' || role === 'ai') return 'ai'
  return role
}

export function normalizeConversationMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) {
    return []
  }
  return rawMessages.map(msg => ({
    role: normalizeChatRole(msg?.role),
    content: msg?.content,
  }))
}

export function buildChatPayload(query, activeConversationId) {
  const payload = {query}
  if (activeConversationId) {
    payload.conversation_id = activeConversationId
  }
  return payload
}

export async function fetchConversations(apiGet) {
  const data = await apiGet('/api/conversations/?page=1&pagesize=50')
  if (data?.data && Array.isArray(data.data)) {
    return data.data
  }
  if (Array.isArray(data)) {
    return data
  }
  throw new Error(resolveApiErrorMessage(data, 'Failed to load conversations'))
}

export async function fetchConversationMessages(apiGet, id) {
  const data = await apiGet(`/api/conversations/${id}/`)
  if (hasErrorField(data)) {
    throw new Error(resolveApiErrorMessage(data, 'Failed to load conversation'))
  }
  const rawMessages = data?.data?.messages || data?.messages || []
  return normalizeConversationMessages(rawMessages)
}

export async function deleteConversation(apiDelete, id) {
  const data = await apiDelete(`/api/conversations/${id}/`)
  if (data?.error) {
    throw new Error(resolveApiErrorMessage(data, 'An error occurred'))
  }
  return data
}

export async function sendChatPrompt(apiPost, query, activeConversationId) {
  const payload = buildChatPayload(query, activeConversationId)
  const data = await apiPost('/api/chat/', payload, {dbChanged: false})
  if (hasErrorField(data) || !data?.data?.response) {
    throw new Error(resolveApiErrorMessage(data, 'An error occurred'))
  }
  return {
    response: data.data.response,
    conversationId: data.data.conversation_id || null,
  }
}
