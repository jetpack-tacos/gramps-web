import {html, css, LitElement} from 'lit'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/icon/icon.js'

import {mdiFamilyTree} from '@mdi/js'
import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderIconSvg} from '../icons.js'
import {renderMarkdownLinks} from '../util.js'

class GrampsjsPersonConnections extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
          margin: 16px 0;
        }

        .connections-card {
          background-color: var(--grampsjs-color-shade-240);
          border-radius: 12px;
          border-left: 4px solid var(--md-sys-color-primary, #6750a4);
          padding: 20px 24px;
        }

        .connections-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: var(--grampsjs-body-font-color);
        }

        .connections-header md-icon {
          --md-icon-size: 20px;
          color: var(--md-sys-color-primary, #6750a4);
        }

        .connections-header span {
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .connections-content {
          font-size: 16px;
          line-height: 26px;
          font-weight: 340;
          color: var(--grampsjs-body-font-color);
          white-space: pre-wrap;
        }

        .connections-content a {
          color: var(--md-sys-color-primary, #6750a4);
          text-decoration: none;
        }

        .connections-content a:hover {
          text-decoration: underline;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          gap: 4px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background-color: var(--grampsjs-body-font-color-50);
          border-radius: 50%;
          animation: flash 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes flash {
          0%,
          80%,
          100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
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
        <div class="connections-card">
          <div class="connections-header">
            <md-icon>${renderIconSvg(mdiFamilyTree, 'currentColor')}</md-icon>
            <span>${this._('AI Connections')}</span>
          </div>
          <div class="loading">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      `
    }

    if (this._error && !this._connections) {
      return html`
        <div class="connections-card">
          <div class="connections-header">
            <md-icon>${renderIconSvg(mdiFamilyTree, 'currentColor')}</md-icon>
            <span>${this._('AI Connections')}</span>
          </div>
          <div class="error">${this._error}</div>
          <div class="retry-area">
            <md-filled-tonal-button @click="${this._fetchConnections}">
              ${this._('Try Again')}
            </md-filled-tonal-button>
          </div>
        </div>
      `
    }

    if (!this._connections) return html``

    return html`
      <div class="connections-card">
        <div class="connections-header">
          <md-icon>${renderIconSvg(mdiFamilyTree, 'currentColor')}</md-icon>
          <span>${this._('AI Connections')}</span>
        </div>
        <div class="connections-content">
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
      const data = await this.appState.apiGet(
        `/api/people/${this.grampsId}/connections/`
      )
      this._checked = true
      this._loading = false

      if (data?.data?.data) {
        this._connections = data.data.data
      } else if (data?.error) {
        this._connections = null
        this._error = data.error
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
