function hasErrorField(value) {
  return Boolean(value && typeof value === 'object' && 'error' in value)
}

const CHAT_REQUEST_TIMEOUT_MS = 30 * 1000
const CHAT_TASK_POLL_INTERVAL_MS = 1500
const CHAT_TASK_MAX_WAIT_MS = 10 * 60 * 1000

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

function getTaskResultPayload(taskStatus) {
  if (
    taskStatus &&
    typeof taskStatus === 'object' &&
    taskStatus.result_object &&
    typeof taskStatus.result_object === 'object'
  ) {
    return taskStatus.result_object
  }
  if (taskStatus && typeof taskStatus.result === 'string') {
    try {
      return JSON.parse(taskStatus.result)
    } catch {
      return null
    }
  }
  return null
}

async function waitForChatTaskResult(apiGet, taskId) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < CHAT_TASK_MAX_WAIT_MS) {
    // eslint-disable-next-line no-await-in-loop
    const statusResponse = await apiGet(`/api/tasks/${taskId}`)

    if (hasErrorField(statusResponse)) {
      throw new Error(
        resolveApiErrorMessage(statusResponse, 'Task polling failed')
      )
    }

    const taskStatus = statusResponse?.data ?? statusResponse
    const state = taskStatus?.state

    if (state === 'SUCCESS') {
      const resultPayload = getTaskResultPayload(taskStatus)
      if (resultPayload?.response) {
        return {
          response: resultPayload.response,
          conversationId: resultPayload.conversation_id || null,
        }
      }
      throw new Error('Chat task completed without a valid response payload')
    }

    if (state === 'FAILURE' || state === 'REVOKED') {
      const details =
        resolveApiErrorMessage(taskStatus, '') ||
        taskStatus?.result ||
        taskStatus?.info ||
        'Chat task failed'
      throw new Error(
        typeof details === 'string' ? details : 'Chat task failed'
      )
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve =>
      setTimeout(resolve, CHAT_TASK_POLL_INTERVAL_MS)
    )
  }

  throw new Error('Chat task exceeded maximum wait time')
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

export async function sendChatPrompt(
  apiPost,
  apiGet,
  query,
  activeConversationId
) {
  const payload = buildChatPayload(query, activeConversationId)
  const apiResponse = await apiPost('/api/chat/?background=true', payload, {
    dbChanged: false,
    timeoutMs: CHAT_REQUEST_TIMEOUT_MS,
  })

  if (hasErrorField(apiResponse)) {
    throw new Error(resolveApiErrorMessage(apiResponse, 'An error occurred'))
  }

  // Some environments may execute immediately without returning a task.
  if (apiResponse?.data?.response) {
    return {
      response: apiResponse.data.response,
      conversationId: apiResponse.data.conversation_id || null,
    }
  }

  const taskId = apiResponse?.task?.id
  if (!taskId) {
    throw new Error('Chat request did not return a task id')
  }

  return waitForChatTaskResult(apiGet, taskId)
}
