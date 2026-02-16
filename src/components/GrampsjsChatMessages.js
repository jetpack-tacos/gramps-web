import {html, css, LitElement} from 'lit'
import {sharedStyles} from '../SharedStyles.js'
import {typingDotsStyles} from '../AiSharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderMarkdownLinks, fireEvent} from '../util.js'
import './GrampsjsChatMessage.js'

function extractPersonIds(content) {
  const personIds = []
  const pattern = /\[[^\]]+\]\(\/person\/([^)/\s]+)\)/g
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(content)) !== null) {
    if (match[1]) {
      personIds.push(match[1])
    }
  }
  return [...new Set(personIds)]
}

class GrampsjsChatMessages extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      typingDotsStyles,
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
          padding: 0 10px 20px 10px;
        }

        .messages-inner {
          display: flex;
          flex-direction: column;
        }

        .loading {
          height: 24px;
          width: 48px;
          padding: 0;
          font-size: 24px;
        }

        .loading .typing-dot {
          margin: 0 4px;
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

        .share-button {
          border: 1px solid var(--grampsjs-color-shade-180);
          background: var(--grampsjs-color-shade-235);
          color: var(--grampsjs-body-font-color-85);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          line-height: 1;
          padding: 4px 9px;
          margin-left: 8px;
          cursor: pointer;
          vertical-align: baseline;
          white-space: nowrap;
          transition: background-color 0.15s ease;
        }

        .share-button:hover {
          background: var(--grampsjs-color-shade-220);
        }

        .share-button:disabled {
          opacity: 0.65;
          cursor: default;
        }
      `,
    ]
  }

  static get properties() {
    return {
      messages: {type: Array},
      loading: {type: Boolean},
      _sharingIndex: {state: true},
    }
  }

  constructor() {
    super()
    this.messages = []
    this.loading = false
    this._sharingIndex = -1
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
                >${message.role === 'ai'
                  ? html`${renderMarkdownLinks(
                        message.content || message.message || ''
                      )}<button
                        class="share-button"
                        type="button"
                        aria-label="${this._('Share')}"
                        title="${this._('Share')}"
                        ?disabled="${this._sharingIndex === i}"
                        @click=${() => this._shareMessage(message, i)}
                      >
                        ${this._sharingIndex === i
                          ? this._('Sharing...')
                          : this._('Share')}
                      </button>`
                  : renderMarkdownLinks(
                      message.content || message.message || ''
                    )}</grampsjs-chat-message
              >
            `
          )}
          ${this.loading
            ? html`
                <grampsjs-chat-message type="ai" .appState="${this.appState}">
                  <div class="loading typing-dots" slot="no-wrap">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
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

  async _shareMessage(message, index) {
    const content = (message.content || message.message || '').trim()
    if (!content || this._sharingIndex !== -1) {
      return
    }

    this._sharingIndex = index
    try {
      await this.appState.apiPost('/api/shared/', {
        content,
        person_ids: extractPersonIds(content),
      })
      fireEvent(this, 'grampsjs:notification', {
        message: this._('Shared to discovery feed'),
      })
    } catch (err) {
      fireEvent(this, 'grampsjs:notification', {
        message: this._('Failed to share discovery'),
        error: true,
      })
    } finally {
      this._sharingIndex = -1
    }
  }
}

window.customElements.define('grampsjs-chat-messages', GrampsjsChatMessages)
