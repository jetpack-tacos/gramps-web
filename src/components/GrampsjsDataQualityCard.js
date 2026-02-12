import {LitElement, css, html} from 'lit'
import '@material/mwc-icon'
import {sharedStyles} from '../SharedStyles.js'

function getCountClass(count) {
  if (count < 0) {
    return 'unknown'
  }
  if (count > 20) {
    return 'critical'
  }
  if (count > 5) {
    return 'warning'
  }
  return 'ok'
}

export class GrampsjsDataQualityCard extends LitElement {
  static get styles() {
    return [
      sharedStyles,
      css`
        .dq-card {
          flex: 1 1 160px;
          min-width: 160px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid
            var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.12));
          cursor: pointer;
          transition: box-shadow 0.2s;
          text-align: center;
          background-color: var(--md-sys-color-surface);
        }

        .dq-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .dq-card[selected] {
          border-color: var(--mdc-theme-primary);
          box-shadow: 0 0 0 1px var(--mdc-theme-primary);
        }

        .dq-icon {
          color: var(--grampsjs-color-icon-default);
          margin-bottom: 8px;
        }

        .dq-card-count {
          font-size: 2em;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .dq-card-count.critical {
          color: var(--mdc-theme-error, #b00020);
        }

        .dq-card-count.warning {
          color: #f9a825;
        }

        .dq-card-count.ok {
          color: #2e7d32;
        }

        .dq-card-count.unknown {
          color: var(--grampsjs-body-font-color-38);
        }

        .dq-card-label {
          font-size: 0.95rem;
          line-height: 1.2;
        }
      `,
    ]
  }

  static get properties() {
    return {
      title: {type: String},
      icon: {type: String},
      count: {type: Number},
      selected: {type: Boolean, reflect: true},
    }
  }

  constructor() {
    super()
    this.title = ''
    this.icon = 'query_stats'
    this.count = 0
    this.selected = false
  }

  render() {
    const countClass = getCountClass(this.count)
    const countText = this.count >= 0 ? this.count : '-'
    return html`
      <button
        class="dq-card"
        ?selected=${this.selected}
        @click=${this._onClick}
      >
        <mwc-icon class="dq-icon">${this.icon}</mwc-icon>
        <div class="dq-card-count ${countClass}">${countText}</div>
        <div class="dq-card-label">${this.title}</div>
      </button>
    `
  }

  _onClick() {
    this.dispatchEvent(
      new CustomEvent('dq:select', {
        bubbles: true,
        composed: true,
      })
    )
  }
}

window.customElements.define(
  'grampsjs-data-quality-card',
  GrampsjsDataQualityCard
)
