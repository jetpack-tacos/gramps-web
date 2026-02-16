import {html, css, LitElement} from 'lit'
import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/progress/circular-progress'
import {mdiDelete} from '@mdi/js'

import {sharedStyles} from '../SharedStyles.js'
import {renderIconSvg} from '../icons.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderMarkdownLinks} from '../util.js'
import {
  appendDismissedDiscoveryId,
  loadDismissedDiscoveries,
  saveDismissedDiscoveries,
} from '../sharedDiscoveriesStorage.js'
import {
  fetchSharedDiscoveries,
  filterVisibleDiscoveries,
} from '../sharedDiscoveriesApiHelpers.js'

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
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6em;
          font-size: 13px;
          color: var(--md-sys-color-on-surface-variant);
        }

        .shared-by {
          display: inline-block;
        }

        .dismiss {
          --md-icon-button-icon-size: 17px;
          --md-icon-button-state-layer-height: 30px;
          --md-icon-button-state-layer-width: 30px;
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
      dismissedDiscoveryIds: {type: Array},
      loading: {type: Boolean},
      errorMessage: {type: String},
    }
  }

  constructor() {
    super()
    this.discoveries = []
    this.dismissedDiscoveryIds = []
    this.loading = false
    this.errorMessage = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadDismissedDiscoveries()
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
      ${!this.loading && this.errorMessage ? this._renderError() : ''}
      ${!this.loading && !this.errorMessage ? this._renderFeed() : ''}
    `
  }

  _renderError() {
    return html`
      <div class="error">${this.errorMessage}</div>
      <md-text-button @click=${this._loadDiscoveries}>
        ${this._('Retry')}
      </md-text-button>
    `
  }

  _renderFeed() {
    const visibleDiscoveries = filterVisibleDiscoveries(
      this.discoveries,
      this.dismissedDiscoveryIds
    )

    if (!visibleDiscoveries.length) {
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
        ${visibleDiscoveries.map(
          discovery => html`
            <div class="item">
              <div class="content">
                ${renderMarkdownLinks(discovery.content || '')}
              </div>
              <div class="meta">
                <span class="shared-by">
                  ${this._('Shared by')}
                  ${discovery.shared_by || this._('Unknown user')}
                </span>
                <md-icon-button
                  class="dismiss"
                  title="${this._('Dismiss')}"
                  aria-label="${this._('Dismiss')}"
                  @click=${() => this._dismissDiscovery(discovery.id)}
                >
                  <md-icon
                    >${renderIconSvg(
                      mdiDelete,
                      'var(--md-sys-color-on-surface-variant)'
                    )}</md-icon
                  >
                </md-icon-button>
              </div>
            </div>
          `
        )}
      </div>
    `
  }

  async _loadDiscoveries() {
    this.loading = true
    this.errorMessage = ''

    try {
      const {discoveries, errorMessage} = await fetchSharedDiscoveries(
        this.appState.apiGet.bind(this.appState)
      )
      this.discoveries = discoveries
      this.errorMessage = errorMessage
    } catch (err) {
      this.errorMessage = this._('Failed to load shared discoveries.')
    } finally {
      this.loading = false
    }
  }

  _dismissDiscovery(id) {
    const dismissedDiscoveryIds = appendDismissedDiscoveryId(
      this.dismissedDiscoveryIds,
      id
    )
    if (dismissedDiscoveryIds === this.dismissedDiscoveryIds) {
      return
    }
    this.dismissedDiscoveryIds = dismissedDiscoveryIds
    this._saveDismissedDiscoveries()
  }

  _treePath() {
    return this.appState?.dbInfo?.database?.path
  }

  _loadDismissedDiscoveries() {
    this.dismissedDiscoveryIds = loadDismissedDiscoveries(this._treePath())
  }

  _saveDismissedDiscoveries() {
    saveDismissedDiscoveries(this._treePath(), this.dismissedDiscoveryIds)
  }
}

window.customElements.define(
  'grampsjs-shared-discoveries',
  GrampsjsSharedDiscoveries
)
