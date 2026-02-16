/*
The dropdown menu for adding objects in the top app bar
*/

import {html, LitElement} from 'lit'
import '@material/mwc-snackbar'

import {fireEvent} from '../util.js'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'

class GrampsjsUndoTransaction extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [sharedStyles]
  }

  static get properties() {
    return {
      transaction: {type: Array},
      redirect: {type: String},
      _undoLoading: {type: Boolean},
      _undoErrorMessage: {type: String},
    }
  }

  constructor() {
    super()
    this.transaction = []
    this.redirect = ''
    this._undoLoading = false
    this._undoErrorMessage = ''
    this._boundHandleEvent = this._handleEvent.bind(this)
  }

  render() {
    return html`
      <mwc-snackbar leading id="undo-snackbar">
        <mwc-button
          slot="action"
          @click="${this._handleUndo}"
          ?disabled="${this._undoLoading || this.transaction.length === 0}"
          >${this._undoLoading
            ? this._('Undoing...')
            : this._('Undo')}</mwc-button
        >
        <mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
      </mwc-snackbar>
    `
  }

  _resolveUndoErrorMessage(resultOrError) {
    if (typeof resultOrError?.error === 'string' && resultOrError.error) {
      return resultOrError.error
    }
    if (typeof resultOrError?.message === 'string' && resultOrError.message) {
      return resultOrError.message
    }
    return this._('Failed to undo transaction')
  }

  async _handleUndo() {
    if (this.transaction.length === 0 || this._undoLoading) {
      return
    }

    this._undoLoading = true
    this._undoErrorMessage = ''

    try {
      const res = await this.appState.apiPost(
        '/api/transactions/?undo=1',
        this.transaction
      )
      if (res && 'data' in res) {
        const redirectPath = this.redirect
        this.transaction = []
        this.redirect = ''
        fireEvent(this, 'nav', {path: redirectPath})
        return
      }
      this._undoErrorMessage = this._resolveUndoErrorMessage(res)
      fireEvent(this, 'grampsjs:error', {message: this._undoErrorMessage})
    } catch (error) {
      this._undoErrorMessage = this._resolveUndoErrorMessage(error)
      fireEvent(this, 'grampsjs:error', {message: this._undoErrorMessage})
    } finally {
      this._undoLoading = false
    }
  }

  _handleEvent(event) {
    this.transaction = event.detail.transaction || []
    this.redirect = event.detail.redirect || ''
    this._undoLoading = false
    this._undoErrorMessage = ''
    const snackbar = this.renderRoot.querySelector('mwc-snackbar')
    snackbar.labelText = this._(event.detail.message)
    snackbar.show()
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('transaction:undo', this._boundHandleEvent)
  }

  disconnectedCallback() {
    window.removeEventListener('transaction:undo', this._boundHandleEvent)
    super.disconnectedCallback()
  }
}

window.customElements.define(
  'grampsjs-undo-transaction',
  GrampsjsUndoTransaction
)
