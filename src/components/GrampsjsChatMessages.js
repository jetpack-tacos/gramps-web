import {html, css, LitElement} from 'lit'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderMarkdownLinks} from '../util.js'
import './GrampsjsChatMessage.js'

class GrampsjsChatMessages extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column-reverse;
          padding: 0 10px 20px 10px;
        }

        .messages-inner {
          display: flex;
          flex-direction: column;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          width: 48px;
          font-size: 24px;
        }

        .dot {
          width: 8px;
          height: 8px;
          margin: 0 4px;
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

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--grampsjs-body-font-color-50);
          font-size: 16px;
          padding: 40px;
          text-align: center;
        }
      `,
    ]
  }

  static get properties() {
    return {
      messages: {type: Array},
      loading: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.messages = []
    this.loading = false
  }

  render() {
    if (this.messages.length === 0 && !this.loading) {
      return html`
        <div class="empty-state">
          ${this._('Ask something about your ancestors')}
        </div>
      `
    }

    return html`
      <div class="messages-container">
        <div class="messages-inner">
          ${this.messages.map(
            (message, i) => html`
              <grampsjs-chat-message
                class="${i === this.messages.length - 1 ? 'fade-in' : ''}"
                type="${message.role}"
                .appState="${this.appState}"
                >${renderMarkdownLinks(
                  message.content || message.message || ''
                )}</grampsjs-chat-message
              >
            `
          )}
          ${this.loading
            ? html`
                <grampsjs-chat-message type="ai" .appState="${this.appState}">
                  <div class="loading" slot="no-wrap">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                  </div>
                </grampsjs-chat-message>
              `
            : ''}
        </div>
      </div>
    `
  }

  updated(changed) {
    super.updated(changed)
    if (changed.has('messages') || changed.has('loading')) {
      this._scrollToBottom()
    }
  }

  _scrollToBottom() {
    const container = this.renderRoot.querySelector('.messages-container')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
}

window.customElements.define('grampsjs-chat-messages', GrampsjsChatMessages)
