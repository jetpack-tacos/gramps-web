import {html, fixture, expect} from '@open-wc/testing'

import {aiCardStyles, typingDotsStyles} from '../src/AiSharedStyles.js'
import {getMapZoomFromBounds} from '../src/mapUtils.js'
import {unwrapApiData} from '../src/util.js'

import '../src/components/GrampsjsChatMessages.js'
import '../src/components/GrampsjsPersonConnections.js'
import '../src/components/GrampsjsPersonInsights.js'

describe('Gate 1 Foundations', () => {
  it('exports shared AI styles', () => {
    expect(aiCardStyles.cssText).to.contain('.ai-card')
    expect(typingDotsStyles.cssText).to.contain('.typing-dot')
  })

  it('unwraps API payloads consistently', () => {
    expect(unwrapApiData({data: {data: [1, 2, 3]}}, [])).to.deep.equal([
      1, 2, 3,
    ])
    expect(unwrapApiData({data: {ok: true}}, null)).to.deep.equal({ok: true})
    expect(unwrapApiData({error: 'boom'}, 'fallback')).to.equal('fallback')
  })

  it('computes map zoom from bounds', () => {
    expect(
      getMapZoomFromBounds(
        [
          [0, 0],
          [45, 45],
        ],
        1
      )
    ).to.equal(3)
    expect(getMapZoomFromBounds([], 1)).to.equal(1)
  })

  it('renders shared typing dots in chat messages loading state', async () => {
    const el = await fixture(
      html`<grampsjs-chat-messages></grampsjs-chat-messages>`
    )
    el.appState = {i18n: {strings: {}}}
    el.messages = []
    el.loading = true
    await el.updateComplete

    expect(el.shadowRoot.querySelectorAll('.typing-dot').length).to.equal(3)
  })

  it('renders insights using shared AI card classes', async () => {
    const el = await fixture(
      html`<grampsjs-person-insights></grampsjs-person-insights>`
    )
    el.appState = {i18n: {strings: {}}, apiGet: async () => ({error: 'noop'})}
    el.grampsId = 'I0001'
    el._checked = true
    el._loading = true
    await el.updateComplete

    expect(el.shadowRoot.querySelector('.ai-card')).to.exist
    expect(el.shadowRoot.querySelectorAll('.typing-dot').length).to.equal(3)
  })

  it('renders connections content using shared AI card classes', async () => {
    const el = await fixture(
      html`<grampsjs-person-connections></grampsjs-person-connections>`
    )
    el.appState = {i18n: {strings: {}}, apiGet: async () => ({error: 'noop'})}
    el.grampsId = 'I0001'
    el._checked = true
    el._connections = {content: 'Hello'}
    await el.updateComplete

    expect(el.shadowRoot.querySelector('.ai-card')).to.exist
    expect(
      el.shadowRoot.querySelector('.ai-card-content').textContent
    ).to.contain('Hello')
  })
})
