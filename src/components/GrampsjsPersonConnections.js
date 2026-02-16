import {html, css, LitElement} from 'lit'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/icon/icon.js'

import {mdiFamilyTree} from '@mdi/js'
import {sharedStyles} from '../SharedStyles.js'
import {aiCardStyles, typingDotsStyles} from '../AiSharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderIconSvg} from '../icons.js'
import {renderMarkdownLinks, unwrapApiData} from '../util.js'

class GrampsjsPersonConnections extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      aiCardStyles,
      typingDotsStyles,
      css`
        :host {
          display: block;
          margin: 16px 0;
        }

        .error {
          color: var(--md-sys-color-error, #b3261e);
          font-size: 14px;
          padding: 8px 0;
        }

        .retry-area {
          text-align: center;
          padding: 12px 0;
        }

        .retry-help {
          margin-top: 8px;
          font-size: 12px;
          color: var(--grampsjs-body-font-color-50);
        }
      `,
    ]
  }

  static get properties() {
    return {
      grampsId: {type: String},
      _connections: {type: Object},
      _loading: {type: Boolean},
      _error: {type: String},
      _checked: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.grampsId = ''
    this._connections = null
    this._loading = false
    this._error = ''
    this._checked = false
  }

  update(changed) {
    super.update(changed)
    if (changed.has('grampsId') && this.grampsId) {
      this._connections = null
      this._error = ''
      this._checked = false
      this._fetchConnections()
    }
  }

  render() {
    if (!this.grampsId) return html``
    if (!this._checked && !this._loading) return html``

    if (this._loading) {
      return html`
        <div class="ai-card">
          <div class="ai-card-header">
            <md-icon>${renderIconSvg(mdiFamilyTree, 'currentColor')}</md-icon>
            <span class="ai-card-title">${this._('AI Connections')}</span>
          </div>
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      `
    }

    if (this._error && !this._connections) {
      return html`
        <div class="ai-card">
          <div class="ai-card-header">
            <md-icon>${renderIconSvg(mdiFamilyTree, 'currentColor')}</md-icon>
            <span class="ai-card-title">${this._('AI Connections')}</span>
          </div>
          <div class="error">${this._error}</div>
          <div class="retry-area">
            <md-filled-tonal-button @click="${() => this._fetchConnections()}">
              ${this._('Try Again')}
            </md-filled-tonal-button>
            <div class="retry-help">
              ${this._('Retrying fetches fresh data from the server.')}
            </div>
          </div>
        </div>
      `
    }

    if (!this._connections) return html``

    return html`
      <div class="ai-card">
        <div class="ai-card-header">
          <md-icon>${renderIconSvg(mdiFamilyTree, 'currentColor')}</md-icon>
          <span class="ai-card-title">${this._('AI Connections')}</span>
        </div>
        <div class="ai-card-content">
          ${renderMarkdownLinks(this._connections.content || '')}
        </div>
      </div>
    `
  }

  async _fetchConnections() {
    if (!this.grampsId) return
    this._loading = true
    this._error = ''

    try {
      const response = await this.appState.apiGet(
        `/api/people/${this.grampsId}/connections/`
      )
      const connections = unwrapApiData(response, null)
      this._checked = true
      this._loading = false

      if (connections && typeof connections === 'object') {
        this._connections = connections
      } else if (response?.error) {
        this._connections = null
        const msg = response.error || ''
        this._error =
          msg.toLowerCase() === 'not found'
            ? this._(
                'Connections endpoint returned not found. This can happen if backend routes are out of date or person lookup failed.'
              )
            : msg
      } else {
        this._connections = null
        this._error = this._('No connections available')
      }
    } catch (e) {
      this._checked = true
      this._loading = false
      this._connections = null
      this._error = this._('An error occurred')
    }
  }
}

window.customElements.define(
  'grampsjs-person-connections',
  GrampsjsPersonConnections
)
