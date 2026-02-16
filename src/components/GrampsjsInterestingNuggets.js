import {html, LitElement, css} from 'lit'
import '@material/web/button/text-button'
import '@material/web/icon/icon'
import '@material/web/progress/circular-progress'
import {mdiAutoFix} from '@mdi/js'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent, unwrapApiData} from '../util.js'
import {renderIconSvg} from '../icons.js'

export class GrampsjsInterestingNuggets extends GrampsjsAppStateMixin(
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

        .nuggets-container {
          display: flex;
          flex-direction: column;
          gap: 0.75em;
        }

        .nugget {
          padding: 1em 1.2em;
          background: var(--md-sys-color-surface-container-low);
          border-radius: 12px;
          border-left: 4px solid var(--md-sys-color-primary);
          transition: all 0.2s ease;
        }

        .nugget.clickable {
          cursor: pointer;
        }

        .nugget.clickable:hover {
          background: var(--md-sys-color-surface-container);
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .nugget-content {
          font-size: 15px;
          line-height: 1.5;
          color: var(--md-sys-color-on-surface);
        }

        .nugget-icon {
          display: inline-block;
          vertical-align: middle;
          margin-right: 0.5em;
          color: var(--md-sys-color-primary);
          font-size: 18px;
        }

        .actions {
          margin-top: 1em;
          display: flex;
          gap: 0.5em;
          align-items: center;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2em;
        }

        .empty {
          color: var(--md-sys-color-on-surface-variant);
          font-style: italic;
          padding: 1em;
        }

        .error {
          color: var(--md-sys-color-error);
          padding: 1em;
        }
      `,
    ]
  }

  static get properties() {
    return {
      nuggets: {type: Array},
      loading: {type: Boolean},
      error: {type: String},
      generating: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.nuggets = []
    this.loading = false
    this.error = ''
    this.generating = false
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadNuggets()
  }

  render() {
    // Ensure nuggets is always an array
    if (!Array.isArray(this.nuggets)) {
      this.nuggets = []
    }

    if (this.loading) {
      return html`
        <h3>${this._('Interesting Discoveries')}</h3>
        <div class="loading">
          <md-circular-progress indeterminate></md-circular-progress>
        </div>
      `
    }

    if (this.error) {
      return html`
        <h3>${this._('Interesting Discoveries')}</h3>
        <div class="error">${this.error}</div>
        <div class="actions">
          <md-text-button @click="${this._generateNuggets}">
            ${this._('Generate New Discoveries')}
          </md-text-button>
        </div>
      `
    }

    return html`
      <h3>${this._('Interesting Discoveries')}</h3>
      ${this.nuggets.length === 0
        ? html`
            <div class="empty">
              ${this._(
                'No discoveries yet. Click below to generate interesting facts from your family tree.'
              )}
            </div>
          `
        : html`
            <div class="nuggets-container">
              ${this.nuggets.map(nugget => this._renderNugget(nugget))}
            </div>
          `}
      <div class="actions">
        <md-text-button
          @click="${this._generateNuggets}"
          ?disabled="${this.generating}"
        >
          ${this.generating
            ? html`
                <md-circular-progress
                  indeterminate
                  slot="icon"
                ></md-circular-progress>
                ${this._('Generating...')}
              `
            : html`${this._('Generate New Discoveries')}`}
        </md-text-button>
        ${this.nuggets.length > 0
          ? html`
              <md-text-button @click="${this._loadNuggets}">
                ${this._('Refresh')}
              </md-text-button>
            `
          : ''}
      </div>
    `
  }

  _renderNugget(nugget) {
    // Only make clickable if it has a valid Gramps ID (not [TREE] or null)
    const hasValidTarget =
      nugget.target_gramps_id &&
      nugget.target_gramps_id !== '[TREE]' &&
      nugget.target_gramps_id !== 'TREE'

    if (hasValidTarget) {
      return html`
        <div
          class="nugget clickable"
          @click="${() => this._handleNuggetClick(nugget)}"
          @keydown="${e => {
            if (e.key === 'Enter' || e.key === ' ') {
              this._handleNuggetClick(nugget)
            }
          }}"
          role="button"
          tabindex="0"
        >
          <div class="nugget-content">
            <span class="nugget-icon"
              >${renderIconSvg(mdiAutoFix, 'var(--md-sys-color-primary)')}</span
            >
            ${nugget.content}
          </div>
        </div>
      `
    }

    return html`
      <div class="nugget" role="presentation">
        <div class="nugget-content">
          <span class="nugget-icon"
            >${renderIconSvg(mdiAutoFix, 'var(--md-sys-color-primary)')}</span
          >
          ${nugget.content}
        </div>
      </div>
    `
  }

  async _loadNuggets() {
    this.loading = true
    this.error = ''

    try {
      const response = await this.appState.apiGet('/api/nuggets/?limit=5')
      if (response?.error) {
        this.nuggets = []
        this.error = response.error
        return
      }
      const nuggets = unwrapApiData(response, [])
      this.nuggets = Array.isArray(nuggets) ? nuggets : []
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading nuggets:', err)
      this.error = this._('Failed to load discoveries. Please try again.')
    } finally {
      this.loading = false
    }
  }

  async _generateNuggets() {
    this.generating = true
    this.error = ''

    try {
      const data = await this.appState.apiPost('/api/nuggets/')
      if (data?.error) {
        this.error = data.error
        fireEvent(this, 'grampsjs:notification', {
          message: this._('Failed to generate discoveries'),
          error: true,
        })
        return
      }
      if (data && data.data) {
        // After generation, reload to get fresh nuggets
        await this._loadNuggets()
        fireEvent(this, 'grampsjs:notification', {
          message: this._('Generated new discoveries!'),
        })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error generating nuggets:', err)
      this.error = this._(
        'Failed to generate discoveries. Please ensure AI chat is enabled.'
      )
      fireEvent(this, 'grampsjs:notification', {
        message: this._('Failed to generate discoveries'),
        error: true,
      })
    } finally {
      this.generating = false
    }
  }

  async _handleNuggetClick(nugget) {
    // Track the click
    try {
      const data = await this.appState.apiPost(`/api/nuggets/${nugget.id}/`)
      if (data?.error) {
        // eslint-disable-next-line no-console
        console.error('Error tracking nugget click:', data.error)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error tracking nugget click:', err)
    }

    // Navigate based on nugget type
    if (nugget.nugget_type === 'person' && nugget.target_gramps_id) {
      fireEvent(this, 'nav', {path: `person/${nugget.target_gramps_id}`})
    } else if (nugget.target_gramps_id) {
      // For events, families, etc., open chat with query about it
      const query = `Tell me more about ${nugget.content.substring(0, 100)}`
      fireEvent(this, 'nav', {path: `chat?q=${encodeURIComponent(query)}`})
    } else {
      // Generic nugget - open chat with the nugget as the query
      fireEvent(this, 'nav', {
        path: `chat?q=${encodeURIComponent(nugget.content)}`,
      })
    }
  }
}

window.customElements.define(
  'grampsjs-interesting-nuggets',
  GrampsjsInterestingNuggets
)
