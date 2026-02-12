import {html, LitElement, css} from 'lit'
import '@material/web/icon/icon'
import '@material/web/progress/circular-progress'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderMarkdownLinks} from '../util.js'

export class GrampsjsThisDay extends GrampsjsAppStateMixin(LitElement) {
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
          margin-bottom: 0.5em;
          display: flex;
          align-items: center;
          gap: 0.5em;
        }

        .date-header {
          font-size: 14px;
          color: var(--md-sys-color-on-surface-variant);
          margin-bottom: 1em;
          font-weight: 500;
        }

        .content-container {
          display: flex;
          flex-direction: column;
          gap: 1em;
        }

        .event-blurb {
          padding: 1em;
          background: var(--md-sys-color-surface-container-low);
          border-radius: 8px;
          border-left: 3px solid var(--md-sys-color-tertiary);
          line-height: 1.6;
        }

        .event-blurb a {
          color: var(--md-sys-color-primary);
          text-decoration: none;
          font-weight: 500;
        }

        .event-blurb a:hover {
          text-decoration: underline;
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

        .icon {
          color: var(--md-sys-color-tertiary);
          font-size: 24px;
        }

        md-icon {
          --md-icon-size: 24px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      content: {type: String},
      monthDay: {type: String},
      loading: {type: Boolean},
      error: {type: String},
    }
  }

  constructor() {
    super()
    this.content = ''
    this.monthDay = ''
    this.loading = false
    this.error = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadThisDay()
  }

  render() {
    if (this.loading) {
      return html`
        <h3>${this._('This Day in Your Family')}</h3>
        <div class="loading">
          <md-circular-progress indeterminate></md-circular-progress>
        </div>
      `
    }

    if (this.error) {
      return html`
        <h3>${this._('This Day in Your Family')}</h3>
        <div class="error">${this.error}</div>
      `
    }

    if (!this.content) {
      return html`
        <h3>${this._('This Day in Your Family')}</h3>
        <div class="empty">${this._('No events found for today.')}</div>
      `
    }

    // Format the date nicely for display
    const dateDisplay = this._formatDate(this.monthDay)

    // Split content into paragraphs (each blurb is a paragraph)
    const paragraphs = this.content
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    return html`
      <h3>${this._('This Day in Your Family')}</h3>
      <div class="date-header">${dateDisplay}</div>
      <div class="content-container">
        ${paragraphs.map(
          paragraph => html`
            <div class="event-blurb">${renderMarkdownLinks(paragraph)}</div>
          `
        )}
      </div>
    `
  }

  // eslint-disable-next-line class-methods-use-this
  _formatDate(monthDay) {
    if (!monthDay) return ''
    const [month, day] = monthDay.split('-')
    const date = new Date(2000, parseInt(month, 10) - 1, parseInt(day, 10))
    return date.toLocaleDateString(undefined, {month: 'long', day: 'numeric'})
  }

  async _loadThisDay() {
    this.loading = true
    this.error = ''

    try {
      const now = new Date()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const response = await this.appState.apiGet(
        `/api/this-day/?date=${mm}-${dd}`
      )
      this.content = response?.data?.content || ''
      this.monthDay = response?.data?.month_day || ''
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading This Day:', err)
      this.error = this._(
        'Failed to load daily digest. Please ensure AI chat is enabled.'
      )
    } finally {
      this.loading = false
    }
  }
}

window.customElements.define('grampsjs-this-day', GrampsjsThisDay)
