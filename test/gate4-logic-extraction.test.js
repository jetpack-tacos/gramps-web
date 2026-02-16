import {expect, fixture, html} from '@open-wc/testing'

import {
  buildChatPayload,
  fetchConversations,
  normalizeConversationMessages,
  sendChatPrompt,
} from '../src/chatApiHelpers.js'
import {extractPersonIdsFromMarkdown} from '../src/chatMessageUtils.js'
import {buildExternalSearchData} from '../src/personExternalSearchData.js'
import {
  appendDismissedDiscoveryId,
  loadDismissedDiscoveries,
  saveDismissedDiscoveries,
} from '../src/sharedDiscoveriesStorage.js'

import '../src/components/GrampsjsChat.js'

describe('Gate 4 Logic Extraction', () => {
  it('extracts person ids from markdown links and de-duplicates ids', () => {
    const content = [
      '[Jane Doe](/person/I0001)',
      'text',
      '[John Doe](/person/I0002)',
      '[Jane Again](/person/I0001)',
    ].join(' ')

    expect(extractPersonIdsFromMarkdown(content)).to.deep.equal([
      'I0001',
      'I0002',
    ])
  })

  it('builds external search payload from person profile data', () => {
    const data = buildExternalSearchData({
      profile: {
        name_given: 'Jane Marie',
        name_surname: 'Doe',
        birth: {date: '1850-04-03', place_name: 'Springfield'},
        death: {date: '1901'},
      },
    })

    expect(data).to.deep.equal({
      name_given: 'Jane Marie',
      name_surname: 'Doe',
      name_middle: 'Marie',
      place_name: 'Springfield',
      birth_year: '1850',
      death_year: '1901',
    })
  })

  it('loads and saves dismissed discovery ids via storage helper', () => {
    const storage = {
      _store: {},
      getItem(key) {
        return this._store[key] ?? null
      },
      setItem(key, value) {
        this._store[key] = value
      },
    }

    saveDismissedDiscoveries('tree-a', ['1', '2'], storage)
    expect(loadDismissedDiscoveries('tree-a', storage)).to.deep.equal([
      '1',
      '2',
    ])
    expect(appendDismissedDiscoveryId(['1', '2'], '2')).to.deep.equal([
      '1',
      '2',
    ])
    expect(appendDismissedDiscoveryId(['1', '2'], '3')).to.deep.equal([
      '1',
      '2',
      '3',
    ])
  })

  it('builds and validates chat orchestration payloads', async () => {
    let called = null
    const apiPost = async (url, payload, options) => {
      called = {url, payload, options}
      return {data: {response: 'ok', conversation_id: 'conv-2'}}
    }

    expect(buildChatPayload('hello', null)).to.deep.equal({query: 'hello'})
    expect(buildChatPayload('hello', 'conv-1')).to.deep.equal({
      query: 'hello',
      conversation_id: 'conv-1',
    })

    const response = await sendChatPrompt(apiPost, 'hello', 'conv-1')
    expect(called).to.deep.equal({
      url: '/api/chat/',
      payload: {query: 'hello', conversation_id: 'conv-1'},
      options: {dbChanged: false},
    })
    expect(response).to.deep.equal({response: 'ok', conversationId: 'conv-2'})
  })

  it('normalizes chat roles via extracted helpers', () => {
    expect(
      normalizeConversationMessages([
        {role: 'assistant', content: 'a'},
        {role: 'user', content: 'b'},
        {role: 'custom', content: 'c'},
      ])
    ).to.deep.equal([
      {role: 'ai', content: 'a'},
      {role: 'human', content: 'b'},
      {role: 'custom', content: 'c'},
    ])
  })

  it('chat component still maps selected conversation messages correctly', async () => {
    const appState = {
      i18n: {strings: {}},
      apiGet: async url => {
        if (url === '/api/conversations/?page=1&pagesize=50') {
          return {data: []}
        }
        return {
          data: {
            messages: [
              {role: 'assistant', content: 'hello'},
              {role: 'user', content: 'hi'},
            ],
          },
        }
      },
      apiPost: async () => ({data: {response: 'ok'}}),
      apiDelete: async () => ({data: {}}),
    }

    const el = await fixture(
      html`<grampsjs-chat .appState="${appState}"></grampsjs-chat>`
    )

    await el._handleSelectConversation({detail: {id: 'conv-1'}})

    expect(el.messages).to.deep.equal([
      {role: 'ai', content: 'hello'},
      {role: 'human', content: 'hi'},
    ])
  })

  it('surfaces fetch conversation errors from orchestration helper', async () => {
    let caughtMessage = ''
    try {
      await fetchConversations(async () => ({foo: 'bar'}))
    } catch (err) {
      caughtMessage = err.message
    }
    expect(caughtMessage).to.equal('Failed to load conversations')
  })
})
