import {html, fixture, expect} from '@open-wc/testing'

import {sharedStyles} from '../src/SharedStyles.js'

import '../src/components/GrampsjsAddMenu.js'
import '../src/components/GrampsjsFormChildRef.js'
import '../src/components/GrampsjsFormSelectDate.js'

describe('Gate 3 Style Dedupe', () => {
  it('exports shared utility classes for repeated inline snippets', () => {
    expect(sharedStyles.cssText).to.contain('.u-min-h-300')
    expect(sharedStyles.cssText).to.contain('.u-w-100')
    expect(sharedStyles.cssText).to.contain('.u-clear-left')
    expect(sharedStyles.cssText).to.contain('.u-pos-relative')
    expect(sharedStyles.cssText).to.contain('.u-hidden-absolute')
  })

  it('uses shared min-height utility class in child reference form', async () => {
    const appState = {
      i18n: {strings: {}},
      apiGet: async () => ({
        data: {default: {child_reference_types: ['Birth']}, custom: {}},
      }),
    }
    const el = await fixture(
      html`<grampsjs-form-childref
        .appState="${appState}"
      ></grampsjs-form-childref>`
    )
    await el.updateComplete

    const select = el.shadowRoot.querySelector(
      'grampsjs-form-select-object-list'
    )
    expect(select).to.exist
    expect(select.classList.contains('u-min-h-300')).to.equal(true)
    expect(select.getAttribute('style')).to.equal(null)
  })

  it('uses shared position utility class in add menu wrapper', async () => {
    const el = await fixture(
      html`<grampsjs-add-menu
        .appState="${{i18n: {strings: {}}, permissions: {canEdit: true}}}"
      ></grampsjs-add-menu>`
    )
    await el.updateComplete

    expect(el.shadowRoot.querySelector('div.u-pos-relative')).to.exist
  })

  it('uses shared hidden absolute utility class for date picker inputs', async () => {
    const el = await fixture(
      html`<grampsjs-form-select-date
        .appState="${{i18n: {strings: {}}}}"
      ></grampsjs-form-select-date>`
    )
    await el.updateComplete

    expect(
      el.shadowRoot
        .querySelector('#input-date1')
        .classList.contains('u-hidden-absolute')
    ).to.equal(true)
  })
})
