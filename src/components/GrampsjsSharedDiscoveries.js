import {html, css, LitElement} from 'lit'
import '@material/web/button/text-button'
import '@material/web/progress/circular-progress'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderMarkdownLinks} from '../util.js'

export class GrampsjsSharedDiscoveries extends GrampsjsAppStateMixin(
  LitElement
) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
        }

        h3 {
          font-weight: 400;
          font-size: 20px;
          margin-bottom: 1em;
        }

        .feed {
          display: flex;
          flex-direction: column;
          gap: 0.75em;
        }

        .item {
          padding: 1em 1.2em;
          background: var(--md-sys-color-surface-container-low);
          border-radius: 12px;
          border-left: 4px solid var(--md-sys-color-secondary);
        }

        .content {
          font-size: 15px;
          line-height: 1.5;
          color: var(--md-sys-color-on-surface);
          white-space: pre-wrap;
        }

        .content a {
          color: var(--md-sys-color-primary, #6750a4);
          text-decoration: none;
        }

        .content a:hover {
          text-decoration: underline;
        }

        .meta {
          margin-top: 0.6em;
          font-size: 13px;
          color: var(--md-sys-color-on-surface-variant);
        }

        .loading {
          display: flex;
          justify-content: center;
          padding: 1.5em 0;
        }

        .empty,
        .error {
          font-size: 14px;
          color: var(--md-sys-color-on-surface-variant);
          padding: 0.5em 0;
        }
      `,
    ]
  }

  static get properties() {
    return {
      discoveries: {type: Array},
      loading: {type: Boolean},
      error: {type: String},
    }
  }

  constructor() {
    super()
    this.discoveries = []
    this.loading = false
    this.error = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadDiscoveries()
  }

  render() {
    return html`
      <h3>${this._('Shared Discoveries')}</h3>
      ${this.loading
        ? html`
            <div class="loading">
              <md-circular-progress indeterminate></md-circular-progress>
            </div>
          `
        : ''}
      ${!this.loading && this.error ? this._renderError() : ''}
      ${!this.loading && !this.error ? this._renderFeed() : ''}
    `
  }

  _renderError() {
    return html`
      <div class="error">${this.error}</div>
      <md-text-button @click=${this._loadDiscoveries}>
        ${this._('Retry')}
      </md-text-button>
    `
  }

  _renderFeed() {
    if (!this.discoveries.length) {
      return html`
        <div class="empty">
          ${this._(
            'No shared discoveries yet. Share an assistant message from chat.'
          )}
        </div>
      `
    }

    return html`
      <div class="feed">
        ${this.discoveries.map(
          discovery => html`
            <div class="item">
              <div class="content">
                ${renderMarkdownLinks(discovery.content || '')}
              </div>
              <div class="meta">
                ${this._('Shared by')}
                ${discovery.shared_by || this._('Unknown user')}
              </div>
            </div>
          `
        )}
      </div>
    `
  }

  async _loadDiscoveries() {
    this.loading = true
    this.error = ''

    try {
      const response = await this.appState.apiGet(
        '/api/shared/?page=1&pagesize=10'
      )
      const discoveries = response?.data?.data || response?.data || []
      this.discoveries = Array.isArray(discoveries) ? discoveries : []
    } catch (err) {
      this.error = this._('Failed to load shared discoveries.')
    } finally {
      this.loading = false
    }
  }
}

window.customElements.define(
  'grampsjs-shared-discoveries',
  GrampsjsSharedDiscoveries
)
