function hasErrorField(value) {
  return Boolean(value && typeof value === 'object' && 'error' in value)
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
  const apiResponse = await apiGet('/api/conversations/?page=1&pagesize=50')
  if (apiResponse?.data && Array.isArray(apiResponse.data)) {
    return apiResponse.data
  }
  if (Array.isArray(apiResponse)) {
    return apiResponse
  }
  throw new Error(
    resolveApiErrorMessage(apiResponse, 'Failed to load conversations')
  )
}

export async function fetchConversationMessages(apiGet, id) {
  const apiResponse = await apiGet(`/api/conversations/${id}/`)
  if (hasErrorField(apiResponse)) {
    throw new Error(
      resolveApiErrorMessage(apiResponse, 'Failed to load conversation')
    )
  }
  const rawMessages = apiResponse?.data?.messages || apiResponse?.messages || []
  return normalizeConversationMessages(rawMessages)
}

export async function deleteConversation(apiDelete, id) {
  const apiResponse = await apiDelete(`/api/conversations/${id}/`)
  if (apiResponse?.error) {
    throw new Error(resolveApiErrorMessage(apiResponse, 'An error occurred'))
  }
  return apiResponse
}

export async function sendChatPrompt(apiPost, query, activeConversationId) {
  const payload = buildChatPayload(query, activeConversationId)
  const apiResponse = await apiPost('/api/chat/', payload, {dbChanged: false})
  if (hasErrorField(apiResponse) || !apiResponse?.data?.response) {
    throw new Error(resolveApiErrorMessage(apiResponse, 'An error occurred'))
  }
  return {
    response: apiResponse.data.response,
    conversationId: apiResponse.data.conversation_id || null,
  }
}
