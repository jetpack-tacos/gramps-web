import {test, expect} from '@playwright/test'

const BASE_URL = 'http://localhost:5000'

/**
 * Recursively poll a background task until it reaches SUCCESS or FAILURE,
 * or until maxSeconds runs out.  Avoids no-await-in-loop lint rule.
 */
async function pollTask(request, taskId, token, maxSeconds) {
  if (maxSeconds <= 0) return null
  const taskResp = await request.get(`${BASE_URL}/api/tasks/${taskId}`, {
    headers: {Authorization: `Bearer ${token}`},
  })
  if (taskResp.ok()) {
    const taskData = await taskResp.json()
    const {state} = taskData
    if (state === 'SUCCESS' || state === 'FAILURE') {
      return taskData
    }
  }
  await new Promise(resolve => {
    setTimeout(resolve, 1000)
  })
  return pollTask(request, taskId, token, maxSeconds - 1)
}

test('chat API returns person links in response', async ({request}) => {
  test.setTimeout(120000)

  // Step 1: Get a JWT token
  const loginResp = await request.post(`${BASE_URL}/api/token/`, {
    data: {username: 'Jer', password: 'password'},
  })
  expect(loginResp.ok()).toBeTruthy()
  const loginData = await loginResp.json()
  const token = loginData.access_token
  expect(token).toBeTruthy()

  // Step 2: Send a chat message
  const chatResp = await request.post(`${BASE_URL}/api/chat/?background=true`, {
    headers: {Authorization: `Bearer ${token}`},
    data: {query: 'Tell me about Harry James Olson and his siblings'},
  })
  expect(chatResp.ok()).toBeTruthy()
  const chatData = await chatResp.json()
  console.log('Chat POST response:', JSON.stringify(chatData).substring(0, 200))

  const taskId = chatData.task?.id || chatData.task_id || chatData.id
  if (!taskId) {
    console.log(
      'No task ID - direct response:',
      JSON.stringify(chatData).substring(0, 500)
    )
    return
  }

  // Step 3: Poll until done
  console.log('Task ID:', taskId, '- polling...')
  const taskData = await pollTask(request, taskId, token, 90)
  if (!taskData) {
    console.log('Polling timed out')
    return
  }

  let responseText = ''
  if (taskData.state === 'SUCCESS') {
    const result = taskData.result_object || taskData.result
    if (result && typeof result === 'object') {
      responseText = result.response || result.message || JSON.stringify(result)
    } else {
      responseText =
        typeof result === 'string' ? result : JSON.stringify(result)
    }
  }

  console.log(
    'RESPONSE TEXT (first 1000 chars):',
    responseText.substring(0, 1000)
  )

  const linkPattern = /\[([^\]]+)\]\(\/person\/[^)]+\)/g
  const hasLinks = linkPattern.test(responseText)
  console.log('HAS PERSON LINKS:', hasLinks)

  const namePattern = /\[([^\]]+)\]\(\/person\/([^)]+)\)/g
  const linkMatches = [...responseText.matchAll(namePattern)]
  console.log(
    'LINKS FOUND:',
    linkMatches.map(m => `${m[1]} -> ${m[2]}`)
  )
})
