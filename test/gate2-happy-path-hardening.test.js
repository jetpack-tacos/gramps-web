import {html, fixture, expect} from '@open-wc/testing'

import '../src/components/GrampsjsChat.js'
import '../src/components/GrampsjsChatPermissions.js'
import '../src/components/GrampsjsUndoTransaction.js'

let GrampsjsViewTask

function makeI18n() {
  return {strings: {}}
}

describe('Gate 2 Happy Path Hardening', () => {
  before(async () => {
    if (!window.process) {
      window.process = {env: {}}
    }
    if (!window.process.env) {
      window.process.env = {}
    }
    ;({GrampsjsViewTask} = await import('../src/views/GrampsjsViewTask.js'))
  })

  it('handles chat conversation fetch errors without stuck loading', async () => {
    const appState = {
      i18n: makeI18n(),
      apiGet: async () => {
        throw new Error('fetch failed')
      },
      apiPost: async () => ({data: {response: 'ok'}}),
      apiDelete: async () => ({data: {}}),
    }
    const el = await fixture(
      html`<grampsjs-chat .appState="${appState}"></grampsjs-chat>`
    )

    await el._fetchConversations()

    expect(el.conversationsLoading).to.equal(false)
    expect(el.conversationsError).to.contain('fetch failed')
  })

  it('handles chat select errors and resets loading in finally', async () => {
    let fetchCalls = 0
    const appState = {
      i18n: makeI18n(),
      apiGet: async () => {
        fetchCalls += 1
        if (fetchCalls === 1) {
          return {data: []}
        }
        throw new Error('select failed')
      },
      apiPost: async () => ({data: {response: 'ok'}}),
      apiDelete: async () => ({data: {}}),
    }
    const el = await fixture(
      html`<grampsjs-chat .appState="${appState}"></grampsjs-chat>`
    )

    await el._handleSelectConversation({detail: {id: 'conv-1'}})

    expect(el.loading).to.equal(false)
    expect(el.messages.at(-1).role).to.equal('error')
    expect(el.messages.at(-1).content).to.contain('select failed')
  })

  it('handles chat send errors and resets loading in finally', async () => {
    const appState = {
      i18n: makeI18n(),
      apiGet: async () => ({data: []}),
      apiPost: async () => {
        throw new Error('send failed')
      },
      apiDelete: async () => ({data: {}}),
    }
    const el = await fixture(
      html`<grampsjs-chat .appState="${appState}"></grampsjs-chat>`
    )

    await el._generateResponse('hello')

    expect(el.loading).to.equal(false)
    expect(el.messages.at(-1).role).to.equal('error')
    expect(el.messages.at(-1).content).to.contain('send failed')
  })

  it('hardens task note update with error handling and reset', async () => {
    const view = new GrampsjsViewTask()
    view.appState = {
      i18n: makeI18n(),
      apiPut: async () => ({error: 'update failed'}),
    }

    await view._handleUpdateNoteText({
      detail: {handle: 'N001', text: {string: 'x'}},
    })

    expect(view.loading).to.equal(false)
    expect(view.error).to.equal(true)
    expect(view._errorMessage).to.contain('update failed')
  })

  it('hardens task note add with error handling and reset', async () => {
    const view = new GrampsjsViewTask()
    view.appState = {
      i18n: makeI18n(),
      apiPost: async () => ({error: 'add failed'}),
    }

    await view._handleAddNoteText({
      detail: {text: {string: 'x'}, type: 'To Do'},
    })

    expect(view.loading).to.equal(false)
    expect(view.error).to.equal(true)
    expect(view._errorMessage).to.contain('add failed')
  })

  it('saves chat permissions with explicit save error/finally handling', async () => {
    const ChatPermissionsClass = customElements.get('grampsjs-chat-permissions')
    const appState = {
      i18n: makeI18n(),
      apiGet: async () => ({data: {min_role_ai: 2}}),
      apiPut: async () => ({error: 'save failed'}),
    }
    const el = new ChatPermissionsClass()
    el.appState = appState
    el._data = {data: {min_role_ai: 2}}

    await el._handleChange({target: {value: '3'}})

    expect(el._saving).to.equal(false)
    expect(el._saveErrorMessage).to.contain('save failed')
  })

  it('undo action resets loading and exposes error on failure', async () => {
    const appState = {
      i18n: makeI18n(),
      apiPost: async () => ({error: 'undo failed'}),
    }
    const el = await fixture(
      html`<grampsjs-undo-transaction
        .appState="${appState}"
      ></grampsjs-undo-transaction>`
    )
    el.transaction = [{_class: 'Transaction'}]
    el.redirect = 'person/I0001'

    await el._handleUndo()

    expect(el._undoLoading).to.equal(false)
    expect(el._undoErrorMessage).to.contain('undo failed')
  })
})
