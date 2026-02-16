import {html, css, LitElement} from 'lit'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/button/text-button.js'
import '@material/web/icon/icon.js'

import {mdiAutoFix} from '@mdi/js'
import {sharedStyles} from '../SharedStyles.js'
import {aiCardStyles, typingDotsStyles} from '../AiSharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderIconSvg} from '../icons.js'
import {renderMarkdownLinks, unwrapApiData} from '../util.js'

class GrampsjsPersonInsights extends GrampsjsAppStateMixin(LitElement) {
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

        .generate-area {
          text-align: center;
          padding: 12px 0;
        }

        .regenerate-area {
          margin-top: 12px;
          text-align: right;
        }

        .error {
          color: var(--md-sys-color-error, #b3261e);
          font-size: 14px;
          padding: 8px 0;
        }
      `,
    ]
  }

  static get properties() {
    return {
      grampsId: {type: String},
      _insight: {type: Object},
      _loading: {type: Boolean},
      _error: {type: String},
      _checked: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.grampsId = ''
    this._insight = null
    this._loading = false
    this._error = ''
    this._checked = false
  }

  update(changed) {
    super.update(changed)
    if (changed.has('grampsId') && this.grampsId) {
      this._insight = null
      this._error = ''
      this._checked = false
      this._fetchInsight()
    }
  }

  render() {
    if (!this.grampsId) return html``

    // Still checking for cached insight
    if (!this._checked && !this._loading) return html``

    // Loading state
    if (this._loading) {
      return html`
        <div class="ai-card">
          <div class="ai-card-header">
            <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
            <span class="ai-card-title">${this._('AI Insights')}</span>
          </div>
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      `
    }

    // Error state
    if (this._error && !this._insight) {
      return html`
        <div class="ai-card">
          <div class="ai-card-header">
            <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
            <span class="ai-card-title">${this._('AI Insights')}</span>
          </div>
          <div class="error">${this._error}</div>
          <div class="generate-area">
            <md-filled-tonal-button @click="${this._handleGenerate}">
              ${this._('Try Again')}
            </md-filled-tonal-button>
          </div>
        </div>
      `
    }

    // Has cached insight
    if (this._insight) {
      return html`
        <div class="ai-card">
          <div class="ai-card-header">
            <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
            <span class="ai-card-title">${this._('AI Insights')}</span>
          </div>
          <div class="ai-card-content">
            ${renderMarkdownLinks(this._insight.content || '')}
          </div>
          <div class="regenerate-area">
            <md-text-button @click="${this._handleGenerate}">
              ${this._('Regenerate')}
            </md-text-button>
          </div>
        </div>
      `
    }

    // No insight yet — show generate button
    return html`
      <div class="ai-card">
        <div class="ai-card-header">
          <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
          <span class="ai-card-title">${this._('AI Insights')}</span>
        </div>
        <div class="generate-area">
          <md-filled-tonal-button @click="${this._handleGenerate}">
            <md-icon slot="icon"
              >${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon
            >
            ${this._('Generate AI Insights')}
          </md-filled-tonal-button>
        </div>
      </div>
    `
  }

  async _fetchInsight() {
    if (!this.grampsId) return

    try {
      const response = await this.appState.apiGet(
        `/api/people/${this.grampsId}/insights/`
      )
      const insight = unwrapApiData(response, null)
      this._checked = true

      if (insight && typeof insight === 'object') {
        this._insight = insight
      } else if (response?.error) {
        // 404 — no insight yet, that's fine
        this._insight = null
      }
    } catch {
      this._checked = true
      this._insight = null
    }
  }

  async _handleGenerate() {
    if (!this.grampsId) return

    this._loading = true
    this._error = ''

    try {
      const response = await this.appState.apiPost(
        `/api/people/${this.grampsId}/insights/`,
        {},
        {dbChanged: false}
      )
      const insight = unwrapApiData(response, null)

      this._loading = false

      if (insight && typeof insight === 'object') {
        this._insight = insight
      } else if (response?.error) {
        this._error = response.error || this._('An error occurred')
      } else {
        this._error = this._('An error occurred')
      }
    } catch {
      this._loading = false
      this._error = this._('An error occurred')
    }
  }
}

window.customElements.define('grampsjs-person-insights', GrampsjsPersonInsights)
