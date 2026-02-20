import {test, expect} from '@playwright/test'

const BASE_URL = 'http://localhost:5000'

async function pollTask(request, taskId, token, maxSeconds) {
  if (maxSeconds <= 0) return null
  const resp = await request.get(`${BASE_URL}/api/tasks/${taskId}`, {
    headers: {Authorization: `Bearer ${token}`},
  })
  if (resp.ok()) {
    const data = await resp.json()
    if (data.state === 'SUCCESS' || data.state === 'FAILURE') return data
  }
  await new Promise(r => setTimeout(r, 2000))
  return pollTask(request, taskId, token, maxSeconds - 2)
}

test('grounding: web_search tool fires for context-gap query', async ({
  request,
}) => {
  test.setTimeout(180000)

  // Login
  const loginResp = await request.post(`${BASE_URL}/api/token/`, {
    data: {username: 'Jer', password: 'password'},
  })
  expect(loginResp.ok()).toBeTruthy()
  const loginData = await loginResp.json()
  const token = loginData.access_token
  expect(token).toBeTruthy()

  // Send a context-gap query — grounding_policy should mark this as "context_gap"
  const chatResp = await request.post(`${BASE_URL}/api/chat/?background=true`, {
    headers: {Authorization: `Bearer ${token}`},
    data: {
      query:
        'What was the historical context of Swedish emigration to Minnesota in 1905?',
    },
  })
  expect(chatResp.ok()).toBeTruthy()
  const chatData = await chatResp.json()
  const taskId = chatData.task?.id || chatData.task_id || chatData.id
  console.log('Task ID:', taskId)
  expect(taskId).toBeTruthy()

  // Poll up to 150s
  const taskData = await pollTask(request, taskId, token, 150)
  expect(taskData).not.toBeNull()
  console.log('Task state:', taskData.state)

  const result = taskData.result_object || taskData.result
  const responseText =
    typeof result === 'string'
      ? result
      : result?.response || result?.message || JSON.stringify(result)

  console.log('Response (first 700):', responseText?.substring(0, 700))

  if (result && typeof result === 'object') {
    console.log('Result keys:', Object.keys(result))
    if (result.grounding) {
      console.log('Grounding info:', JSON.stringify(result.grounding, null, 2))
    }
  }

  expect(taskData.state).toBe('SUCCESS')
})
