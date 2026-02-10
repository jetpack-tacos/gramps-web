import {html, css, LitElement} from 'lit'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/button/text-button.js'
import '@material/web/icon/icon.js'

import {mdiAutoFix} from '@mdi/js'
import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderIconSvg} from '../icons.js'
import {renderMarkdownLinks} from '../util.js'

class GrampsjsPersonInsights extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
          margin: 16px 0;
        }

        .insights-card {
          background-color: var(--grampsjs-color-shade-240);
          border-radius: 12px;
          border-left: 4px solid var(--md-sys-color-primary, #6750a4);
          padding: 20px 24px;
        }

        .insights-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: var(--grampsjs-body-font-color);
        }

        .insights-header md-icon {
          --md-icon-size: 20px;
          color: var(--md-sys-color-primary, #6750a4);
        }

        .insights-header span {
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .insights-content {
          font-size: 16px;
          line-height: 26px;
          font-weight: 340;
          color: var(--grampsjs-body-font-color);
          white-space: pre-wrap;
        }

        .insights-content a {
          color: var(--md-sys-color-primary, #6750a4);
          text-decoration: none;
        }

        .insights-content a:hover {
          text-decoration: underline;
        }

        .generate-area {
          text-align: center;
          padding: 12px 0;
        }

        .regenerate-area {
          margin-top: 12px;
          text-align: right;
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
        <div class="insights-card">
          <div class="insights-header">
            <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
            <span>${this._('AI Insights')}</span>
          </div>
          <div class="loading">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      `
    }

    // Error state
    if (this._error && !this._insight) {
      return html`
        <div class="insights-card">
          <div class="insights-header">
            <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
            <span>${this._('AI Insights')}</span>
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
      console.log('[Insights] Rendering with insight:', {
        has_insight: !!this._insight,
        has_content: !!this._insight.content,
        content_length: this._insight.content?.length || 0,
        content_preview: this._insight.content?.substring(0, 100),
      })
      return html`
        <div class="insights-card">
          <div class="insights-header">
            <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
            <span>${this._('AI Insights')}</span>
          </div>
          <div class="insights-content">
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
      <div class="insights-card">
        <div class="insights-header">
          <md-icon>${renderIconSvg(mdiAutoFix, 'currentColor')}</md-icon>
          <span>${this._('AI Insights')}</span>
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
      const data = await this.appState.apiGet(
        `/api/people/${this.grampsId}/insights/`
      )
      this._checked = true

      console.log('[Insights] GET response:', {
        has_data: !!data,
        has_data_data: !!data?.data,
        data_keys: data ? Object.keys(data) : [],
        data_data_keys: data?.data ? Object.keys(data.data) : [],
        content_exists: !!data?.data?.content,
        content_length: data?.data?.content?.length || 0,
        content_type: typeof data?.data?.content,
        content_preview: data?.data?.content?.substring(0, 100),
      })

      if (data?.data?.data) {
        this._insight = data.data.data
        console.log('[Insights] Set _insight, content check:', {
          insight_content_exists: !!this._insight.content,
          insight_content_length: this._insight.content?.length || 0,
        })
      } else if (data?.error) {
        // 404 — no insight yet, that's fine
        this._insight = null
      }
    } catch (e) {
      this._checked = true
      this._insight = null
      console.error('[Insights] GET error:', e)
    }
  }

  async _handleGenerate() {
    if (!this.grampsId) return

    this._loading = true
    this._error = ''

    try {
      const data = await this.appState.apiPost(
        `/api/people/${this.grampsId}/insights/`,
        {},
        {dbChanged: false}
      )

      this._loading = false

      console.log('[Insights] POST response:', {
        has_data: !!data,
        has_data_data: !!data?.data,
        data_keys: data ? Object.keys(data) : [],
        data_data_keys: data?.data ? Object.keys(data.data) : [],
        content_length: data?.data?.content?.length || 0,
      })
      console.log(
        '[Insights] POST full data:',
        JSON.stringify(data).substring(0, 1000)
      )

      if (data?.data?.data) {
        console.log(
          '[Insights] Setting insight, content preview:',
          data.data.data.content?.substring(0, 200)
        )
        this._insight = data.data.data
      } else if (data?.error) {
        this._error = data.error || this._('An error occurred')
      } else {
        this._error = this._('An error occurred')
      }
    } catch (e) {
      this._loading = false
      this._error = this._('An error occurred')
    }
  }
}

window.customElements.define('grampsjs-person-insights', GrampsjsPersonInsights)
